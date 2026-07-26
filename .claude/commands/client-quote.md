# /client-quote

## 目的

以一個入口串接 Project Manager Agent 與 Commercial Proposal & Quotation Specialist，讓使用者不需要重複說明同一案件背景。

## 輸入

`$ARGUMENTS` 可以是案件資料夾、逐字稿路徑或已存在的 PM-to-Quote Data Pack。

## 執行順序

1. 確認輸入路徑與案件資料夾。
2. 執行 `project-manager` 身份的需求分析流程。
3. 複雜案件先執行 `grill-with-docs`，並等待使用者確認。
4. 產出並保存 PM-to-Quote Data Pack。
5. 等使用者確認 FRD 與資料包後，執行 `commercial-proposal-quotation-specialist`。
6. 等使用者確認正式價格與 HTML 初稿後，輸出 PDF。
7. 執行內容、金額、PDF 視覺與 Git 驗證。

## 重要限制

不可因為使用者只輸入一次路徑，就跳過 PM 確認、價格確認或 PDF 初稿確認。找不到案件資料或依賴 Skill 時，停止並明確回報。
