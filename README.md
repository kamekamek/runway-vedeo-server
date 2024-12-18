# Runway Video MCP Server

🎥 RunwayAPIを使用して画像から動画を生成するModel Context Protocol (MCP) サーバー

## 📋 概要

このMCPサーバーは、RunwayAPIを利用して画像から動画を生成する機能を提供します。ユーザーは画像URL、ローカルにアップロードされた画像、またはBase64エンコードされた画像データと、オプションのプロンプトテキストを入力として、動画を生成することができます。

## 🚀 機能

- 画像URL、ローカルにアップロードされた画像、またはBase64エンコードされた画像データから動画を生成
- オプションのプロンプトテキストによる動画生成のカスタマイズ
- MCPツールとしての統合が容易

## 🛠 セットアップ

1. npmパッケージをインストールします：

```bash
npm install @kamechan/runway-video-server
```

2. Claude.appの設定ファイル（@claude_desktop_config.json）を開き、以下のようにRunway Video MCPサーバーの設定を追加します：

```json
{
  "mcpServers": {
    "runway-video-server": {
      "command": "npx",
      "args": [
        "-y",
        "@kamechan/runway-video-server"
      ],
      "env": {
        "RUNWAY_API_KEY": "YOUR_RUNWAY_API_KEY_HERE"
      }
    }
  }
}
```

3. `YOUR_RUNWAY_API_KEY_HERE`を実際のRunwayAPIキーに置き換えてください。

## 💻 使用方法

Claude.appでRunway Video MCPサーバーが設定されると、`generate_video`ツールが利用可能になります。このツールは以下のパラメータを受け取ります：

- `image` (必須): 入力画像のURL、ローカルにアップロードされた画像、またはBase64エンコードされた画像データ
- `promptText` (オプション): 動画生成のためのプロンプトテキスト

例：

1. 画像URLを使用する場合：

```
画像から動画を生成してください。画像URL: https://example.com/input-image.jpg、プロンプト: 穏やかな風景が四季を通じて変化する
```

2. ローカルにアップロードされた画像を使用する場合：

画像をClaudeアプリにドラッグ＆ドロップしてアップロードし、以下のように指示します：

```
この画像から動画を生成してください。プロンプト: 穏やかな風景が四季を通じて変化する
```

3. Base64エンコードされた画像データを使用する場合（通常はプログラムから使用）：

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAA...",
  "promptText": "A serene landscape transforming through seasons"
}
```

## 🤝 貢献

プルリクエストは歓迎します。大きな変更を加える場合は、まずissueを開いて変更内容を議論してください。

## 📄 ライセンス

[MIT](https://choosealicense.com/licenses/mit/)

---

🌟 Powered by [RunwayAPI](https://runwayml.com/) and [Model Context Protocol](https://modelcontextprotocol.github.io/)
