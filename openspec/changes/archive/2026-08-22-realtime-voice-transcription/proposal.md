## Why

`realtime-need-capture` 已經能讀逐字稿即時拆解需求，但逐字稿目前要人工貼上去，業務員跟客戶對談時沒辦法邊講邊自動送進案神分析。缺的是「聲音變文字」這一段：按一個鍵開始收音，講話同時即時吐出文字，文字自動落地給既有拆解流程讀，不再需要手動打字或事後複製貼上。

## What Changes

- 新增一個本機小網頁：業務員在電腦或手機瀏覽器開啟，按鍵開始/停止收音，畫面即時顯示辨識出的文字，供對談當下確認講對了沒有
- 新增本機語音轉文字引擎：用 FunASR 的 SenseVoiceSmall 模型（已實測：936MB、rtf 0.16、辨識正確），完全在本機跑，不上雲端、不用另外的 API 費用
- 辨識結果預設輸出簡體字，新增簡轉繁後處理（OpenCC `s2twp`），確保文字最終落地是繁體中文
- 文字片段即時寫入 `realtime-need-capture` 既有讀取的輸入資料夾，銜接既有的即時拆解流程，`realtime-need-capture` 本身的拆解邏輯不用修改
- 手機瀏覽器可以當麥克風輸入來源（跟電腦連同一個 Wi-Fi，開瀏覽器連到本機服務即可），不需要另外裝 App

## Non-Goals (optional)

- 不做雲端部署、不做多人多裝置同時錄音的併發設計，一次對談只有一個收音來源
- 不取代 `realtime-need-capture` 既有的拆解邏輯，這個 change 只補「聲音變文字」這一段
- 不做語者分離（誰講了什麼话），只做單一逐字稿輸出
- 收音服務只在業務員手動啟動對談的當下運作，對談結束後手動關閉即結束，不是背景常駐服務、不留任何排程——延續案神既有「不是常駐系統」原則，跟 `case-page`「不部署上網」的既有邊界也不衝突：這個服務只在本機區域網路內運作，不會把任何內容部署到公開網址上

## Capabilities

### New Capabilities

- `realtime-voice-transcription`：本機即時語音轉文字管線，涵蓋按鍵收音的本機網頁介面、本機 FunASR SenseVoiceSmall 辨識引擎、簡轉繁後處理，以及把文字片段寫入 `realtime-need-capture` 輸入資料夾的銜接機制

### Modified Capabilities

(none)

## Impact

- Affected code:
  - New:
    - tools/realtime-voice/server.py（本機服務：收音端點、呼叫 FunASR 辨識、簡轉繁、寫入輸出資料夾）
    - tools/realtime-voice/static/index.html（按鍵收音介面，電腦與手機瀏覽器共用）
    - tools/realtime-voice/requirements.txt（funasr、torch、opencc-python-reimplemented 等相依套件版本鎖定）
    - tools/realtime-voice/README.md（本機啟動方式：如何在同一 Wi-Fi 下用手機瀏覽器連線）
    - tests/test-realtime-voice-s2tw-conversion.js（驗證簡轉繁輸出）
    - tests/test-realtime-voice-writes-to-inbox.js（驗證文字片段正確寫入 realtime-need-capture 讀取的資料夾）
  - Modified:
    - .claude/skills/realtime-need-capture/SKILL.md（補充說明輸入來源除了人工貼上，也可能是這個新管線自動寫入的文字片段，拆解邏輯本身不變）
