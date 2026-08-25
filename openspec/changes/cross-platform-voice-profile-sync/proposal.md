## Why｜為什麼要做

案神目前能在本機建立使用者聲音身份，但 profile 預設只存在單台電腦：

```text
~/.config/anson/voice-profile/
```

使用者換另一台 Mac 會需要重新錄音；Windows 使用者也沒有一條清楚的同步路徑。這讓安裝包完成後仍無法形成「錄一次、其他自己的電腦直接讀取」的使用流程。

本 SR 把同步資料夾偵測與 profile 遷移寫進安裝流程：Mac 優先使用 iCloud Drive，Windows 使用 Google Drive for Desktop，資料夾名稱固定使用英文 `Awesome-Anson/voice-profile/`。

## What Changes｜會改變什麼

- 新增跨平台同步根目錄偵測：
  - macOS：`iCloud Drive/Awesome-Anson/voice-profile/`
  - Windows：`Google Drive/My Drive/Awesome-Anson/voice-profile/`
- 安裝或首次啟動時，若找到同步資料夾，保存 profile 根目錄設定，之後不必每次手動設定環境變數。
- 若目前只有本機 profile，第一次找到同步資料夾時，先驗證後複製到同步位置。
- 若本機與同步位置都有不同 profile，停止自動合併並顯示衝突，禁止靜默覆蓋聲音身份。
- 啟動服務時從已保存的 profile 根目錄讀取，並在 onboarding／狀態區顯示目前是同步位置或本機位置。
- 找不到同步服務時仍可使用本機 profile，但明確顯示「未同步」，不讓使用者誤以為已備份。
- README 補上 macOS、Windows、Google Drive、iCloud、衝突處理與隱私說明。

## Non-Goals｜不包含的範圍

- 不把聲音原檔、embedding 或 `profile.json` 提交 GitHub。
- 不實作 Google Drive API、iCloud API、登入、雲端資料庫或案神自有同步服務。
- 不將聲音資料自動上傳到第三方；同步由使用者已登入的本機同步資料夾負責。
- 不在本 SR 內做聲音 profile 加密匯出／匯入；這是後續獨立 SR。
- 不支援多台電腦同時寫入同一份 profile 的合併；衝突必須停下來讓使用者處理。

## Capabilities｜能力

### New Capabilities｜新增能力

- `cross-platform-voice-profile-sync`：偵測同步資料夾、遷移 profile、保存設定、處理衝突與顯示同步狀態。

### Modified Capabilities｜修改既有能力

- `realtime-voice-transcription`：`VoiceProfileStore` 從已解析的 profile 根目錄讀取，不改變 profile JSON schema 與 speaker attribution 行為。
- 安裝／啟動流程：安裝完成後自動選擇同步位置；找不到時清楚回報本機 fallback。

## Impact｜影響範圍

- 修改：`tools/realtime-voice/voice_identity.py`
- 修改：`tools/realtime-voice/server.py`
- 修改：`tools/realtime-voice/static/voice-profile.html`
- 修改：`scripts/setup-realtime-voice.sh`
- 修改：`scripts/start-realtime-voice.sh`
- 修改：`README.md`
- 修改：`tools/realtime-voice/README.md`
- 新增：跨平台路徑／設定解析模組與匿名測試 fixture
- 不修改：真實使用者的聲音檔與本機 profile

## Acceptance Gate｜驗收門檻

- macOS 有 iCloud Drive 時，自動使用 `Awesome-Anson/voice-profile/`，不需手動 export 環境變數。
- Windows 有 Google Drive for Desktop 時，自動使用 `Awesome-Anson/voice-profile/`，不需手動 export 環境變數。
- 既有本機 profile 只存在本機時，首次偵測到同步位置能安全複製並保留可驗證的 checksum。
- 本機與同步 profile 不一致時，安裝與啟動都不覆蓋任一邊，顯示可理解的衝突處理方式。
- 沒有 iCloud／Google Drive 時，服務仍能啟動，但 UI 與 README 明確標示未同步。
- 服務重啟與換電腦後，能讀取同一份 profile，speaker attribution 行為保持一致。
- 全部既有 42 項測試與新增跨平台 profile 測試通過。
