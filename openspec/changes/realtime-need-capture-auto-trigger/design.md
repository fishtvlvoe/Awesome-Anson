## Context

`realtime-voice-transcription`（已完成 15/15）提供本機收音＋辨識＋簡轉繁，逐字稿持續寫進 `tools/realtime-voice/output/<session-id>.md`。`realtime-need-capture` skill 已定義「即時回應」規格（客戶反應了什麼／拆解目前樣子／給業務員下一步建議），但目前只能由業務員手動觸發（按停止收音或手動貼路徑），對談進行中案神完全不動作。

本次要在收音服務裡加一層自動監看＋分析，讓業務員收音時，畫面上會自動跳出即時分析，不用自己觸發。

## Goals / Non-Goals

**Goals:**

- 收音頁面持續監看逐字稿新增內容，在「業務員自然停頓思考」或「累積 30 秒到 1 分鐘」兩個條件先到者觸發一次分析
- 分析結果（客戶反應／拆解／下一步建議，比照 `realtime-need-capture` SKILL.md 既有規格）即時顯示在收音頁面上
- 分析用 Mac 內建 Apple Intelligence（Foundation Models framework），完全本機、免費、不用額外安裝

**Non-Goals:**

- 不改動 `realtime-voice-transcription` 既有的辨識/簡轉繁/寫檔邏輯
- 不自動幫業務員回答客戶，只給建議
- 不做背景常駐服務，頁面關掉/收音停止，監看跟著停

## Decisions

### 分析引擎：Apple Foundation Models framework + Guided Generation

**選擇**：用 Swift 寫一個小型 CLI（或直接整合進一個常駐的 Swift helper process），透過 `FoundationModels` framework 呼叫本機 Apple Intelligence 模型，`server.py` 用 subprocess 呼叫它做分析。

**關鍵技術決策：用 Guided Generation（`@Generable` 結構化輸出），不用自由文字生成**。本 change 討論前期曾用自由文字生成測試「清理逐字稿贅詞」這個任務，結果指令遵循度差、會誤刪不該刪的內容（耗時 2.5 秒、效果不理想）。但那是「自由改寫」任務。這次要做的是「拆解成固定欄位＋三態標記＋選一句建議」，屬於結構化抽取／分類任務，用 Guided Generation 讓模型只能在預先定義的 schema 內產出值（例如 `enum ConfirmState { confirmed, pending, guessed }`、固定欄位的 struct），對小模型準確度通常明顯優於自由文字生成。這是本次選型能不能用的關鍵，實作前必須先驗證。

**替代方案考慮過**：
- Claude API：品質最好、成本低，但需要 API key，且跟本機優先的既有原則不一致（Fish 已明確選 Apple 內建）
- 本機 Ollama：免費但要多裝軟體＋下載模型，增加維護負擔，Fish 未選

**品質底線（實作前必須先驗證，不是做完才發現不夠用）**：apply 階段第一個任務必須是用 Guided Generation 重新測一次「客戶反應／拆解／建議」這三項輸出，拿今天實測用的逐字稿內容當測資。如果準確度依然不可用（例如三態標記亂標、建議文不對題），停下來回報 Fish，不能為了完成任務硬把爛結果接上線。

### 觸發判斷：雙條件（自然停頓 OR 時間上限），沿用既有 VAD

**選擇**：重用 `tools/realtime-voice/static/index.html` 既有的 RMS 靜音偵測邏輯（`vadLoop`、`rms()`），但獨立一組門檻和計時器，不能跟現有「切音檔段落」用的 700ms 門檻共用變數，兩者判斷目的不同（一個決定音檔怎麼切段送去辨識，一個決定何時該跳出分析結果）。

- 停頓門檻：業務員這邊偵測到持續靜音超過一定秒數（初值抓 3 秒，具體數字實作時可調），視為「客戶剛講完、業務員在想」
- 時間上限：不論有沒有停頓，累積新增逐字稿內容達 30 秒到 1 分鐘（以逐字稿內建的時間戳為準，不是音檔秒數）強制觸發一次

**替代方案考慮過**：純時間輪詢（不判斷停頓）——實作簡單，但會在業務員還在講話時彈出分析，體驗上會打斷；Fish 明確要求要對齊「停頓思考」那個空檔。

### 分析結果傳遞：`server.py` 內部函式呼叫 → WebSocket 推播

**選擇**：延用現有 `/stream` WebSocket 連線（`server.py` 的 `handle_stream`），新增一種訊息類型（例如 `{"type": "analysis", ...}` 區別於現有的 `{"text": ..., "ts": ...}` 逐字稿訊息），前端收到後渲染進新的分析顯示區塊，不用開新連線。

## Implementation Contract

**行為**：收音頁面（`index.html`）收音期間，除了現有逐字稿顯示區，新增一個「即時分析」區塊。當觸發條件成立（停頓或時間上限），該區塊會更新顯示：
1. 客戶反應了什麼（條列，或「客戶還沒回應」）
2. 目前拆解狀態（人群/場景/痛點/需求/解決方案，含三態標記，或服務型 12 格）
3. 給業務員的下一步建議（一句話）

**介面 / 資料格式**：
- WebSocket 新訊息類型：`{"type": "analysis", "client_response": [...], "decomposition": {...}, "suggestion": "...", "ts": "..."}`
- `decomposition` 的每個欄位值是 `{"value": "...", "state": "confirmed" | "pending" | "guessed"}`
- Swift 分析 CLI 輸入：一段文字（自上次分析後新增的逐字稿內容，含之前已確認的欄位當上下文）；輸出：上述 JSON 結構（用 `@Generable` 定義對應 struct，讓 Foundation Models 直接產出可解析的結構）

**失敗模式**：
- Apple Intelligence 無法使用（`SystemLanguageModel.default.availability` 非 `available`，例如系統不支援或功能被關閉）→ 分析區塊顯示「本機 AI 模型無法使用，即時分析停用，逐字稿功能不受影響」，不能讓整個收音服務因此掛掉
- Guided Generation 呼叫逾時或出錯 → 該次觸發跳過，不重試，等下一次觸發週期，並在該次分析區塊標記「這輪分析失敗，稍後會再試」，不能靜默失敗讓業務員以為沒有新內容
- 逐字稿內容太少（例如都是「[聽不清楚]」）→ 分析區塊顯示「內容不足，還無法分析」，不勉強產出拆解結果

**驗收標準**：
- 用今天實測的逐字稿內容（`tools/realtime-voice/output/20260822-185501.md`）跑過 Guided Generation 分析，人工檢查三態標記和建議是否合理（不是自動化測試能完全覆蓋的品質判斷，需要 Fish 或實作者人工過目）
- 手動測試：開收音頁面，講一段話後停頓 3+ 秒，確認分析區塊有跳出結果且格式正確
- 手動測試：連續講超過 1 分鐘不停頓，確認時間上限有強制觸發
- Apple Intelligence 不可用時（可用 `#Preview` 或 mock 模擬），確認分析區塊顯示對應錯誤訊息而非讓服務崩潰

**範圍邊界**：這個 change 只負責「觸發分析＋顯示結果」，不負責把分析結果送進報價流程（那是既有 `commercial-proposal-quotation-specialist` 的既有交接規則，`realtime-need-capture` SKILL.md 已定義的「已確認不到一半不能送」的門檻不變）。

## Risks / Trade-offs

- [風險] Apple Intelligence 小模型在結構化抽取任務上的實際準確度未知（自由文字生成已測過效果不理想，Guided Generation 理論上更適合但沒實測過）→ 緩解：apply 第一個任務就是驗證，不合格就停下來回報，不能硬做
- [風險] 停頓門檻抓太短，客戶話講到一半的短暫停頓被誤判成「講完了」，分析結果基於不完整內容 → 緩解：門檻預設抓 3 秒（比現有 VAD 切段用的 700ms 長很多），且時間上限是保底，不是每次都靠停頓判斷準
- [風險] Swift CLI 每次啟動的呼叫延遲（進程啟動 + 模型推論）可能影響體驗 → 緩解：apply 階段量測實際延遲，若過慢考慮改成常駐 helper process 用 IPC 而非每次啟動新進程，但這是效能優化，先求正確能動
- [風險] 客戶敏感資訊（對談逐字稿）經過本機 AI 模型處理 → 緩解：Apple Intelligence 官方文件宣稱 on-device 處理不外送雲端（Private Cloud Compute 只在超出裝置能力時才用，且不留存），本次用途文字量小，預期全程在裝置端完成，但這是廠商聲明，未逐行驗證原始碼，屬於信任邊界外的假設，需要在 tasks 裡列一項確認裝置端執行（而非落到 Private Cloud Compute）的方式
