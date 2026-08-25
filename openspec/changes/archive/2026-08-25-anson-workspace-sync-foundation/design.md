## Context｜背景

案神目前把可重用程式碼、Agent、Skill、契約與案件資料分開。cases/ 下的真實案件資料已經排除在 Git 追蹤之外。Fish 在桌機開發，客戶會議時使用筆電；兩臺 macOS 需要共用最新程式碼、外部案件資料、簡報、報價單與 Demo。

這個變更會碰到 Git 工作樹、macOS 登入觸發、外部加密同步資料夾與案神案件入口，因此需要先定義清楚的同步邊界。案神仍然是使用者啟動才執行的工具；新增的是裝置層同步工具，不是背景 Agent，也不是常駐分析服務。

## Goals / Non-Goals｜目標與不做的事

**目標：**

- 桌機 push 後，筆電登入 macOS 時自動以 fast-forward-only 更新乾淨的案神 checkout。
- 桌機與筆電使用同一個外部私有案件根目錄保存真實客戶資料與客戶專屬產出物。
- 案神指令與 Agent 能透過明確設定讀取外部案件根目錄。
- 同步狀態、遠端不可用、工作樹髒、檔案衝突與同步延遲都能被看見。
- 使用檔案版本與 append-only 事件檔降低兩臺電腦同時修改造成的覆蓋風險。
- 保留未來 Anson Workspace Server 的接入點，但本次不建立 Server。

**不做：**

- 不建立 PostgreSQL、D1、Workers API、手機 App 或 Web 登入。
- 不同步 Codex Desktop 內部對話歷史；本次只同步案件內由案神明確寫出的對話、摘要、決策與產出物檔案。
- 不自動 commit、push、merge conflict、build、改寫程式碼或刪除檔案。
- 不把真實案件資料、密碼、API key、付款資料或私鑰送進 GitHub。
- 不把客戶內容自動提升為可重用案神知識。
- 不指定單一雲端供應商；外部同步層必須提供本機可讀的加密案件根目錄。

## Decisions｜設計決策

### Decision 1: 登入時只做安全的 pull 與 fast-forward

登入同步程式先執行 fetch，再檢查當前 checkout 是否乾淨，以及 upstream 是否可以 fast-forward。兩項都成立時才更新本機分支。髒工作樹、分支分叉、未設定 upstream、認證失敗或遠端不可用時，停止更新並寫入明確狀態。

不採用讓 IDE 或 Codex 在開啟時執行 git pull，因為那會把裝置同步責任綁在特定應用程式，且可能在沒有人工檢查時覆蓋筆電本機修改。

### Decision 2: 真實客戶資料放在 Git 外部的案件根目錄

每臺裝置設定一個本機案件根目錄，例如 ~/Anson-private-cases。該路徑由外部加密同步工具同步；案神只把它視為案件輸入與產出根目錄。Repo 內只保存設定範例、資料格式、匿名 fixture 與驗證腳本。

不採用 Git LFS 或另一個 private Git repo 保存案件資料，因為那會把客戶資料與程式碼版本權限綁在一起，也不適合頻繁追加逐字稿、同步二進位產出物與跨裝置工作。

### Decision 3: 會議紀錄採追加，產出物採不可覆寫版本

逐字稿與對話紀錄以案件、日期、裝置與 session 命名的新檔案追加。簡報、報價單與 Demo 使用版本檔名與 manifest，不原地覆寫另一臺裝置正在編輯的檔案。案件摘要可以更新，但每次更新必須留下時間、裝置與來源事件。

不採用兩臺裝置直接覆蓋同一份 CONTEXT.md 或 state.json，因為最後同步到的檔案無法判斷誰覆蓋誰，也無法回復談判紀錄。

### Decision 4: 本機同步命令是未來擴充的唯一適配邊界

新增裝置層同步命令，提供 code sync、case sync check、status 與 conflict report。macOS launchd 只負責在登入時呼叫它；Git、案件根目錄與未來中央 Server 都透過這個邊界接入。

不把 launchd plist、Git 指令與雲端供應商操作散落在多個 Agent Skill，因為那會讓行為難以測試，也會讓未來改接 Workspace Server 時需要重寫使用者入口。

## Implementation Contract｜實作契約

### Observable behavior｜可觀察行為

- 使用者登入筆電後，裝置同步命令在設定的延遲內自動執行一次。
- 乾淨且可以 fast-forward 的 checkout 更新到 upstream HEAD。
- 髒工作樹或分支分叉時不修改 code checkout，狀態顯示 blocked，並指出原因。
- 案件根目錄不存在、未掛載、無法讀寫或外部同步尚未完成時，狀態顯示 unavailable，不刪除本機案件資料，也不建立誤導性的空案件庫。
- 案件產出物建立後，另一臺裝置可以透過外部同步層取得；status 可以顯示本機可見的最新 manifest 版本與衝突數。

### Interfaces and data shapes｜介面與資料格式

本機設定檔：~/.config/anson-sync/config.json

- repoPath：本機 Awesome-Anson checkout 的絕對路徑
- branch：追蹤的分支名稱
- caseRoot：本機外部私有案件根目錄的絕對路徑
- syncOnLogin：是否在登入時同步
- installDependenciesOnLockfileChange：lockfile 改變後是否安裝依賴

狀態檔：<caseRoot>/.anson-sync/status.json

- schemaVersion：固定為 1
- deviceId：穩定的本機裝置識別碼
- lastCodeSyncAt：ISO-8601 時間或 null
- codeStatus：up-to-date、updated、blocked、unavailable 或 error
- caseStatus：ready、unavailable、conflict 或 error
- changedFiles：整數
- conflictFiles：相對路徑陣列
- message：繁體中文的人類可讀訊息

產出物 manifest：每個案件可以有 .anson-sync/artifacts.json，記錄 artifact id、相對路徑、版本、建立時間、裝置識別碼、sha256、kind 與 promotionStatus。

### Failure modes｜失敗模式

- 找不到設定檔：回傳非零、顯示設定方式，不修改任何檔案。
- 工作樹髒：code sync 回傳非零，保留所有本機修改，寫入 blocked 狀態。
- fetch、認證或網路失敗：保留本機 checkout 與案件檔案，寫入 error 狀態，回傳可重試的失敗結果。
- 外部案件根目錄不可用：不建立誤導性的空案件根目錄，回報 unavailable。
- 發現衝突：不自動選擇勝出版本，列出衝突路徑，等待明確處理。
- lockfile 改變後安裝失敗：保留已更新的 checkout，但最終狀態標記 error，讓使用者知道依賴尚未完成。

### Acceptance criteria｜驗收標準

- fixture repo 可以驗證乾淨 fast-forward 更新，且 local HEAD 等於預期 upstream commit。
- dirty-worktree 測試證明 code sync 回傳非零、修改檔案不變、狀態為 blocked。
- remote failure 測試證明本機程式碼與案件檔案不變，且錯誤可見。
- case-root fixture 證明一臺裝置建立的產出物可以在設定的案件根目錄被另一臺裝置看到，並出現在 manifest。
- conflict fixture 證明不自動選勝出版本，且列出所有衝突路徑。
- macOS login smoke test 呼叫產生的 launchd job 或等價命令，並證明產生一筆 status。
- 文件明確說明：外部加密同步工具負責雲端傳輸，Anson Sync Agent 負責檢查與接案整合；本 SR 不宣稱雲端供應商的伺服器端隱私保證。

### Scope boundaries｜範圍邊界

本次包含：本機同步命令、登入觸發、Git pull 保護、外部案件根目錄設定、產出物 manifest、狀態與衝突回報、測試與操作文件。

本次不包含：中央 Workspace Server、手機存取、多人權限、Server 端 AI、自動知識升級、雲端供應商帳號建立，以及任何自動刪除或自動解衝突。

## Risks / Trade-offs｜風險與取捨

- [風險] 雲端供應商可能延遲同步或產生衝突 → [對策] 使用追加式紀錄、產出物 manifest、明確 conflict 狀態，不自動選擇勝出版本。
- [風險] 自動更新程式碼可能中斷筆電工作 → [對策] 只有乾淨且可 fast-forward 時才更新，不自動 reset 或 stash。
- [風險] 登入時加密案件庫尚未掛載 → [對策] 回報 unavailable，保留最後一份本機資料，不建立空替代目錄。
- [風險] 未來 Workspace Server 與檔案 SSOT 產生分歧 → [對策] 第一階段以外部案件根目錄為 SSOT，manifest 作為未來匯入邊界。
- [風險] 登入自動化變成隱藏的永久服務 → [對策] 文件明確定位為裝置同步工具，提供狀態、停用設定與解除方法，不執行 Agent 分析迴圈。
