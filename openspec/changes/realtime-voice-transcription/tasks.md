## 1. 環境與相依套件設置

- [x] 1.1 建立 tools/realtime-voice/requirements.txt 鎖定 funasr、torch、torchaudio、opencc-python-reimplemented 版本；驗證：在乾淨 venv 執行 `pip install -r tools/realtime-voice/requirements.txt` 成功不報錯
- [x] 1.2 撰寫 tools/realtime-voice/README.md 說明一次性安裝步驟（模型下載、預期耗時、Ctrl+C 關閉方式）；驗證：照 README 從零安裝一次，過程不需要額外查資料即可跑起來

## 2. 本機收音介面（收音介面：本機小網頁，不做獨立 App）

- [x] 2.1 依「收音介面：本機小網頁，不做獨立 App」的決策，實作 tools/realtime-voice/static/index.html 的 Local push-to-record web interface：開始/停止按鍵，用 getUserMedia/MediaRecorder 收音並透過 WebSocket 送到 /stream；驗證：手動打開頁面按「開始」，瀏覽器彈出麥克風權限請求
- [x] 2.2 實作麥克風權限被拒絕時的畫面提示；驗證：手動在瀏覽器封鎖麥克風權限後開啟頁面，畫面顯示「需要允許麥克風權限才能開始收音」文字，不是空白畫面
- [x] 2.3 伺服器啟動時印出區域網路 IP 網址供手機連線；驗證：啟動服務後終端機輸出包含形如 `http://192.168.` 開頭的網址

## 3. 本機語音辨識（辨識引擎：本機 FunASR SenseVoiceSmall，不用瀏覽器內建語音辨識、不用雲端 API）

- [x] 3.1 依「辨識引擎：本機 FunASR SenseVoiceSmall，不用瀏覽器內建語音辨識、不用雲端 API」的決策，實作 tools/realtime-voice/server.py 載入 iic/SenseVoiceSmall 模型，在 /stream 收到音訊段落時完成 Local speech-to-text transcription with confidence flagging；驗證：`tests/test-realtime-voice-writes-to-inbox.js` 模擬一段辨識結果並通過
- [x] 3.2 實作 confidence flagging：低信心或過短片段標記「[聽不清楚]」而非靜默丟棄或亂猜；驗證：以極短或空白音訊片段呼叫辨識函式，回傳文字以「[聽不清楚]」開頭
- [x] 3.3 實作模型載入失敗時印出明確錯誤並以非 0 結束碼結束進程；驗證：指向不存在的模型路徑啟動服務，進程印出錯誤訊息後結束，不留下接受連線的伺服器

## 4. 簡繁轉換（簡繁轉換：OpenCC `s2twp`，在伺服器端轉換後才寫入輸出檔）

- [x] 4.1 依「簡繁轉換：OpenCC `s2twp`，在伺服器端轉換後才寫入輸出檔」的決策，在辨識結果送出前串接 OpenCC `s2twp` 完成 Simplified-to-traditional Chinese conversion；驗證：`tests/test-realtime-voice-s2tw-conversion.js` 餵入「开放时间早上9点至下午5点。」，斷言輸出為「開放時間早上9點至下午5點。」

## 5. 逐字稿輸出檔與案神銜接（案神銜接方式：寫固定路徑輸出檔，人在 Claude Code session 裡手動指給 realtime-need-capture 讀，不做檔案監看常駐服務）

- [x] 5.1 依「案神銜接方式：寫固定路徑輸出檔，人在 Claude Code session 裡手動指給 realtime-need-capture 讀，不做檔案監看常駐服務」的決策，實作每段辨識結果附加寫入 tools/realtime-voice/output/<session-id>.md，格式 `- [ISO時間] 文字`，完成 Session transcript file for handoff to realtime-need-capture；驗證：`tests/test-realtime-voice-writes-to-inbox.js` 斷言檔案新增對應格式的一行
- [x] 5.2 實作 session-id 由伺服器啟動時間戳產生，不覆蓋前一個 session 檔案；驗證：連續啟動兩次服務，兩個輸出檔案檔名不同且都存在
- [x] 5.3 在 .claude/skills/realtime-need-capture/SKILL.md 補充說明輸入來源可以是這個服務產生的輸出檔案路徑；驗證：SKILL.md 內容包含 `tools/realtime-voice/output` 這個路徑的說明文字

## 6. 手動啟動、非常駐生命週期（Manually-started, non-persistent service）

- [x] 6.1 確認安裝與啟動流程不建立任何 launchd plist 或 cron 排程，符合 Manually-started, non-persistent service 要求；驗證：`find ~/Library/LaunchAgents -iname "*realtime-voice*"` 沒有任何結果
- [x] 6.2 實作 Ctrl+C（SIGINT）終止進程後不再接受新的收音連線；驗證：啟動服務後手動送出 SIGINT，進程結束，後續對 /stream 的連線嘗試失敗

## 7. 手機瀏覽器端到端驗證

- [x] 7.1 用手機瀏覽器開啟同一區網網址，完成一次「開始收音→取得文字→寫入輸出檔」完整流程；驗證：手動實測一次，輸出檔案裡出現手機講的那句話的繁體文字（2026-08-22 實測：因手機瀏覽器對非 localhost 的 http 來源會擋麥克風權限，過程中補了自簽憑證讓服務跑 https，且修正了停止收音時最後一段辨識結果被截斷的 bug；修好後用真實瀏覽器連線完整測過，輸出檔 `output/20260822-185501.md` 有完整逐字稿）
