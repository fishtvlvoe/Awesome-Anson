# Anson-to-Quotemaster Command

## 用途

案神（Awesome-Anson）確認報價後，交給「報價師」（quote-master）獨立專案的唯一指令格式。這份文件只定義案神「送出什麼」，不定義報價師「怎麼處理」——報價師收到指令後內部要跑什麼機制，完全是報價師專案自己的範圍，不寫在這裡。

## 欄位形狀

| 欄位 | 型別 | 說明 | 範例值 |
|---|---|---|---|
| `client_id` | string | 客戶識別碼，唯一值 | `"client-a3f9"` |
| `confirmed_price` | number | 已確認的案件金額，單位新台幣，僅接受整數 | `128000` |
| `terms` | object | 條款摘要，欄位固定為 `payment_schedule`（string）與 `delivery_scope`（string） | `{ "payment_schedule": "訂金 50%／驗收 50%", "delivery_scope": "首頁＋兩個子頁" }` |
| `case_ref` | string | 案件識別碼，報價師要用這個值對應到同一個客戶 | `"case-2026-0822-01"` |

## 狀態規則

指令內容一律是「已確認」狀態才送出，不帶 `pending`／`inferred` 這類草稿標記——案神呼叫這份指令前，`confirmed_price` 跟 `terms` 都必須已經是使用者確認過的正式內容，不是代理推測值。

## 範圍邊界

- 這份文件只定義資料形狀，不含任何案神或報價師的業務邏輯
- 不含動態調整、時效性提醒、催辦通知這類機制——那些屬於報價師專案自己的功能範圍
- 案神不需要知道報價師收到指令後內部怎麼運作
