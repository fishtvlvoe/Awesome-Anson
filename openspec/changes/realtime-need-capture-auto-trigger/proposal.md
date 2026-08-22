## Why

現在 `realtime-need-capture` 只有兩種觸發方式：業務員按「停止收音」，或事後手動把逐字稿路徑貼給案神。這代表整段對談進行中，案神完全不動作，業務員（Fish）沒辦法在對談當下看到「客戶真實意圖」與「下一步該問什麼」，只能靠自己臨場反應。等到對談結束才看分析，等於錯過了整場對談能被即時輔助的價值。

## What Changes

- 新增一個輪詢/監看層，持續讀取 `tools/realtime-voice/output/<session-id>.md` 的新增內容
- 觸發時機用兩個條件的「哪個先到就先觸發」：
  1. **自然停頓**：偵測到客戶剛講完、業務員開始停頓思考的空檔（沿用 `tools/realtime-voice/static/index.html` 既有的 VAD 靜音偵測邏輯，門檻另外評估，不能跟現有 700ms 分段門檻搞混，那是用來切音檔段落，這裡是用來判斷「該不該跳出分析」）
  2. **時間上限**：即使沒有偵測到自然停頓，累積新內容達 30 秒到 1 分鐘也要觸發一次，避免業務員講很久都沒停頓、分析一直不出現
- 觸發後自動呼叫 `realtime-need-capture` 既有的「即時回應」規格（已在 SKILL.md 定義：客戶反應了什麼／拆解目前樣子／給業務員的下一步建議），把結果顯示在收音頁面上，不打斷收音本身
- 業務員（Fish）不用做任何額外動作，收音期間畫面會自動更新分析結果

## Non-Goals

- 不改動 `realtime-voice-transcription`（已完成 15/15）的辨識、簡轉繁、寫檔邏輯本身，只在其輸出檔案上加一層監看
- 不做「自動幫業務員回答客戶」，只給建議，最終要問什麼由業務員自己判斷（案神既有原則：輔助不是代替判斷）
- 不做背景常駐服務，這個監看只在收音頁面開著、對談進行中才運作，跟 `tools/realtime-voice` 現有「不背景常駐」的原則一致，頁面關掉/收音停止監看就跟著停

## Capabilities

### New Capabilities

- `realtime-need-capture-auto-trigger`: 對談進行中自動監看逐字稿新增內容，在自然停頓或時間上限觸發時，自動呼叫即時回應分析並顯示在收音頁面上，不需業務員手動觸發

### Modified Capabilities

（無。既有的即時分析邏輯本身不變，本次只新增自動觸發的入口，詳見 Why／What Changes 段落說明）

## Impact

- 新增：`tools/realtime-voice/static/index.html`（前端顯示分析結果的區塊）
- 新增：`tools/realtime-voice/server.py`（監看邏輯、觸發判斷、呼叫分析並回傳給前端的機制）
- 依賴既有：`.claude/skills/realtime-need-capture/SKILL.md`（即時回應規格已定義，本次不改）
