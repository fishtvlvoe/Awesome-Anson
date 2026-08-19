# 新增簡報管理師 Agent

## Why

目前 Agent 系統已能完成需求分析與報價，但報價單、PRD、課程內容等資料仍缺少一致的簡報整理入口。需要一個可與 PM、報價 Agent 並列的簡報管理師，將內容整理成逐頁結構與 Kimi PPT 提詞。

## Scope

- 新增 `presentation-manager` Agent。
- 使用既有全域 `kimi-slide` Skill，不複製 Skill 內容。
- 新增 `/presentation-manager` 專案入口。
- 在 Agent repo 的驗證腳本加入簡報管理師檢查。
- 不新增 Kimi API、自動貼上或未驗證的 HTML／PDF 產出能力。
