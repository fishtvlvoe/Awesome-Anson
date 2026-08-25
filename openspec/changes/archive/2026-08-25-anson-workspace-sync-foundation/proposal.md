## Why｜為什麼要做

Fish 平常在桌機開發案神，但到客戶現場會使用筆電。現在 GitHub 只保存程式碼，案件資料與筆電產出的 Demo、簡報、報價單沒有一套安全的自動同步流程，因此每次換電腦都需要人工確認與搬檔案。

這個 SR 先建立兩臺 macOS 的本機同步基礎：登入時安全更新程式碼，並讓外部加密案件資料夾保存與同步真實客戶資料及客戶專屬產出物。

## What Changes｜會改變什麼

- 在 macOS 登入時自動執行裝置同步命令，更新乾淨且可以 fast-forward 的案神 Git checkout。
- 每臺裝置可以設定位於 Git repo 外部的私有案件根目錄。
- 案件逐字稿、會議紀錄、談判紀錄、Demo、簡報與報價單透過外部加密同步層在兩臺電腦間同步。
- 產出物保留版本、建立時間、建立裝置、雜湊與是否已確認納入案神的狀態。
- 遇到髒工作樹、遠端不可用、認證失敗、案件根目錄未掛載或檔案衝突時，系統停止或排隊，不覆蓋本機資料。
- 可重用的匿名模板與程式碼放在 private GitHub repo；真實客戶內容留在外部案件庫。
- 保留未來 Anson Workspace Server 的接入邊界，但本 SR 不建立中央 Server。

## Non-Goals｜不包含的範圍

- 不建立中央 database、Web 登入、手機 App 或 Server 端對話歷史。
- 不把客戶內容自動升級成可重用案神知識；納入知識仍要經過人工確認。
- 不把 API key、密碼、付款資料、私鑰或真實客戶資料放進 Git。
- 不在登入時自動 build、產生程式碼、commit、push、解衝突或刪除檔案。
- 同步工具是裝置工具，不改變案神「使用者啟動才執行」的 Agent 模型，也不建立常駐 Agent。

## Capabilities｜能力

### New Capabilities｜新增能力

- `workspace-sync-foundation`：安全同步案神程式碼與外部私有案件工作區。

### Modified Capabilities｜修改既有能力

- 無。

## Impact｜影響範圍

- 規格：新增 workspace-sync-foundation。
- 程式碼：
  - 新增登入同步、案件同步檢查、狀態回報與驗證 fixture。
  - 修改 README.md、cases/README.md 與外部案件根目錄設定文件。
  - 如有需要，修改 .gitignore，維持真實案件資料不進 Git 的邊界。
  - 不刪除檔案。
- 外部系統：private GitHub repo、兩臺 macOS、加密雲端同步案件庫，以及案神本機案件入口。
