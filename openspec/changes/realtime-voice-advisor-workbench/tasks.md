## 1. 先建立可驗證的資料契約與 fixture

- [ ] Local operator voice profile；驗證：匿名瀏覽器錄音可以建立本機 profile，未錄音時保持 unready
- [ ] Speaker attribution for multiple clients；驗證：operator、client-1、client-2、unknown 的角色與標籤一致
- [ ] Transcription segments expose optional speaker metadata；驗證：`.md` 相容，結構化 segment 含四個 speaker 欄位
- [ ] Browser-recorded profile remains local；驗證：原始錄音不會上傳、不會出現在 Git diff
- [ ] Analysis payload exposes the advisor reasoning chain；驗證：payload 含 observed、mental_model、evidence、conclusion、response_options
- [ ] Analysis failure does not hide the conversation；驗證：analysis_error 時左右兩欄仍可操作
- [ ] Role-aware conversation timeline；驗證：客戶左、operator 右，兩位客戶保留不同 id
- [ ] Fixed three-panel responsive workspace；驗證：桌面三欄、窄螢幕無水平溢出
- [ ] Explainable AI analysis；驗證：中央顯示五段判斷鏈與 1 至 3 個選項
- [ ] Advisor discussion and adoption tracking；驗證：右欄保留討論並寫入 adopted／partial／not_adopted
- [ ] Existing transcription compatibility；驗證：舊逐字稿消費者不需要 speaker metadata 仍可讀取

- [ ] Decision 1: 目前使用者的聲音是第一個身份基準，其他人不是直接冒充某個客戶姓名；驗證：使用者直接錄音建立 profile，客戶只取得匿名 id
- [ ] Decision 2: 聲音模型放在 adapter 邊界，第一版保持本機；驗證：provider 失敗時顯示 unknown，不呼叫雲端服務
- [ ] Decision 3: 逐字稿檔案保持向後相容，身份資料另存 metadata；驗證：`.md` 格式不變，speaker 欄位在結構化資料
- [ ] Decision 4: 三欄是固定視窗，不是整頁無限延伸；驗證：三個 panel 各自捲動，離底時新增訊息不跳動
- [ ] Decision 5: AI 分析是可追溯的判斷鏈，不只是一句建議；驗證：中央顯示觀察、模型、依據、結論、選項
- [ ] Decision 6: DEMO 啟動只寫事件，不在收音 server 內偷偷產生程式碼；驗證：只新增 event，不啟動生成或部署程序

- [ ] 1.1 定義 speaker segment、voice profile、analysis reasoning、adoption event 與 demo trigger event schema；驗證：新增 assert 腳本可解析匿名 fixture，缺少必要欄位時 exit 1
- [ ] 1.2 建立匿名 operator／client-1／client-2／unknown 測試 fixture；驗證：fixture 不包含真實錄音、姓名、token 或 customer content
- [ ] 1.3 為既有 `.md` transcript 相容性寫 regression test；驗證：既有測試與新增測試都 exit 0

## 2. 本機使用者聲音身份（Local operator voice profile）

- [x] 2.1 實作 profile storage 與 sample validation；驗證：至少一段有效樣本建立 ready profile，空樣本或壞檔回傳可讀錯誤
- [ ] 2.2 實作本機 speaker identity adapter 邊界與可用 provider；驗證：瀏覽器錄音的匿名測試能回傳 `matched`、`unmatched`、`pending` 三態，provider 載入失敗不會啟動假辨識
- [x] 2.3 將 speaker attribution 接到 websocket transcription response 與 session metadata；驗證：每段 response 都包含 speaker id、role、confidence、identity status
- [x] 2.4 更新 `voice-profile.html`，讓使用者直接錄音、播放確認、重錄並建立 profile；驗證：權限允許、權限拒絕、太短與成功四種狀態均可重現
- [ ] 2.5 覆蓋 Speaker attribution for multiple clients；驗證：operator、client-1、client-2、unknown 四種匿名 fixture 在 API 與 UI 標籤一致

## 3. 三欄正式工作台（Role-aware conversation timeline／Fixed three-panel responsive workspace）

- [x] 3.1 以 `realtime-workbench-c.css` 作為正式入口的唯一樣式來源，移除 `index.html` 對舊版單欄結構的依賴；驗證：grep 確認入口載入三欄 layout，無水平 overflow
- [x] 3.2 完成角色化 LINE 氣泡：客戶左、目前使用者右、不同客戶保留穩定標籤、unknown 提供人工確認；驗證：匿名 fixture 產生的畫面角色位置與標籤正確
- [x] 3.3 實作三個獨立 scroll container、貼底自動跟隨、離底不跳動與回到最新控制；驗證：browser smoke 或 DOM 行為測試證明離底時新增訊息不改變 scrollTop
- [x] 3.4 完成窄螢幕 responsive fallback；驗證：320px、768px、1440px viewport 均無水平捲軸且內容可讀

## 4. AI 顧問判斷鏈（Explainable AI analysis／Advisor discussion and adoption tracking）

- [x] 4.1 擴充 analysis schema 與 server endpoint，支援 observed、mental_model、evidence、conclusion、response_options；驗證：valid、missing、malformed payload 各有明確 UI 狀態
- [x] 4.2 將 1 至 3 個回應選項送入右側 advisor chat；驗證：點選後右側留下使用者訊息，中央分析仍保留
- [ ] 4.3 實作使用者採納比對與 evidence segment ids；驗證：adopted、partial、not_adopted 三種匿名情境可重現
- [x] 4.4 實作 DEMO phrase event writer，與 `demo-generation-deploy` 保持 process 邊界；驗證：只寫事件檔，不在 server process 內產生或部署程式碼

## 5. 整合與文件

- [x] 5.1 更新 `tools/realtime-voice/README.md`：聲音資料位置、隱私、profile 建立、角色判別、fallback 與停止方式；驗證：文件命令可對照實際 CLI route
- [x] 5.2 執行既有 realtime voice tests 與新增 schema／adapter tests；驗證：所有命令 exit 0
- [ ] 5.3 啟動本機服務完成收音 → 角色化逐字稿 → 分析 → 右側討論 → 採納記錄的 browser smoke；驗證：留存 screenshot 與 session fixture 路徑
- [ ] 5.4 完成 self-review、更新本 SR tasks，確認只提交本 SR 檔案與實作檔；驗證：`git status --short` 無未預期變更
- [ ] 5.5 覆蓋 Existing transcription compatibility；驗證：既有逐字稿、簡轉繁、低信心與停止服務測試保持 exit 0
