## Context

案神目前有可動的本機錄音／FunASR 逐字稿服務（`tools/realtime-voice/server.py`＋`static/index.html`），也有已驗證過一次「定期觸發 headless 分析」機制（`realtime-need-capture-auto-trigger`，17/17，2026-08-22 實測：`monitor_transcript.py` 偵測停頓後呼叫 `claude --model haiku`，產出 `.analysis.json`，`server.py` 提供 `/analysis/<session_id>` 輪詢端點）。但這個機制要求「有一個開著的 Claude Code session 在監看」才算數，沒有這種 session 就完全沒有分析；而前端顯示層原本設計走三欄工作台（`realtime-voice-advisor-workbench`，16/38），Fish 實測後三欄面板完全沒給出任何建議，且該 change 從未完成端到端 browser smoke（tasks 5.3、5.4 從未打勾），已被 park。

本次把「已驗證能動的分析引擎」與「已驗證有用的呈現方式（CLI 對話）」接起來，取代兩條沒驗證成功的舊路（互動 session 監看、三欄面板），做成一個獨立跑的 CLI 顧問。

## Goals / Non-Goals

**Goals:**

- 一個啟動指令同時啟動錄音服務與 CLI 顧問，兩者生命週期綁在一起。
- CLI 顧問不依賴任何開著的互動 Agent session，自己偵測觸發時機並呼叫可設定的分析後端。
- 分析結果與 1/2/3 選項直接印在 CLI 終端機，業務按數字取得可直接說出口的句子。
- Session state 累積保存已確認／待確認事項，每次分析都帶入完整狀態而非只看最新片段。
- PM／客戶角色用文字脈絡推定，信心不足標 `unknown`／`pending`，不需要聲音辨識即可運作。

**Non-Goals:**

- 不做多位客戶的自動聲音身份辨識（聲音比對能力保留在獨立的 `cross-platform-voice-profile-sync` 能力，本次不串接、不繼續開發）。
- 不做三欄／Dashboard 呈現；瀏覽器只保留收音控制、逐字稿、顧問連線狀態；`realtime-voice-advisor-workbench` 未完成、從未驗證成功的三欄原型與 demo 頁面本次直接刪除，不留在介面目錄裡。
- 不讓顧問自動改報價、改程式或部署 Demo，只產生建議文字。
- 不支援「手動開 Codex／Claude Code 桌面版問」作為產品流程；顧問必須自動觸發，不能要求業務主動發問。

## Decisions

### Decision 1：CLI 顧問是獨立跑的程序，不依賴互動 Agent session

取代 `realtime-need-capture-auto-trigger` 的「需要開著的 Claude Code session 執行 Monitor 類工具監看逐字稿」模式。改為 `tools/realtime-voice/advisor_cli.py`：一個可獨立啟動、獨立運作的 Python 程序，本身負責監看逐字稿檔案、判斷觸發時機、呼叫分析後端、印出結果與接收數字輸入，全程不需要任何人在旁邊開著 IDE 對話視窗。

替代方案考慮：沿用舊模式但把顯示從瀏覽器改到終端機——被拒絕，因為仍然要求「有人開著 Claude Code session 執行監看指令」，不符合「業務只需一個啟動指令」的目標，也是 Fish 明確拒絕的「打開 Codex 桌面版手動問」模式的變體。

### Decision 2：分析後端可設定、呼叫既有已驗證的 headless 呼叫模式

沿用 `realtime-need-capture-auto-trigger` 已驗證能動的「headless 呼叫 CLI 產出結構化 JSON」機制（如 `claude --model haiku "<prompt>"` 或 `codex exec "<prompt>"`），但抽成可設定的 backend adapter（例如環境變數或設定檔指定 `claude`／`codex`／未來其他 CLI），`advisor_cli.py` 呼叫時不寫死單一供應商。

替代方案考慮：自建或串接獨立本機/雲端 LLM API——被拒絕，`realtime-need-capture-auto-trigger` 的討論已否決過 Apple Intelligence／Ollama 方案，理由是分析本該由既有 Agent CLI 完成，不需另疊一層模型。

### Decision 3：自動觸發規則——停頓優先，時間上限保底

延續 SR 文件與 `realtime-need-capture-auto-trigger` 已驗證的雙觸發條件：新增逐字稿後約 2-3 秒無新內容視為停頓觸發；連續無停頓時，累積約 30-60 秒強制觸發一次。每次觸發把連續短片段合併成一個可理解的對話回合再送給分析後端，不用瀏覽器 700ms 音訊切段直接當一次顧問回合。

### Decision 4：Session state 累積保存，每次分析帶入完整狀態

顧問維護一份 session state（`confirmed_facts`／`open_questions`／`current_mental_model`／`quote_signals`／`last_analysis_ts`／`pending_response_options`／`adoption_events`），每次觸發時把「目前累積狀態＋上次分析後新增的逐字稿＋上次業務選擇的 1/2/3」一起交給分析後端，避免每次只看最新 30 秒重新猜整個案件。

### Decision 5：PM／客戶角色用文字脈絡推定，不需要聲音辨識

Session 啟動者在啟動時直接指定為 `pm`／業務員角色，不由模型猜。之後每句話只用文字功能判斷候選角色：提問／重述／確認句 → `pm_candidate`；描述現況／限制／同意或拒絕 → `client_candidate`。模型只回傳 `pm`／`client`／`unknown` 並附信心度與判斷依據，信心不足標 `unknown`／`pending`，不得自動改寫成「客戶已確認」。單一 PM＋單一客戶場景下不阻塞於任何聲音 profile 的存在與否。

替代方案考慮：等 `realtime-voice-advisor-workbench` 的聲音比對功能做完再上線——被拒絕，該功能從未驗證成功，且文字脈絡推定已足以支撐第一版可用性，聲音比對留作多人場景的後續增強。

### Decision 6：瀏覽器介面收斂為錄音控制＋逐字稿＋連線狀態

`tools/realtime-voice/static/index.html` 移除三欄分析面板與右側寫死的 AI 對話框，只保留開始／停止收音、麥克風權限與收音狀態、即時繁中逐字稿、「顧問已連線／未連線」狀態。`server.py` 的 `/analysis/<session_id>` 舊輪詢端點與其對應前端顯示區塊一併棄用（顧問結果只在 CLI 顯示，不在瀏覽器顯示）。`realtime-voice-advisor-workbench` 留在 `static/` 目錄裡從未上線、從未驗證成功的三欄原型與比對頁面（`index-v2.html`、`index-v2-dark.html`、`index-v2-conversation.html`、`index-v2-compare.html`、`realtime-workbench-demo.html`、`realtime-workbench-autonomous-demo.html`、`realtime-workbench-c.css`）本次一併刪除，不留半成品檔案在介面目錄裡；`voice-profile.html` 與其後端 `voice_identity.py`／`voice_profile_sync.py` 屬於獨立的 `cross-platform-voice-profile-sync` 能力，不受影響。

### Decision 7：啟動與停止生命週期綁在一起，不留背景程序

`scripts/start-realtime-voice.sh` 同時啟動錄音 server 與 `advisor_cli.py`，任一元件啟動失敗時明確報錯（不能顧問其實沒啟動但畫面看起來正常）。停止收音或按 `q` 時，兩者一起結束，不留 monitor、Agent worker、daemon 或 launchd 殘留進程；session state、逐字稿與事件保留在案件資料夾供會後查閱。

## Implementation Contract

**行為（業務員視角）**：執行一個啟動指令後，終端機顯示「顧問 ready」、分析後端名稱、資料保存位置與隱私狀態；瀏覽器開啟錄音頁面按下開始收音；客戶回答完停頓約 2-3 秒後，CLI 自動印出：

```text
[案神] 客戶目前現況
已確認：...
尚未確認：...
報價影響：...

[案神] 建議下一步，請選擇：
1. ...
2. ...
3. ...

請輸入 1／2／3，Enter 跳過，q 結束：
```

輸入 `1`／`2`／`3` 後印出對應的可直接對客戶說的句子，並寫入 adoption event；輸入 `Enter` 跳過本輪；輸入 `q` 停止顧問與錄音服務。

**資料形狀**：

- 每次分析輸出 JSON（`advisor_cli.py` 內部使用，不直接顯示原始 JSON 給業務）：`client_response`、`current_state`、`confirmed`、`open_questions`、`quote_impact`、`mental_model`、`evidence`、`recommended_next_move`、`response_options`（最多 3 項）、`speaker_attribution`（含 `segment_id`／`role`／`confidence`／`reason`）、`route`（`realtime-need-capture|pm|quote|web-design|none`）。
- Session state 檔案（`tools/realtime-voice/output/<session_id>.state.json`）：`session_id`、`operator_role`、`case_ref`、`confirmed_facts`、`open_questions`、`current_mental_model`、`quote_signals`、`last_analysis_ts`、`pending_response_options`、`adoption_events`。

**失敗模式**：

- 錄音 server 或顧問任一啟動失敗 → 啟動指令明確報錯並終止，不讓另一個元件單獨跑起來造成「看起來正常但顧問沒運作」的假象。
- 只有業務員說話、客戶尚未回應 → 顧問輸出「客戶尚未回應」，不觸發 1/2/3 選項，不腦補客戶需求。
- 內容太短、聽不清楚或角色不明 → 標 `unknown`／`pending`，不得寫成客戶已確認的事實。
- 上一次分析尚未完成時新內容持續累積 → 不重複呼叫分析後端，排隊等上一次完成後一次處理累積內容。
- 分析後端呼叫失敗（CLI 不存在、逾時、回傳非預期格式）→ 顧問印出明確錯誤訊息，錄音與逐字稿功能不受影響，不讓終端機卡死或安靜失敗。

**驗收準則**：

- 匿名 fixture 模擬 PM／客戶交替發言，客戶回答後自動觸發一次分析（不需人工輸入「請分析」）。
- `curl` 或直接檢視 session state 檔案確認「已確認事項」在下一輪分析後仍保留，不因新分析而遺失。
- 手動測試連續講話超過 60 秒不停頓，確認時間上限強制觸發至少一次。
- `q` 或停止收音後，用 `ps` 確認沒有殘留的 `advisor_cli.py` 或 monitor 進程。
- 真實逐字稿、session state、事件檔不進 Git；測試 fixture 全部匿名、不含真實客戶內容或音檔。

**範圍界線**：

- In scope：`advisor_cli.py` 本體、`monitor_transcript.py` 改造或拆分、`server.py` manifest／狀態端點調整、`index.html` 精簡、`start-realtime-voice.sh` 生命週期整合、README 更新、對應測試。
- Out of scope：`realtime-voice-advisor-workbench` 已完成的聲音身份比對後端邏輯（`voice_identity.py`／`voice_profile_sync.py`，屬於獨立的 `cross-platform-voice-profile-sync` 能力，不刪除也不繼續開發；未完成的三欄 UI 原型與 demo 頁面則在本次範圍內直接刪除，見 Decision 6）、`cross-platform-voice-profile-sync`（已完成，不受影響）、`realtime-voice-public-https-url`（獨立功能，不受影響）、報價單／程式碼／Demo 的自動修改或部署（顧問只給建議文字）。

## Risks / Trade-offs

- [風險] 顧問依賴外部 CLI（Codex／Claude Code）headless 呼叫，若該 CLI 未安裝或未登入會導致分析失敗 → [對策] 啟動時檢查後端 CLI 是否可執行，不可執行時明確報錯並列出安裝/登入指引，不讓服務假裝正常。
- [風險] 文字脈絡角色推定在資訊不足時可能誤判 PM/客戶 → [對策] 信心不足一律標 `unknown`／`pending`，並保留 CLI 低成本人工修正選項（1.客戶 2.PM 3.暫不判定），不強制每段都要求人工標記。
- [風險] 逐字稿文字送到外部模型服務可能涉及隱私 → [對策] 啟動時明確顯示「逐字稿文字會送到哪個模型服務」，不得模糊宣稱完全本機；音檔仍維持本機保存不上傳。
- [風險] 刪除三欄原型檔案時誤刪聲音身份比對的後端邏輯 → [對策] 明確區分「三欄 UI 原型/demo 頁面（刪除）」與「`voice_identity.py`／`voice_profile_sync.py` 聲音比對後端（不刪除，屬於獨立的 `cross-platform-voice-profile-sync` 能力）」，刪除清單只列 `static/` 底下的原型與 demo 檔案，不動任何 `.py` 後端檔案。

## Migration Plan

1. 先寫 session state／analysis schema 的 fixture 與驗證腳本（對應 `spectra:apply` tasks 第一批）。
2. 把 `monitor_transcript.py` 改造或拆出 `advisor_cli.py`，具備獨立觸發、session state、CLI 選項輸入能力，不再要求外部 Agent session 監看。
3. `scripts/start-realtime-voice.sh` 改為同時啟動並管理錄音 server 與 `advisor_cli.py` 的生命週期。
4. 加入文字角色推定與 `unknown` fallback。
5. 精簡 `index.html`，移除三欄面板與寫死 AI 回覆。
6. 用真實 browser smoke 驗證「收音 → 逐字稿 → 自動分析 → CLI 1/2/3 → event 保存 → 停止後無殘留進程」全流程。
7. 執行 `spectra park realtime-voice-advisor-workbench`（若尚未 park）確認舊三欄路線正式停止推進；`realtime-need-capture-auto-trigger` 待本次 archive 時在 archive 說明中標記為被取代。

無需 rollback 特殊處理：新舊程式碼可並存於 repo，`advisor_cli.py` 未啟動時不影響現有錄音功能；若需退回舊行為，直接不執行新啟動腳本即可。

## Open Questions

- 分析後端預設用哪一個 CLI（`claude` 或 `codex`）？先以 `realtime-need-capture-auto-trigger` 已驗證的 `claude --model haiku` 為預設，`codex` 作為可設定的替代選項，實作時如有更明確偏好由 Fish 在 apply 階段確認。
