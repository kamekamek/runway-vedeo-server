# Runway Video MCP Server

🎥 RunwayAPIを使用して画像から動画を生成するModel Context Protocol (MCP) サーバー

## 📋 概要

このMCPサーバーは、RunwayAPIを利用して画像から動画を生成する機能を提供します。ユーザーは画像URLとオプションのプロンプトテキストを入力として、動画を生成することができます。

## 🚀 機能

- 画像URLから動画を生成
- オプションのプロンプトテキストによる動画生成のカスタマイズ
- MCPツールとしての統合が容易

## 🛠 セットアップ

1. このリポジトリをクローンします：

```bash
git clone https://github.com/yourusername/runway-video-server.git
cd runway-video-server
```

2. 必要な依存関係をインストールします：

```bash
npm install
```

3. `.env`ファイルを作成し、RunwayAPIキーを設定します：

```
RUNWAY_API_KEY=your_runway_api_key_here
```

4. サーバーをビルドします：

```bash
npm run build
```

5. サーバーを起動します：

```bash
npm start
```

## 💻 使用方法

このMCPサーバーは、`generate_video`というツールを提供します。このツールは以下のパラメータを受け取ります：

- `imageUrl` (必須): 入力画像のURL
- `promptText` (オプション): 動画生成のためのプロンプトテキスト

例：

```json
{
  "imageUrl": "https://example.com/input-image.jpg",
  "promptText": "A serene landscape transforming through seasons"
}
```

## 🤝 貢献

プルリクエストは歓迎します。大きな変更を加える場合は、まずissueを開いて変更内容を議論してください。

## 📄 ライセンス

[MIT](https://choosealicense.com/licenses/mit/)

---

🌟 Powered by [RunwayAPI](https://runwayml.com/) and [Model Context Protocol](https://modelcontextprotocol.github.io/)
