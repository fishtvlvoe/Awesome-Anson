## Context｜背景

`VoiceProfileStore` 目前以 `ANSON_VOICE_PROFILE_DIR` 或 `~/.config/anson/voice-profile/` 決定保存位置。這個入口可以保留，但不能要求一般使用者自己找路徑與設定 shell 環境變數。

同步服務的實際資料夾由 iCloud Drive 與 Google Drive for Desktop 管理；案神只讀寫它們提供的本機資料夾，不直接呼叫雲端 API。

## Decisions｜設計決策

### Decision 1: 依作業系統選擇同步服務

- macOS：優先尋找 `~/Library/Mobile Documents/com~apple~CloudDocs`，profile 根目錄為其下的 `Awesome-Anson/voice-profile/`。
- Windows：尋找 Google Drive for Desktop 的已掛載路徑，profile 根目錄為 `My Drive/Awesome-Anson/voice-profile/`。
- 其他系統：保留現有本機路徑，不假裝有同步。

若平台有多個候選路徑，使用已保存設定；沒有設定時選擇唯一可驗證的候選，超過一個則顯示選擇／衝突提示，不猜測。

### Decision 2: 保存「解析後的 profile 根目錄」，不依賴每次手動 export

安裝／首次啟動完成路徑解析後，寫入使用者層級的本機設定檔。設定檔只保存路徑、平台、同步 provider 與狀態，不保存聲音內容或 embedding。

`ANSON_VOICE_PROFILE_DIR` 仍是明確的最高優先級 override，方便測試與進階使用者；未設定時才使用保存設定，再退回平台偵測，最後才退回本機路徑。

解析優先序：

```text
明確環境變數
  ↓
已保存的使用者設定
  ↓
平台同步資料夾自動偵測
  ↓
本機 fallback（標記未同步）
```

### Decision 3: profile 遷移採「複製、驗證、再切換」，不直接搬走

當本機 profile 存在、同步位置不存在時：

1. 建立同步資料夾。
2. 複製 `profile.json` 與列出的 sample 檔案。
3. 以 metadata 的 SHA-256 與實際檔案重新驗證。
4. 驗證成功才把設定切換到同步根目錄。
5. 原本本機 profile 保留，讓使用者有可回復來源。

若同步位置已有 profile：

- 本機沒有 profile：直接使用同步 profile。
- 本機與同步 profile 的 profile id／checksum 一致：視為已同步。
- 兩邊不同：回傳 `profile_sync_conflict`，不覆蓋、不合併，UI 要求使用者選擇保留哪一份。

### Decision 4: 同步狀態必須可見

API 與 onboarding 顯示：

- `synced_icloud`
- `synced_google_drive`
- `local_only`
- `profile_sync_conflict`
- `sync_provider_not_found`

聲音身份已建立不等於已同步；UI 必須分開顯示「已建立」與「同步位置」。

### Decision 5: 不把雲端同步誤報成備份

Google Drive／iCloud 的同步資料夾仍可能被刪除、衝突或未完成同步。README 與 UI 必須說明：這是跨裝置可讀取，不是完整備份，也不是加密保管。

## Data contract｜資料契約

使用者設定檔範例：

```json
{
  "schema_version": 1,
  "profile_dir": "/Users/example/Library/Mobile Documents/com~apple~CloudDocs/Awesome-Anson/voice-profile",
  "provider": "icloud",
  "status": "synced_icloud",
  "updated_at": "2026-08-26T12:00:00+08:00"
}
```

設定檔不可包含 `operator_embedding`、原始音訊、access token 或 Google／Apple 憑證。

## Failure modes｜失敗模式

- iCloud／Google Drive 未安裝或尚未登入：使用本機 fallback，顯示未同步與處理方式。
- 同步資料夾尚未完成下載：不讀半成品 profile，回報等待同步。
- profile checksum 不一致：標記衝突，不覆蓋任一檔案。
- 使用者沒有同步資料夾寫入權限：保留本機 profile，顯示權限錯誤。
- 設定檔損壞或路徑失效：忽略設定檔，重新偵測並保留原設定供診斷。
