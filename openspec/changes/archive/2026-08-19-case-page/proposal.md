## Why

案神目前確認提案後只有一條輸出路徑：簡報師整理成逐頁大綱，交給 Kimi 提詞或 ppt-master 產出 .pptx。部分使用情境（客戶只想先看一份可以直接開的頁面草稿、或小白拿著案神丟給 Codex/Claude Code 自己跑）需要另一種更輕量的輸出：不用簡報格式，也不用依賴任何外部服務或帳號，單純一份能開瀏覽器就看的獨立頁面。

## What Changes

- 新增 `case-page` Skill：吃 commercial-proposal-quotation-specialist 交出的「已確認提案內容」，直接生成一份自包含 `.html` 檔案。
- Skill 職責只到「生成」為止：不負責部署上網、不管理任何 GitHub/GitLab 帳號、不依賴任何外部服務（例如不透過 note-bridge 之類需要 OAuth 的 Git 協作平台）。
- 在 README.md 新增「網頁對焦版本」段落，說明這是跟「簡報」平行的第二條輸出路徑，附上呼叫方式。

## Capabilities

### New Capabilities

- `case-page`: 把已確認的提案/內容轉成自包含 HTML 頁面的生成能力，不依賴外部服務或帳號

### Modified Capabilities

(none)

## Impact

- Affected code:
  - New: `.claude/skills/case-page/SKILL.md`
  - Modified: `README.md`
