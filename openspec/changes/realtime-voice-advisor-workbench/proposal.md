## Why｜為什麼要做

案神目前已經有本機收音、FunASR 逐字稿、即時分析端點，以及三欄介面 demo，但這些能力還沒有形成一條可實際使用的工作流程：

- 逐字稿沒有根據目前使用者的聲音穩定判斷「誰是我、誰是客戶」。
- 多位客戶在現場時，畫面沒有保留可追蹤的說話人身份。
- 正式入口還可能呈現舊式單欄逐字稿，不符合已確認的 LINE 左右對話閱讀方式。
- AI 分析需要留下「看到了什麼、用什麼心智模型、依據是什麼、判斷結果是什麼、建議怎麼回應」，而不是只顯示一段結論。
- 使用者往上查看舊對話時，最新內容與 AI 建議不應把整頁往下洗掉。

本 SR 把已確認的聲音身份與 Conversation First 工作台寫回案神正式功能，讓 demo 的互動模型成為 production baseline。

## What Changes｜會改變什麼

- 新增通用本機使用者聲音身份建立流程：直接從瀏覽器錄音、建立聲音特徵、保存身份狀態。
- 新增逐字稿說話人標記：目前使用者顯示為「我／專案經理」並靠右；其他已辨識聲音顯示為「客戶｜客戶 1」等並靠左；信心不足顯示「待確認」並保留原文。
- 將正式收音入口固定為三欄工作台：左側現場對話、中間 AI 判斷、右側 AI 顧問對話。
- 左側對話採 LINE 類左右氣泡，三欄各自有固定高度與內部捲軸；最新對話在底部，使用者手動往上查看時不強制跳回底部。
- 中間分析固定呈現觀察、心智模型、判斷依據、需求／結果、結論與 1 至 3 個回應選項。
- 右側 AI 顧問保留建議、使用者指令與 AI 回覆；中間選取的回應選項可帶入右側討論，不會因對話串流而消失。
- 在逐字稿中記錄目前使用者是否採納建議；偵測到方向確認與 DEMO 啟動關鍵句時，寫入事件，交給既有 demo-generation-deploy 流程處理。
- 全部聲音原檔與聲音特徵留在本機，不將其寫入 Git，也不新增背景常駐服務。

## Non-Goals｜不包含的範圍

- 不修改已封存的 FunASR SenseVoiceSmall、簡轉繁與逐字稿檔案格式核心規則。
- 不在本 SR 內建立雲端語音辨識、雲端聲紋服務或把錄音上傳第三方。
- 不保證只靠聲音就能辨識客戶姓名；無法穩定辨識時必須標示待確認。
- 不自動替目前使用者對客戶發言；AI 只提供建議與討論。
- 不把 `case-page` 改成可部署服務；DEMO 產出仍由既有 `demo-generation-deploy` 能力負責。
- 不在本 SR 內完成 Cloudflare Pages 部署。

## Capabilities｜能力

### New Capabilities｜新增能力

- `realtime-voice-advisor-workbench`：本機聲音身份、角色化逐字稿、三欄即時顧問工作台與採納／DEMO 觸發事件。

### Modified Capabilities｜修改既有能力

- `realtime-voice-transcription`：逐字稿片段增加說話人身份 metadata，但保留既有文字與檔案相容性。
- `realtime-need-capture`：即時分析輸出增加心智模型、判斷依據、結論與回應選項，並可被工作台輪詢顯示。

## Impact｜影響範圍

- 修改：`tools/realtime-voice/server.py`
- 修改：`tools/realtime-voice/static/index.html`
- 修改：`tools/realtime-voice/static/realtime-workbench-c.css`
- 修改：`tools/realtime-voice/static/voice-profile.html`
- 修改：`tools/realtime-voice/README.md`
- 新增：本機聲音身份資料格式與 adapter／測試 fixture（不得包含真實聲音或真實客戶資料）
- 新增：`openspec/specs/realtime-voice-advisor-workbench/spec.md`

## Acceptance Gate｜驗收門檻

- 用匿名測試音訊完成目前使用者、客戶、待確認三種角色結果，並能在逐字稿與 UI 中對應。
- 桌面寬度下三欄同時可見；窄螢幕下不產生橫向溢出，欄位可依序閱讀。
- 對話、分析、AI 顧問各自內部捲動；新增訊息只在使用者仍貼近底部時自動跟隨。
- 分析結果含完整判斷鏈，且 1 至 3 個回應選項能送到右側 AI 顧問。
- 既有逐字稿寫檔、簡轉繁、低信心標記與無監看器 fallback 測試全部保持通過。
