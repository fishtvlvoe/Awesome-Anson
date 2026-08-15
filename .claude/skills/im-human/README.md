# im-human

給 Claude 用的技能：讓 AI 用台灣人的繁體中文講話，並且把已經寫好的文字清掉 AI 味。

Claude Code、claude.ai 網頁版與桌面版、ChatGPT Codex、ChatGPT 一般聊天都能用。

只做兩種語言：**台灣繁體中文**和**英文**。不支援簡體中文場景。

中文觸發詞是「我是人」——說「開啟我是人」就會啟動。

---

## 兩個模式

| 模式 | 你說什麼 | 管什麼 |
|---|---|---|
| **語態模式** | 「開啟我是人」 | **AI 接下來的每一句話**，直到你說「關閉我是人」 |
| **編輯模式** | 「幫我把這段去 AI 味」 | 你貼給它的那段文字 |

### 語態模式

開啟之後，AI 的輸出要照一份合約走：

- 台灣詞彙。影片不是視頻，軟體不是軟件，資訊不是信息，品質不是質量。
- 結論先講，句子長短不齊，允許「其實」「老實說」「蠻」這種口語。
- 禁止 AI 開場白（「當然！」「這是一個很好的問題」）、禁止路標（「首先／其次／最後」成套出現）、禁止空泛拔高（賦能、打造、本質上、核心在於）、禁止客套收尾（「希望這對你有幫助」）。
- 禁止翻譯腔：「進行了討論」該寫「討論了」，「扮演著重要的角色」直接刪。
- 三句話講得完就不要開列點，不要每段都補一句總結，連續三段一樣長就是出問題了。
- 英文同一套標準：contractions 預設開、禁 delve / seamless / leverage / "It's worth noting" 那一整批。

有一條底線：**像人是指說話方式，不是捏造人設。** 不假裝有情緒、不編故事、不把不確定講成確定。

### 編輯模式

把你的文字改得像一個具體的人寫的，同時保住事實。

最高原則是**不發明**——不補數字、來源、經驗、情緒。缺具體內容時它會標「（需作者補充：⋯）」，不會自己編一句漂亮話填洞。

改之前會先圈出保護清單：價格、日期、數字、專名、URL、程式碼、引號原話、退費與法律條款、作者的立場強度。改完逐項回讀，確保「我反對」沒有被改成「我持保留態度」。

---

## 安裝

### Claude Code / Codex（本機資料夾）

**macOS / Linux**

```bash
git clone https://github.com/chang416/im-human.git "$HOME/.claude/skills/im-human"
```

**Windows（PowerShell）**

```powershell
git clone https://github.com/chang416/im-human.git "$env:USERPROFILE\.claude\skills\im-human"
```

Codex 使用者把 `.claude` 換成 `.codex`。裝好開一個新的 session，打 `/im-human` 或直接說「開啟我是人」。

### claude.ai 網頁版 / 桌面版（上傳 zip）

打包時**最上層必須是 `im-human/` 這層資料夾**，不能把 `SKILL.md` 直接丟在 zip 根目錄，
否則上傳會失敗。在技能資料夾的上一層執行：

```bash
zip -r im-human.zip im-human -x "*/__pycache__/*" "*/_archive/*"
```

Windows PowerShell：

```powershell
Compress-Archive -Path im-human -DestinationPath im-human.zip -Force
```

正確的結構長這樣：

```
im-human.zip
└── im-human/
    ├── SKILL.md
    ├── references/
    ├── prompts/
    └── scripts/
```

到 [claude.ai 的 Customize → Skills](https://claude.ai/customize/skills) 上傳，
Free / Pro / Max 都能用。上傳的技能只屬於你自己的帳號。
這個功能需要開啟程式碼執行（code execution）。

裝好之後在對話裡說「開啟我是人」就會載入——Claude 是用語意比對 description，
不是關鍵字比對，所以講法不用一字不差。

### ChatGPT 一般聊天（貼上就好）

ChatGPT 的一般對話沒有 skill 系統，所以這裡把語態合約壓成可以直接貼的一段話：

| 檔案 | 貼到哪 | 長度 |
|---|---|---|
| [`prompts/chatgpt-custom-instructions.md`](prompts/chatgpt-custom-instructions.md) | 設定 → 個人化 → 自訂指令 | 約 600 字，塞得進去 |
| [`prompts/chatgpt-project.md`](prompts/chatgpt-project.md) | 專案指示欄，或自訂 GPT 的 Instructions | 約 1,600 字，含編輯模式的保真規則 |

貼完之後每一段新對話都會生效，不用再手動開啟。要臨時關掉就跟它說
「這一則不用照規則」。

---

## 機械掃描器

`scripts/audit_ai_flavor.py` 是一個離線的回歸掃描，不需要任何 API 金鑰。

```bash
python scripts/audit_ai_flavor.py 你的文章.md
```

它會抓：二分對照殼、機械先後順序、真正／本質式拔高、助理路標、講義腔、抽象包裝詞、進行體、翻譯腔、「隨著⋯的發展」開場、整齊編號、段落長度過於均勻、結尾假互動提問，以及英文層的清嗓開場與 AI 高頻詞。詞表繁簡兩形都收，混到簡體殘留也抓得到。

輸出範例：

```
你的文章.md: review score=15 findings=8 blockers=2
  L1 [助理路標詞] 這是一個很好的問題
  L2 [整齊編號邏輯] 首先，我們來看看這個工具的核心價值。其次
  L3 [抽象包裝詞堆疊] 賦能
```

`--json` 給機器讀，`--fail-on-review` 讓它在 CI 裡擋下有問題的稿子。

**掃描結果只是提示，不是判決。** 引用別人的原話、技術術語、禁詞表本身被掃到都是預期中的誤殺，人看過放行就好。

---

## 這個技能不做什麼

- **不幫你騙 AI 偵測器。** 目標是文字讀起來自然、事實沒被動過，不是讓某個偵測器吐出漂亮的分數。任何宣稱能保證「AI 率低於 X%」的工具都是在賣你無法驗證的東西——偵測器是黑盒、版本天天換，而且誤判人類文章的機率高到不該被當裁判。
- **不憑空創作。** 你沒給的細節它不會生出來。
- **不做翻譯，不做事實查核。**
- **不模仿特定作者的文風。**

---

## 檔案結構

```
SKILL.md                          行為合約的單一來源
references/tw/                    台灣繁中：38 種 AI 痕跡、詞彙對照、場景、保護清單
references/bilingual/             英文與中英混排：禁詞分級、保護區段、場景包
prompts/                          ChatGPT 一般聊天用的貼上版（自訂指令／專案指示）
scripts/audit_ai_flavor.py        離線掃描器
agents/openai.yaml                Codex / OpenAI agent 介面設定
```

`references/tw/patterns.md` 那份 38 種痕跡清單，整理自[中文維基百科「AI生成文的特徵」](https://zh.wikipedia.org/zh-tw/Wikipedia:AI生成文的特徵)、朱宥勳的「AI腔」句型分析，以及英文維基的 Signs of AI writing，範例全部針對台灣的內容創作與辦公場景重寫。每一種痕跡都附「誤殺邊界」，因為問題從來不是句型本身，是密度，以及底下有沒有東西撐著。

---

## English

A Claude skill that does two things: force the assistant to write like an actual Taiwanese person in Traditional Chinese (and like a native speaker in English), and strip AI-flavored patterns out of existing text without touching the facts.

Two modes. **Voice mode** governs every line the assistant writes from the moment you turn it on. **Edit mode** rewrites text you hand it, with a hard no-invention rule: it will never add a number, source, or anecdote you did not supply.

The banned-phrase contract covers both languages, and `scripts/audit_ai_flavor.py` runs offline as a regression check with no API key.

It will not help you beat AI detectors. That is a design decision, not an oversight.

Works in Claude Code, claude.ai, and ChatGPT Codex. For plain ChatGPT chat, which has no skill system, `prompts/` ships paste-ready versions for custom instructions and project instructions. MIT licensed.

---

## 授權

MIT。詳見 [LICENSE](LICENSE)。
