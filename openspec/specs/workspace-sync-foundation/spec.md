# workspace-sync-foundation Specification

## Purpose

TBD - created by archiving change 'anson-workspace-sync-foundation'. Update Purpose after archive.

## Requirements

### Requirement: 登入時安全同步程式碼

系統 SHALL 提供一個裝置本機同步命令，抓取設定的 upstream 分支；只有在工作樹乾淨且更新可以 fast-forward 時，才更新本機 Awesome-Anson checkout。

#### Scenario: 乾淨 checkout 成功更新

- **WHEN** 設定的 repo 沒有 tracked 或 untracked 變更，而且 upstream 分支有一個可以 fast-forward 的 commit
- **THEN** 同步命令 SHALL 更新本機 checkout 到 upstream commit，並回報 codeStatus 為 updated 或 up-to-date

##### Example: 桌機 push 後筆電登入

- **GIVEN** upstream HEAD 是 abc123，筆電 local HEAD 是 abc122，工作樹沒有變更
- **WHEN** 筆電執行登入同步命令
- **THEN** local HEAD SHALL 變成 abc123，codeStatus SHALL 為 updated

#### Scenario: 髒工作樹受到保護

- **WHEN** 設定的 repo 有任何 tracked 或 untracked 本機變更
- **THEN** 同步命令 SHALL 回傳非零、SHALL NOT 修改 checkout，並在 codeStatus 為 blocked 的狀態中列出髒檔案

##### Example: 筆電有未提交修改

- **GIVEN** laptop checkout 修改了 README.md
- **WHEN** 登入同步命令執行
- **THEN** README.md 內容與 local HEAD SHALL 保持不變，結果 SHALL 為 blocked

#### Scenario: 分支不是 fast-forward 時受到保護

- **WHEN** 本機分支與 upstream 分支已經分叉
- **THEN** 同步命令 SHALL 回傳非零，SHALL NOT 執行 reset、stash、rebase 或 merge，並回報 codeStatus 為 blocked

##### Example: 桌機與筆電各自有 commit

- **GIVEN** desktop branch 有 commit A，laptop branch 有不同的 commit B
- **WHEN** laptop 執行登入同步
- **THEN** laptop 的 commit B SHALL 保留，結果 SHALL 為 blocked


<!-- @trace
source: anson-workspace-sync-foundation
updated: 2026-08-25
code:
  - graphify-out/cache/ast/a30190143d640b7b0c46f383e661da7a425bd159007e101c0ad2dc472e48cdf6.json
  - graphify-out/graph.json
  - .opencode/commands/spectra-debug.md
  - .cursorrules
  - graphify-out/cache/ast/e2239ae4caf4905c834bb57d6e097064c17d952a9a5d2ee8775a0568619c4066.json
  - tests/test-anson-sync.js
  - .opencode/commands/spectra-ingest.md
  - .opencode/skills/spectra-archive/SKILL.md
  - graphify-out/.graphify_root
  - design/fish-admin/SURFACE.md
  - .github/prompts/spectra-ask.prompt.md
  - .opencode/skills/spectra-drift/SKILL.md
  - graphify-out/.graphify_state.json
  - graphify-out/cache/ast/f805a6aef02ad563f850999c531b0d64a58d2c4f85e0f01ae7aca51c8a3ba441.json
  - tools/realtime-voice/static/index-v2-dark.html
  - .github/prompts/spectra-archive.prompt.md
  - .opencode/commands/spectra-audit.md
  - tools/realtime-voice/static/realtime-workbench-c.css
  - .opencode/commands/spectra-drift.md
  - .github/prompts/spectra-debug.prompt.md
  - graphify-out/cache/ast/49acdd20ff4fa559d5020703b9c09692318bee494ed14845295292283548a498.json
  - tools/realtime-voice/server.py
  - .github/prompts/spectra-commit.prompt.md
  - .github/skills/spectra-apply/SKILL.md
  - graphify-out/cache/ast/e4b08962cb21f7aa56ef5737eae3cbc09d54bf02c5a69313ef8ed1c0cc00129f.json
  - .github/skills/spectra-audit/SKILL.md
  - .spectra.yaml
  - graphify-out/cache/ast/cb991f903340797afda3b7e4fba629adedcc6986430e0b5a0a6323dfb1992420.json
  - graphify-out/cache/ast/885fbf9e21d24ebb5ef3f0782c0a213db019e3391b3f56f14a021c22a9c9c245.json
  - .github/skills/spectra-ingest/SKILL.md
  - design/fish-admin/tokens.css
  - graphify-out/cache/ast/60d0bf76284f04e21c188fec1257fe4787ed7e515ddcda92da38fb575ece80b7.json
  - .github/prompts/spectra-drift.prompt.md
  - .github/prompts/spectra-apply.prompt.md
  - .github/skills/spectra-debug/SKILL.md
  - .github/prompts/spectra-audit.prompt.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .github/prompts/spectra-discuss.prompt.md
  - .opencode/commands/spectra-discuss.md
  - graphify-out/.graphify_detect.json
  - .github/skills/spectra-drift/SKILL.md
  - graphify-out/cache/ast/09c6c931050a185112cdcf9612c4c3372e16df7abba9f4ca21a29b90bb8225ba.json
  - graphify-out/cache/ast/9e9daab2a2aedc7b46d0de123776383eec9a305edfc8953914f51010ea0a5c3f.json
  - .opencode/skills/spectra-commit/SKILL.md
  - graphify-out/.graphify_ast.json
  - graphify-out/graph.html
  - .opencode/commands/spectra-ask.md
  - tools/realtime-voice/static/index.html
  - .github/skills/spectra-commit/SKILL.md
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-audit/SKILL.md
  - CLAUDE.md
  - .github/skills/spectra-ask/SKILL.md
  - design/fish-admin/canonical.png
  - docs/verification/2026-08-24-manual/desktop.png
  - graphify-out/cache/ast/d82e16a1073f2c938ec26b69236bb3b77157d84c80dd3c8945ed44a8157089c8.json
  - cases/README.md
  - tools/realtime-voice/static/voice-profile.html
  - assets/logo.jpg
  - graphify-out/cache/ast/8e51e2945c307e6abfb38dfcf7b1f8f28003051ddaa1a631d867b221ef1c481e.json
  - graphify-out/manifest.json
  - scripts/anson-sync.js
  - docs/superpowers/specs/2026-08-24-manual-website-design.md
  - .github/skills/spectra-propose/SKILL.md
  - .opencode/skills/spectra-debug/SKILL.md
  - graphify-out/GRAPH_REPORT.md
  - graphify-out/cache/ast/c0e1b529fb2165b3c815c446919e7667c216e584a443ef2f0f85a9c5b23061ed.json
  - README.md
  - graphify-out/cache/ast/e5d28e544fa8c2d2b2cfaab77a464b5b82078ffbde4d1669d7fb5d7fa74cdc40.json
  - .opencode/commands/spectra-apply.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/skills/spectra-apply/SKILL.md
  - .opencode/skills/spectra-propose/SKILL.md
  - AGENTS.md
  - tools/realtime-voice/static/realtime-workbench-demo.html
  - .opencode/skills/spectra-ask/SKILL.md
  - .github/skills/spectra-archive/SKILL.md
  - graphify-out/cache/ast/87d3321d15848bf0e3b033592cd562df18bfd8427d36f113d0aad42dca514624.json
  - graphify-out/cache/ast/dd7a6d2df2f937bab590dc84197d9f417b4856c0f5992c7f925172e010769b6a.json
  - dashboard/index.html
  - docs/WEBSITE-HANDOFF-2026-08-24.md
  - .github/prompts/spectra-propose.prompt.md
  - graphify-out/cache/ast/6071fcdce98524636c6abec309d4e828bcbaa811b8fab7226fc09189238d2ad3.json
  - .opencode/commands/spectra-commit.md
  - graphify-out/cache/ast/21f829fcb05a110167d4fdac8cb4edae0b0b8efffca1c7913932e6c7790896db.json
  - .opencode/skills/spectra-discuss/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - .opencode/commands/spectra-archive.md
  - docs/verification/2026-08-24-manual/mobile.png
  - graphify-out/.graphify_python
  - graphify-out/cache/ast/3ccf98217c678565078da4100cbbe5e00ad337e893f69fcc4f9189183df84137.json
  - GEMINI.md
  - graphify-out/cache/ast/59e1a6ba1a0cc9cd37f47c10e967f7c98b7cf58c344ba8bfc88d7ca9d86edd7c.json
  - graphify-out/cache/ast/dfdedd484bb5ebe3f69c923715a683a4585cc0d0e16bc8e40470728d9079b3f6.json
  - graphify-out/cache/ast/edfe4f960e85b45e9130638c3bff10c8428caf044e88e032208106f3c6a13e25.json
-->

---
### Requirement: 登入自動化不依賴 IDE 與 Agent 工作階段

系統 SHALL 提供 macOS 登入觸發器，在不開啟 IDE、Codex、Claude 或其他 Agent 工作階段的情況下，呼叫裝置本機同步命令。

#### Scenario: 使用者登入筆電

- **WHEN** macOS 啟動已設定的使用者工作階段
- **THEN** 登入觸發器 SHALL 執行一次同步，並寫入帶有時間戳記的狀態結果

##### Example: 沒有開啟 IDE

- **GIVEN** 使用者登入 macOS，但 IDE、Codex、Claude 都沒有啟動
- **WHEN** 登入觸發器執行
- **THEN** SHALL 產生一筆 status.json，且不需要任何 Agent session

#### Scenario: 使用者停用登入同步

- **WHEN** 使用者在本機設定把 syncOnLogin 設為 false
- **THEN** 登入觸發器 SHALL 略過程式碼與案件同步，且 SHALL 不修改 checkout 或 caseRoot

##### Example: 停用登入同步

- **GIVEN** syncOnLogin 設為 false，且本機 checkout 與 caseRoot 都有既有檔案
- **WHEN** macOS 執行登入觸發器
- **THEN** SHALL 不執行 code sync 或 case sync，兩個既有路徑 SHALL 保持不變


<!-- @trace
source: anson-workspace-sync-foundation
updated: 2026-08-25
code:
  - graphify-out/cache/ast/a30190143d640b7b0c46f383e661da7a425bd159007e101c0ad2dc472e48cdf6.json
  - graphify-out/graph.json
  - .opencode/commands/spectra-debug.md
  - .cursorrules
  - graphify-out/cache/ast/e2239ae4caf4905c834bb57d6e097064c17d952a9a5d2ee8775a0568619c4066.json
  - tests/test-anson-sync.js
  - .opencode/commands/spectra-ingest.md
  - .opencode/skills/spectra-archive/SKILL.md
  - graphify-out/.graphify_root
  - design/fish-admin/SURFACE.md
  - .github/prompts/spectra-ask.prompt.md
  - .opencode/skills/spectra-drift/SKILL.md
  - graphify-out/.graphify_state.json
  - graphify-out/cache/ast/f805a6aef02ad563f850999c531b0d64a58d2c4f85e0f01ae7aca51c8a3ba441.json
  - tools/realtime-voice/static/index-v2-dark.html
  - .github/prompts/spectra-archive.prompt.md
  - .opencode/commands/spectra-audit.md
  - tools/realtime-voice/static/realtime-workbench-c.css
  - .opencode/commands/spectra-drift.md
  - .github/prompts/spectra-debug.prompt.md
  - graphify-out/cache/ast/49acdd20ff4fa559d5020703b9c09692318bee494ed14845295292283548a498.json
  - tools/realtime-voice/server.py
  - .github/prompts/spectra-commit.prompt.md
  - .github/skills/spectra-apply/SKILL.md
  - graphify-out/cache/ast/e4b08962cb21f7aa56ef5737eae3cbc09d54bf02c5a69313ef8ed1c0cc00129f.json
  - .github/skills/spectra-audit/SKILL.md
  - .spectra.yaml
  - graphify-out/cache/ast/cb991f903340797afda3b7e4fba629adedcc6986430e0b5a0a6323dfb1992420.json
  - graphify-out/cache/ast/885fbf9e21d24ebb5ef3f0782c0a213db019e3391b3f56f14a021c22a9c9c245.json
  - .github/skills/spectra-ingest/SKILL.md
  - design/fish-admin/tokens.css
  - graphify-out/cache/ast/60d0bf76284f04e21c188fec1257fe4787ed7e515ddcda92da38fb575ece80b7.json
  - .github/prompts/spectra-drift.prompt.md
  - .github/prompts/spectra-apply.prompt.md
  - .github/skills/spectra-debug/SKILL.md
  - .github/prompts/spectra-audit.prompt.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .github/prompts/spectra-discuss.prompt.md
  - .opencode/commands/spectra-discuss.md
  - graphify-out/.graphify_detect.json
  - .github/skills/spectra-drift/SKILL.md
  - graphify-out/cache/ast/09c6c931050a185112cdcf9612c4c3372e16df7abba9f4ca21a29b90bb8225ba.json
  - graphify-out/cache/ast/9e9daab2a2aedc7b46d0de123776383eec9a305edfc8953914f51010ea0a5c3f.json
  - .opencode/skills/spectra-commit/SKILL.md
  - graphify-out/.graphify_ast.json
  - graphify-out/graph.html
  - .opencode/commands/spectra-ask.md
  - tools/realtime-voice/static/index.html
  - .github/skills/spectra-commit/SKILL.md
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-audit/SKILL.md
  - CLAUDE.md
  - .github/skills/spectra-ask/SKILL.md
  - design/fish-admin/canonical.png
  - docs/verification/2026-08-24-manual/desktop.png
  - graphify-out/cache/ast/d82e16a1073f2c938ec26b69236bb3b77157d84c80dd3c8945ed44a8157089c8.json
  - cases/README.md
  - tools/realtime-voice/static/voice-profile.html
  - assets/logo.jpg
  - graphify-out/cache/ast/8e51e2945c307e6abfb38dfcf7b1f8f28003051ddaa1a631d867b221ef1c481e.json
  - graphify-out/manifest.json
  - scripts/anson-sync.js
  - docs/superpowers/specs/2026-08-24-manual-website-design.md
  - .github/skills/spectra-propose/SKILL.md
  - .opencode/skills/spectra-debug/SKILL.md
  - graphify-out/GRAPH_REPORT.md
  - graphify-out/cache/ast/c0e1b529fb2165b3c815c446919e7667c216e584a443ef2f0f85a9c5b23061ed.json
  - README.md
  - graphify-out/cache/ast/e5d28e544fa8c2d2b2cfaab77a464b5b82078ffbde4d1669d7fb5d7fa74cdc40.json
  - .opencode/commands/spectra-apply.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/skills/spectra-apply/SKILL.md
  - .opencode/skills/spectra-propose/SKILL.md
  - AGENTS.md
  - tools/realtime-voice/static/realtime-workbench-demo.html
  - .opencode/skills/spectra-ask/SKILL.md
  - .github/skills/spectra-archive/SKILL.md
  - graphify-out/cache/ast/87d3321d15848bf0e3b033592cd562df18bfd8427d36f113d0aad42dca514624.json
  - graphify-out/cache/ast/dd7a6d2df2f937bab590dc84197d9f417b4856c0f5992c7f925172e010769b6a.json
  - dashboard/index.html
  - docs/WEBSITE-HANDOFF-2026-08-24.md
  - .github/prompts/spectra-propose.prompt.md
  - graphify-out/cache/ast/6071fcdce98524636c6abec309d4e828bcbaa811b8fab7226fc09189238d2ad3.json
  - .opencode/commands/spectra-commit.md
  - graphify-out/cache/ast/21f829fcb05a110167d4fdac8cb4edae0b0b8efffca1c7913932e6c7790896db.json
  - .opencode/skills/spectra-discuss/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - .opencode/commands/spectra-archive.md
  - docs/verification/2026-08-24-manual/mobile.png
  - graphify-out/.graphify_python
  - graphify-out/cache/ast/3ccf98217c678565078da4100cbbe5e00ad337e893f69fcc4f9189183df84137.json
  - GEMINI.md
  - graphify-out/cache/ast/59e1a6ba1a0cc9cd37f47c10e967f7c98b7cf58c344ba8bfc88d7ca9d86edd7c.json
  - graphify-out/cache/ast/dfdedd484bb5ebe3f69c923715a683a4585cc0d0e16bc8e40470728d9079b3f6.json
  - graphify-out/cache/ast/edfe4f960e85b45e9130638c3bff10c8428caf044e88e032208106f3c6a13e25.json
-->

---
### Requirement: 外部私有案件根目錄是客戶資料邊界

系統 SHALL 允許每臺裝置設定 Git repo 外部的 caseRoot；案神工作流程 SHALL 使用這個路徑保存真實客戶案件紀錄與客戶專屬產出物。

#### Scenario: 案件根目錄可用

- **WHEN** 設定的 caseRoot 存在，且可讀、可寫
- **THEN** 同步命令 SHALL 回報 caseStatus 為 ready，並讓案神案件工作流程使用該路徑

##### Example: 兩臺裝置使用同一個案件庫

- **GIVEN** desktop 與 laptop 都設定自己的本機加密案件庫路徑
- **WHEN** 案件庫已完成外部同步
- **THEN** 兩臺裝置的同步檢查 SHALL 回報 caseStatus 為 ready

#### Scenario: 案件根目錄不可用

- **WHEN** 設定的 caseRoot 不存在、未掛載或不可讀
- **THEN** 同步命令 SHALL 回報 caseStatus 為 unavailable，且 SHALL 不建立新的空案件根目錄或刪除既有本機資料

##### Example: 筆電登入時加密案件庫尚未掛載

- **GIVEN** caseRoot 的外部同步工具尚未完成掛載
- **WHEN** 登入同步命令執行
- **THEN** 結果 SHALL 為 unavailable，且既有案件檔案 SHALL 保持不變

#### Scenario: 客戶資料不進 Git

- **WHEN** 在 caseRoot 建立真實案件
- **THEN** 案件檔案 SHALL 留在 Git 追蹤路徑之外，repo 驗證 SHALL 拒絕真實案件 fixture 或含秘密的檔案

##### Example: 真實案件在 repo 外

- **GIVEN** caseRoot 是 /private/Anson-cases，repo 是 /Development/Awesome-Anson
- **WHEN** 在 caseRoot 建立 case-2026-0825-client-a
- **THEN** git status SHALL 不列出該案件，秘密掃描 SHALL 不把它當成 repo 檔案


<!-- @trace
source: anson-workspace-sync-foundation
updated: 2026-08-25
code:
  - graphify-out/cache/ast/a30190143d640b7b0c46f383e661da7a425bd159007e101c0ad2dc472e48cdf6.json
  - graphify-out/graph.json
  - .opencode/commands/spectra-debug.md
  - .cursorrules
  - graphify-out/cache/ast/e2239ae4caf4905c834bb57d6e097064c17d952a9a5d2ee8775a0568619c4066.json
  - tests/test-anson-sync.js
  - .opencode/commands/spectra-ingest.md
  - .opencode/skills/spectra-archive/SKILL.md
  - graphify-out/.graphify_root
  - design/fish-admin/SURFACE.md
  - .github/prompts/spectra-ask.prompt.md
  - .opencode/skills/spectra-drift/SKILL.md
  - graphify-out/.graphify_state.json
  - graphify-out/cache/ast/f805a6aef02ad563f850999c531b0d64a58d2c4f85e0f01ae7aca51c8a3ba441.json
  - tools/realtime-voice/static/index-v2-dark.html
  - .github/prompts/spectra-archive.prompt.md
  - .opencode/commands/spectra-audit.md
  - tools/realtime-voice/static/realtime-workbench-c.css
  - .opencode/commands/spectra-drift.md
  - .github/prompts/spectra-debug.prompt.md
  - graphify-out/cache/ast/49acdd20ff4fa559d5020703b9c09692318bee494ed14845295292283548a498.json
  - tools/realtime-voice/server.py
  - .github/prompts/spectra-commit.prompt.md
  - .github/skills/spectra-apply/SKILL.md
  - graphify-out/cache/ast/e4b08962cb21f7aa56ef5737eae3cbc09d54bf02c5a69313ef8ed1c0cc00129f.json
  - .github/skills/spectra-audit/SKILL.md
  - .spectra.yaml
  - graphify-out/cache/ast/cb991f903340797afda3b7e4fba629adedcc6986430e0b5a0a6323dfb1992420.json
  - graphify-out/cache/ast/885fbf9e21d24ebb5ef3f0782c0a213db019e3391b3f56f14a021c22a9c9c245.json
  - .github/skills/spectra-ingest/SKILL.md
  - design/fish-admin/tokens.css
  - graphify-out/cache/ast/60d0bf76284f04e21c188fec1257fe4787ed7e515ddcda92da38fb575ece80b7.json
  - .github/prompts/spectra-drift.prompt.md
  - .github/prompts/spectra-apply.prompt.md
  - .github/skills/spectra-debug/SKILL.md
  - .github/prompts/spectra-audit.prompt.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .github/prompts/spectra-discuss.prompt.md
  - .opencode/commands/spectra-discuss.md
  - graphify-out/.graphify_detect.json
  - .github/skills/spectra-drift/SKILL.md
  - graphify-out/cache/ast/09c6c931050a185112cdcf9612c4c3372e16df7abba9f4ca21a29b90bb8225ba.json
  - graphify-out/cache/ast/9e9daab2a2aedc7b46d0de123776383eec9a305edfc8953914f51010ea0a5c3f.json
  - .opencode/skills/spectra-commit/SKILL.md
  - graphify-out/.graphify_ast.json
  - graphify-out/graph.html
  - .opencode/commands/spectra-ask.md
  - tools/realtime-voice/static/index.html
  - .github/skills/spectra-commit/SKILL.md
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-audit/SKILL.md
  - CLAUDE.md
  - .github/skills/spectra-ask/SKILL.md
  - design/fish-admin/canonical.png
  - docs/verification/2026-08-24-manual/desktop.png
  - graphify-out/cache/ast/d82e16a1073f2c938ec26b69236bb3b77157d84c80dd3c8945ed44a8157089c8.json
  - cases/README.md
  - tools/realtime-voice/static/voice-profile.html
  - assets/logo.jpg
  - graphify-out/cache/ast/8e51e2945c307e6abfb38dfcf7b1f8f28003051ddaa1a631d867b221ef1c481e.json
  - graphify-out/manifest.json
  - scripts/anson-sync.js
  - docs/superpowers/specs/2026-08-24-manual-website-design.md
  - .github/skills/spectra-propose/SKILL.md
  - .opencode/skills/spectra-debug/SKILL.md
  - graphify-out/GRAPH_REPORT.md
  - graphify-out/cache/ast/c0e1b529fb2165b3c815c446919e7667c216e584a443ef2f0f85a9c5b23061ed.json
  - README.md
  - graphify-out/cache/ast/e5d28e544fa8c2d2b2cfaab77a464b5b82078ffbde4d1669d7fb5d7fa74cdc40.json
  - .opencode/commands/spectra-apply.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/skills/spectra-apply/SKILL.md
  - .opencode/skills/spectra-propose/SKILL.md
  - AGENTS.md
  - tools/realtime-voice/static/realtime-workbench-demo.html
  - .opencode/skills/spectra-ask/SKILL.md
  - .github/skills/spectra-archive/SKILL.md
  - graphify-out/cache/ast/87d3321d15848bf0e3b033592cd562df18bfd8427d36f113d0aad42dca514624.json
  - graphify-out/cache/ast/dd7a6d2df2f937bab590dc84197d9f417b4856c0f5992c7f925172e010769b6a.json
  - dashboard/index.html
  - docs/WEBSITE-HANDOFF-2026-08-24.md
  - .github/prompts/spectra-propose.prompt.md
  - graphify-out/cache/ast/6071fcdce98524636c6abec309d4e828bcbaa811b8fab7226fc09189238d2ad3.json
  - .opencode/commands/spectra-commit.md
  - graphify-out/cache/ast/21f829fcb05a110167d4fdac8cb4edae0b0b8efffca1c7913932e6c7790896db.json
  - .opencode/skills/spectra-discuss/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - .opencode/commands/spectra-archive.md
  - docs/verification/2026-08-24-manual/mobile.png
  - graphify-out/.graphify_python
  - graphify-out/cache/ast/3ccf98217c678565078da4100cbbe5e00ad337e893f69fcc4f9189183df84137.json
  - GEMINI.md
  - graphify-out/cache/ast/59e1a6ba1a0cc9cd37f47c10e967f7c98b7cf58c344ba8bfc88d7ca9d86edd7c.json
  - graphify-out/cache/ast/dfdedd484bb5ebe3f69c923715a683a4585cc0d0e16bc8e40470728d9079b3f6.json
  - graphify-out/cache/ast/edfe4f960e85b45e9130638c3bff10c8428caf044e88e032208106f3c6a13e25.json
-->

---
### Requirement: 案件紀錄與產出物同步時不得靜默覆蓋

系統 SHALL 使用裝置與版本 metadata 表示會議紀錄及客戶專屬產出物，並在發現衝突時回報，不自動選擇勝出版本。

#### Scenario: 新會議紀錄可以同步

- **WHEN** 裝置在案件內寫入新的逐字稿、筆記或決策檔案
- **THEN** 檔案 SHALL 使用唯一的案件相對路徑，並包含或取得時間與裝置 metadata，讓另一臺裝置取得時不會替換其他紀錄

##### Example: 兩臺裝置各自新增逐字稿

- **GIVEN** desktop 建立 2026-08-25-desktop.md，laptop 建立 2026-08-25-laptop.md
- **WHEN** 外部同步工具完成同步
- **THEN** 兩份逐字稿 SHALL 同時保留

#### Scenario: 產出物版本可見

- **WHEN** 裝置建立 Demo、簡報、報價單或其他客戶專屬產出物
- **THEN** 案件 artifact manifest SHALL 記錄 artifact id、相對路徑、version、建立時間、device id、SHA-256、kind 與 promotionStatus

##### Example: 筆電產生第一版簡報

- **GIVEN** laptop 產生 proposal-v1.pptx
- **WHEN** 案件 manifest 更新
- **THEN** manifest SHALL 記錄 kind=presentation、version=1、deviceId=laptop 與對應 sha256

#### Scenario: 發現衝突

- **WHEN** 同一個 logical artifact 或紀錄出現兩個互不相容版本
- **THEN** 系統 SHALL 回報 caseStatus 為 conflict、列出每個衝突路徑，並保留兩個版本

##### Example: 桌機與筆電同時修改報價單

- **GIVEN** desktop 有 quote-v2，laptop 有另一個 quote-v2
- **WHEN** 同步檢查發現兩者內容不同
- **THEN** 兩個版本 SHALL 保留，結果 SHALL 為 conflict，不自動刪除任一版本


<!-- @trace
source: anson-workspace-sync-foundation
updated: 2026-08-25
code:
  - graphify-out/cache/ast/a30190143d640b7b0c46f383e661da7a425bd159007e101c0ad2dc472e48cdf6.json
  - graphify-out/graph.json
  - .opencode/commands/spectra-debug.md
  - .cursorrules
  - graphify-out/cache/ast/e2239ae4caf4905c834bb57d6e097064c17d952a9a5d2ee8775a0568619c4066.json
  - tests/test-anson-sync.js
  - .opencode/commands/spectra-ingest.md
  - .opencode/skills/spectra-archive/SKILL.md
  - graphify-out/.graphify_root
  - design/fish-admin/SURFACE.md
  - .github/prompts/spectra-ask.prompt.md
  - .opencode/skills/spectra-drift/SKILL.md
  - graphify-out/.graphify_state.json
  - graphify-out/cache/ast/f805a6aef02ad563f850999c531b0d64a58d2c4f85e0f01ae7aca51c8a3ba441.json
  - tools/realtime-voice/static/index-v2-dark.html
  - .github/prompts/spectra-archive.prompt.md
  - .opencode/commands/spectra-audit.md
  - tools/realtime-voice/static/realtime-workbench-c.css
  - .opencode/commands/spectra-drift.md
  - .github/prompts/spectra-debug.prompt.md
  - graphify-out/cache/ast/49acdd20ff4fa559d5020703b9c09692318bee494ed14845295292283548a498.json
  - tools/realtime-voice/server.py
  - .github/prompts/spectra-commit.prompt.md
  - .github/skills/spectra-apply/SKILL.md
  - graphify-out/cache/ast/e4b08962cb21f7aa56ef5737eae3cbc09d54bf02c5a69313ef8ed1c0cc00129f.json
  - .github/skills/spectra-audit/SKILL.md
  - .spectra.yaml
  - graphify-out/cache/ast/cb991f903340797afda3b7e4fba629adedcc6986430e0b5a0a6323dfb1992420.json
  - graphify-out/cache/ast/885fbf9e21d24ebb5ef3f0782c0a213db019e3391b3f56f14a021c22a9c9c245.json
  - .github/skills/spectra-ingest/SKILL.md
  - design/fish-admin/tokens.css
  - graphify-out/cache/ast/60d0bf76284f04e21c188fec1257fe4787ed7e515ddcda92da38fb575ece80b7.json
  - .github/prompts/spectra-drift.prompt.md
  - .github/prompts/spectra-apply.prompt.md
  - .github/skills/spectra-debug/SKILL.md
  - .github/prompts/spectra-audit.prompt.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .github/prompts/spectra-discuss.prompt.md
  - .opencode/commands/spectra-discuss.md
  - graphify-out/.graphify_detect.json
  - .github/skills/spectra-drift/SKILL.md
  - graphify-out/cache/ast/09c6c931050a185112cdcf9612c4c3372e16df7abba9f4ca21a29b90bb8225ba.json
  - graphify-out/cache/ast/9e9daab2a2aedc7b46d0de123776383eec9a305edfc8953914f51010ea0a5c3f.json
  - .opencode/skills/spectra-commit/SKILL.md
  - graphify-out/.graphify_ast.json
  - graphify-out/graph.html
  - .opencode/commands/spectra-ask.md
  - tools/realtime-voice/static/index.html
  - .github/skills/spectra-commit/SKILL.md
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-audit/SKILL.md
  - CLAUDE.md
  - .github/skills/spectra-ask/SKILL.md
  - design/fish-admin/canonical.png
  - docs/verification/2026-08-24-manual/desktop.png
  - graphify-out/cache/ast/d82e16a1073f2c938ec26b69236bb3b77157d84c80dd3c8945ed44a8157089c8.json
  - cases/README.md
  - tools/realtime-voice/static/voice-profile.html
  - assets/logo.jpg
  - graphify-out/cache/ast/8e51e2945c307e6abfb38dfcf7b1f8f28003051ddaa1a631d867b221ef1c481e.json
  - graphify-out/manifest.json
  - scripts/anson-sync.js
  - docs/superpowers/specs/2026-08-24-manual-website-design.md
  - .github/skills/spectra-propose/SKILL.md
  - .opencode/skills/spectra-debug/SKILL.md
  - graphify-out/GRAPH_REPORT.md
  - graphify-out/cache/ast/c0e1b529fb2165b3c815c446919e7667c216e584a443ef2f0f85a9c5b23061ed.json
  - README.md
  - graphify-out/cache/ast/e5d28e544fa8c2d2b2cfaab77a464b5b82078ffbde4d1669d7fb5d7fa74cdc40.json
  - .opencode/commands/spectra-apply.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/skills/spectra-apply/SKILL.md
  - .opencode/skills/spectra-propose/SKILL.md
  - AGENTS.md
  - tools/realtime-voice/static/realtime-workbench-demo.html
  - .opencode/skills/spectra-ask/SKILL.md
  - .github/skills/spectra-archive/SKILL.md
  - graphify-out/cache/ast/87d3321d15848bf0e3b033592cd562df18bfd8427d36f113d0aad42dca514624.json
  - graphify-out/cache/ast/dd7a6d2df2f937bab590dc84197d9f417b4856c0f5992c7f925172e010769b6a.json
  - dashboard/index.html
  - docs/WEBSITE-HANDOFF-2026-08-24.md
  - .github/prompts/spectra-propose.prompt.md
  - graphify-out/cache/ast/6071fcdce98524636c6abec309d4e828bcbaa811b8fab7226fc09189238d2ad3.json
  - .opencode/commands/spectra-commit.md
  - graphify-out/cache/ast/21f829fcb05a110167d4fdac8cb4edae0b0b8efffca1c7913932e6c7790896db.json
  - .opencode/skills/spectra-discuss/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - .opencode/commands/spectra-archive.md
  - docs/verification/2026-08-24-manual/mobile.png
  - graphify-out/.graphify_python
  - graphify-out/cache/ast/3ccf98217c678565078da4100cbbe5e00ad337e893f69fcc4f9189183df84137.json
  - GEMINI.md
  - graphify-out/cache/ast/59e1a6ba1a0cc9cd37f47c10e967f7c98b7cf58c344ba8bfc88d7ca9d86edd7c.json
  - graphify-out/cache/ast/dfdedd484bb5ebe3f69c923715a683a4585cc0d0e16bc8e40470728d9079b3f6.json
  - graphify-out/cache/ast/edfe4f960e85b45e9130638c3bff10c8428caf044e88e032208106f3c6a13e25.json
-->

---
### Requirement: 同步狀態可以被查詢

系統 SHALL 每次同步都寫入機器可讀的 status.json，並提供人類可讀的 status 命令。

#### Scenario: 同步成功時有完整狀態

- **WHEN** 一次同步在沒有阻擋錯誤的情況下完成
- **THEN** status.json SHALL 包含 schemaVersion=1、deviceId、時間、codeStatus、caseStatus、changedFiles、conflictFiles 與繁體中文 message

##### Example: 成功同步狀態

- **GIVEN** desktop 完成 code 與 case 同步
- **WHEN** 使用者執行 status 命令
- **THEN** 輸出 SHALL 顯示 codeStatus=up-to-date、caseStatus=ready、changedFiles=0、conflictFiles=[]

#### Scenario: 失敗狀態可以採取行動

- **WHEN** 同步因髒工作樹、遠端不可用、案件根目錄不可用或衝突而失敗
- **THEN** status 命令 SHALL 指出失敗邊界；同步未完成時 SHALL 回傳非零，且 SHALL 保留既有程式碼與案件檔案

##### Example: 遠端不可用

- **GIVEN** laptop 無法連到 GitHub
- **WHEN** 登入同步命令執行
- **THEN** codeStatus SHALL 為 error 或 unavailable，既有 local HEAD SHALL 保持不變，命令 SHALL 回傳非零

<!-- @trace
source: anson-workspace-sync-foundation
updated: 2026-08-25
code:
  - graphify-out/cache/ast/a30190143d640b7b0c46f383e661da7a425bd159007e101c0ad2dc472e48cdf6.json
  - graphify-out/graph.json
  - .opencode/commands/spectra-debug.md
  - .cursorrules
  - graphify-out/cache/ast/e2239ae4caf4905c834bb57d6e097064c17d952a9a5d2ee8775a0568619c4066.json
  - tests/test-anson-sync.js
  - .opencode/commands/spectra-ingest.md
  - .opencode/skills/spectra-archive/SKILL.md
  - graphify-out/.graphify_root
  - design/fish-admin/SURFACE.md
  - .github/prompts/spectra-ask.prompt.md
  - .opencode/skills/spectra-drift/SKILL.md
  - graphify-out/.graphify_state.json
  - graphify-out/cache/ast/f805a6aef02ad563f850999c531b0d64a58d2c4f85e0f01ae7aca51c8a3ba441.json
  - tools/realtime-voice/static/index-v2-dark.html
  - .github/prompts/spectra-archive.prompt.md
  - .opencode/commands/spectra-audit.md
  - tools/realtime-voice/static/realtime-workbench-c.css
  - .opencode/commands/spectra-drift.md
  - .github/prompts/spectra-debug.prompt.md
  - graphify-out/cache/ast/49acdd20ff4fa559d5020703b9c09692318bee494ed14845295292283548a498.json
  - tools/realtime-voice/server.py
  - .github/prompts/spectra-commit.prompt.md
  - .github/skills/spectra-apply/SKILL.md
  - graphify-out/cache/ast/e4b08962cb21f7aa56ef5737eae3cbc09d54bf02c5a69313ef8ed1c0cc00129f.json
  - .github/skills/spectra-audit/SKILL.md
  - .spectra.yaml
  - graphify-out/cache/ast/cb991f903340797afda3b7e4fba629adedcc6986430e0b5a0a6323dfb1992420.json
  - graphify-out/cache/ast/885fbf9e21d24ebb5ef3f0782c0a213db019e3391b3f56f14a021c22a9c9c245.json
  - .github/skills/spectra-ingest/SKILL.md
  - design/fish-admin/tokens.css
  - graphify-out/cache/ast/60d0bf76284f04e21c188fec1257fe4787ed7e515ddcda92da38fb575ece80b7.json
  - .github/prompts/spectra-drift.prompt.md
  - .github/prompts/spectra-apply.prompt.md
  - .github/skills/spectra-debug/SKILL.md
  - .github/prompts/spectra-audit.prompt.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .github/prompts/spectra-discuss.prompt.md
  - .opencode/commands/spectra-discuss.md
  - graphify-out/.graphify_detect.json
  - .github/skills/spectra-drift/SKILL.md
  - graphify-out/cache/ast/09c6c931050a185112cdcf9612c4c3372e16df7abba9f4ca21a29b90bb8225ba.json
  - graphify-out/cache/ast/9e9daab2a2aedc7b46d0de123776383eec9a305edfc8953914f51010ea0a5c3f.json
  - .opencode/skills/spectra-commit/SKILL.md
  - graphify-out/.graphify_ast.json
  - graphify-out/graph.html
  - .opencode/commands/spectra-ask.md
  - tools/realtime-voice/static/index.html
  - .github/skills/spectra-commit/SKILL.md
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-audit/SKILL.md
  - CLAUDE.md
  - .github/skills/spectra-ask/SKILL.md
  - design/fish-admin/canonical.png
  - docs/verification/2026-08-24-manual/desktop.png
  - graphify-out/cache/ast/d82e16a1073f2c938ec26b69236bb3b77157d84c80dd3c8945ed44a8157089c8.json
  - cases/README.md
  - tools/realtime-voice/static/voice-profile.html
  - assets/logo.jpg
  - graphify-out/cache/ast/8e51e2945c307e6abfb38dfcf7b1f8f28003051ddaa1a631d867b221ef1c481e.json
  - graphify-out/manifest.json
  - scripts/anson-sync.js
  - docs/superpowers/specs/2026-08-24-manual-website-design.md
  - .github/skills/spectra-propose/SKILL.md
  - .opencode/skills/spectra-debug/SKILL.md
  - graphify-out/GRAPH_REPORT.md
  - graphify-out/cache/ast/c0e1b529fb2165b3c815c446919e7667c216e584a443ef2f0f85a9c5b23061ed.json
  - README.md
  - graphify-out/cache/ast/e5d28e544fa8c2d2b2cfaab77a464b5b82078ffbde4d1669d7fb5d7fa74cdc40.json
  - .opencode/commands/spectra-apply.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/skills/spectra-apply/SKILL.md
  - .opencode/skills/spectra-propose/SKILL.md
  - AGENTS.md
  - tools/realtime-voice/static/realtime-workbench-demo.html
  - .opencode/skills/spectra-ask/SKILL.md
  - .github/skills/spectra-archive/SKILL.md
  - graphify-out/cache/ast/87d3321d15848bf0e3b033592cd562df18bfd8427d36f113d0aad42dca514624.json
  - graphify-out/cache/ast/dd7a6d2df2f937bab590dc84197d9f417b4856c0f5992c7f925172e010769b6a.json
  - dashboard/index.html
  - docs/WEBSITE-HANDOFF-2026-08-24.md
  - .github/prompts/spectra-propose.prompt.md
  - graphify-out/cache/ast/6071fcdce98524636c6abec309d4e828bcbaa811b8fab7226fc09189238d2ad3.json
  - .opencode/commands/spectra-commit.md
  - graphify-out/cache/ast/21f829fcb05a110167d4fdac8cb4edae0b0b8efffca1c7913932e6c7790896db.json
  - .opencode/skills/spectra-discuss/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - .opencode/commands/spectra-archive.md
  - docs/verification/2026-08-24-manual/mobile.png
  - graphify-out/.graphify_python
  - graphify-out/cache/ast/3ccf98217c678565078da4100cbbe5e00ad337e893f69fcc4f9189183df84137.json
  - GEMINI.md
  - graphify-out/cache/ast/59e1a6ba1a0cc9cd37f47c10e967f7c98b7cf58c344ba8bfc88d7ca9d86edd7c.json
  - graphify-out/cache/ast/dfdedd484bb5ebe3f69c923715a683a4585cc0d0e16bc8e40470728d9079b3f6.json
  - graphify-out/cache/ast/edfe4f960e85b45e9130638c3bff10c8428caf044e88e032208106f3c6a13e25.json
-->