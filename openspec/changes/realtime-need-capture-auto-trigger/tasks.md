## 1. 觸發判斷：基於逐字稿檔案時間戳，不用音訊 VAD

- [x] 1.1 寫一個監看腳本（bash 或 python，供 Monitor 類工具驅動），持續讀取 `tools/realtime-voice/output/<session-id>.md`，比對最後一行時間戳與目前時間，實作「Dual trigger condition based on transcript timestamps」規格的停頓條件（初值 3 秒無新行視為停頓）；驗證：手動附加一行帶時間戳的測試資料到暫存檔案，等待超過門檻秒數，確認腳本印出觸發事件
- [x] 1.2 在同一個腳本實作時間上限條件：累積新增內容（依時間戳計算）達 30-60 秒未觸發過停頓時強制觸發；驗證：模擬連續每秒附加一行、持續 65 秒不間斷，確認腳本在時間窗內印出時間上限觸發事件而不是一直等停頓
- [x] 1.3 驗證「Trigger detection is independent from the browser's audio VAD」情境：確認這個監看腳本完全不讀取、不修改 `tools/realtime-voice/static/index.html` 既有的 VAD 邏輯或其 700ms 分段門檻；驗證：code review 確認監看腳本與前端程式碼之間沒有共用變數或直接依賴

## 2. 分析執行者：執行中的 AI coding agent session，不裝獨立模型；用 Haiku 等級子代理即可，不需要高階模型

- [x] 2.1 定義觸發後的分析呼叫格式：監看腳本觸發時，把「上次分析後新增的逐字稿內容」整理成給子代理的輸入，套用 `.claude/skills/realtime-need-capture/SKILL.md` 既有「即時回應」規格（客戶反應／拆解／建議），實作「Analysis performed by a lightweight agent, not a dedicated local model」規格；驗證：用今天實測的逐字稿內容（`tools/realtime-voice/output/20260822-185501.md`）跑一次，人工核對子代理回覆內容符合三段式規格，且過程沒有安裝任何額外模型或推論元件
- [x] 2.2 把子代理輸出寫成 `tools/realtime-voice/output/<session-id>.analysis.json`，格式對應 design.md 定義的欄位（`client_response`／`decomposition`／`suggestion`／`analyzed_through_ts`／`generated_at`）；驗證：檢查產出的 JSON 檔案可以被 `json.load` 正確解析，欄位齊全
- [x] 2.3 實作「No active agent session monitoring」情境：沒有監看腳本在跑時，不產生任何分析檔案，逐字稿寫入與收音功能不受影響；驗證：不啟動監看腳本、正常收音一段時間，確認 `output/` 底下沒有出現對應的 `.analysis.json` 檔案，且 `.md` 逐字稿檔案正常寫入

## 3. 分析結果傳遞：HTTP 輪詢端點，不用 WebSocket 新訊息類型

- [x] 3.1 在 `tools/realtime-voice/server.py` 新增 `GET /analysis/<session_id>` 端點，實作「Analysis results delivered via a polling HTTP endpoint」規格：讀取對應的 `.analysis.json` 並回傳；驗證：`curl http://localhost:8420/analysis/<有效session-id>` 在檔案存在時回傳其 JSON 內容，狀態碼 200
- [x] 3.2 實作「No analysis yet」情境：檔案不存在時端點回傳 200 且內容為 `{"status": "not_yet_analyzed"}`；驗證：對一個還沒產生分析結果的 session id 呼叫端點，確認回傳狀態碼 200（不是 404）且內容符合預期結構
- [x] 3.3 實作「Malformed analysis file」情境：檔案存在但無法解析時端點回傳 `{"status": "analysis_error"}`；驗證：手動寫一個壞掉的 JSON 到對應路徑，呼叫端點確認回傳這個錯誤狀態而非拋出未處理例外

## 4. 前端顯示

- [x] 4.1 在 `tools/realtime-voice/static/index.html` 新增即時分析顯示區塊，固定間隔（3-5 秒）輪詢 3.1 的端點，實作「Analysis panel shows three fixed sections in order」規格：依序顯示客戶反應／拆解狀態（含三態標記樣式）／下一步建議；驗證：手動開頁面，用瀏覽器開發工具模擬端點回傳測試資料，確認三個區塊依序渲染且內容對應正確
- [x] 4.2 實作「Client has not spoken yet」與「Graceful degradation when no monitoring is active」兩種情境的文案顯示：分別對應「客戶還沒回應」與「目前沒有即時分析（可能沒有 agent session 在監看）」；驗證：手動模擬對應端點回傳值，確認畫面顯示對應文案而非空白或報錯畫面
- [ ] 4.3 實作「One suggestion, not a checklist」情境：建議區塊只顯示一句話，不渲染成清單；驗證：模擬多筆待確認欄位的回傳資料，確認畫面只顯示一句建議文字

## 5. 監看操作說明與生命週期

- [ ] 5.1 在 `tools/realtime-voice/README.md` 補充說明：業務員開始收音後，若要啟用即時分析，需要另外請 agent session 執行監看指令（記錄 1.1/1.2 腳本的實際呼叫方式），並說明「Automatic monitoring stops when recording stops」規格——監看跟著收音 session 結束，不留背景 process；驗證：README 內容包含實際可複製貼上的監看啟動指令，且指令能對照 tasks 1.1 的腳本路徑

## 6. Automatic trigger during live conversation, driven by an active agent session（整合驗收）

- [ ] 6.0 確認整條「Automatic trigger during live conversation, driven by an active agent session」規格成立：收音進行中（未按停止收音）且監看腳本正在跑，過程中至少產生一次自動分析，業務員不需手動觸發；驗證：計時觀察一次完整收音過程，記錄自動觸發發生的時間點與次數

## 7. 端到端驗證

- [ ] 6.1 完整跑一次「開始收音 → 講話產生逐字稿 → 監看腳本偵測停頓 → 觸發子代理分析 → 寫入 `.analysis.json` → 前端輪詢顯示」全流程；驗證：用今天累積的實測逐字稿內容重播或即席講話，確認分析面板實際跳出結果且內容合理，附截圖或終端機輸出當證據
- [ ] 6.2 完整跑一次「連續講超過 1 分鐘不停頓」流程，確認時間上限有強制觸發至少一次分析；驗證：手動計時實測，確認 60 秒內畫面有分析更新
- [ ] 6.3 完整跑一次「不啟動監看腳本直接收音」流程，確認收音與逐字稿功能完全不受影響，畫面顯示「目前沒有即時分析」而非任何錯誤；驗證：手動實測，對照既有 `realtime-voice-transcription` 的驗收標準沒有退步
