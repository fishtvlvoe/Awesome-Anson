## Why

案神即時陪同客戶訪談時，現在流程是「錄音頁面轉逐字稿 → Fish 中斷對話切到 IDE → 手動請 Claude Code 讀逐字稿 → 才給建議」。這代表對談進行中案神完全不主動，Fish 只能靠自己臨場反應；即使有 `realtime-need-capture-auto-trigger` 做出的自動觸發機制，也仍要求「一個開著的 Claude Code session 手動監看」才會動作，沒有這個 session 就完全沒有分析。同時錄音頁面右側的「AI 顧問」三欄面板是前端寫死的示範回覆，不是真正連到 Agent；`realtime-voice-advisor-workbench` 想把這塊做成正式三欄工作台，但從未完成端到端驗證（tasks 5.3 browser smoke 從未打勾），Fish 實測後三欄面板完全沒給出任何建議，唯一有用的是直接在 CLI 跟 AI 對話。

本次改成獨立跑的 CLI 顧問：業務下一個啟動指令，錄音服務與 CLI 顧問一起啟動，顧問自動監看逐字稿、自動偵測停頓或時間上限、主動在終端機列出現況與 1/2/3 選項，業務按數字即可拿到可直接對客戶說的下一句。CC／IDE 退回只負責開發與除錯，不再是客戶訪談中的必要操作介面。

## What Changes

- 新增 `realtime-cli-advisor` 能力：獨立跑的 `advisor_cli.py`，不依賴任何開著的 Claude Code／Codex 互動 session；由 session 生命週期自動啟動與停止，監控逐字稿新增內容與 session state，自然停頓（約 2-3 秒無新內容）或時間上限（連續無停頓累積 30-60 秒）觸發分析，將分析結果直接印在 CLI（現況／已確認／待確認／報價影響／最多三個 1/2/3 選項），接收業務輸入的數字並印出可直接對客戶說的句子，寫入 adoption event。
- 顧問後端可設定呼叫哪個 CLI（Codex／Claude Code 等），不綁死單一供應商。
- 新增文字脈絡角色推定：PM 由啟動者在 session 開始時指定，客戶角色由回答內容／問答順序／表態語氣推定，只回傳 `pm`／`client`／`unknown` 並附信心度，信心不足標 `unknown`／`pending`，不得自動改寫成「客戶已確認」；不需要聲音辨識或聲紋比對即可運作。
- 新增可累積的 session state（`confirmed_facts`／`open_questions`／`current_mental_model`／`quote_signals`／`pending_response_options`／`adoption_events`），每次分析同時參考累積狀態與新增逐字稿，避免每次只看最新片段重新猜整個案件；`realtime-need-capture` 既有的五分類／服務型 4x4／三態標記／PM-to-Quote 資料包規則沿用不變，本次只新增執行者與 session state，不修改其既有需求。
- **BREAKING**：`realtime-need-capture-auto-trigger` 既有「需要一個開著的 Claude Code session 手動監看逐字稿、寫 `.analysis.json` 給瀏覽器輪詢顯示」的運作模式，被本次 `realtime-cli-advisor` 取代；`tools/realtime-voice/monitor_transcript.py` 改為獨立跑的顧問腳本本體（或拆成 `advisor_cli.py`），不再只是「供 Monitor 類工具驅動的監看腳本」，`server.py` 的 `/analysis/<session_id>` 輪詢端點與前端三段式顯示區塊隨之棄用。
- **BREAKING**：`tools/realtime-voice/static/index.html` 收斂為只保留：開始／停止收音、麥克風權限與收音狀態、即時繁中逐字稿顯示、「顧問已連線／未連線」狀態；移除三欄分析面板與右側寫死的 AI 對話框，且不再載入三欄專用樣式。`realtime-voice-advisor-workbench` 從未跑通、從未上線的三欄原型與比對頁面（`index-v2.html`、`index-v2-dark.html`、`index-v2-conversation.html`、`index-v2-compare.html`、`realtime-workbench-demo.html`、`realtime-workbench-autonomous-demo.html`、`realtime-workbench-c.css`）一併從 `tools/realtime-voice/static/` 刪除，不留在介面目錄裡當半成品；`voice-profile.html`（聲音 profile 建檔頁）與其後端 `voice_identity.py`／`voice_profile_sync.py` 屬於獨立的 `cross-platform-voice-profile-sync` 能力，非三欄 demo 的一部分，本次不刪除。
- `scripts/start-realtime-voice.sh` 改為同時管理錄音 server 與 CLI 顧問的生命週期，一個指令啟動兩者、一起停止，不留 monitor／daemon／launchd 殘留進程。

## Non-Goals

- 不做多位客戶的自動聲音身份辨識；沒有聲音 profile 時，單一 PM＋單一客戶流程仍必須可用（聲音比對能力保留在獨立的 `cross-platform-voice-profile-sync` 能力，不在本次範圍內開發或串接）。
- 不做完整 Dashboard 或三欄顧問面板；`realtime-voice-advisor-workbench`（16/38，三欄工作台＋聲音身份標註）因此本次一併 park：Fish 已確認三欄方向不需要，且該 change 從未完成端到端驗證（tasks 5.3 browser smoke、5.4 self-review 均未完成），實測證實三欄顯示是半成品、沒有任何實際輸出。其未完成的三欄 UI 原型與 demo 頁面本次直接從介面目錄刪除，不留下半成品檔案；已完成的聲音身份儲存／比對後端程式碼（`voice_identity.py`／`voice_profile_sync.py`，屬於獨立能力）不在本次刪除範圍。
- 不讓顧問自動改報價、自動改程式或自動部署 Demo；路由只產生「目前應該怎麼問」的建議，要進入開發、報價或部署流程必須由 Fish 明確選擇並確認。
- 不採用「打開 Codex／Claude Code 桌面版手動問」的操作方式：這個方式犧牲了自動偵測與自動觸發，會讓業務員必須重新記得中斷對話手動發問，違背本次要解決的核心問題。
- 不做本機 LLM 部署；若 CLI 顧問使用外部模型服務，啟動時必須清楚顯示「逐字稿文字會送到哪個模型服務」，不得模糊宣稱完全本機。
- 不修改 `realtime-need-capture` 現有的正式規格內容（五分類、4x4、三態標記、資料包格式），本次不對該既有 spec 開 delta。

## Capabilities

### New Capabilities

- `realtime-cli-advisor`: 獨立跑的 CLI 顧問，自動監控逐字稿與 session state、自然停頓／時間上限自動觸發分析、終端機顯示現況與 1/2/3 選項、接收數字輸入產生可直接說出口的回應、寫入 adoption event，session 結束即停止不留背景程序。

### Modified Capabilities

- `realtime-voice-transcription`: 既有錄音／轉文字規格，新增「錄音介面畫面只保留收音控制、逐字稿顯示、顧問連線狀態」與「服務生命週期涵蓋 CLI 顧問，兩者一起啟動一起停止」的需求變更，移除既有三欄分析面板與寫死 AI 回覆相關的顯示需求。

## Impact

- Affected specs: `realtime-cli-advisor`（新）、`realtime-voice-transcription`（改）
- Affected code:
  - New:
    - `tools/realtime-voice/advisor_cli.py`
    - `tests/test_advisor_cli.py`
  - Modified:
    - `tools/realtime-voice/monitor_transcript.py`
    - `tools/realtime-voice/server.py`
    - `tools/realtime-voice/static/index.html`
    - `tools/realtime-voice/README.md`
    - `scripts/start-realtime-voice.sh`
    - `tests/test-realtime-analysis-options.js`
    - `tests/test-realtime-voice-identity.js`
  - Removed:
    - `tools/realtime-voice/static/index-v2.html`
    - `tools/realtime-voice/static/index-v2-dark.html`
    - `tools/realtime-voice/static/index-v2-conversation.html`
    - `tools/realtime-voice/static/index-v2-compare.html`
    - `tools/realtime-voice/static/realtime-workbench-demo.html`
    - `tools/realtime-voice/static/realtime-workbench-autonomous-demo.html`
    - `tools/realtime-voice/static/realtime-workbench-c.css`
