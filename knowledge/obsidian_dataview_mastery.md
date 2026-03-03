# Obsidian Dataview プラグイン 完全マスターガイド

---

## 1. Dataview の基本概念

Dataview は、Obsidian の Vault 内のノートをデータベースのテーブルやリストとして扱うことができる強力なプラグインです。静的なテキストである Markdown ファイルに、動的なクエリや集計を付与します。

**主な機能:**
- 特定のタグやフォルダからノートを抽出
- YAML フロントマター（プロパティ）によるフィルタリング
- タスクの自動収集
- テーブル、リスト、タスク、カレンダー形式での表示
- ソート、グループ化、メタデータの計算

---

## 2. データソースとアノテーション

Dataview がデータを認識する方法は2種類あります。

### 2.1 YAML フロントマター (プロパティ)
ファイルの先頭に記述されるメタデータです。Obsidianの標準プロパティ機能とも連動します。

```yaml
---
author: 山田太郎
rating: 5
genre: [SF, ミステリー]
---
```

### 2.2 インラインフィールド
本文中に `キー:: 値` の形式で記載します。

```markdown
今日のタスクは順調だった。
気分:: 最高
体調:: 80
```

---

## 3. Query Language (DQL) の基本構文

Dataview Query Language は SQL に似た構文を持ちます。

### 3.1 4つの基本表示形式
1. `TABLE`: 表形式（複数フィールドの比較に最適）
2. `LIST`: リスト形式（シンプルな一覧に最適）
3. `TASK`: タスク形式（チェックボックスの収集に最適）
4. `CALENDAR`: カレンダー形式（日付関連ノートに最適）

---

## 4. TABLE クエリの実用例

### 4.1 プロジェクト一覧テーブル
ステータスと期限で整理されたプロジェクト一覧を作成します。

````markdown
```dataview
TABLE status AS "ステータス", deadline AS "期限", priority AS "優先度"
FROM "Projects"
WHERE status != "完了"
SORT priority DESC, deadline ASC
```
````

### 4.2 読書記録テーブル
今年読んだ本を評価順に表示します。

````markdown
```dataview
TABLE author AS "著者", rating AS "評価", date-read AS "読了日"
FROM #book
WHERE date-read >= date(2025-01-01)
SORT rating DESC, date-read DESC
```
````

### 4.3 データのグループ化と計算
カテゴリごとにノート数をカウントします。

````markdown
```dataview
TABLE length(rows) AS "ノート数"
FROM "Zettelkasten"
GROUP BY category
```
````

---

## 5. LIST クエリの実用例

### 5.1 最近更新されたノート
過去7日間に更新されたノートのリスト。

````markdown
```dataview
LIST " (更新: " + file.mday + ")"
FROM ""
WHERE file.mday >= date(today) - dur(7 days)
SORT file.mday DESC
LIMIT 10
```
````

### 5.2 リンクされていない（孤立した）ノート
どこからもリンクされていない作成途中のノートを見つけます。

````markdown
```dataview
LIST
FROM ""
WHERE length(file.inlinks) = 0 AND length(file.outlinks) = 0
```
````

---

## 6. TASK クエリの実用例

Dataview は `- [ ]` で書かれた世界中のタスクを収集できます。

### 6.1 未完了の全タスク
````markdown
```dataview
TASK
WHERE !completed
```
````

### 6.2 タスクのグループ化（ファイル別）
ノートごとに未完了タスクを整理します。

````markdown
```dataview
TASK
WHERE !completed
GROUP BY file.link
```
````

---

## 7. 高度なフィルタリングと関数

### 7.1 日付関数
- `date(today)`: 今日の日付
- `date(sow)`: 今週の月曜日
- `dur(1 week)`: 1週間の期間

**例: 明日が期限のタスク**
```dataview
TASK
WHERE due = date(tomorrow)
```

### 7.2 文字列関数
- `contains(文字列, "検索語")`: 文字列が含まれるか判定
- `startswith(文字列, "検索語")`: 文字列で始まるか判定

**例: タイトルに「会議」が含まれるファイル**
```dataview
LIST
WHERE contains(file.name, "会議")
```

### 7.3 ファイルのメタデータ (Implicit Fields)
全てのファイルが自動で持つ情報です。
- `file.name`: ファイル名
- `file.link`: ファイルへのリンク
- `file.cday`: 作成日（日付のみ）
- `file.ctime`: 作成日時
- `file.mday`: 最終更新日
- `file.tags`: ファイル内の全タグ
- `file.inlinks`: このノートをリンクしているノート（バックリンク）
- `file.outlinks`: このノートからリンクしているノート
- `file.folder`: ファイルのフォルダパス
- `file.size`: ファイルサイズ

---

## 8. Dataview JS (JavaScript API)

より複雑な処理が必要な場合は、JavaScript を直接記述できる `dataviewjs` を使用します。

### 8.1 Dataview JS の基本
````markdown
```dataviewjs
dv.header(2, "進行中のプロジェクト");

const pages = dv.pages('"Projects"').where(p => p.status === "進行中");

dv.table(["名前", "期限"], pages.map(p => [p.file.link, p.deadline]));
```
````

### 8.2 外部APIからのデータ取得と表示
JavaScript を使えるため、外部データを取得して表示することも可能です。

````markdown
```dataviewjs
// 天気APIから情報を取得し、今日のノートに表示する例
const response = await fetch("https://api.weatherapi.com/v1/current.json?query=Tokyo...");
const data = await response.json();
dv.paragraph(`今日の東京の気温は ${data.current.temp_c}度 です。`);
```
````

---

## 9. パフォーマンスチューニング

Dataview はノート数が数千に及ぶと重くなる可能性があります。
- `FROM` 句で検索範囲をできるだけ絞る（Vault全体を検索しない）
- `LIMIT` を使って表示件数を制限する
- リアルタイム更新の頻度をDataview設定から下げる

## 10. まとめ
Dataview は Obsidian を単なるメモ帳から「個人データベース」へと昇華させる最重要プラグインです。構造化と抽出を分離することで、ノートを書く時は自由に書き、後から好きな形で知識を構築することが可能になります。
