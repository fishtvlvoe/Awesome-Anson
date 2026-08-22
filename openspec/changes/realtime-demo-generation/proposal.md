## Why

案神目前的接案流程是「談完之後才整理」：業務員跟客戶對談結束，才回頭讀逐字稿、拆需求、算報價。客戶當場看不到任何東西，容易在等待期間流失興趣。這個change讓案神在對談當下就能拆解需求、生出一個可操作的 Demo 網站給客戶看，把「接案分析」跟「當場展示」接起來。

## What Changes

- 新增即時需求拆解能力：對談中即時語音轉文字，即時拆出人群/場景/痛點/需求/解決方案；服務型任務改用 4×4＝12 格拆解法（服務前/中/後 × 4 個檢查點）
- 新增一個獨立的新 skill 負責「生 Demo 程式碼 + 部署到 Cloudflare Pages + 串 Cloudflare D1 後台登入」，讓客戶當場能操作看到的東西不是死的截圖
- 這個新 skill 能在 Demo 裡嵌入第三方服務的即時示意（例如客戶要串 LINE OA，就在 Demo 裡秀出對應的即時畫面）
- 這個新 skill 缺圖/缺影片時能自動生成示意素材（圖片走 OpenAI Image API 或 Nano Banana，影片走可靈/SeaDance 或 fal.ai/Kie.ai 這類服務）
- **明確不動** `case-page` skill：`case-page` 现有規則寫死「不部署上網」，這個 change 不修改這條規則，也不讓 `case-page` 自己去做部署。部署這件事只交給這次新增的 skill，兩者職責切開，各自獨立

## Capabilities

### New Capabilities

- `realtime-need-capture`：對談過程中即時語音轉文字，即時拆解客戶需求（人群/場景/痛點/需求/解決方案，或服務型任務的 4×4 拆解法），產出可交給報價流程的確認資料包
- `demo-generation-deploy`：把已拆解/已確認的需求轉成可操作的 Demo 程式碼，部署到 Cloudflare Pages（含 Cloudflare D1 後台登入），並在 Demo 中嵌入第三方服務示意畫面、自動補齊缺少的圖片/影片素材

### Modified Capabilities

(none)

## Impact

- Affected specs: `realtime-need-capture`（新）、`demo-generation-deploy`（新）
- Affected code:
  - New:
    - `.claude/skills/demo-generation-deploy/SKILL.md`
    - `.claude/skills/realtime-need-capture/SKILL.md`
    - `contracts/ANSON-TO-QUOTEMASTER-COMMAND.md`（案神確認報價後下指令給「報價師」獨立專案的交接格式，只定義介面，不含報價師實作）
  - Modified:
    - `.claude/agents/project-manager.md`（銜接 `realtime-need-capture` 產出的即時拆解資料）
    - `README.md`（補上這兩個新能力與「神系列」關聯圖裡「案神→報價師」這一段交接說明）
  - Removed: (none)
- 不影響：`.claude/skills/case-page/SKILL.md` 維持現狀不動，`commercial-proposal-quotation-specialist.md`、`engagement-quote` skill 邏輯不變
