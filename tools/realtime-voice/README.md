# 即時語音接案神

按鍵開始收音，講話同時即時轉成繁體文字，文字持續寫進一個檔案，讓你在 Claude Code 對話裡直接交給 `realtime-need-capture` 讀取分析。完全在本機／區域網路跑，不上雲端、不用 API 費用。

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
cd tools/realtime-voice
bash ../../scripts/start-realtime-voice.sh
```

啟動後終端機會印出：

- 電腦本機網址（例如 `http://localhost:8420`）
- 區域網路網址（例如 `http://192.168.1.23:8420`）——手機要連這個網址，手機跟電腦要在同一個 Wi-Fi 下

用電腦或手機瀏覽器打開對應網址，按「開始」開始收音，講話同時畫面會即時顯示辨識出的繁體文字。文字同時持續寫進 `output/<session-id>.md`。

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

## 對談中啟用即時分析

即時分析不是 `server.py` 的背景服務。開始收音後，請由目前的 agent session
在前景執行監看器：

```bash
cd tools/realtime-voice
venv/bin/python monitor_transcript.py output/<session-id>.md
```

把 `<session-id>` 換成 server 啟動時印出的實際 session id。監看器只讀取逐字稿
每行的時間戳，不讀取瀏覽器音訊，也不改動既有 700ms VAD 分段。

- 最後一行超過 3 秒沒有新增內容：觸發一次停頓分析。
- 沒有停頓時，新增內容依時間戳累積達 30 秒：觸發一次時間上限分析。
- 觸發後，Haiku 等級的外部 agent 只分析上次分析之後新增的內容。
- 結果寫入 `output/<session-id>.analysis.json`，頁面每 4 秒輪詢並顯示。

監看器以前景程序執行，不會自行 daemonize。停止收音後，讓同一個 agent session
停止這個監看指令；server 關閉時不會留下任何 server-side 監看程序。若 server
是由背景程序啟動，可傳入 PID 讓 server 行程退出時自動結束監看器：

```bash
venv/bin/python monitor_transcript.py output/<session-id>.md --server-pid <server-pid>
```

沒有 agent session 監看時，收音與逐字稿仍照常運作，頁面顯示「目前沒有即時分析（可能沒有 agent session 在監看）」。

## 對談結束後

在終端機按 `Ctrl+C` 關閉服務。這個服務**不會**背景常駐、**不會**開機自動啟動，關掉就是真的關掉，下次要用再重新執行 `venv/bin/python server.py`。

## 交給案神分析

對談結束或告一段落後，在 Claude Code 對話裡把 `output/<session-id>.md` 的路徑交給案神（觸發 `realtime-need-capture`），跟現在手動貼文字的操作一樣簡單，只是文字來源從自己打字變成講話自動產生。

## 常見問題

- **瀏覽器沒有跳出麥克風權限請求**：檢查瀏覽器網址列旁邊的權限圖示，手動允許麥克風存取後重新整理頁面。
- **手機連不上**：確認手機跟電腦在同一個 Wi-Fi，不是用行動網路。
- **辨識出現「[聽不清楚]」**：代表那段音訊太短、太安靜，或雜訊太多，系統故意不猜測內容，需要重講一次。
