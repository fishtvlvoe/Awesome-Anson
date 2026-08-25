## ADDED Requirements

以下需求用繁體中文描述，保留 SHALL、SHALL NOT、WHEN、THEN 等規格關鍵字，方便實作與驗收。

### Requirement: 登入時安全同步程式碼

系統 SHALL 提供一個裝置本機同步命令，抓取設定的 upstream 分支；只有在工作樹乾淨且更新可以 fast-forward 時，才更新本機 Awesome-Anson checkout。

#### Scenario: 乾淨 checkout 成功更新

- **WHEN** 設定的 repo 沒有 tracked 或 untracked 變更，而且 upstream 分支有一個可以 fast-forward 的 commit
- **THEN** 同步命令 SHALL 更新本機 checkout 到 upstream commit，並回報 codeStatus 為 updated 或 up-to-date

##### Example: 桌機 push 後筆電登入

- **GIVEN** upstream HEAD 是 abc123，筆電 local HEAD 是 abc122，工作樹沒有變更
- **WHEN** 筆電執行登入同步命令
- **THEN** local HEAD SHALL 變成 abc123，codeStatus SHALL 為 updated

#### Scenario: 髒工作樹受到保護

- **WHEN** 設定的 repo 有任何 tracked 或 untracked 本機變更
- **THEN** 同步命令 SHALL 回傳非零、SHALL NOT 修改 checkout，並在 codeStatus 為 blocked 的狀態中列出髒檔案

##### Example: 筆電有未提交修改

- **GIVEN** laptop checkout 修改了 README.md
- **WHEN** 登入同步命令執行
- **THEN** README.md 內容與 local HEAD SHALL 保持不變，結果 SHALL 為 blocked

#### Scenario: 分支不是 fast-forward 時受到保護

- **WHEN** 本機分支與 upstream 分支已經分叉
- **THEN** 同步命令 SHALL 回傳非零，SHALL NOT 執行 reset、stash、rebase 或 merge，並回報 codeStatus 為 blocked

##### Example: 桌機與筆電各自有 commit

- **GIVEN** desktop branch 有 commit A，laptop branch 有不同的 commit B
- **WHEN** laptop 執行登入同步
- **THEN** laptop 的 commit B SHALL 保留，結果 SHALL 為 blocked

### Requirement: 登入自動化不依賴 IDE 與 Agent 工作階段

系統 SHALL 提供 macOS 登入觸發器，在不開啟 IDE、Codex、Claude 或其他 Agent 工作階段的情況下，呼叫裝置本機同步命令。

#### Scenario: 使用者登入筆電

- **WHEN** macOS 啟動已設定的使用者工作階段
- **THEN** 登入觸發器 SHALL 執行一次同步，並寫入帶有時間戳記的狀態結果

##### Example: 沒有開啟 IDE

- **GIVEN** 使用者登入 macOS，但 IDE、Codex、Claude 都沒有啟動
- **WHEN** 登入觸發器執行
- **THEN** SHALL 產生一筆 status.json，且不需要任何 Agent session

#### Scenario: 使用者停用登入同步

- **WHEN** 使用者在本機設定把 syncOnLogin 設為 false
- **THEN** 登入觸發器 SHALL 略過程式碼與案件同步，且 SHALL 不修改 checkout 或 caseRoot

##### Example: 停用登入同步

- **GIVEN** syncOnLogin 設為 false，且本機 checkout 與 caseRoot 都有既有檔案
- **WHEN** macOS 執行登入觸發器
- **THEN** SHALL 不執行 code sync 或 case sync，兩個既有路徑 SHALL 保持不變

### Requirement: 外部私有案件根目錄是客戶資料邊界

系統 SHALL 允許每臺裝置設定 Git repo 外部的 caseRoot；案神工作流程 SHALL 使用這個路徑保存真實客戶案件紀錄與客戶專屬產出物。

#### Scenario: 案件根目錄可用

- **WHEN** 設定的 caseRoot 存在，且可讀、可寫
- **THEN** 同步命令 SHALL 回報 caseStatus 為 ready，並讓案神案件工作流程使用該路徑

##### Example: 兩臺裝置使用同一個案件庫

- **GIVEN** desktop 與 laptop 都設定自己的本機加密案件庫路徑
- **WHEN** 案件庫已完成外部同步
- **THEN** 兩臺裝置的同步檢查 SHALL 回報 caseStatus 為 ready

#### Scenario: 案件根目錄不可用

- **WHEN** 設定的 caseRoot 不存在、未掛載或不可讀
- **THEN** 同步命令 SHALL 回報 caseStatus 為 unavailable，且 SHALL 不建立新的空案件根目錄或刪除既有本機資料

##### Example: 筆電登入時加密案件庫尚未掛載

- **GIVEN** caseRoot 的外部同步工具尚未完成掛載
- **WHEN** 登入同步命令執行
- **THEN** 結果 SHALL 為 unavailable，且既有案件檔案 SHALL 保持不變

#### Scenario: 客戶資料不進 Git

- **WHEN** 在 caseRoot 建立真實案件
- **THEN** 案件檔案 SHALL 留在 Git 追蹤路徑之外，repo 驗證 SHALL 拒絕真實案件 fixture 或含秘密的檔案

##### Example: 真實案件在 repo 外

- **GIVEN** caseRoot 是 /private/Anson-cases，repo 是 /Development/Awesome-Anson
- **WHEN** 在 caseRoot 建立 case-2026-0825-client-a
- **THEN** git status SHALL 不列出該案件，秘密掃描 SHALL 不把它當成 repo 檔案

### Requirement: 案件紀錄與產出物同步時不得靜默覆蓋

系統 SHALL 使用裝置與版本 metadata 表示會議紀錄及客戶專屬產出物，並在發現衝突時回報，不自動選擇勝出版本。

#### Scenario: 新會議紀錄可以同步

- **WHEN** 裝置在案件內寫入新的逐字稿、筆記或決策檔案
- **THEN** 檔案 SHALL 使用唯一的案件相對路徑，並包含或取得時間與裝置 metadata，讓另一臺裝置取得時不會替換其他紀錄

##### Example: 兩臺裝置各自新增逐字稿

- **GIVEN** desktop 建立 2026-08-25-desktop.md，laptop 建立 2026-08-25-laptop.md
- **WHEN** 外部同步工具完成同步
- **THEN** 兩份逐字稿 SHALL 同時保留

#### Scenario: 產出物版本可見

- **WHEN** 裝置建立 Demo、簡報、報價單或其他客戶專屬產出物
- **THEN** 案件 artifact manifest SHALL 記錄 artifact id、相對路徑、version、建立時間、device id、SHA-256、kind 與 promotionStatus

##### Example: 筆電產生第一版簡報

- **GIVEN** laptop 產生 proposal-v1.pptx
- **WHEN** 案件 manifest 更新
- **THEN** manifest SHALL 記錄 kind=presentation、version=1、deviceId=laptop 與對應 sha256

#### Scenario: 發現衝突

- **WHEN** 同一個 logical artifact 或紀錄出現兩個互不相容版本
- **THEN** 系統 SHALL 回報 caseStatus 為 conflict、列出每個衝突路徑，並保留兩個版本

##### Example: 桌機與筆電同時修改報價單

- **GIVEN** desktop 有 quote-v2，laptop 有另一個 quote-v2
- **WHEN** 同步檢查發現兩者內容不同
- **THEN** 兩個版本 SHALL 保留，結果 SHALL 為 conflict，不自動刪除任一版本

### Requirement: 同步狀態可以被查詢

系統 SHALL 每次同步都寫入機器可讀的 status.json，並提供人類可讀的 status 命令。

#### Scenario: 同步成功時有完整狀態

- **WHEN** 一次同步在沒有阻擋錯誤的情況下完成
- **THEN** status.json SHALL 包含 schemaVersion=1、deviceId、時間、codeStatus、caseStatus、changedFiles、conflictFiles 與繁體中文 message

##### Example: 成功同步狀態

- **GIVEN** desktop 完成 code 與 case 同步
- **WHEN** 使用者執行 status 命令
- **THEN** 輸出 SHALL 顯示 codeStatus=up-to-date、caseStatus=ready、changedFiles=0、conflictFiles=[]

#### Scenario: 失敗狀態可以採取行動

- **WHEN** 同步因髒工作樹、遠端不可用、案件根目錄不可用或衝突而失敗
- **THEN** status 命令 SHALL 指出失敗邊界；同步未完成時 SHALL 回傳非零，且 SHALL 保留既有程式碼與案件檔案

##### Example: 遠端不可用

- **GIVEN** laptop 無法連到 GitHub
- **WHEN** 登入同步命令執行
- **THEN** codeStatus SHALL 為 error 或 unavailable，既有 local HEAD SHALL 保持不變，命令 SHALL 回傳非零
