## 1. 品質驗證（gate，其他任務都要等這關過了才能繼續）

- [ ] 1.1 用 Swift 寫一個最小測試程式，呼叫 Apple Foundation Models framework，對今天實測留下的逐字稿（`tools/realtime-voice/output/20260822-185501.md`）用 Guided Generation（`@Generable` schema）做「拆解成人群/場景/痛點/需求/解決方案＋三態標記＋一句下一步建議」的抽取；驗證：印出結構化結果，人工檢查三態標記是否合理、建議是否切題（對應 design.md「分析引擎：Apple Foundation Models framework + Guided Generation」決策的品質底線）
- [ ] 1.2 若 1.1 的結果不可用（標記亂標、建議文不對題），停下來回報 Fish，列出實測輸出當證據，不得繼續後面任務硬做；驗證：若觸發此情況，回報訊息附上實際輸出範例

## 2. Swift 分析 CLI

- [ ] 2.1 定義 Guided Generation 的 `@Generable` struct，欄位對應 spec「Analysis panel shows three fixed sections in order」的三段輸出（客戶反應陣列、decomposition 物件含三態 enum、單一建議字串）；驗證：`swift build` 通過，型別檢查無錯誤
- [ ] 2.2 實作 CLI 入口：讀 stdin（新增逐字稿內容＋既有已確認欄位當上下文），呼叫 `LanguageModelSession` 做 Guided Generation，輸出結構化 JSON 到 stdout；驗證：`echo "<測試逐字稿>" | swift run analyze-cli` 印出符合 schema 的 JSON
- [ ] 2.3 實作「On-device analysis via Apple Foundation Models Guided Generation」規格中「On-device model unavailable」情境：CLI 啟動時檢查 `SystemLanguageModel.default.availability`，非 `available` 時回傳明確的錯誤 JSON（不是 crash）；驗證：手動模擬（或用 mock）讓 availability 回傳非 available 值，確認 CLI 回傳可解析的錯誤結構而非非零 exit 卻無輸出
- [ ] 2.4 實作逾時控制：Guided Generation 呼叫超過設定秒數（初值 10 秒）視為失敗，CLI 回傳逾時錯誤 JSON；驗證：用人工延遲測試或縮短逾時值測試，確認超時後 CLI 在預期時間內回傳而不是無限等待

## 3. 觸發判斷：雙條件（自然停頓 OR 時間上限），沿用既有 VAD（伺服器端）

- [ ] 3.1 在 `tools/realtime-voice/server.py` 新增獨立的停頓計時邏輯，跟現有 VAD 切段用的 700ms 門檻分開，實作 spec「Dual trigger condition — pause detection or time cap」的停頓門檻（初值 3 秒）；驗證：新增單元測試模擬「新增逐字稿內容後 3 秒無新內容」情境，確認觸發函式被呼叫
- [ ] 3.2 實作時間上限判斷：累積新增逐字稿內容達 30-60 秒未被停頓觸發時強制觸發一次；驗證：新增單元測試模擬「連續 65 秒不間斷新增內容、無停頓」情境，確認時間上限觸發函式在時間窗內被呼叫
- [ ] 3.3 實作「Automatic trigger during live conversation」規格：觸發判斷模組持續監看 session 對應的逐字稿內容（增量讀取，不重複分析已分析過的內容），並在觸發時呼叫 2.2 的 Swift CLI；驗證：整合測試，模擬連續寫入逐字稿檔案，確認觸發後傳給 CLI 的內容只包含上次分析後新增的部分

## 4. 分析結果傳遞：`server.py` 內部函式呼叫 → WebSocket 推播

- [ ] 4.1 在 `handle_stream`（`tools/realtime-voice/server.py`）新增 `{"type": "analysis", ...}` 訊息格式，實作「Analysis results delivered over the existing WebSocket connection」規格，重用既有 `/stream` 連線推播，不開新連線；驗證：整合測試對 `/stream` 送出模擬逐字稿觸發分析後，WebSocket 收到的訊息包含 `type: "analysis"` 且欄位符合 design.md 定義的 JSON 結構
- [ ] 4.2 實作「Analysis call fails or times out」情境：CLI 呼叫失敗或逾時時，WebSocket 送出標記失敗狀態的 analysis 訊息，而非略過不送；驗證：模擬 CLI 回傳錯誤，確認 WebSocket 送出的訊息帶有失敗標記欄位

## 5. 前端顯示

- [ ] 5.1 在 `tools/realtime-voice/static/index.html` 新增即時分析顯示區塊，實作「Analysis panel shows three fixed sections in order」規格：固定順序顯示客戶反應／拆解狀態（含三態標記樣式）／下一步建議；驗證：手動開頁面，用瀏覽器開發工具送出模擬 WebSocket analysis 訊息，確認三個區塊依序渲染且內容對應正確
- [ ] 5.2 實作「客戶還沒回應」與「本機 AI 模型無法使用」兩種文案顯示情境，對應 spec「Client has not spoken yet」與「On-device model unavailable」情境；驗證：手動送出對應狀態的模擬訊息，確認畫面顯示對應文案而非空白或報錯畫面
- [ ] 5.3 實作「One suggestion, not a checklist」情境：建議區塊只顯示一句話，不渲染成清單；驗證：送入多筆待確認欄位的模擬資料，確認畫面只顯示一句建議文字

## 6. 監看生命週期

- [ ] 6.1 實作「Automatic monitoring stops when recording stops」規格：業務員按「停止收音」或伺服器收到 SIGINT 時，取消所有排程中的分析觸發計時器，不留下背景 process；驗證：啟動服務、觸發至少一次分析、按 Ctrl+C 關閉，確認 `ps` 檢查不到殘留的分析監看 process

## 7. 端到端驗證

- [ ] 7.1 完整跑一次「開始收音 → 講話產生逐字稿 → 停頓 3+ 秒 → 分析結果顯示在頁面上」流程；驗證：手動實測，用今天累積的實測逐字稿內容重播或即席講話，確認分析面板實際跳出結果且內容合理
- [ ] 7.2 完整跑一次「連續講超過 1 分鐘不停頓」流程，確認時間上限有強制觸發至少一次分析；驗證：手動計時實測，確認 60 秒內畫面有分析更新
