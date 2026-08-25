## 1. 一致的同步資料契約

- [x] 1.1 `Sync state is visible`：定義 profile sync config、provider、status 與 conflict schema；驗證：匿名 fixture 可解析，設定檔不含聲音內容、embedding、token 或憑證
- [x] 1.2 `macOS selects iCloud profile storage`、`Windows selects Google Drive profile storage`：定義 macOS iCloud、Windows Google Drive、local fallback 的候選路徑規則；驗證：固定 fixture 下每個平台只選出預期路徑
- [x] 1.3 `Profile migration is verified before switching`：定義 profile file checksum 與安全遷移規則；驗證：複製後 checksum 一致，半成品或不一致檔案不會切換

## 2. 跨平台路徑解析與設定保存

- [x] 2.1 `macOS selects iCloud profile storage`、`Windows selects Google Drive profile storage`：實作平台同步根目錄偵測；驗證：macOS、Windows、無 provider、多人候選四種 fixture 結果明確
- [x] 2.2 `Voice profile root is resolved from explicit, saved, or platform configuration`：實作使用者層級設定檔讀寫；驗證：重啟後不需要重新 export，明確 `ANSON_VOICE_PROFILE_DIR` 仍優先
- [x] 2.3 將解析後的 profile 根目錄接回 `VoiceProfileStore`；驗證：既有 profile API 與 speaker attribution 使用同一份 profile

## 3. 安全遷移與衝突處理

- [x] 3.1 `Profile migration is verified before switching`：實作 local-only profile 複製到同步位置；驗證：複製、checksum 驗證、設定切換成功，原始本機 profile 保留
- [x] 3.2 實作同步 profile 讀取；驗證：第二台同平台電腦可直接讀到 profile，不需重新錄音
- [x] 3.3 `Conflicting profiles are never silently overwritten`：實作 local／sync profile conflict；驗證：不覆蓋任何一方，API 回傳 `profile_sync_conflict`
- [x] 3.4 防止半同步檔案被讀取；驗證：暫存檔、缺檔、checksum 不一致都回傳可理解狀態

## 4. 安裝、啟動與 UI 引導

- [x] 4.1 安裝腳本自動執行路徑偵測與 profile 遷移；驗證：首次安裝與已有 local profile 兩條流程可重現
- [x] 4.2 `Sync state is visible`：onboarding 顯示聲音身份狀態與同步 provider；驗證：已建立／已同步／本機／衝突四種狀態不混淆
- [x] 4.3 `Decision 5: 不把雲端同步誤報成備份`：README 寫清楚 Mac iCloud、Windows Google Drive、local fallback、衝突與隱私；驗證：每個命令可對照實際腳本

## Design decision traceability

- [x] Trace `Decision 1: 依作業系統選擇同步服務`：由 1.2、2.1 驗證 macOS／Windows provider 選擇
- [x] Trace `Decision 2: 保存「解析後的 profile 根目錄」，不依賴每次手動 export`：由 2.2 驗證設定保存與 override 優先序
- [x] Trace `Decision 3: profile 遷移採「複製、驗證、再切換」，不直接搬走`：由 1.3、3.1、3.3 驗證遷移與衝突保護
- [x] Trace `Decision 4: 同步狀態必須可見`：由 1.1、4.2 驗證 UI/API 狀態
- [x] Trace `Decision 5: 不把雲端同步誤報成備份`：由 4.3 驗證文件與 UI 文案

## 5. 驗證與交付

- [x] 5.1 新增跨平台 resolver、migration、conflict regression tests；驗證：所有測試 exit 0
- [x] 5.2 執行既有 42 項測試；驗證：46/46 PASS
- [x] 5.3 完成 Mac 本機 fixture smoke：local profile → iCloud path → restart → read same profile
- [x] 5.4 完成 Windows fixture smoke：local profile → Google Drive path → restart → read same profile
- [ ] 5.5 完成 self-review，確認只修改本 SR 列出的檔案；驗證：git diff、git status 與測試輸出完整
