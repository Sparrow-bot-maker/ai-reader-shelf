# AI Reader Shelf - 雲端 AI 讀書助理

這是一個基於 React + Vite 開發的 AI 讀書助理，結合了 Gemini AI 與 Google Sheets 作為後端儲存。

## 🚀 快速開始

### 1. 環境設定
複製一份 `.env.example` 並更名為 `.env.local`：
```bash
cp .env.example .env.local
```
在 `.env.local` 中填入以下資訊：
- `VITE_GEMINI_API_KEY`: 從 [Google AI Studio](https://aistudio.google.com/) 取得。
- `VITE_GAS_URL`: 你的 Google Apps Script Web App 網址。
- `VITE_GOOGLE_CLIENT_ID`: 從 [Google Cloud Console](https://console.cloud.google.com/) 建立 OAuth 2.0 用戶端 ID 取得。

### 2. 安裝與執行
```bash
npm install
npm run dev
```

---

## 📦 GitHub Pages 自動部署設定

本專案已設定 GitHub Actions，當你推送到 `main` 分支時會自動部署。

### 步驟：
1. **設定 GitHub Secrets**：
   前往你的 GitHub 儲存庫 `Settings > Secrets and variables > Actions`，新增以下兩個 Secrets：
   - `VITE_GEMINI_API_KEY`: 你的 Gemini API 密鑰。
   - `VITE_GAS_URL`: 你的 GAS Web App URL。
   - `VITE_GOOGLE_CLIENT_ID`: 你的 Google OAuth Client ID。

2. **啟用 GitHub Pages**：
   前往 `Settings > Pages`，在 **Build and deployment > Source** 選擇 `GitHub Actions`。

3. **推送代碼**：
   推送至 `main` 分支後，Actions 會自動執行構建並部署。

---

## 🛠️ 技術棧
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Visualization**: React Flow (思維導圖)
- **Backend**: Google Apps Script (GAS)
- **Database**: Google Sheets
- **AI**: Google Gemini API
