# 案神 Awesome-Anson（原 PM專案師）

**這不是常駐系統，不是 Agent OS。** 沒有背景排程、沒有狀態機一直在跑——你打指令或呼叫 Agent 它才動，不叫它就完全靜止，像精靈一樣呼之即來、揮之即去。它是一組「丟案件資料進去、吐結構化產出出來」的接案分析架構：集中管理可重複使用的 Agent 身份、Skills 依賴、案件資料契約與流程入口。

## 這個 repo 裝了什麼，別人裝了會拿到什麼

`.claude/agents/` 三個接案用的 Agent 身份 ＋ `.claude/skills/` 七個實際可用的 Skill（不是外部連結，檔案本身就在這個 repo 裡）＋ 契約文件。clone 下來就是一整套，不用另外去別的地方湊依賴。

另外還搭了一個第四個 Agent「開課師」，跟接案報價流程無關，是拿主題、素材整理成課程大綱、簡報與學員講義用的，算附贈，不影響上面三個的流程。


---

<!-- GODS-FAMILY:START -->
## 👑 「神」系列家族：彼此怎麼接力合作？

「神」系列不是各自為政的工具，而是一條從**商務接案、工程開發到成果交付**的完整流水線：

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                       👑 「神」系列家族完整協同接力鏈                         │
└─────────────────────────────────────────────────────────────────────────┘

【第一棒：接案與商務需求】
  📋 案神 (Awesome-Anson) ➔ 丟進客戶會議逐字稿與資料，自動拆解需求、產出報價單與簡報。
         │
         ▼ (客戶成交，需求確認，交棒給工程總管)
【第二棒：自動化工程開發】
  🏗️ 蓋神 (Awesome-Gason) ➔ 把需求轉成 Spectra 規格，指揮多 Agent 在隔離房間寫碼與驗收。
         │
         ├─► 🗣️ 譯神 (Awesome-Eason) ➔ 過程中遇到看不懂的技術名詞？對外文案太假？
         │                               隨時叫「譯神」出來翻譯成白話、去 AI 味。
         │
         ├─► ⌨️ Key神 (Awesome-Keyson) ➔ 專案需註冊第三方平台、申請 API Key、填寫繁瑣企業表單？
         │                               貼上網址交給「Key神」安全自動填表，不用手打。
         │
         ▼ (系統開發完成，功能已驗收上線)
【第三棒：產品交付與行銷宣傳】
  🎬 剪神 (Awesome-Janson) ➔ 錄好的系統操作教學、發表會影片，一鍵自動精修成長片與爆款短影音。
```

### 家族成員倉庫速查

* 📋 **[案神 Awesome-Anson](https://github.com/fishtvlvoe/Awesome-Anson)**（本倉庫）：接案分析、商務報價、合約拆解與提案簡報架構
* 🏗️ **[蓋神 Awesome-Gason](https://github.com/fishtvlvoe/Awesome-Gason)**：Spectra SDD 全自動開發總管（規格→TDD→多代理派工→CR→驗收）
* 🗣️ **[譯神 Awesome-Eason](https://github.com/fishtvlvoe/Awesome-Eason)**：小白技術降維、台灣繁中去 AI 味與翻譯急救
* ⌨️ **[Key神 Awesome-Keyson](https://github.com/fishtvlvoe/Awesome-Keyson)**：自動 Key 單、智慧語意對齊與跨平台表單自動填寫
* 📊 **[待神 Awesome-Dyson](https://github.com/fishtvlvoe/Awesome-Dyson)**：跨專案開發儀表板：固定網址看現況、進度、待確認事項與歷史紀錄，換 CLI/AI 接手不用重新對焦
* 🎬 **[剪神 Awesome-Janson](https://github.com/fishtvlvoe/Awesome-Janson)**：全能 AI 影片剪輯 Agent（長片精修、爆款短影音與動效）
<!-- GODS-FAMILY:END -->

---
## 安裝方式（任何 AI 工具都能裝，不限 Claude Code）

1. 把這個 repo clone 下來：
   ```
   git clone https://github.com/fishtvlvoe/Awesome-Anson.git Awesome-Anson
   ```
2. 打開你在用的 AI 工具（Claude Code、Cursor、Codex CLI、Windsurf、或任何能讀檔案、能連續對話執行多步驟的 AI 都可以），把它指到剛剛 clone 下來的資料夾
3. 跟 AI 說：**「幫我安裝這個」**（或更明確一點：「讀這個資料夾的 README.md，還有 `.claude/agents/` 底下三個角色的說明，之後我提到報價、簡報、需求分析，就照這些角色的規則做」）
4. AI 自己讀完就會知道怎麼扮演這三個角色，不用你手動搬檔案或設定
5. 如果要用「本機做出正式 .pptx 檔」這個功能（不是只要 Kimi 提詞），還要多跑一次：
   ```
   pip install -r .claude/skills/ppt-master/requirements.txt
   ```
   這步驟需要電腦上已經有 Python；只用 Kimi 路徑（複製提詞貼去 Kimi 網站）的話可以跳過，不用裝 Python 環境。

**差異**：Claude Code 認得 `.claude/agents/*.md` 和 `.claude/commands/*.md` 這套格式，會自動抓到，`/client-quote` 這種指令也是原生支援，裝好立刻能打；其他 AI 工具沒有這種「自動認格式」的機制，需要你明確叫它先讀過 README 跟 Agent 說明檔，之後用口語描述（「用 PM 助理幫我分析這份逐字稿」）達到一樣效果，不能打 `/client-quote` 這種斜線指令。

## 新手怎麼用（不懂技術也看得懂，以 Claude Code 為例）

**這是做什麼的**：接案子時，把客戶給的一堆資料（逐字稿、會議記錄、官網連結）丟進來，它會像三個助理接力，幫你整理成「需求」、「報價單」、「簡報」。

**照這幾步做：**

1. 打開 Claude Code，進到這個資料夾
2. 把客戶給的資料準備好：逐字稿檔案路徑、資料夾位置都可以
3. 打這一行，把 `<>` 換成你的檔案路徑：
   ```
   /client-quote <案件資料夾或逐字稿路徑>
   ```
4. 它會開始一題一題問你問題（一次只問一題，你答完才問下一題），照實回答就好
5. 它整理完需求會先給你看一份摘要，你要說「對」或「這裡改一下」，它才會往下算報價
6. 報價確認完，如果還要做簡報，直接用中文跟它說「幫我做成簡報」，它自己知道要叫哪個助理，不用背指令

**你不用做的事**：不用自己套報價公式、不用自己排簡報版面、它不會自己把東西送給客戶——每一步都會先給你看、等你點頭才繼續。

## 三個核心 Agent（接力賽，不是同一個東西）

白話講：「Agent」就是一個有固定角色、固定做事規則的 AI 助理，你點名它，它才會用那個角色的方式做事。三個助理各做各的，互不知道對方在忙什麼，只認「上一棒交過來、你已經點頭確認過」的東西。

```text
助理1：project-manager（專案管理與需求分析師）
讀逐字稿/資料 → 拆需求 → 每一項標「已確認 / 待確認 / 我猜的」
  ↓ 交出一份「PM 資料包」（contracts/PM-TO-QUOTE-DATA-PACK.md 定義了長相）
助理2：commercial-proposal-quotation-specialist（商務提案與報價顧問）
算價格、寫條款 → 產出報價文件（先做網頁版給你看，你點頭才轉成 PDF）
  ↓ 交出已確認的提案內容，接下來平行分兩條路
助理3：簡報師（Presentation Manager）
整理成逐頁簡報大綱 → 交給 Kimi（一個 AI 簡報生成工具）或本機的簡報製作程式
Skill：case-page（網頁對焦版本）
把同一份已確認內容直接生成一份獨立網頁，不用登入、不用帳號，開瀏覽器就能看
```

### 網頁對焦版本（case-page）

白話講：報價確認之後，除了做成簡報，還可以直接生成一份**能開瀏覽器就看**的獨立網頁——不是簡報格式，不用連任何外部服務，也不用任何帳號。跟簡報師是平行關係，不是誰取代誰，兩者吃同一份已確認內容，各自產出不同格式。

什麼時候會用到：
- 客戶只想先看一份網頁草稿，不需要正式簡報
- 小白把這個 repo 的連結丟給自己手上的 AI（Codex、Claude Code 這類），走到這一步，AI 自己生成頁面給小白看，不需要小白辦任何帳號

這是一個 Skill（`.claude/skills/case-page/`），不是 Agent——它不用自己判斷、不用問問題，純粹是一個生成動作。它只負責「生成」，不負責把頁面部署上網、不管理任何 GitHub/GitLab 帳號，產出的檔案要放哪裡是使用情境自己決定的事。

## 怎麼叫（兩種方式，看情境）

**整案分析到報價，一條龍走完：**

```text
/client-quote <案件資料夾或逐字稿路徑>
```

打這行，它會照順序帶你走完助理1 → 助理2：先幫你理需求（案子複雜就先多問幾輪，這步驟叫 `grill-with-docs`），你確認需求整理對了才進報價，報價表你點頭、網頁版你也看過了才轉成正式 PDF。每一步都停下來等你說「對」才往下走，不會自己偷跑。

**只想單獨叫某一位助理（不走整條流程）：**

沒有現成的斜線指令，要用「Agent 工具」直接點名：

```text
Agent(subagent_type="project-manager", ...)                              → 叫助理1
Agent(subagent_type="commercial-proposal-quotation-specialist", ...)     → 叫助理2
Agent(subagent_type="簡報師", ...)                                        → 叫助理3
```

白話講，這行語法的意思就是「請用 XXX 這個角色來處理」，不是要你寫程式，是跟 AI 講「這次麻煩用簡報師的身分幫我」。例如只想重做一份簡報、不想重跑整個需求分析，就直接點名「簡報師」，把已經確認過的文案/報價單丟給它。

> 舊版曾經有 `/presentation-manager` 這個獨立指令，內容跟「簡報師」這個角色的說明重複又會兜不起來，已經刪掉。簡報功能現在只有一個入口：點名叫「簡報師」。

簡報師做完大綱後，會問你要走哪條路，兩條都可以，只能選一條：

- **Kimi 路徑**：用本 repo 內建的 `kimi-slide` 這份技能，生出一段文字（提詞），你自己複製貼去 Kimi 網站生成簡報。它不會自動幫你送出去，也不會假裝已經做出簡報檔案。
- **本機製作路徑**：產出一份交接包（內容規則見 `PRESENTATION-HANDOFF-PACK.md`），給本 repo 內建的 `ppt-master` 這套專門做簡報檔的工具接手，做出正式的 .pptx 檔。簡報師本身**不會**去執行 ppt-master，也不會生出 .pptx 檔案——只負責把料準備好交接，實際製作要你另外叫 ppt-master 這個 Skill 來做。`ppt-master` 是 Python 寫的，第一次用之前要先跑一次 `pip install -r .claude/skills/ppt-master/requirements.txt`；純文字轉 PPTX 不用額外設定，要用 AI 配圖或語音旁白才需要在 `.env` 填自己的 API Key。

兩條路都只能用你已經確認過的那份大綱內容，不能自己回頭亂加東西。

## 依賴 Skills

白話講：「Skill」是一包寫好的做事技巧／模板，教 Agent 該怎麼問問題、怎麼算報價、怎麼寫提詞。全部技巧的實體檔案都在本 repo 的 `.claude/skills/` 底下，clone 下來就有，不需要另外去別的地方裝：

- `pm-discovery-upgrade`（前期需求訪談技巧）、`engagement-quote`（報價計算與文件模板）、`kimi-slide`（簡報提詞生成模板） — 自己寫的
- `grill-with-docs`（帶著既有文件深挖需求）、`grilling`（一題一題逼問的訪談法）、`domain-modeling`（業務領域拆解技巧） — 原樣搬自 [mattpocock/skills](https://github.com/mattpocock/skills)（MIT 授權，可自由使用改作）
- `im-human`（把 AI 味的文字改成人話） — 原樣搬自 [chang416/im-human](https://github.com/chang416/im-human)（MIT 授權，取代舊版寫死引用但從沒真的存在過的 `speak-human-tw`）
- `ppt-master`（把交接包做成正式 .pptx 檔的工具） — 搬自 [hugohe3/ppt-master](https://github.com/hugohe3/ppt-master) 的 Claude Code Skill 部分（MIT 授權）。這個是 Python 工具，第一次用要先 `pip install -r .claude/skills/ppt-master/requirements.txt`

授權與出處明細見 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。

依賴與交接規格：

- [PM-TO-QUOTE-DATA-PACK.md](contracts/PM-TO-QUOTE-DATA-PACK.md)：PM Agent → 商務提案與報價 Agent
- [PRESENTATION-HANDOFF-PACK.md](contracts/PRESENTATION-HANDOFF-PACK.md)：簡報管理師 → ppt-master 交接包
