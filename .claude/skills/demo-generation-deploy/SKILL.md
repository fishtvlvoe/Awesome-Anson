---
name: demo-generation-deploy
description: "把已確認的需求資料包轉成客戶當場可操作的 Demo 網站，部署到 Cloudflare Pages（含 D1 後台登入），嵌入第三方服務即時示意畫面，缺素材時自動生成示意內容。跟 case-page 職責切開：這個 skill 專責部署上網，case-page 專責產出離線可看的自包含 HTML。"
user-invocable: true
---

# Demo Generation & Deploy（即時 Demo 生成部署）

一句話定位：把已確認的需求資料包，變成一個真的能上網、客戶當場能操作的 Demo。

## 跟 case-page 的邊界（設計決策，不可打破）

- `case-page` 只做離線自包含 HTML，明文寫死「不部署上網」，這個 skill 完全不動它
- 部署、上網、串 D1、串第三方服務即時示意、素材自動生成，全部收在這個 skill 底下
- 兩個 skill 各自單一職責，互不越界：`case-page` 不判斷要不要部署，這個 skill 不做「離線可看」的產出格式

## 適用時機

- `realtime-need-capture` 已產出「已確認需求資料包」
- 業務員需要在對談當下或對談結束前，給客戶一個可操作的真實網址，而不是死的截圖或簡報

## 本 skill 專責的部署行為

- 生成 Demo 程式碼並部署到 Cloudflare Pages（`--branch=main`，走 Production）
- 需求標記需要登入時，provision Cloudflare D1 並串最簡登入後台；不需要登入時不建立多餘 D1 資源
- Demo 內嵌入第三方服務（如 LINE OA）的即時示意畫面；遇到未支援的服務要顯示明確提示，不能省略
- 缺圖/缺影片時自動生成示意素材，且明顯標示「示意用，非最終素材」
- 部署失敗要回報實際錯誤原因，並保留上一個成功版本網址繼續可用

## 部署機制（複用待神已驗證做法，內容邏輯完全獨立）

參考 `Awesome-Dyson` 的 `scripts/dashboard-deploy.sh`：單一 writer lock 避免同時部署衝突、明確用 `--branch=main`、部署後用穩定 DOM 標記驗證成功與否。只借部署機制的寫法，不共用 state.json/entries 結構——這個 skill 產出的是客製接案 Demo，跟待神儀表板的專案進度內容完全獨立。

## 案神到報價師的交接

需求確認報價後，呼叫方依 `contracts/ANSON-TO-QUOTEMASTER-COMMAND.md` 定義的格式送出指令（`client_id`／`confirmed_price`／`terms`／`case_ref`）。這份文件只定義「送出什麼」，不定義報價師「怎麼處理」——報價師怎麼跑，是報價師那個獨立專案的事。
