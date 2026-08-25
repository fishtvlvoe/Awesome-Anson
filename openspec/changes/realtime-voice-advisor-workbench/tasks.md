## 1. 先建立可驗證的資料契約與 fixture

- [ ] 1.1 定義 speaker segment、voice profile、analysis reasoning、adoption event 與 demo trigger event schema；驗證：新增 assert 腳本可解析匿名 fixture，缺少必要欄位時 exit 1
- [ ] 1.2 建立匿名 Fish／client-1／client-2／unknown 測試 fixture；驗證：fixture 不包含真實錄音、姓名、token 或 customer content
- [ ] 1.3 為既有 `.md` transcript 相容性寫 regression test；驗證：既有測試與新增測試都 exit 0

## 2. 本機使用者聲音身份

- [ ] 2.1 實作 profile storage 與 sample validation；驗證：有效樣本建立 ready profile，少於兩段或壞檔回傳可讀錯誤
- [ ] 2.2 實作本機 speaker identity adapter 邊界與可用 provider；驗證：瀏覽器錄音的匿名測試能回傳 `matched`、`unmatched`、`pending` 三態，provider 載入失敗不會啟動假辨識
- [ ] 2.3 將 speaker attribution 接到 websocket transcription response 與 session metadata；驗證：每段 response 都包含 speaker id、role、confidence、identity status
- [ ] 2.4 更新 `voice-profile.html`，讓使用者直接錄音、播放確認、重錄並建立 profile；驗證：權限允許、權限拒絕、太短與成功四種狀態均可重現

## 3. 三欄正式工作台

- [ ] 3.1 以 `realtime-workbench-c.css` 作為正式入口的唯一樣式來源，移除 `index.html` 對舊版單欄結構的依賴；驗證：grep 確認入口載入三欄 layout，無水平 overflow
- [ ] 3.2 完成角色化 LINE 氣泡：客戶左、Fish 右、不同客戶保留穩定標籤、unknown 提供人工確認；驗證：匿名 fixture 產生的畫面角色位置與標籤正確
- [ ] 3.3 實作三個獨立 scroll container、貼底自動跟隨、離底不跳動與回到最新控制；驗證：browser smoke 或 DOM 行為測試證明離底時新增訊息不改變 scrollTop
- [ ] 3.4 完成窄螢幕 responsive fallback；驗證：320px、768px、1440px viewport 均無水平捲軸且內容可讀

## 4. AI 顧問判斷鏈

- [ ] 4.1 擴充 analysis schema 與 server endpoint，支援 observed、mental_model、evidence、conclusion、response_options；驗證：valid、missing、malformed payload 各有明確 UI 狀態
- [ ] 4.2 將 1 至 3 個回應選項送入右側 advisor chat；驗證：點選後右側留下使用者訊息，中央分析仍保留
- [ ] 4.3 實作使用者採納比對與 evidence segment ids；驗證：adopted、partial、not_adopted 三種匿名情境可重現
- [ ] 4.4 實作 DEMO phrase event writer，與 `demo-generation-deploy` 保持 process 邊界；驗證：只寫事件檔，不在 server process 內產生或部署程式碼

## 5. 整合與文件

- [ ] 5.1 更新 `tools/realtime-voice/README.md`：聲音資料位置、隱私、profile 建立、角色判別、fallback 與停止方式；驗證：文件命令可對照實際 CLI route
- [ ] 5.2 執行既有 realtime voice tests 與新增 schema／adapter tests；驗證：所有命令 exit 0
- [ ] 5.3 啟動本機服務完成收音 → 角色化逐字稿 → 分析 → 右側討論 → 採納記錄的 browser smoke；驗證：留存 screenshot 與 session fixture 路徑
- [ ] 5.4 完成 self-review、更新本 SR tasks，確認只提交本 SR 檔案與實作檔；驗證：`git status --short` 無未預期變更
