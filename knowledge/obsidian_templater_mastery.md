# Obsidian Templater プラグイン 実践マスターガイド

---

## 1. Templater とは

Templater は、Obsidian の標準「テンプレート」機能を拡張し、JavaScript を含む複雑な自動化と変数の展開を可能にする強力なプラグインです。日付の自動挿入、ファイル名の自動変更、入力プロンプト、カーソル位置の指定など、あらゆる定型作業を自動化します。

---

## 2. Templater の基本設定

1. コミュニティプラグインから `Templater` をインストールし有効化
2. 設定画面で以下を行う:
   - `Template folder location`: テンプレートを保存するフォルダを指定
   - `Trigger Templater on new file creation`: オン（新規作成時に自動展開）
   - `Automatic jump to cursor`: オン（展開後に自動でカーソル移動）

---

## 3. 基本的なシステム変数

### 3.1 日付と時間
- `<% tp.date.now() %>`: 今日の日付 (例: 2025-01-15)
- `<% tp.date.now("YYYY年MM月DD日 HH:mm") %>`: フォーマット指定
- `<% tp.date.tomorrow() %>`: 明日の日付
- `<% tp.date.yesterday() %>`: 昨日の日付
- `<% tp.date.weekday("YYYY-MM-DD", 1) %>`: 今週の月曜日を計算

### 3.2 ファイル情報
- `<% tp.file.title %>`: 現在のファイル名
- `<% tp.file.creation_date() %>`: ファイルの作成日時
- `<% tp.file.folder(true) %>`: ファイルが存在するフォルダの相対パス

### 3.3 カーソルと入力
- `<% tp.file.cursor(1) %>`: テンプレート展開後にカーソルが移動する場所
- `<% tp.file.selection() %>`: 選択されていたテキスト

---

## 4. 動的な入力プロンプト (システムプロンプト)

テンプレート展開時にポップアップダイアログを表示して、ユーザーに入力を求めることができます。非常に強力な機能です。

### 4.1 テキスト入力ダイアログ (Prompt)
ファイルタイトルをダイアログで入力させる例。
```markdown
<%*
const title = await tp.system.prompt("ノートのタイトルを入力してください:");
await tp.file.rename(title);
-%>
# <% title %>
```

### 4.2 選択ダイアログ (Suggester)
カテゴリをドロップダウンメニューから選ばせる例。
```yaml
<%*
// 表示用のリストと、実際の値（YAML用）のリスト
const displayList = ["📝 読書メモ", "🤝 会議録", "🚀 プロジェクト", "💡 アイデア"];
const valueList = ["book", "meeting", "project", "idea"];
const docType = await tp.system.suggester(displayList, valueList);
-%>
---
type: <% docType %>
date: <% tp.date.now("YYYY-MM-DD") %>
---
```

---

## 5. フォルダ別テンプレートの設定

Templater設定画面の `Folder Templates` セクションを使用すると、特定のフォルダに新規ファイルを作成した際、自動的に対応するテンプレートを適用できます。

**設定例:**
- フォルダ: `03-Meetings` → テンプレート: `Templates/Meeting Template.md`
- フォルダ: `01-Daily` → テンプレート: `Templates/Daily Note Template.md`

これにより、手動でテンプレートを呼び出す手間すら不要になります。

---

## 6. 実践的なテンプレート集

### 6.1 デイリーノート テンプレート
前日と翌日のリンクを自動生成します。

```markdown
---
type: daily
created: <% tp.file.creation_date("YYYY-MM-DD") %>
tags: [daily]
---
<< [[<% tp.date.now("YYYY-MM-DD", -1) %>]] | [[<% tp.date.now("YYYY-MM-DD", 1) %>]] >>

# <% tp.file.title %>

## 🌅 今日の目標
1. <% tp.file.cursor(1) %>
2. 
3. 

## 📋 タスク
- [ ] 

## 📝 ログ
- <% tp.date.now("HH:mm") %> 
```

### 6.2 ブックマーク先から自動生成テンプレート
ブラウザ拡張（Obsidian Web Clipper等）でクリップしたテキストに対して適用。

```markdown
---
type: article
url:
tags: []
---

# <% tp.file.title %>

> <% tp.file.selection() %>

## 所感
<% tp.file.cursor(1) %>
```

### 6.3 Zettelkasten インデックス作成（JavaScript ループ）
JavaScriptを使って動的にリストを生成することも可能です。

```markdown
<%*
// JavaScriptコードとして実行
let content = "## 今月のプロジェクト一覧\n";
// 例: 特定の配列をループで回す
const projects = ["Website", "Mobile App", "Marketing"];
projects.forEach(p => {
    content += `- [[${p}]]\n`;
});
-%>
<% content %>
```

---

## 7. ユーザー関数の定義 (User System Commands)

シェルスクリプトやPythonなど、PC内のシステムコマンドをTemplater経由で実行し、結果をノートに取り込むことができます。

**設定方法:**
1. Templater設定の `User System Command Includes` をオン
2. 新しいコマンドを追加。名前を `echo_test`、コマンドを `echo "Hello World"` とする

**ノート側の記述:**
```markdown
システムからの挨拶: <% await tp.user.echo_test() %>
```

## 8. カスタムスクリプト (User Scripts)

`.obsidian/scripts/` フォルダに JavaScript (`.js`) ファイルを置き、Templater から呼び出すことができます。APIとの連携など複雑なロジックをJSファイル側に分離できます。

`my_script.js`:
```javascript
function greet(name) {
    return `こんにちは、${name}さん！`;
}
module.exports = greet;
```

テンプレート内での呼び出し:
```markdown
<% tp.user.my_script("山田") %>
```

---

## 9. まとめ
Templaterを使うことで、メタデータのコピペ、ファイル名変更、日時入力といった摩擦（Friction）をゼロにすることができます。JavaScript が書けるユーザーにとって、Obsidianは「プログラム可能なノートアプリ」となり、他のどんなアプリにも真似できない強力なシステムを構築できます。
