# PM-to-Quote Data Pack

## 用途

這是 Project Manager Agent 交給 Commercial Proposal & Quotation Specialist 的唯一交接格式，避免兩個 Agent 重新詢問相同背景。

## 必要欄位

| 類別 | 欄位 |
|---|---|
| 專案 | project_name、business_goal、users、success_criteria、non_goals |
| 範圍 | required_scope、optional_scope、unknown_scope、third_party_integrations |
| 責任 | hosting、domain、email、payment、video、deployment、security、data |
| 商務 | commercial_model、timeline、acceptance、payment_preferences、warranty |
| 決策 | confirmed_decisions、open_questions、evidence_sources |

## 狀態規則

每個欄位都必須標記：

- `confirmed`：使用者或可靠文件已確認。
- `pending`：已提出但尚未確認。
- `inferred`：代理推測，只能作為草稿提示。

`pending` 或 `inferred` 的價格影響範圍、授權邊界、交付責任與付款條件，不得直接成為正式報價承諾。

## 交接停止點

PM Agent 必須在資料包完成後停下來，讓使用者確認；報價 Agent 不得默認資料包內容就是正式商務條件。
