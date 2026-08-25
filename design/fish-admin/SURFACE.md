【標題】fish-admin 視覺鎖

surface 名稱：`fish-admin`

▋ 這是什麼

神系列說明頁與產品 UI 的共用長相。代理做網站前先讀這份。

對答案原檔：

`/Users/fishtv/Development/products/startkiter/docs/startkiter-course-engine-visual-report-v2.html`

一句話：淺灰 slate 底、Inter 大標、橘色 signal 強調、硬邊按鈕帶位移陰影；不是鋅灰近黑後台，也不是 BuyGo 賣場藍當主 CTA。

▋ 何時用

• 案神／譯神／剪神／課神／待神／開站包等說明頁或產品說明 UI

▋ 何時不用

• BuyGo／賣場後台 → `DESIGN.md`

• WordPress Admin 原生頁

▋ 檔案

• 真相：`/Users/fishtv/Development/design/fish-admin/`

• 各神 repo 副本：`<repo>/design/fish-admin/`

• `tokens.css`、`SURFACE.md`、`canonical.png`

禁止改副本當主檔。要改先改工作區再同步。

▋ 長相鎖定

• 字型：Inter + Noto Sans TC（程式碼可用 JetBrains Mono）

• 底：`#f8fafc`

• 卡片／表面：`#ffffff`

• 字：`#0f172a`

• 次要字：`#334155`／`#64748b`

• 邊：`#e2e8f0`

• 強調色 signal：`#f59e0b`（大標重點、主按鈕、進度條、選取）

• 主按鈕字色：`#1c0a00`

• 主按鈕：橘底 + 2px 深色邊 + `box-shadow: 4px 4px 0` 文字色；hover 微位移

• 圓角：`8px`（大區塊 `16px`）

• 版面骨架：上方 sticky 導覽，不是深色側欄

• easing：`cubic-bezier(0.16, 1, 0.3, 1)`

• 深色主題：`#111318` 背景、`#191c22` 表面、`#22262d` 浮層；文字使用 `#eeede9`／`#d0d0c9`，互動採灰階，禁止大面積亮綠、亮藍、棕色或霓虹對比

▋ 禁止

• DM Sans 當主字型、近黑 `#18181b` 當主 CTA

• 開站包課程播放器那套鋅灰膠囊後台當說明頁預設

• Archivo、暖紙 `#f5f4f0`、BuyGo `#3b82f6` 當主 CTA

• 玻璃擬態、霓虹、說明圖 SVG

• 用 Cursor `GenerateImage`、Midjourney、或其他非 Codex 管道生說明頁插畫／封面／情境圖

▋ 配圖（Fish 2026-08-24 定案）

• AI 生圖一律走 Codex 內建 `image_gen`（GPT-image），用 `codex exec` 派工

• 預設落地：`$CODEX_HOME/generated_images/...`；指定路徑時再 `cp` 到目標 repo（例如 `Awesome-Anson/dashboard/assets/`）

• 驗收截圖、ego-browser 頁面截圖不算「生圖」，仍用既有截圖流程

• 風格跟對答案：淺底、硬邊、橘色 signal 可當 accent；禁 AI glow、假 UI 截圖、emoji 堆

▋ 離線

`file://` 開得了。字型載不到就退回系統字。

▋ 交接怎麼寫

`surface: fish-admin`，路徑本 repo `design/fish-admin/`。對答案可附 startkiter v2 原檔路徑。
