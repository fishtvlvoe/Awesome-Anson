## 1. Fixture 與 schema

- [x] 1.1 [P] 建立匿名 PM/客戶交替發言逐字稿 fixture（不含真實客戶內容、音檔或 secrets），存於 `tests/fixtures/`；驗證：`ls tests/fixtures/` 可看到新 fixture 檔，內容 grep 不到任何真實案件關鍵字
  Evidence: `ls -l tests/fixtures/realtime-cli-advisor-anonymous.md` → fixture 存在（461 bytes）；安全掃描 → `fixture-safety: no real-case markers`。
- [x] 1.2 [P] 定義 session state JSON schema（`confirmed_facts`／`open_questions`／`current_mental_model`／`quote_signals`／`last_analysis_ts`／`pending_response_options`／`adoption_events`）與分析輸出 JSON schema（`client_response`／`current_state`／`confirmed`／`open_questions`／`quote_impact`／`mental_model`／`evidence`／`recommended_next_move`／`response_options`／`speaker_attribution`／`route`），寫一個 assert 腳本驗證兩份 schema；驗證：`python3 tests/test_schema_validation.py` exit 0，缺欄位時 exit 1
  Evidence: `python3 tests/test_schema_validation.py` → `{"session_state": "valid", "analysis_output": "valid"}`；`python3 tests/test_schema_validation.py --missing-field` → exit 1。

## 2. Advisor 獨立程序與自動觸發（Decision 1：CLI 顧問是獨立跑的程序，不依賴互動 Agent session；Decision 3：自動觸發規則——停頓優先，時間上限保底）

- [x] 2.1 實作 `tools/realtime-voice/advisor_cli.py` 作為獨立可執行程序，體現「Advisor runs as an independent process, not a monitored interactive agent session」規格：持續讀取逐字稿檔案，不依賴任何互動 Agent session；驗證：不開任何 Claude Code/Codex 對話視窗，直接執行 `python3 tools/realtime-voice/advisor_cli.py --session-id <id>`，程序正常啟動並持續運作
  Evidence: `python3 tools/realtime-voice/advisor_cli.py --session-id independent-fixture --output-dir /private/tmp/realtime-advisor-independent.aHuJTC --poll-interval 0.1` → `[案神] 顧問 ready`、`state-file: created`，TERM 後 `process_exit=0`；未開互動 Agent session。
- [x] 2.2 實作「Dual automatic trigger condition based on transcript timestamps」規格：新增內容後約 2-3 秒無新行視為停頓觸發；累積新增內容達 30-60 秒未觸發過停頓時強制觸發；連續短片段合併為一個對話回合；驗證：用 1.1 的 fixture 模擬「附加一行後等待超過門檻」與「連續 65 秒每秒附加一行不間斷」兩種情境，各自印出對應的觸發事件且僅觸發一次
  Evidence: 匿名 fake backend 整合測試 → `pause-case: trigger_count=1`、`time-cap-case: trigger_count=1`、`trigger-integration: pause=1 time_cap=1`。
- [x] 2.3 實作「In-flight analysis is not duplicated」情境：上一次分析尚未完成時新內容持續累積，不重複呼叫分析後端；驗證：模擬分析呼叫延遲 3 秒的假後端，期間持續附加逐字稿，確認只送出一次呼叫，延遲完成後才處理排隊中的新內容
  Evidence: `python3 tests/test_advisor_cli.py` → `ok (8 tests)`，其中 `test_inflight_analysis_queues_new_content` 在延遲 worker 期間確認 calls 只有第一批，完成後才送第二批。

## 3. 可設定分析後端與終端機輸出（Decision 2：分析後端可設定、呼叫既有已驗證的 headless 呼叫模式）

- [x] 3.1 [P] 實作「Configurable analysis backend」規格：透過設定（環境變數或設定檔）選擇 `claude` 或 `codex` 作為 headless 呼叫對象，不寫死單一供應商；驗證：分別設定兩種後端執行同一次分析，`ps`/log 確認實際呼叫的指令對應設定值
  Evidence: 匿名 fixture 以同一 fake headless backend 執行兩次：`backend=claude` 與 `backend=codex` 的 ready log 各出現一次，`--backend` 不需改程式即可切換。
- [x] 3.2 實作「Backend unavailable is reported, not silently skipped」情境：設定的後端 CLI 不存在或未登入時，啟動時明確報錯並終止；驗證：故意指定不存在的 CLI 名稱啟動，確認終端機印出明確錯誤訊息且程序不繼續假裝分析中
  Evidence: 指定 `--agent-command definitely-not-installed-advisor --backend codex --once` → exit 1，輸出 `[案神] 啟動失敗：分析後端不可用：codex（找不到可執行檔 definitely-not-installed-advisor）`。
- [x] 3.3 實作「Terminal output shows current state and at most three response options」規格：每次觸發分析後在終端機印出現況／已確認／待確認／報價影響／最多三個 1/2/3 選項，並接受數字／Enter／`q` 輸入；驗證：用 1.1 的 fixture 觸發一次分析，人工核對輸出格式與 SR 文件範例一致，選項數不超過 3 個且 `recommended_next_move` 只有一句
  Evidence: `--once` 使用 1.1 fixture 與 fake backend → 輸出包含 `客戶目前現況`、`已確認`、`尚未確認`、`報價影響`、單一句 `確認第一階段成功標準。`；`numbered_options=1`（上限 3）。
- [x] 3.4 實作「Choosing an option prints a ready-to-say sentence」與「Client has not responded yet」兩種情境；驗證：分別模擬「輸入 1」與「只有業務員說話客戶尚未回應」兩種逐字稿，確認前者印出可直接說出口的句子並寫入 adoption event，後者印出「客戶尚未回應」且不顯示任何選項
  Evidence: choice case `--once --choice 1` → 輸出 `[案神] 建議你直接問`，state 含 `response_option_selected`；PM-only case → 輸出 `客戶尚未回應`，`^[123]\. ` 選項數為 0。
- [x] 3.5 遷移既有 `tests/test-realtime-analysis-options.js` 對 `monitor_transcript.parse_agent_output` 的斷言（1-3 個 response_options、超出範圍必須報錯）到 `advisor_cli.py` 對應的解析函式，並移除或更新舊測試對 `monitor_transcript` 的直接依賴；驗證：`node tests/run.js` 涵蓋新版斷言且不再匯入已棄用的 `parse_agent_output` 路徑
  Evidence: `node tests/run.js` → `Tests: 54 | Passed: 54 | Failed: 0`；`rg` 檢查 → `deprecated-parser-imports: none`。

## 4. Session state 累積（Decision 4：Session state 累積保存，每次分析帶入完整狀態）

- [x] 4.1 實作「Accumulated session state carried across analysis passes」規格：每次分析把累積 session state（含上次業務選擇）與新增逐字稿一起送給分析後端，並把結果寫回 session state 檔案；驗證：連續觸發兩次分析，用 1.2 的 schema 驗證腳本讀取 session state 檔案，確認第一次「已確認」的事項在第二次分析後仍存在
  Evidence: 兩次 `--once` 使用匿名 fake backend 後，`python3 tests/test_schema_validation.py --state-file ...` → `state_file: valid`，state 同時保留 `目前狀況已被說明` 與 `維護方式需要再確認`。
- [x] 4.2 [P] 實作「Session state stops with the session」情境：session 結束（停止收音或 `q`）後不再更新 session state，檔案保留在案件資料夾；驗證：結束 session 後檢查檔案 mtime 不再更新，且檔案仍存在於指定案件路徑
  Evidence: q shutdown 整合測試 → `process_exit=0`、`state_mtime_unchanged=True`、`[案神] 顧問 stopped`；state 檔案仍存在並於結束後不再寫入。

## 5. 文字脈絡角色推定（Decision 5：PM／客戶角色用文字脈絡推定，不需要聲音辨識）

- [x] 5.1 實作「Session starter is assigned PM without inference」情境：session 啟動時直接把啟動者標為 `pm`，不跑推論；驗證：啟動 session 後檢查 session state 的 `operator_role` 欄位固定為 `pm`，不因輸入內容變動
  Evidence: 啟動匿名 session 後讀取 state → `operator_role=pm`；角色推定只處理逐字稿段落，不改寫 session operator。
- [x] 5.2 實作「Text-context role inference without voice biometrics」規格與「Role inference outputs confidence and falls back to unknown」情境：用文字脈絡（提問/確認句 vs 回答/表態句）推定 `pm`／`client`／`unknown`，附信心度與依據；驗證：用 1.1 的 fixture（含至少一段模糊片段）跑一次推定，確認明確片段標對角色、模糊片段標 `unknown` 並附信心度
  Evidence: fixture role run → `seg-0001 pm 0.88`、`seg-0002 client 0.88`、`seg-0003 pm 0.88`、`seg-0004 client 0.88`、`seg-0005 unknown 0.42`，每段均附 reason。
- [x] 5.3 [P] 實作「Uncertain role is never auto-upgraded to a confirmed client statement」與「Single PM and single client works without any voice profile」兩種情境；驗證：(a) 對 `unknown` 片段跑一次分析，確認該片段內容未出現在 `confirmed_facts`；(b) 完全不建立任何聲音 profile，直接跑單一 PM＋單一客戶的完整流程，確認分析正常產出不被阻擋
  Evidence: unknown backend run → `unknown-confirmed-facts=[]`；隔離 `ANSON_VOICE_PROFILE_DIR`、未建立 profile 的正常 fixture run → `single-pm-client-without-voice-profile: analysis-ready`。

## 6. 啟動與停止生命週期整合（Decision 7：啟動與停止生命週期綁在一起，不留背景程序）

- [x] 6.1 修改 `scripts/start-realtime-voice.sh`，體現「Manually-started, non-persistent service」規格的更新內容：一個指令同時啟動 `server.py` 與 `advisor_cli.py`，任一啟動失敗時明確報錯並終止另一個；驗證：正常執行一次確認兩個程序都啟動並印出 ready 訊息；故意讓其中一個啟動失敗（如佔用 port），確認腳本回報明確錯誤且不留下另一個程序孤兒運作
  Evidence: 正常 `bash scripts/start-realtime-voice.sh --no-open` → `顧問 ready`、`server 與 advisor 已 ready`，停止後 `normal-shutdown: no advisor/server process`；port conflict → exit 1、`錄音 server port 8420 已被其他程序占用`、`failure-cleanup: no advisor/server process`。
- [x] 6.2 修改停止流程，體現「Clean shutdown with no residual background process」規格：停止收音或按 `q` 時兩個程序一起結束；驗證：`q` 停止後執行 `ps aux | grep advisor_cli` 與 `ps aux | grep server.py`，確認都無殘留進程
  Evidence: full launcher q test → `launcher_exit=0`、`[案神] 顧問 stopped`、launcher 偵測 `CLI 顧問已停止，正在停止錄音 server`；`ps` → `q-shutdown: no advisor/server process`。

## 7. 瀏覽器介面精簡與刪除未完成三欄殘留檔案（Decision 6：瀏覽器介面收斂為錄音控制＋逐字稿＋連線狀態）

- [x] 7.1 修改 `tools/realtime-voice/static/index.html`，體現「Local push-to-record web interface」規格的更新內容：只保留收音控制／逐字稿／顧問連線狀態，移除三欄分析面板（`workspace`／`conversation-panel`／`analysis-panel`／`command-panel`）與右側寫死的 AI 對話框，移除對 `realtime-workbench-c.css` 與 `realtime-workbench-autonomous-demo.html` 的連結／載入；驗證：`grep -c "workbench\|三欄\|command-panel\|analysis-panel" tools/realtime-voice/static/index.html` 結果為 0，手動開頁面確認畫面只剩收音控制／逐字稿／顧問連線狀態三個元素
  Evidence: `grep -c 'workbench\|三欄\|command-panel\|analysis-panel' tools/realtime-voice/static/index.html` → `0`；ego-browser page smoke → `dom-checks={"controls":true,"initialStatus":"顧問未連線","forbiddenNodes":[],"forbiddenText":false,"hasRecordingCopy":true,"hasTranscriptCopy":true}`；保留元素為 `id="toggle"`、`id="transcript"`、`id="advisor-status"`。
- [x] 7.2 刪除 `realtime-voice-advisor-workbench` 遺留的未完成三欄原型與比對頁面檔案：`tools/realtime-voice/static/index-v2.html`、`index-v2-dark.html`、`index-v2-conversation.html`、`index-v2-compare.html`、`realtime-workbench-demo.html`、`realtime-workbench-autonomous-demo.html`、`realtime-workbench-c.css`；驗證：`ls tools/realtime-voice/static/` 確認上述 7 個檔案已不存在，`tools/realtime-voice/static/voice-profile.html` 與其後端 `voice_identity.py`／`voice_profile_sync.py` 仍保留不受影響
  Evidence: exact retired-file `ls` → exit 1、`retired-files: absent`；`voice-profile.html`、`voice_identity.py`、`voice_profile_sync.py` → `preserved-voice-profile-files: present`。
- [x] 7.3 [P] 移除 `tools/realtime-voice/server.py` 中已棄用的 `/analysis/<session_id>` 輪詢端點，改為提供顧問連線狀態端點；驗證：`curl http://localhost:8420/advisor-status/<session_id>` 回傳連線狀態 JSON，舊端點回傳 404 或已刪除
  Evidence: local aiohttp app curl → `advisor-status={"session_id": "status-fixture", "status": "connected", "connected": true, ...}`；舊 `/analysis/status-fixture` → HTTP `404`。
- [x] 7.4 移除或更新 `tests/test-realtime-voice-identity.js` 對已刪除的 `tools/realtime-voice/static/realtime-workbench-c.css` 三欄佈局規則的斷言；驗證：`node tests/run.js` 不再對已刪除的 CSS 檔案或選擇器斷言，且整體測試套件保持綠燈
  Evidence: `node tests/run.js` → `Tests: 54 | Passed: 54 | Failed: 0`；`rg` retired CSS/layout selectors → `retired-css-and-layout-assertions: none`。

## 8. 端到端驗證與文件

- [x] 8.1 完整跑一次「開始收音 → 講話產生逐字稿 → advisor_cli.py 自動偵測停頓 → 自動呼叫分析後端 → 終端機顯示現況與 1/2/3 → 輸入數字寫入 adoption event」全流程；驗證：browser smoke 測試截圖或終端機輸出紀錄留存於 `/tmp/`，並附 session state 檔案路徑
  Evidence: `/tmp/realtime-cli-e2e-final.uwKFDA/terminal.log` → `analysis_triggered=True`、`option_selected=True`、`adoption_events=['response_option_selected']`、launcher exit 0；逐字稿 `/tmp/realtime-cli-e2e-final.uwKFDA/output/20260826-124755-17842.md`，state `/tmp/realtime-cli-e2e-final.uwKFDA/output/20260826-124755-17842.state.json`。
- [x] 8.2 更新 `tools/realtime-voice/README.md` 為一個指令啟動的使用方式，說明顧問後端設定方式與隱私顯示（逐字稿文字送到哪個模型服務）；驗證：README 內容包含可複製貼上的啟動指令，且指令能對照 6.1 的腳本路徑
  Evidence: README grep → `bash scripts/start-realtime-voice.sh`、`REALTIME_ADVISOR_BACKEND=codex`、`REALTIME_ADVISOR_COMMAND`、`逐字稿文字會送到該 headless CLI 及其模型服務` 均存在。
- [x] 8.3 執行既有 `tests/run.js` 與本次新增測試，確認全部通過；驗證：`node tests/run.js` 與新增 Python 測試指令全部 exit 0
  Evidence: `node tests/run.js` → `Tests: 54 | Passed: 54 | Failed: 0`；`python3 tests/test_schema_validation.py` → `{"session_state": "valid", "analysis_output": "valid"}`；`python3 tests/test_advisor_cli.py` → `ok (8 tests)`；Python `py_compile` 與 `bash -n scripts/start-realtime-voice.sh` → `syntax-checks: PASS`。
