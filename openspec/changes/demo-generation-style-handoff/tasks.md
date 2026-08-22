## 1. 案神是唯一調度者，其他能力不自主觸發(Anson dispatches specialist capabilities; they do not self-trigger)

- [ ] 1.1 在 `.claude/skills/demo-generation-deploy/SKILL.md` 開頭新增「調度原則」段落，明文寫「案神是統籌者，`網頁設計師`／`案例設計師`／`簡報師`／`demo-generation-deploy`／`case-page` 在進行中的案件裡不自主觸發，一律由案神判斷後派工」；驗證：內容審閱確認段落存在且措辭跟 design.md「案神是唯一調度者」決策一致

## 2. Demo 部署前的委派順序：先風格，才部署(Style-and-content pre-stage before demo deployment)

- [ ] 2.1 在 `.claude/skills/demo-generation-deploy/SKILL.md` 新增「風格與內容前置階段」段落，明列委派 `網頁設計師` 的條件（預設需要）、`網頁設計師` 只跑到 Phase 1 mockup 確認為止、不進它自己的 Phase 2 部署流程；驗證：內容包含「不進 `網頁設計師` 自己的 Phase 2 部署流程」這句話，跟 `~/.claude/agents/網頁設計師.md` 既有的 Phase 1/Phase 2 分界描述一致，沒有互相矛盾的規則
- [ ] 2.2 在同一段落明列 `案例設計師` 作為 `網頁設計師` 風格參考來源之一（SaaSFrame 本地索引），跟既有的 21st.dev/motionsites.ai/Pinterest 並列；驗證：內容明確提到 `案例設計師` 跟 SaaSFrame
- [ ] 2.3 新增敘事內容委派 `簡報師` 的判斷條件：需求資料包含敘事/簡報式頁面才委派，純功能型 Demo 不委派；驗證：內容包含兩種情境各自的判斷依據，對應 spec 裡「Narrative content is delegated to 簡報師 only when the demo needs it」與「Narrative delegation is skipped for purely functional demos」兩個情境

## 3. 後台深度與前台呈現的判斷依據(Backend scope is bounded by the confirmed requirements pack)

- [ ] 3.1 在 SKILL.md 新增「後台範圍」規則：後台功能以已確認需求資料包明確列出的功能為準，資料包沒明講的功能點標示為示意用而非做出完整可運作的假功能；驗證：內容包含「不多做、不少做」的判斷依據，且跟既有規格裡「缺素材自動生成示意內容並標示示意用」的既有規則不衝突

## 4. Skipping the style pre-stage requires an explicit stated reason

- [ ] 4.1 在 SKILL.md 新增例外規則：只有 Demo 完全沒有視覺呈現需求時，案神才可以判斷跳過委派 `網頁設計師`，且必須在回報裡明講跳過理由，不能悄悄跳過；驗證：內容包含「明講」「不能悄悄跳過」等對應措辭

## 5. Generate a live demo site from confirmed requirements(Generate a live demo site from confirmed requirements)

- [ ] 5.1 修改 SKILL.md 現有「本 skill 專責的部署行為」段落，明確標註部署前必須完成第 2 節前置階段，未完成不得進部署；驗證：內容包含「Deployment is blocked until the pre-stage mockup is confirmed」對應的中文說明，且措辭不跟既有「生成 Demo 程式碼並部署」段落矛盾

## 6. 報價師交接維持既有契約，不擴大範圍

- [ ] 6.1 確認 `contracts/ANSON-TO-QUOTEMASTER-COMMAND.md` 本次未被修改（`git diff` 應無變更），且 SKILL.md 若有提到報價師交接只引用既有契約，不新增欄位或邏輯；驗證：`git diff contracts/ANSON-TO-QUOTEMASTER-COMMAND.md` 輸出為空

## 7. 一致性驗證

- [ ] 7.1 完整讀一次修改後的 `.claude/skills/demo-generation-deploy/SKILL.md`，跟 `~/.claude/agents/網頁設計師.md`、`~/.claude/agents/案例設計師.md`、`.claude/agents/簡報師.md`、`contracts/ANSON-TO-QUOTEMASTER-COMMAND.md` 逐一核對，確認沒有重複定義同一段邏輯（例如風格判斷邏輯只在 `網頁設計師` 那邊定義一次，`demo-generation-deploy` 只引用不重寫）；驗證：列出核對結果，若發現重複定義要修掉才算完成
- [ ] 7.2 `spectra validate "demo-generation-style-handoff"` 通過（0 Critical/Warning）；驗證：指令實際輸出
