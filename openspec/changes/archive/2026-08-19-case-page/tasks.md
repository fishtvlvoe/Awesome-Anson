## 1. Skill 骨架

- [x] 1.1 建立 `.claude/skills/case-page/SKILL.md`，frontmatter 含 `name: case-page` 與觸發時機描述；內文記錄命名依據（對應設計決策「命名：case-page（Skill，非 Agent）」）— 驗證：`.claude/skills/case-page/SKILL.md` 存在，`head -20` 可見完整 frontmatter 三個必要欄位（name/description/disable-model-invocation 或 user-invocable）
- [x] 1.2 在 SKILL.md 中寫明輸出形式規則，明確禁止呼叫 note-bridge 或任何需要 OAuth 登入的外部服務（對應設計決策「輸出形式：自包含靜態 HTML，不透過 note-bridge」）— 驗證：`grep -n "note-bridge" .claude/skills/case-page/SKILL.md` 命中處都出現在「不使用」的說明脈絡，而非呼叫指令

## 2. 生成規則

- [x] 2.1 撰寫輸入確認判斷步驟：當內容含「待確認/我猜的」等未解標記時回報未解項目、不產生頁面，落實規格 Requirement: Reject unconfirmed input — 驗證：用一份含「待確認」標記的假提案內容跑一次 case-page，實際輸出的是未解項目清單而非 `.html` 檔案
- [x] 2.2 撰寫 HTML 生成規則：單一自包含 `.html` 檔案，CSS 以 `<style>` inline、字體宣告本機備援不外連需登入或付費服務，落實規格 Requirement: Generate self-contained HTML page from confirmed content 與 Requirement: No external service or account dependency — 驗證：用一份已確認的假提案內容實際跑一次，產出的 `.html` 檔案在關閉網路連線的瀏覽器以 `file://` 開啟仍完整正常顯示
- [x] 2.3 撰寫視覺呈現指引：色彩以 token 定義並支援 `prefers-color-scheme` 深色/淺色雙主題、字體依內容選擇而非套死一套樣板，落實規格 Requirement: Support light and dark viewer themes 與設計決策「視覺呈現：色彩 token + 字體配對 + 雙主題，內容驅動而非固定樣板」— 驗證：2.2 產出的範例頁面切換系統深色/淺色模式後文字對背景對比皆清晰可讀

## 3. 職責邊界

- [x] 3.1 在 SKILL.md 明確列出排除項目：不部署上網、不管理 GitHub/GitLab 帳號、不產生分享連結或存取控制，落實規格 Requirement: Generation is out of scope for deployment and account management — 驗證：`grep -n -A3 "不部署\|不管理\|不產生分享連結"` `.claude/skills/case-page/SKILL.md` 可見完整三項排除說明

## 4. README 文件

- [x] 4.1 在 README.md 新增「網頁對焦版本」段落，說明這是跟簡報平行的第二條輸出路徑、附上觸發方式，並標明與簡報師的分工界線 — 驗證：`grep -n "網頁對焦版本" README.md` 有命中，段落內容涵蓋 case-page 的觸發時機與輸出說明

## 5. 端到端驗證

- [x] 5.1 用一份完整的假案件提案內容實際跑過一次 case-page，確認產出的 `.html` 檔案存在且開啟後排版正常、無破版 — 驗證：檔案存於 `/tmp/` 或 scratchpad 目錄下，附實際渲染結果描述或截圖路徑
- [x] 5.2 執行 `spectra validate case-page` 確認所有 artifact 通過驗證 — 驗證：指令輸出 0 warning/error
