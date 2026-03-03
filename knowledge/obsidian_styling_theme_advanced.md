# Obsidian スタイルとテーマ設定 (カスタムCSS 完全ガイド)

Obsidian の外観は CSS (Cascading Style Sheets) によって完全に制御されています。テーマの変更だけでなく、自分専用のカスタムCSS（CSS Snippets）を書くことで、インターフェースのあらゆるピクセルをカスタマイズ可能です。

---

## 1. コミュニティテーマの適用

あらかじめ作られたテーマをダウンロードするのが最も簡単なカスタマイズです。

### 1.1 おすすめの人気テーマ
- **Minimal:** 開発者 kepano (ObsidianのCEO) によって作られた、最もクリーンで機能的なテーマ。名前の通り余計な装飾を削ぎ落とし、執筆に集中できる。専用の設定プラグイン (Minimal Theme Settings) と併用するのが必須。
- **Things:** 人気タスク管理アプリ「Things 3」のような、白と洗練されたグレーを基調とした美しいUI。
- **AnuPpuccin:** MacchiatoやFrappeなどの「Catppuccin」系パステルカラーパレットを採用した非常に可愛らしく、かつ読みやすいテーマ。カスタマイズ性が高い。
- **Cybertron:** サイバーパンクやSFを思わせるネオンカラー主体のダークテーマ。

## 2. カスタム CSS Snippets の使い方

テーマを丸ごと変えるのではなく、「見出しの色だけ変えたい」「特定のタグの見た目を変えたい」場合は、CSSスニペットを使用します。

### 2.1 設定手順
1. 設定 > 外観 (Appearance) > CSS スニペット (CSS snippets)
2. フォルダアイコン（`Open snippets folder`）をクリック
3. `Vault/.obsidian/snippets/` フォルダが開く。
4. そこに `my-custom.css` というテキストファイルを作成し、CSSを記述。
5. Obsidianの画面に戻り、リロードボタンを押して `my-custom` をオン（トグルを有効化）にする。

### 2.2 実践的なCSSスニペット例

#### ① 特定のタグ（#important）を赤色で目立たせる
```css
a.tag[href="#important"] {
    background-color: var(--color-red);
    color: white;
    font-weight: bold;
    border-radius: 4px;
    padding: 2px 6px;
}
```

#### ② 見出し (H1, H2, H3) に下線とアイコンを追加
```css
.markdown-rendered h1 {
    border-bottom: 2px solid var(--interactive-accent);
    padding-bottom: 4px;
}

.markdown-rendered h2::before {
    content: "📌 ";
}
```

#### ③ 引用 (Blockquote) のデザインをおしゃれにする
```css
.markdown-rendered blockquote {
    border-left: 4px solid var(--color-purple);
    background-color: rgba(var(--color-purple-rgb), 0.1);
    border-radius: 0 8px 8px 0;
    padding: 10px 15px;
    margin: 15px 0;
}
```

#### ④ 画像に影（ドロップシャドウ）をつける
```css
.markdown-rendered img {
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    border-radius: 8px;
}
```

---

## 3. Style Settings プラグイン

カスタムCSSを自分で書かなくても、テーマの設定をUIから直感的に変更できるようにする必須プラグインが `Style Settings` です。

**機能:**
- フォントサイズからアクセントカラー、サイドバーの幅まで、スライダーとカラーピッカーで変更。
- Minimal や AnuPpuccin などの主要テーマは、すべてこのプラグインに対応しています。
- テーマを切り替えても、変更した設定はテーマごとに保存されます。

---

## 4. Callout (コールアウト / 装飾ブロック)

Obsidian v0.14 から標準機能となった、文章を目立たせるブロックです。

### 4.1 基本構文
```markdown
> [!info] インフォメーション
> これは情報のコールアウトです。
> 複数行にまたがることもできます。
```

### 4.2 標準で使える種類 (Type)
`[!note]`, `[!abstract]`, `[!info]`, `[!todo]`, `[!tip]`, `[!success]`, `[!question]`, `[!warning]`, `[!failure]`, `[!danger]`, `[!bug]`, `[!example]`, `[!quote]`

### 4.3 折りたたみ機能 (Collapsible)
`+` (デフォルトで開く) または `-` (デフォルトで閉じる) を付けることができます。

```markdown
> [!faq]- コールアウトとは何ですか？
> Markdownの引用構文を拡張した、Obsidianの標準的な情報強調表示の形式です。クリックで中身を展開できます。
```

### 4.4 カスタムコールアウトの作成 (CSS)
自分だけの新しいアイコンと色のコールアウトを作ることも可能です。

```css
.callout[data-callout="idea"] {
    --callout-color: 255, 204, 0; /* 黄色系 RGB */
    --callout-icon: lucide-lightbulb; /* 任意のアイコン名 */
}
```

## 5. デベロッパーツールを利用した調査

Obsidian は Electron（Webテクノロジー）で作られているため、Chrome と同様のデベロッパーツール（開発者ツール）が使えます。

**Mac:** `Cmd + Option + I`
**Windows:** `Ctrl + Shift + I`

インスペクタ画面が開き、Elements タブから要素を選択すれば、「どのCSSクラスが適用されているか」をピンポイントで調べることができます。ここで色や余白をテストし、うまくいったら前述の `snippets` フォルダ内に保存する、というのがプロのカスタマイズフローです。
