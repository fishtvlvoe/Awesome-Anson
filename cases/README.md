# 案件資料夾

每個案件使用一個獨立資料夾，例如：

```text
cases/<client-slug>/
├── client-profile.yaml
├── project-brief.md
├── CONTEXT.md
├── docs/adr/
├── pm-to-quote.yaml
├── quote-review.md
└── deliverables/
```

案件資料是跨對話與跨 Agent 的 SSOT。真實客戶資料只放在私有案件資料夾，不要提交到公開或共享的 Agent repository。

禁止保存：API key、密碼、付款憑證、私鑰、未授權個資與第三方登入 token。
