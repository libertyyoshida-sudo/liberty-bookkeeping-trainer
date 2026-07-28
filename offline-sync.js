(() => {
  const DB_NAME = "liberty-bookkeeping-offline";
  const DB_VERSION = 1;
  const STORE_NAME = "sync_queue";
  const handlers = new Map();
  let syncing = false;

  const openDatabase = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true
        });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("type", "type", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const runTransaction = async (mode, operation) => {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      const result = operation(store);

      transaction.oncomplete = () => {
        db.close();
        resolve(result?.result);
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
      transaction.onabort = () => {
        db.close();
        reject(transaction.error || new Error("Offline transaction aborted"));
      };
    });
  };

  const emit = (name, detail = {}) => {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  };

  const getPending = async () => {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).getAll();

      request.onsuccess = () => resolve(
        (request.result || []).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      );
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  };

  const remove = (id) => runTransaction("readwrite", (store) => store.delete(id));

  const queue = async (type, payload, options = {}) => {
    if (!type || typeof type !== "string") {
      throw new TypeError("Offline sync type is required");
    }

    const record = {
      type,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
      dedupeKey: options.dedupeKey || null
    };

    const id = await runTransaction("readwrite", (store) => store.add(record));
    emit("liberty-offline-queued", { id, type });

    if (navigator.onLine) {
      void sync();
    } else if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if ("sync" in registration) {
          await registration.sync.register("liberty-learning-sync");
        }
      } catch (error) {
        console.debug("Background Sync registration unavailable:", error);
      }
    }

    return id;
  };

  const updateAttempts = async (record) => {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put({
        ...record,
        attempts: (record.attempts || 0) + 1,
        lastAttemptAt: new Date().toISOString()
      });
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  };

  async function sync() {
    if (syncing || !navigator.onLine) return { synced: 0, pending: await count() };

    syncing = true;
    emit("liberty-offline-sync-start");
    let synced = 0;

    try {
      const pending = await getPending();

      for (const record of pending) {
        const handler = handlers.get(record.type);
        if (!handler) continue;

        try {
          await handler(record.payload, record);
          await remove(record.id);
          synced += 1;
          emit("liberty-offline-item-synced", { id: record.id, type: record.type });
        } catch (error) {
          await updateAttempts(record);
          emit("liberty-offline-sync-error", {
            id: record.id,
            type: record.type,
            error
          });
          if (!navigator.onLine) break;
        }
      }

      const pendingCount = await count();
      emit("liberty-offline-sync-complete", { synced, pending: pendingCount });
      return { synced, pending: pendingCount };
    } finally {
      syncing = false;
    }
  }

  const count = async () => {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).count();
      request.onsuccess = () => resolve(request.result || 0);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  };

  const register = (type, handler) => {
    if (!type || typeof handler !== "function") {
      throw new TypeError("Offline sync register requires a type and handler");
    }
    handlers.set(type, handler);
    if (navigator.onLine) void sync();
    return () => handlers.delete(type);
  };

  window.LibertyOfflineSync = {
    queue,
    sync,
    count,
    getPending,
    register
  };

  window.addEventListener("online", () => {
    emit("liberty-network-online");
    void sync();
  });

  window.addEventListener("offline", () => {
    emit("liberty-network-offline");
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "LIBERTY_SYNC_REQUEST") {
        void sync();
      }
    });
  }
})();