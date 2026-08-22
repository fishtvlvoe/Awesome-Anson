## Why

現在 `realtime-need-capture` 只有兩種觸發方式：業務員按「停止收音」，或事後手動把逐字稿路徑貼給案神。這代表整段對談進行中，案神完全不動作，業務員（Fish）沒辦法在對談當下看到「客戶真實意圖」與「下一步該問什麼」，只能靠自己臨場反應。等到對談結束才看分析，等於錯過了整場對談能被即時輔助的價值。

## What Changes

- 新增一個觸發判斷機制：持續監看 `tools/realtime-voice/output/<session-id>.md` 的新增內容，在「業務員自然停頓思考」或「累積新內容達 30-60 秒」兩個條件哪個先到，就觸發一次分析
- **分析本身由執行中的 Claude Code（或同等能力的 AI coding agent）session 直接負責**，用 Monitor 類工具盯著逐字稿檔案，觸發時讀取新增內容，套用 `realtime-need-capture` SKILL.md 已定義的「即時回應」規格（客戶反應了什麼／拆解目前樣子／給業務員的下一步建議），把結果寫成 JSON 檔案
- `tools/realtime-voice/server.py` 新增一個唯讀 HTTP 端點，回傳目前這個 session 最新的分析結果 JSON
- 收音頁面（`index.html`）定期輪詢這個端點，把結果顯示在畫面上的「即時分析」區塊，不打斷收音本身

## Non-Goals

- **不是背景常駐、不需人在旁的自動化服務**：這個功能仰賴一個正在執行的 AI coding agent session（目前實作對象是 Claude Code）在旁監看逐字稿，不是掛在 `server.py` 裡自己跑的獨立小模型。收音時如果沒有對應的 agent session 開著並主動監看，畫面上不會有自動分析，只能沿用手動觸發（跟現況一樣）
- **不裝、不依賴任何本機/雲端 LLM 模型**：討論過程中曾考慮 Apple Intelligence（Mac 限定，且指令遵循度實測不理想）、Ollama＋Qwen2.5（跨平台但要求使用者另外安裝），兩者都因為「分析本來就該由執行中的 AI agent 自己做，不用另外疊一層模型」而放棄，改用執行中的 agent session 本身
- 不改動 `realtime-voice-transcription`（已完成 15/15）的辨識、簡轉繁、寫檔邏輯本身，只在其輸出檔案上加一層監看
- 不做「自動幫業務員回答客戶」，只給建議，最終要問什麼由業務員自己判斷（案神既有原則：輔助不是代替判斷）

## Capabilities

### New Capabilities

- `realtime-need-capture-auto-trigger`: 對談進行中，執行中的 AI coding agent session 自動監看逐字稿新增內容，在自然停頓或時間上限觸發時，自己做一次即時回應分析並把結果寫成檔案，收音頁面輪詢顯示，不需業務員手動觸發

### Modified Capabilities

（無。既有的即時分析邏輯本身不變，本次只新增自動觸發的入口，詳見 Why／What Changes 段落說明）

## Impact

- 新增：`tools/realtime-voice/static/index.html`（前端輪詢並顯示分析結果的區塊）
- 新增：`tools/realtime-voice/server.py`（新增讀取分析結果 JSON 的 HTTP 端點）
- 新增：一份給執行中 agent session 使用的監看操作說明（例如放進 `tools/realtime-voice/README.md` 或 `.claude/skills/realtime-need-capture/SKILL.md`），說明怎麼啟動監看、觸發條件怎麼判斷、分析結果要寫去哪裡
- 依賴既有：`.claude/skills/realtime-need-capture/SKILL.md`（即時回應規格已定義，本次不改）
