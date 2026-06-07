# Liberty Bookkeeping Trainer

留学生・実務初学者向けの簿記仕訳トレーニングWebアプリです。  
日本語・英語の切り替え、仕訳問題の自動採点、学習履歴、苦手分野の復習、AI解説などを通じて、簿記の基礎学習をサポートします。

## 公開URL

GitHub Pagesで公開することを想定しています。

```text
https://libertyyoshida-sudo.github.io/liberty-bookkeeping-trainer
```

## 主な機能

- 仕訳問題の出題・自動採点
- 借方・貸方の勘定科目と金額入力
- 日本語 / English の表示切り替え
- カテゴリ別出題
- ランダム出題
- 未学習・未修得・復習用のフィルタ
- 特訓モード
- 苦手カテゴリの設定
- ルビ表示
- 問題文の読み上げ
- 学習履歴の保存
- 学習分析ページ
- 動画・スライド等の学習コンテンツページ
- 勘定科目クイズ
- 管理者ページへの導線
- AIによる問題解説

## 画面構成

| ファイル | 役割 |
|---|---|
| `index.html` | メインの仕訳トレーニング画面 |
| `app.js` | 出題、採点、認証、履歴保存、UI制御などの主要ロジック |
| `style.css` | 共通スタイル |
| `config.js` | GitHub Pages URL、Supabase、AI Worker等の設定 |
| `analytics.html` | 学習分析画面 |
| `history.html` | 学習履歴画面 |
| `contents.html` | 動画・スライド等の学習コンテンツ画面 |
| `quiz.html` | 勘定科目クイズ画面 |
| `admin.html` | 管理者向け画面 |
| `signup.html` | 新規登録画面 |
| `forgot-password.html` | パスワード再設定画面 |

## 使用技術

- HTML
- CSS
- JavaScript
- Supabase
  - Authentication
  - Database
- GitHub Pages
- Chart.js
- Kuroshiro / Kuromoji
- Cloudflare Workers等の外部AI API連携

## Supabaseで利用する主なデータ

このアプリでは、Supabase上のデータを利用します。主に以下のようなテーブルを想定しています。

| テーブル | 用途 |
|---|---|
| `quiz_questions` | 仕訳問題データ |
| `study_logs` | ユーザーごとの解答履歴・学習ログ |
| `profiles` | ユーザー権限、管理者判定など |

## 問題データの主な項目例

`quiz_questions` には、以下のような項目を持たせる想定です。

| 項目 | 内容 |
|---|---|
| `id` | 問題ID |
| `categoryJa` | 日本語カテゴリ |
| `categoryEn` | 英語カテゴリ |
| `titleJa` | 日本語タイトル |
| `titleEn` | 英語タイトル |
| `questionJa` | 日本語問題文 |
| `questionEn` | 英語問題文 |
| `solution` | 正解仕訳データ |
| `journalJa` | 日本語の模範仕訳表示 |
| `journalEn` | 英語の模範仕訳表示 |
| `account_options` | 日本語の選択肢 |
| `account_optionsEn` | 英語の選択肢 |
| `ref_links` | 参考リンク |

## ローカルでの起動方法

このリポジトリは静的Webアプリのため、ビルドなしで起動できます。

```bash
git clone https://github.com/libertyyoshida-sudo/liberty-bookkeeping-trainer.git
cd liberty-bookkeeping-trainer
python -m http.server 8000
```

ブラウザで以下にアクセスします。

```text
http://localhost:8000
```

`index.html` を直接開くこともできますが、ブラウザの制約や辞書ファイルの読み込みの都合で、ローカルサーバー経由での確認を推奨します。

## 設定ファイル

`config.js` にアプリの設定を記載します。

```js
window.APP_BASE_URL = "https://libertyyoshida-sudo.github.io/liberty-bookkeeping-trainer";
window.SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
window.SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
window.APP_AI_WORKER_URL = "YOUR_AI_WORKER_URL";
```

注意: Supabaseのanon keyは公開フロントエンドで利用される公開キーですが、Row Level Securityなどのアクセス制御を必ずSupabase側で設定してください。

## デプロイ方法

GitHub Pagesを利用する場合は、リポジトリの設定画面からPagesを有効化します。

1. GitHubのリポジトリ画面を開く
2. `Settings` を開く
3. `Pages` を開く
4. Sourceに `Deploy from a branch` を選択
5. Branchに `main`、フォルダに `/root` を選択
6. 保存後、公開URLにアクセス

## 学習ログの流れ

1. ユーザーがSupabase Authでログイン
2. 問題に解答
3. 正誤判定を実行
4. `study_logs` に結果を保存
5. 履歴画面・分析画面で学習状況を確認

## AI解説機能

各問題について、問題文と模範仕訳をもとにAI解説を生成する機能があります。  
AI連携先は `config.js` の `APP_AI_WORKER_URL` で指定します。

AI解説は学習補助を目的としています。会計処理の最終判断は、教材・基準・社内ルール等と照合してください。

## 今後の改善候補

- 問題データのインポート / エクスポート機能
- 管理者画面からの問題編集機能の強化
- 学習進捗のグラフ拡充
- 多言語対応の拡張
- モバイル表示のさらなる改善
- Supabase RLSポリシーのドキュメント化
- テストデータ・サンプル問題の追加

## ライセンス

現時点ではライセンス未設定です。  
公開・再利用範囲を明確にする場合は、`LICENSE` ファイルの追加を検討してください。

## 運営

Takeshi Yoshida
