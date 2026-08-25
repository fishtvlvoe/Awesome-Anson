# 案神使用說明網站｜交接文件

> 交給接手網站的代理。這份文件只處理 `anson-manual.pages.dev` 說明書網站，不處理剪神影片生成。
>
> `surface: fish-admin` — 長相讀本 repo [`design/fish-admin/`](../design/fish-admin/)，不要讀工作區 BuyGo 的 `DESIGN.md`。

## 1. 目標

把案神做成「不懂工程的人看了就知道在做什麼」的個人說明書網站。它是文件／操作說明介面，不是 SaaS 後台，也不是 Cloudflare 上的產品系統。

公開入口：`https://anson-manual.pages.dev/`

## 2. 目前可重用的程式

- 主頁：`dashboard/index.html`
- 版本資料：`dashboard/entries/manifest.json`、`dashboard/entries/v1.json`、`v2.json`、`v3.json`
- 狀態：`dashboard/state.json`
- 現有案例互動：`dashboard/index.html` 內的 `[data-case-demo]` 與 `initCaseDemo()`
- 現有契約：`contracts/`、`openspec/specs/case-page/spec.md`
- 現有公開部署背景與邊界：`README.md`
- 視覺鎖：`design/fish-admin/SURFACE.md`、`design/fish-admin/tokens.css`

先讀現有程式與 `git status`，不要重寫一個平行網站。

## 3. 使用者要看到的主敘事

首頁第一屏先講結果，不先講 Agent 名稱或技術。

H1（短句）：

> 把模糊需求，整理成能報價、能執行的方案。

導言（長句，不當 H1）：

> 只要雙方需要對齊認知，後面可能收費，就把對話、筆記與文件放進來。案神會整理重點，也會把還沒問清楚的地方留下來給人確認。

第一屏交付物只要三樣，每樣一句白話用途：

1. 簡報檔 — 拿去跟客戶對方案
2. 網站／Demo — 讓客戶當場點給你看
3. 服務報價說明書 — 範圍、錢、下一步寫清楚

不要把「程式代碼」算進案神交付物。程式是成交後交給蓋神的活。

## 4. 必須新增／修正的內容

### A. 案例：一個匿名案子、四個步驟

「先看案例」維持一個匿名「我想做網站」案子。四個 tab 切換的是同一案子的四個步驟（先聽懂 → 找出缺口 → 問對問題 → 交付方案），不是兩個客戶案例。

真實客戶名、Vista／擎宇、BNI、未授權圖片不准上網。第二個真實案例等有匿名可公開稿再加，不是這輪驗收。

### B. 流程示意（不要無限畫布）

用 HTML 圖卡畫五格流程，旁邊一定要有白話：

```text
1. 客戶說：口頭、訊息、會議記錄或檔案
2. 案神整理：已確認／待確認／我猜的
3. 你做確認：範圍、價格、能不能答應
4. 拿方案回談：簡報、Demo、報價說明書
5. 成交再交棒：才交給蓋神開發
```

課神已判定無限畫布是死路。不要做拖拉畫布，也不要為說明圖輸出 SVG。

### C. 責任邊界

- 客戶：提供需求與資料，不需要懂工程。
- 案神：整理對話、找出真正問題、提出方案候選、產出 Demo／文件草稿。
- 人工確認：PM／業務確認內容和範圍，AI 不可替人答應價格。
- 交付：簡報、網站／Demo、報價說明書。
- 成交後：交棒蓋神。CTA「與我們聯繫」是另一個頁尾按鈕，不是第五格本身。

### D. 技術名稱放下方小字

畫面主標用白話。技術名稱只放卡片下方小字，例如 `project-manager`、`case-page`、`engagement-quote`。

### E. CTA

頁面最後要有「與我們聯繫」按鈕，連到：

`https://github.com/fishtvlvoe/Awesome-Anson`

可寫「以後也許有付費版」，不准假裝現在已有 SaaS 登入。

## 5. UI／UX 固定規則

- `surface: fish-admin`：對答案是 `products/startkiter/docs/startkiter-course-engine-visual-report-v2.html`。
- 淺灰底 `#f8fafc`、Inter + Noto Sans TC、橘色 signal `#f59e0b` 主按鈕（字色 `#1c0a00`）、硬邊＋位移陰影、上方 sticky 導覽。
- 禁止：近黑 CTA、DM Sans 主字、Archivo、暖紙底、BuyGo 藍當主 CTA、深色側欄當說明頁預設、說明圖 SVG。
- H1 只留一個；區塊用 H2；卡片標題用 H3。
- 動畫只用來表示流程順序或步驟切換，不能讓使用者等動畫才看得到內容。
- 手機版要能讀完流程；四步案例不可因響應式變成看不懂的橫向溢出。

## 6. 不要做的事

- 不把 Cloudflare Pages 文件站改成 SaaS 操作後台。
- 不把「案例」說成兩個真實客戶卻只改 tab 文案。
- 不把客戶名字、真實個資或未授權圖片放上去。
- 不把未完成的即時語音、公開 HTTPS 收音、付費 SaaS 說成已經完成。
- 不再為說明圖輸出 SVG；用 HTML 圖卡。
- 不碰剪神影片生成、Flow、Seedance 或 fal.ai 工作。
- 不讀工作區 `DESIGN.md` 來幫這頁上色。

## 7. 驗收條件

接手代理完成後，必須實跑並回報：

1. `dashboard/index.html` 可 `file://` 開啟；四個步驟 tab 可切換同一匿名案子的四步。字型可能退回系統字；`state.json` fetch 失敗時版本區用靜態 fallback。
2. 首頁第一屏能在 10 秒內看懂「案神整理什麼、最後拿到簡報／Demo／報價」；沒有「程式代碼」交付物。
3. 五格流程可辨認；最後一格是交蓋神；沒有無限畫布。
4. 頁尾「與我們聯繫」點得到 GitHub；整頁沒有未定義連結、圖片 404 或水平滾動。
5. 頁面沒有 Vista／擎宇／vista-imc／BNI 當客戶案例名。
6. 以瀏覽器截圖驗證桌面與手機寬度；測試輸出要附檔案路徑，不可只說 build 通過。

## 8. 接手順序

1. 先讀 `design/fish-admin/SURFACE.md`、`dashboard/index.html`、`dashboard/entries/v3.json`、`README.md`。
2. 先做本地 HTML 預覽，不發布正式網址。
3. 讓 Fish 看本地畫面確認後，再依部署規則處理 `anson-manual.pages.dev`。
4. 完成後建立獨立 SR／PR，避免把影片或其他神系列的變更混進來。
