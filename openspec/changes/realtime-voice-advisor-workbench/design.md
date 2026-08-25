## Context｜背景

案神已有 `tools/realtime-voice/server.py`、`monitor_transcript.py`、`index.html` 與多個工作台 demo。這次不是另開一個平行收音產品，而是把已確認的 Conversation First 介面與聲音身份接回正式入口。

## Decisions｜設計決策

### Decision 1: 目前使用者的聲音是第一個身份基準，其他人不是直接冒充某個客戶姓名

使用者直接在瀏覽器錄製自己的聲音，本機建立使用者聲音特徵。逐字稿片段先判斷是否符合目前使用者：

- 符合：`pm`，顯示「我｜專案經理」，右側。
- 不符合：建立穩定的匿名說話人 id，例如「客戶 1」，顯示左側。
- 信心不足：`unknown`，顯示「待確認」，不擅自歸類。

這樣可以支援多位業主，又不會把未確認的聲音誤寫成真實姓名。客戶姓名由使用者在工作階段中手動確認，不由聲音模型猜測。

### Decision 2: 聲音模型放在 adapter 邊界，第一版保持本機

新增一個可替換的本機 speaker identity adapter。它接收音訊片段與目前使用者的 voice profile，回傳 `speaker_id`、`role`、`confidence`。模型選擇必須以本機環境實測為準，不在 UI 或 server route 內綁死第三方雲端 API。

若模型不可用，系統仍可收音與轉文字，但所有片段標成 `unknown`，並把原因顯示在工作台；不能假裝完成聲音判別。

### Decision 3: 逐字稿檔案保持向後相容，身份資料另存 metadata

既有 `.md` 仍保留人類可讀的一行一段格式。角色與信心寫入同 session 的 metadata／JSON stream，前端透過 API 取得結構化片段。舊的 `realtime-need-capture` 只讀 `.md` 時仍能工作。

建議片段 shape：

```json
{
  "id": "seg-0007",
  "ts": "2026-08-25T14:20:12+08:00",
  "text": "第一版先把預約和提醒做好。",
  "speaker_id": "operator",
  "role": "pm",
  "confidence": 0.94,
  "identity_status": "matched"
}
```

### Decision 4: 三欄是固定視窗，不是整頁無限延伸

工作台使用 viewport 高度減去錄音列的固定 shell。三個 panel 各自 `overflow-y: auto`：

- 左：對話時間線，客戶左、目前使用者右，貼近底部時才自動追最新。
- 中：目前判斷，依序顯示觀察、模型、依據、結論、建議選項。
- 右：AI 顧問訊息與輸入框，持續保留使用者與 AI 的討論。

使用者離開底部時，新增內容不改變目前閱讀位置；畫面顯示「有新對話／回到最新」控制。窄螢幕採單欄分頁或堆疊模式，不把三欄硬塞成不可讀的細條。

### Decision 5: AI 分析是可追溯的判斷鏈，不只是一句建議

分析 payload 至少包含：

```json
{
  "observed": "客戶把預約與提醒說成第一版最重要的結果。",
  "mental_model": "核心結果 × 需求成熟度 × 決策風險",
  "evidence": ["預約被明確說成最重要", "付款與會員被放到後面"],
  "conclusion": "核心範圍已經穩定，可以確認第一版成功標準。",
  "response_options": [
    "第一版先做預約與提醒，這樣就解決最重要的問題嗎？",
    "如果先不做付款與會員，你們可以先用這個版本確認流程嗎？"
  ]
}
```

AI 顧問右欄接收選項、使用者自己的判斷與自由文字。使用者回到現場講話後，系統依角色化逐字稿比對是否涵蓋建議意圖，記錄 `adopted`、`partial` 或 `not_adopted`；不把模型判斷當成人工確認。

### Decision 6: DEMO 啟動只寫事件，不在收音 server 內偷偷產生程式碼

偵測到「我覺得這個方向可以，那我們開始來做 DEMO 好不好？」等已定義關鍵句時，工作台寫入帶 timestamp 的 `demo_triggered` 事件與目前已確認需求。既有 demo 生成流程再依自己的規格與確認門檻執行，避免收音服務變成背景常駐 agent。

## Data and privacy｜資料與隱私

- 使用者真實聲音樣本、聲音特徵與案件逐字稿留在本機或使用者指定的案件根目錄。
- Git 只放匿名 fixture、schema、測試音訊或測試文字，不放使用者真實錄音與客戶內容。
- server 啟動與停止行為維持人工操作，不新增 launchd、cron 或 daemon。

## Failure modes｜失敗模式

- 聲音 profile 不存在：逐字稿照常產生，但角色為 `unknown`，UI 提示先直接錄製使用者聲音。
- 聲音模型載入失敗：明確顯示錯誤，不能把所有人靜默標成目前使用者或客戶。
- speaker confidence 不足：保留文字，顯示待確認，允許人工指定角色。
- analysis JSON 缺欄位或損壞：右欄保留既有對話，中央顯示分析暫不可用原因。
- 使用者正在看舊訊息：不強制捲到底部，提供回到最新按鈕。
