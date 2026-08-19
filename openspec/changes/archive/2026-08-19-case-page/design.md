## Context

案神目前的接力流程：project-manager（需求分析）→ commercial-proposal-quotation-specialist（報價）→ 簡報師（Presentation Manager，整理逐頁大綱交給 Kimi 提詞或 ppt-master）。這條路徑只服務「簡報」這一種輸出格式。

實務上出現兩種新情境需要另一種更輕量的輸出：
1. 案神服務的客戶只想先看一份可以直接開的內容頁草稿，不需要正式簡報格式。
2. 完全不懂技術的使用者（下稱「小白」）把 Awesome-Anson 這個公開 repo 的連結丟給自己手上能操作檔案/git 的 AI（Codex、Claude Code 這類），讓那個 AI 自己跑案神流程；這種情境下不能預設對方有 GitHub/GitLab 帳號，也不能要求任何額外的服務部署或 OAuth 設定。

討論過程中曾評估透過 note-bridge（一個 Git-backed 的網頁 Markdown 協作平台，https://github.com/chuangkevin/gitea-html-viewer）承接這個需求，但 note-bridge 的「寫入」動作需要 GitHub 或 GitLab 帳號登入，這對上述兩種情境（尤其情境 2 的小白）都是不必要的門檻，故不採用。

## Goals / Non-Goals

**Goals:**

- 提供一個新 Skill `case-page`，吃已確認的提案/內容，直接生成一份自包含 `.html` 檔案。
- 生成的頁面不依賴任何外部服務或帳號即可開啟（本機雙擊開啟瀏覽器即可看到完整內容）。
- 與簡報師平行、互不影響：兩者都吃 commercial-proposal-quotation-specialist 交出的「已確認提案內容」，各自產出不同格式的輸出。

**Non-Goals:**

- 不負責把生成的 HTML 部署上網（GitHub Pages、Cloudflare Pages 等皆不在這個 Skill 的職責內）。
- 不管理任何 GitHub/GitLab 帳號或 OAuth 流程。
- 不整合 note-bridge 或其他需要外部服務/帳號的 Git 協作平台。
- 不提供類似 note-bridge `/s/<token>` 的分享連結機制或存取控制（密碼、到期時間）；產出的檔案怎麼傳遞、要不要再部署，交由呼叫這個 Skill 的人/Agent 自行決定。
- 不處理 project-manager 需求確認階段的協作編輯需求（已在討論中擱置，不屬於這次範圍）。

## Decisions

### 命名：case-page（Skill，非 Agent）

案神既有 Skill 一律用英文 kebab-case 命名（`ppt-master`、`kimi-slide`、`engagement-quote`），人格化的「XX 師」名稱保留給 Agent（簡報師、開課師）。`case-page` 呼應「案神」品牌的「案」字，且遵循既有 Skill 命名慣例，不做成 Agent——它不需要自己判斷、不需要問使用者問題，純粹是一個生成動作，做成 Agent 只是空殼子。

替代方案考慮過 `proposal-page`（跟 `engagement-quote` 同款式）與 `pitch-html`（標明輸出格式），最終選 `case-page` 因為最短、最貼近品牌識別。

### 輸出形式：自包含靜態 HTML，不透過 note-bridge

自包含 HTML 檔案不需要任何登入、帳號、外部服務即可開啟，直接解決「案神服務的客戶」與「小白自己的 AI 操作」這兩種情境共同的門檻問題（GitHub 帳號、OAuth）。相對地，note-bridge 方案雖然能提供更完整的協作編輯與分享連結能力，但「寫入」動作綁定 GitHub/GitLab OAuth，對兩種目標情境都是不必要的複雜度，故不採用。

### 視覺呈現：色彩 token + 字體配對 + 雙主題，內容驅動而非固定樣板

不套用單一固定的視覺樣板，而是依提案內容（產業、受眾、語氣）挑選對應的配色與字體，但共用同一套技術底線：CSS 色彩用 token 定義並同時支援淺色/深色（`prefers-color-scheme`），標題與內文字體分開配對，避免所有輸出長得千篇一律。這與案神既有 Skill（`kimi-slide`）「依內容判斷而非套死規則」的精神一致。

## Implementation Contract

**Behavior**：呼叫方（Fish、簡報師、或安裝了 Awesome-Anson 的外部 AI/CLI）提供 commercial-proposal-quotation-specialist 交出的「已確認提案內容」，`case-page` Skill 生成一個檔名可識別（例如 `<client-slug>-case-page.html` 或呼叫方指定路徑）的自包含 `.html` 檔案，開啟後不需要網路連線、不需要登入即可看到完整排版內容。

**Interface**：新增 `.claude/skills/case-page/SKILL.md`，frontmatter 至少包含 `name: case-page`、`description`（何時觸發：提案/內容已確認、需要網頁對焦版本時）。Skill 內容需說明：輸入是什麼（已確認的提案/內容，文字或 Markdown 皆可）、輸出规则（單一自包含 `.html` 檔案，CSS/字體以 inline 或 `<style>` 內嵌，不依賴外部 CDN／付費字體服務以確保離線可開啟）。

**Failure modes**：輸入內容尚未標記「已確認」（例如還帶有「待確認 / 我猜的」標記）時，Skill 應先提示呼叫方回頭確認，不強行生成；沒有可用內容時不得產出空殼頁面充數。

**Acceptance criteria**：
- 生成的 `.html` 檔案可直接用瀏覽器開啟（`file://` 協議），排版正常、無破版。
- 檔案不含任何需要登入或外部帳號才能載入的資源（不呼叫 note-bridge、不內嵌需要 OAuth 的 iframe）。
- 深色／淺色系統主題切換下文字與背景對比皆清楚可讀。

**Scope boundaries**：本次僅新增 `case-page` Skill 本體與 README.md 的「網頁對焦版本」說明段落。不修改 project-manager、commercial-proposal-quotation-specialist、簡報師三個既有 Agent 的定義檔；三者與 `case-page` 的關係僅止於「同樣消費已確認的提案內容」，不需要新增彼此呼叫的程式邏輯。

## Risks / Trade-offs

- [Risk] 自包含 HTML 若提案內容包含大量圖片，單檔案可能過大、難以傳遞 → Mitigation: Skill 說明文件中要求優先使用文字/CSS 呈現，圖片以外部連結或精簡向量圖為主，不內嵌大型點陣圖。
- [Risk] 沒有 note-bridge 式的分享連結或存取控制，檔案一旦外流無法撤銷 → Mitigation: 這是刻意的職責邊界（見 Non-Goals），檔案傳遞方式與存取控制交由使用情境自行決定，不在這個 Skill 的範圍內解決。
- [Risk] 「小白的 AI」若不具備檔案/git 操作能力（純聊天型 AI），無法使用這個 Skill → Mitigation: 這次討論已明確限定範圍為「能操作檔案的 AI（Codex、Claude Code 這類）」，純聊天型 AI 情境不在這次方案內，留待後續視需求另行評估。
