## Context

`realtime-voice-transcription`（已完成 15/15）提供本機收音＋辨識＋簡轉繁，逐字稿持續寫進 `tools/realtime-voice/output/<session-id>.md`。`realtime-need-capture` skill 已定義「即時回應」規格（客戶反應了什麼／拆解目前樣子／給業務員下一步建議），但目前只能由業務員手動觸發，對談進行中案神完全不動作。

本次要在收音服務裡加一層自動監看＋分析，讓業務員收音時，畫面上會自動跳出即時分析，不用自己觸發。

**架構決策已經歷一次翻案**：最初設計是裝一個獨立的本機小模型（先試 Apple Intelligence，後考慮 Ollama＋Qwen2.5）在 `server.py` 裡自動呼叫做分析。實測 Apple Intelligence 自由文字生成效果不理想，且只能在 Mac 上跑，跨平台（Windows）要嘛沒有對應硬體（Copilot+ PC 限定）要嘔另外裝 Ollama。討論到最後發現這個問題问錯了方向：**業務員收音時，Claude Code（或同等的 AI coding agent）session 本來就開著**，分析這件事直接讓這個 session 自己做就好，不需要疊一層獨立模型——品質更好（前面已手動示範過一次完整分析）、不用裝任何額外軟體、沒有跨平台模型選型問題。本文件記錄的是翻案後的最終設計。

## Goals / Non-Goals

**Goals:**

- 收音進行中，執行中的 AI coding agent session 持續監看逐字稿新增內容，在「業務員自然停頓思考」或「累積 30-60 秒」兩個條件先到者觸發一次分析
- 分析結果（客戶反應／拆解／下一步建議，比照 `realtime-need-capture` SKILL.md 既有規格）寫成檔案，收音頁面輪詢顯示

**Non-Goals:**

- 不做成不需要人／agent 在場的背景服務。這個功能明確依賴一個正在執行、正在監看的 AI agent session，缺席時退回手動觸發（跟現況一樣，不是退步）
- 不安裝、不整合任何獨立 LLM 模型（Apple Intelligence／Ollama／其他），這是本次設計翻案後明確排除的方向
- 不改動 `realtime-voice-transcription` 既有的辨識/簡轉繁/寫檔邏輯

## Decisions

### 分析執行者：執行中的 AI coding agent session，不裝獨立模型；用 Haiku 等級子代理即可，不需要高階模型

**選擇**：分析工作由監看逐字稿的 agent session（目前實作對象是 Claude Code，透過 Monitor 類工具）直接完成，套用既有的即時回應規格產出結果，寫成 JSON 檔案。不引入任何額外的 LLM 推論元件。

**模型層級選擇**：這個分析任務是「對照已經寫死在 `realtime-need-capture` SKILL.md 的固定規則做欄位抽取＋三態標記＋選一句建議」，不需要複雜推理或創意判斷，用 Haiku 等級的子代理（例如 `Agent(subagent_type: "haiku", ...)` 或等效的輕量子代理呼叫）處理即可，不需要動用驅動整場對談的主 session 本身（可能是 Opus/Sonnet）。這樣主 session 不會被逐字稿監看的輪詢工作佔用，且單次分析成本低、速度快，符合「每 3-60 秒觸發一次」的高頻呼叫特性。

**放棄的替代方案**：
- Apple Intelligence（Foundation Models framework + Guided Generation）：只能在 Apple Silicon Mac 用，Windows 完全沒有對應方案（Phi Silica 一樣限定 Copilot+ PC 硬體）；且本次討論過程中用自由文字生成實測過，指令遵循度不理想（測試細節：對一段含贅詞的逐字稿做清理，結果只清掉部分贅詞，殘留「那個」「啊」等未清乾淨的字，耗時 2.5 秒）
- Ollama＋Qwen2.5（1.5b/3b，JSON Schema structured output）：確認可跨平台（Mac/Windows/Linux），且 Ollama 自 v0.5 起用 GBNF 文法在 token 層級強制合法 JSON，理論上比 Guided Generation 更穩。但這個方案仍然是「疊一層獨立模型」，而業務員操作當下本來就有 AI agent session 開著，疊上去是多餘的複雜度，被 Fish 否決
- 兩套都採用做 fallback（Mac 用 Apple Intelligence、其他平台退到 Ollama）：複雜度最高，同樣因為「不需要獨立模型」這個判斷而不採用

### 觸發判斷：基於逐字稿檔案時間戳，不用音訊 VAD

**選擇**：`tools/realtime-voice/output/<session-id>.md` 每一行都帶時間戳（見既有 `append_transcript_line` 實作）。監看邏輯（agent session 用輪詢腳本驅動）比對「最後一行時間戳」與「現在時間」的差距：
- 停頓觸發：新內容出現後，超過門檻秒數（初值 3 秒）沒有新行寫入 → 判定業務員在停頓思考，觸發分析
- 時間上限：即使沒有觸發停頓條件，累積的新內容（依時間戳計算）達到 30-60 秒的區間 → 強制觸發一次

**替代方案考慮過**：沿用前端既有的音訊 RMS 靜音偵測（`tools/realtime-voice/static/index.html` 的 `vadLoop`）——這是原本第一版設計。放棄原因：agent session 監看的是伺服器端的逐字稿檔案，不會也不需要接觸瀏覽器端的原始音訊資料流，用檔案時間戳判斷停頓，邏輯更簡單、跟前端音訊處理完全解耦，不會混淆現有切音檔段落用的 700ms 門檻。

### 分析結果傳遞：HTTP 輪詢端點，不用 WebSocket 新訊息類型

**選擇**：agent session 把分析結果寫成 `tools/realtime-voice/output/<session-id>.analysis.json`。`server.py` 新增一個唯讀 GET 端點（例如 `/analysis/<session_id>`），讀取並回傳這個檔案目前的內容（檔案不存在時回傳「尚無分析結果」的狀態）。前端 `index.html` 用固定間隔（例如每 3-5 秒）輪詢這個端點，內容有變化就更新畫面。

**替代方案考慮過**：延用既有 `/stream` WebSocket 連線新增訊息類型——這是原本第一版設計。放棄原因：分析結果的產出方（agent session）跟現有 WebSocket 連線的兩端（瀏覽器＋`server.py` 的辨識邏輯）是分開的行程，要把分析結果送進既有 WebSocket 連線需要額外的行程間通訊機制（例如 agent session 呼叫一個內部 API 讓 `server.py` 轉發），比「寫檔案 + HTTP 輪詢」複雜，且輪詢間隔幾秒對「即時但不用毫秒級」的這個場景完全夠用。

## Implementation Contract

**行為**：收音頁面（`index.html`）收音期間，除了現有逐字稿顯示區，新增一個「即時分析」區塊，定期輪詢分析端點。當有新的分析結果，該區塊會更新顯示：
1. 客戶反應了什麼（條列，或「客戶還沒回應」）
2. 目前拆解狀態（人群/場景/痛點/需求/解決方案，含三態標記，或服務型 12 格）
3. 給業務員的下一步建議（一句話）

**介面 / 資料格式**：
- 分析結果檔案：`tools/realtime-voice/output/<session-id>.analysis.json`，格式：`{"client_response": [...], "decomposition": {...}, "suggestion": "...", "analyzed_through_ts": "...", "generated_at": "..."}`
- `decomposition` 的每個欄位值是 `{"value": "...", "state": "confirmed" | "pending" | "guessed"}`
- HTTP 端點：`GET /analysis/<session_id>` → 200 回傳上述 JSON；檔案不存在時回傳 200 + `{"status": "not_yet_analyzed"}`（不是 404，前端不用特別處理錯誤狀態）
- 監看操作說明：寫進 `tools/realtime-voice/README.md`，說明業務員開始收音後，要另外請 agent session 執行監看指令（具體指令格式在 tasks 階段定案），監看什麼時候該觸發、分析結果寫去哪裡

**失敗模式**：
- Agent session 沒有在監看（業務員忘記啟動，或該次對談沒有 agent 陪同）→ 分析端點持續回傳 `not_yet_analyzed`，前端顯示「目前沒有即時分析（可能是沒有 agent session 在監看）」，不影響收音與逐字稿功能
- 分析結果檔案格式壞掉或無法解析 → 端點回傳 `{"status": "analysis_error"}`，前端顯示「這次分析結果讀取失敗」，不讓壞資料當作正常結果顯示
- 逐字稿內容太少（例如都是「[聽不清楚]」）→ agent session 分析時輸出對應狀態，比照既有 SKILL.md「內容不足」的處理原則

**驗收標準**：
- 用今天實測的逐字稿內容（`tools/realtime-voice/output/20260822-185501.md`）示範一次完整流程：模擬監看觸發 → 產出分析 JSON → `/analysis/<session_id>` 端點回傳正確內容 → 前端顯示正確
- 手動測試：開收音頁面，講一段話後停頓 3+ 秒，確認監看腳本有偵測到停頓並發出觸發訊號（可用 Monitor 的通知機制驗證，不需要真的每次都跑一次完整 agent 分析）
- 手動測試：連續講超過 1 分鐘不停頓，確認時間上限有強制觸發
- 手動測試：分析端點在沒有分析結果檔案時，回傳 `not_yet_analyzed` 而非錯誤

**範圍邊界**：這個 change 只負責「觸發判斷＋結果傳遞＋前端顯示」的機制本身，不負責把分析結果送進報價流程（那是既有 `commercial-proposal-quotation-specialist` 的既有交接規則不變）。監看腳本本身怎麼驅動 agent session（是用 Monitor 工具、還是其他排程方式）留在 tasks 階段依實作可行性決定，design 只定「觸發條件用逐字稿時間戳判斷」這個原則。

## Risks / Trade-offs

- [風險] 這個功能完全依賴「有 agent session 在監看」，沒有獨立運作能力，如果業務員忘記啟動監看，整場對談都不會有自動分析 → 緩解：這是明確的 Non-Goal（見上方），失敗模式已定義成「優雅退回手動觸發」，不是靜默失敗；`tools/realtime-voice/README.md` 要清楚寫怎麼啟動監看
- [風險] 用逐字稿時間戳判斷停頓，跟前端音訊 VAD 判斷的「真實停頓」可能有落差（例如網路延遲、辨識耗時導致寫檔案時間戳比實際講話時間晚）→ 緩解：門檻抓寬鬆一點（3 秒），且有時間上限保底，不追求毫秒級精準
- [風險] HTTP 輪詢比 WebSocket 推播多一點延遲（輪詢間隔 3-5 秒）→ 緩解：這個場景不需要毫秒級即時，業務員停頓思考通常有好幾秒，輪詢間隔遠小於這個時間，可接受
