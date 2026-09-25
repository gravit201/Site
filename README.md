# My Notes（Notion風ホームページ）

自分のパソコンで書いて、公開したサイトでみんなに読んでもらうページです。React + Tailwind。

## 書くとき（自分のパソコン）

```bash
npm install
npm run dev
```

- 開発画面では編集できる。書いた内容は `src/content.json` に自動で保存される
- 左のサイドバーでページを追加・削除できる
- 行頭に `# ` で見出し、`[] ` でチェックボックス
- Enterで新しい行、空の行でBackspaceを押すと削除

## 公開するとき

`src/content.json` をコミットして `main` に push すると、GitHub Actions がサイトを作り直して公開する。
公開されたサイトは読むだけ（編集はできない）。

ページのURLは `…/#ページID`。そのページへのリンクとして人に送れる。
