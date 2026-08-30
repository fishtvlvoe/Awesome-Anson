# 即時語音接案神

按鍵開始收音，講話同時即時轉成繁體文字；獨立 CLI 顧問會自動讀取逐字稿、分析並在終端機提供 1／2／3 個下一步選項。錄音 server 與顧問由同一個指令啟動與停止。

## 一次性安裝（只需要做一次，預估 10-15 分鐘，取決於網速）

從 repo 根目錄也可以直接執行跨電腦安裝腳本：

```bash
bash scripts/setup-realtime-voice.sh
```

腳本會建立 `venv`、安裝 `requirements.txt`、自動安裝 ffmpeg，並預下載 SenseVoice 與 ERes2NetV2 speaker model。若只想檢查現有環境：`bash scripts/setup-realtime-voice.sh --check-only`。

```bash
cd tools/realtime-voice
python3 -m venv venv
venv/bin/pip install -r requirements.txt
```

第一次啟動服務時，會自動下載 FunASR 的 `iic/SenseVoiceSmall` 語音辨識模型（約 936MB），下載一次後會存在 `~/.cache/modelscope/`，之後啟動不用重新下載。網速普通的情況下，第一次啟動大概要等 5-10 分鐘。

## 每次使用

```bash
bash scripts/start-realtime-voice.sh
```

定案：本機錄音頁走 `http://localhost:8420`，不要 https。Chrome 憑證警告不過，現場也走 http。啟動預設必須是 http；https 改成可選，不要因為 `tools/realtime-voice/certs/` 存在就自動切 https。

啟動後終端機會印出：

- 電腦本機網址：`http://localhost:8420`
- 區域網路網址（例如 `http://192.168.1.23:8420`）——手機與電腦要在同一個 Wi-Fi 下
- `[案神] 顧問 ready`、後端名稱、session state 路徑與隱私提示

用電腦或手機瀏覽器打開對應網址，按「開始收音」開始錄音。畫面只顯示收音狀態與即時繁中逐字稿；顧問結果在啟動終端機顯示。文字寫進 `tools/realtime-voice/output/<session-id>.md`。

### 顧問後端設定與隱私

預設使用 Claude Code headless CLI。可在啟動前切換 Codex：

```bash
REALTIME_ADVISOR_BACKEND=codex bash scripts/start-realtime-voice.sh
```

也可用 `REALTIME_ADVISOR_COMMAND` 指定可執行命令，例如測試用的本機 wrapper。啟動時會列出實際 backend；逐字稿文字會送到該 headless CLI 及其模型服務，音檔仍留在本機。若後端不存在或不可啟動，啟動指令會直接失敗，不會顯示假 ready。

## 建立聲音身份

工作台的「聲音身份」頁可以直接用瀏覽器錄一段目前使用者的聲音，播放確認後按「建立聲音身份」。
原始樣本與 profile 預設會使用平台同步資料夾：macOS 優先使用 iCloud Drive，Windows 優先使用 Google Drive for Desktop，資料夾名稱固定為 `Awesome-Anson/voice-profile/`。找不到同步服務時才使用 `~/.config/anson/voice-profile/`。也可以用 `ANSON_VOICE_PROFILE_DIR` 指定另一個目錄；`profile.json` 只保存樣本 metadata、雜湊與 speaker embedding，不保存到 Git，也不由案神直接送到雲端。

建立 profile 後，server 會嘗試載入 FunASR ERes2NetV2 speaker model。模型可用時，符合 profile
的片段回傳 `operator`／`pm`；其他穩定 speaker key 可映射成匿名 `client-1`、`client-2`。
模型未安裝、音檔轉換失敗或信心不足時，一律回傳 `unknown`／`pending`，不把未知聲音假裝辨識成功。

### 使用 Google Drive 跨電腦保存 profile

可以使用 Google Drive for Desktop；案神使用的是它提供的本機同步資料夾，不直接呼叫 Google Drive API。先在每台電腦安裝並登入 Google Drive for Desktop，建立同一個資料夾，例如：

```text
Google Drive/Awesome-Anson/voice-profile/
```

如果自動偵測不到，才需要手動指定 `ANSON_VOICE_PROFILE_DIR`。Mac 範例（實際 Google Drive 路徑依帳號不同）：

```bash
export ANSON_VOICE_PROFILE_DIR="$HOME/Library/CloudStorage/GoogleDrive-你的帳號/My Drive/Awesome-Anson/voice-profile"
bash scripts/start-realtime-voice.sh
```

Windows Git Bash 範例：

```bash
export ANSON_VOICE_PROFILE_DIR="G:/My Drive/Awesome-Anson/voice-profile"
bash scripts/start-realtime-voice.sh
```

不要讓兩台電腦同時建立或更新聲音身份，等 Google Drive 顯示同步完成後再換另一台使用。目前 profile 尚未加密，請使用私人 Google Drive，不要設成公開共享；正式對外版本應改用案神提供的加密匯出／匯入流程。

每段即時回應都包含 `speaker_id`、`role`、`confidence`、`identity_status`。舊的 Markdown 逐字稿
格式保持不變，結構化身份資料另存為 `output/<session-id>.segments.jsonl`，也可由
`GET /segments/<session-id>` 讀取。

## 顧問如何運作

- 最後一行逐字稿約 3 秒沒有更新時，自動觸發一次分析。
- 持續說話時，以逐字稿時間戳累積 60 秒作為保底觸發。
- 每次分析帶入完整 session state 與新增逐字稿；分析進行中新增內容會排隊，不會重複並行呼叫。
- 終端機顯示現況、已確認、尚未確認、報價影響與最多三個選項。輸入 `1`／`2`／`3` 會顯示可直接對客戶說的句子並保存 adoption event；Enter 跳過，`q` 結束。

session state 保存於 `output/<session-id>.state.json`，事件另存為 `output/<session-id>.events.jsonl`。PM 角色在 session 啟動時固定指定；其他段落只依文字脈絡判斷 `pm`／`client`／`unknown`，不需要聲音 profile。

## 對談結束後

按 `q` 或瀏覽器的「停止收音」會結束本次 session；也可以在終端機按 `Ctrl+C`。server 與顧問一起停止，不註冊 daemon、launchd 或 cron。session state、逐字稿與事件檔保留在案件輸出位置。
會後可查閱 `output/<session-id>.md`、`output/<session-id>.state.json` 與 `output/<session-id>.events.jsonl`。這些檔案位於 Git ignore 的輸出資料夾，不會進入版控。

## 常見問題

- **瀏覽器沒有跳出麥克風權限請求**：檢查瀏覽器網址列旁邊的權限圖示，手動允許麥克風存取後重新整理頁面。
- **手機連不上**：確認手機跟電腦在同一個 Wi-Fi，不是用行動網路。
- **辨識出現「[聽不清楚]」**：代表那段音訊太短、太安靜，或雜訊太多，系統故意不猜測內容，需要重講一次。
- **為什麼不是 https**：Fish 定案。Chrome 憑證警告不過。週二現場也走 `http://localhost:8420`。https 是可選，不是預設。
