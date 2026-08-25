## 1. 本機設定與案件資料邊界

- [x] [P] 1.1 建立本機設定解析與 schema validation，支援 repoPath、branch、caseRoot、syncOnLogin、installDependenciesOnLockfileChange；驗證：valid、缺欄位、相對路徑三組 fixture 分別得到成功、非零錯誤與明確欄位訊息。
- [x] [P] 1.2 實作「外部私有案件根目錄是客戶資料邊界」的檢查，確認 caseRoot 可讀寫且不位於 Git repo 追蹤範圍；驗證：正常、未掛載、無法讀寫與 repo 內路徑 fixture 都產生預期 caseStatus，且不建立空資料夾。
- [x] [P] 1.3 定義 status.json 與 artifacts.json schema，包含 schemaVersion、deviceId、時間、狀態、衝突路徑、artifact id、version、sha256、kind 與 promotionStatus；驗證：schema fixture 通過檢查，缺少必要欄位時回傳非零。

## 2. 程式碼登入同步

- [x] 2.1 實作 Decision 1: 登入時只做安全的 pull 與 fast-forward，讓乾淨 checkout 只執行 fetch 與 fast-forward update；驗證：upstream 新增一個 commit 後執行同步，local HEAD 等於預期 upstream HEAD，codeStatus 為 updated 或 up-to-date。
- [x] 2.2 實作「登入時安全同步程式碼」的 dirty、diverged、未設定 upstream、認證失敗與遠端不可用分支；驗證：每個 fixture 都回傳非零、保留原始檔案與 HEAD、不執行 reset/stash/rebase/merge，並在 status 中列出原因。
- [x] 2.3 實作 lockfile 變更後的可選依賴安裝；驗證：設定為 false 時不執行安裝，設定為 true 時只在成功 fast-forward 後執行指定 package-manager install，安裝失敗時保留 checkout 並回報 error。

## 3. 案件紀錄與產出物同步

- [x] 3.1 實作 Decision 2: 真實客戶資料放在 Git 外部的案件根目錄，讓案神案件入口讀取外部 caseRoot；驗證：在 fixture caseRoot 建立真實案件檔案後，Git status 不列出該檔案，案件命令能讀到完整原始內容。
- [x] 3.2 實作 Decision 3: 會議紀錄採追加，產出物採不可覆寫版本，為逐字稿、會議紀錄、決策、Demo、簡報與報價單產生唯一路徑與裝置／時間 metadata；驗證：兩個 device fixture 同時建立紀錄，兩份檔案都保留，artifacts.json 含完整 metadata。
- [x] 3.3 實作「案件紀錄與產出物同步時不得靜默覆蓋」的 conflict detector；驗證：同一 logical artifact 出現兩個不相容版本時，caseStatus 為 conflict、列出每個 conflict path，且兩個版本都仍存在。

## 4. 登入觸發與狀態回報

- [x] 4.1 實作 Decision 4: 本機同步命令是未來擴充的唯一適配邊界，提供 code sync、case sync check、status 與 conflict report 的穩定 CLI 介面；驗證：四個命令在成功、unavailable、blocked、conflict 情境回傳既定 exit code 與可解析輸出。
- [x] 4.2 實作「登入自動化不依賴 IDE 與 Agent 工作階段」的 macOS launchd job；驗證：沒有 IDE、Codex、Claude 或 Agent session 時執行登入觸發，產生帶 timestamp 的 status.json。
- [x] 4.3 實作「同步狀態可以被查詢」的人類可讀 status 命令與機器可讀 status.json；驗證：成功與四種失敗情境都包含 codeStatus、caseStatus、changedFiles、conflictFiles、message，失敗情境回傳非零。

## 5. 文件與整合驗證

- [x] [P] 5.1 更新 README.md 與 cases/README.md，說明 private GitHub repo、外部加密 caseRoot、登入同步、資料不進 Git、衝突處理與未來 Workspace Server 邊界；驗證：文件 review 確認沒有把同步工具描述成常駐 Agent，也沒有宣稱雲端供應商的伺服器端隱私保證。
- [x] 5.2 建立完整雙裝置 fixture，驗證「桌機 push code → 筆電登入更新 → 筆電產生 artifact → 桌機取得 artifact」流程；驗證：一次 bounded integration test 產出兩臺 device 的 status.json、更新後 commit SHA、artifact manifest 與無靜默覆蓋證據。
- [x] 5.3 以 design.md 的 Observable behavior｜可觀察行為、Interfaces and data shapes｜介面與資料格式、Failure modes｜失敗模式、Acceptance criteria｜驗收標準、Scope boundaries｜範圍邊界，以及 Decision 1: 登入時只做安全的 pull 與 fast-forward、Decision 2: 真實客戶資料放在 Git 外部的案件根目錄、Decision 3: 會議紀錄採追加，產出物採不可覆寫版本、Decision 4: 本機同步命令是未來擴充的唯一適配邊界，逐項核對實作與測試；驗證：逐項勾稽 design.md、spec.md、tasks.md，確認每個面向都有可執行測試或明確文件證據。
- [x] 5.4 執行 workspace-sync-foundation 全部測試、文件檢查與 spectra validate；驗證：測試 exit 0、所有同步 failure fixture 通過、spectra validate 0 warnings。
