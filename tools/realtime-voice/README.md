# 即時語音接案神

按鍵開始收音，講話同時即時轉成繁體文字，文字持續寫進一個檔案，讓你在 Claude Code 對話裡直接交給 `realtime-need-capture` 讀取分析。完全在本機／區域網路跑，不上雲端、不用 API 費用。

## 一次性安裝（只需要做一次，預估 10-15 分鐘，取決於網速）

```bash
cd tools/realtime-voice
python3 -m venv venv
venv/bin/pip install -r requirements.txt
```

第一次啟動服務時，會自動下載 FunASR 的 `iic/SenseVoiceSmall` 語音辨識模型（約 936MB），下載一次後會存在 `~/.cache/modelscope/`，之後啟動不用重新下載。網速普通的情況下，第一次啟動大概要等 5-10 分鐘。

## 每次使用

```bash
cd tools/realtime-voice
venv/bin/python server.py
```

啟動後終端機會印出：

- 電腦本機網址（例如 `http://localhost:8420`）
- 區域網路網址（例如 `http://192.168.1.23:8420`）——手機要連這個網址，手機跟電腦要在同一個 Wi-Fi 下

用電腦或手機瀏覽器打開對應網址，按「開始」開始收音，講話同時畫面會即時顯示辨識出的繁體文字。文字同時持續寫進 `output/<session-id>.md`。

## 對談結束後

在終端機按 `Ctrl+C` 關閉服務。這個服務**不會**背景常駐、**不會**開機自動啟動，關掉就是真的關掉，下次要用再重新執行 `venv/bin/python server.py`。

## 交給案神分析

對談結束或告一段落後，在 Claude Code 對話裡把 `output/<session-id>.md` 的路徑交給案神（觸發 `realtime-need-capture`），跟現在手動貼文字的操作一樣簡單，只是文字來源從自己打字變成講話自動產生。

## 常見問題

- **瀏覽器沒有跳出麥克風權限請求**：檢查瀏覽器網址列旁邊的權限圖示，手動允許麥克風存取後重新整理頁面。
- **手機連不上**：確認手機跟電腦在同一個 Wi-Fi，不是用行動網路。
- **辨識出現「[聽不清楚]」**：代表那段音訊太短、太安靜，或雜訊太多，系統故意不猜測內容，需要重講一次。
