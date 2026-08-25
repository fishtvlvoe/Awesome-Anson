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

## 兩臺電腦的案件資料

真實案件資料放在 Git repo 外部的加密案件根目錄，例如 `~/Anson-private-cases`。桌機與筆電各自設定一個本機路徑，由外部加密同步工具負責同步；案神透過 `caseRoot` 讀取它。

案件根目錄不可用時，Anson Sync 只回報 `unavailable`，不會建立空資料夾、刪除既有案件或把客戶資料搬進 Git。

會議逐字稿與決策紀錄採新增檔案；Demo、簡報、報價單採版本檔案並寫入 `.anson-sync/artifacts.json`。如果兩臺電腦產生同一案件、同一產出物版本但內容不同，狀態會是 `conflict`，兩份檔案都保留，必須人工決定。

可重用的匿名模板才放回 private GitHub repo。客戶資料要標記為已確認，才可以進入後續人工審核的可重用內容；案神不會自動把客戶談話升級成永久知識。
