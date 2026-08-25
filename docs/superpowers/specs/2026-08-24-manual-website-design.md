【標題】fish-admin 視覺鎖 + 案神說明書這輪做完

這份規格只覆蓋兩件事：神系列網站共用的長相要住哪，以及這輪把案神說明書做到能公開驗收。剪神說明書、studio 換皮、譯神換皮、BuyGo 都不在這輪。

日期：2026-08-24

狀態：等 Fish 看過這份再實作

→ 1 這輪做什麼、不做什麼

做：

• 在工作區建立 fish-admin 長相檔，案神 repo 放一份副本。

• 改工作區規則：神系列網站走 fish-admin；DESIGN.md 只給 BuyGo。

• 重寫案神交接文件，拿掉會讓代理走錯的指示。

• 改 `Awesome-Anson/dashboard/index.html` 的長相與第一屏內容，讓 anson-manual.pages.dev 對得上修正後的交接文件。

不做：

• 不新建剪神說明書。

• 不改剪神 studio、待神 dashboard、課神後台。

• 不改 BuyGo 色票、不改 `DESIGN.md` 的藍。

• 不上網真實客戶名（Vista／擎宇、BNI、余啟彰當客戶案例）。

• 不做無限畫布。

• 不把第二個真實案例這輪做出來。

• 不把「程式代碼」寫成案神交付物。

→ 2 長相（fish-admin）

視覺對答案是開站包課程播放頁，加上待神的近黑主按鈕。一句話：像乾淨的後台說明頁，不是行銷 landing，也不是 BuyGo 賣場藍。

字型：標題與內文 `DM Sans`，中文 `Noto Sans TC`。禁止 Archivo、Fira Sans、只用系統字當主字型。

底：`#fafafa`。卡片：`#ffffff`。字：`#09090b`。次要字：`#71717a`。邊：`#e4e4e7`。

主按鈕（CTA）：近黑 `#18181b`，白字。這是待神那條，不跟開站包的淡灰藍按鈕。

側欄目前選取：淺灰膠囊底，不是亮藍底。

圓角：預設 `10px`（`0.625rem`）。主按鈕不要做成全圓 pill。只有側欄選取可用膠囊。

成功：深綠。警告：琥珀。錯誤：紅。顏色只拿來標狀態，不當品牌裝飾。

深色模式：跟開站包同一套反轉（底近黑、卡片鋅深、字近白），邏輯不變。

禁止：BuyGo `#3b82f6`、案神現況暖紙 `#f5f4f0`、Archivo 特粗大標、磚橘、漸層、玻璃擬態、霓虹、漂浮全息卡、為動畫而動畫。

離線：可以 `file://` 開頁。Google Fonts 載不到就退回系統字，驗收不得寫「離線也跟線上字型一模一樣」。`state.json` 用 fetch，失敗時版本區停在 HTML 裡的靜態 fallback。

→ 3 檔案放哪（以後不用重講長相）

可改的真相只住這裡：

`/Users/fishtv/Development/design/fish-admin/`

• `SURFACE.md`：人話規則、何時用、禁止表、CTA 用近黑。

• `tokens.css`：CSS 變數，網站直接引用或複製進頁面。

• `canonical.png`：開站包那頁截圖，Orca 分享連結會過期，不能當長期依據。

案神副本（只 clone 案神也要找得到）：

`Awesome-Anson/design/fish-admin/`

內容與工作區那份相同。禁止把副本當主檔改。要改去工作區那份再同步。

工作區 `DESIGN.md` 開頭加一行：這份只給 BuyGo／賣場後台。神系列說明頁與後台走 `design/fish-admin/`。

待神 `design-system/tokens.md` 開頭改成：儀表板請改讀工作區 `design/fish-admin/`。這輪只加指向，不重做待神畫面。

代理永遠生效的規則放 `Development/.cursor/rules/fish-admin-ui.mdc`（alwaysApply），並在 `Development/AGENTS.md` 第 13 節改寫。規則本文只准寫三句：

• 神系列 UI 先讀本 repo 的 `design/fish-admin/`。

• 沒有就讀工作區 `/Users/fishtv/Development/design/fish-admin/`。

• 禁止用 BuyGo `DESIGN.md` 幫神系列上色。

產品交接文件只留一行 `surface: fish-admin`，不准再抄色票。

→ 4 案神說明書這一頁要變成什麼

入口不變：`https://anson-manual.pages.dev/`。主檔不變：`Awesome-Anson/dashboard/index.html`。不要另做一個平行網站。

第一屏：

• 一個 H1，短句，沿用現況精神：「案神是你的接案幕僚：把客戶的模糊想法，整理成可以一起確認的方案。」

• 導言用長句，不當 H1：「客戶把需求、錄音、聊天紀錄、Word／Excel／PDF、手寫筆記交給你；案神幫你整理成可以確認、可以報價、可以提案的成果。」

• 三張交付物圖卡，每張一句白話用途：簡報檔（拿去跟客戶對方案）、網站／Demo（讓客戶當場點給你看）、服務報價說明書（範圍、錢、下一步寫清楚）。沒有「程式代碼」。

• 10 秒內要看得出：案神整理什麼、最後拿到這三樣。

案例：

• 維持一個匿名「我想做網站」案子。

• 四個 tab 是同一個案子的四個步驟：先聽懂、找出缺口、問對問題、交付方案。

• 不是兩個案例的切換。驗收文案要寫「步驟切換」，不要寫「兩個案例按鈕」。

• Vista、BNI、真公司名、真 IG、真講師當客戶案例，都不准出現在這頁。

流程：

• 保留五格：客戶說 → 案神整理 → 你確認 → 拿方案回談 → 成交再交蓋神。

• 最後一格是交棒蓋神，不是 CTA。

• 無限畫布不做。現有 SVG 連線改成 HTML 圖卡，不再為說明圖輸出 SVG。

CTA：

• 頁面最後一個清楚按鈕「與我們聯繫」。

• 連到 `https://github.com/fishtvlvoe/Awesome-Anson`。

• 可寫「以後也許有付費版」，不准寫成現在已經有 SaaS 登入。

技術名稱：主標用白話。`project-manager`、`case-page`、`engagement-quote` 只放卡片下方小字。

待神那句「這頁的版面就是照它的設計系統重做」要改掉。改成這頁走 fish-admin，待神畫面本身這輪沒改。

→ 5 交接文件要改掉的錯

檔案：`Awesome-Anson/docs/WEBSITE-HANDOFF-2026-08-24.md`

• 刪「讀工作區 DESIGN.md」「跟課神無限畫布」。改 `surface: fish-admin`，路徑寫本 repo `design/fish-admin/`。

• 第一屏交付物刪「程式代碼」。寫明程式是成交後蓋神的活。

• 案例寫「一個匿名案子、四個步驟」。刪「兩個真實案例」當這輪驗收。註明第二案等有匿名稿再加。

• 驗收第 1 條改成：四個步驟 tab 可切換同一案子的四步；不要寫成兩個案例。

• 離線寫一半真：頁開得了；字型可能退回系統字；版本區 fetch 失敗就用靜態 fallback。

• 視覺稿沒有獨立檔。對答案是 fish-admin 的 canonical 截圖，說明圖用 HTML 圖卡。

• 範圍一句話：只處理說明書網站，不處理剪神影片生成。

→ 6 實作順序

1. 建工作區 `design/fish-admin/`（SURFACE.md、tokens.css、canonical 截圖）。

2. 同步副本到 `Awesome-Anson/design/fish-admin/`。

3. 改 `Development/AGENTS.md` 第 13 節、加永遠生效規則；`DESIGN.md` 加「只給 BuyGo」；待神 tokens.md 加指向。

4. 改交接文件。

5. 改 `dashboard/index.html` 長相與第一屏內容。先本地打開給 Fish 看。

6. Fish 點頭後再部署 `anson-manual.pages.dev`。獨立 PR，不要跟剪神或其他神混在同一支。

→ 7 驗收

• 本機打開 `dashboard/index.html`，四個步驟 tab 會換同一案子的文案。

• 第一屏看得到三樣交付物，沒有「程式代碼」。

• 五格流程看得到，最後一格是交蓋神。

• 頁尾「與我們聯繫」點得到 GitHub，HTTP 不是 404。

• 沒有 Vista、擎宇、vista-imc、BNI 客戶名。

• 沒有新的說明用 SVG。

• 桌面與手機寬度截圖存檔，路徑寫在回報裡。不准只說 build 通過。

• `file://` 開得了。字型退回系統字可以，但頁面不能空白。

→ 8 下一輪（這份規格不實作）

• 剪神新建說明書（janson-manual，第一屏長片＋短影音）。

• 譯神說明頁換皮。

• 剪神 studio、待神 dashboard 換皮。

• 第二個匿名真實案例，等 Fish 給可公開稿。
