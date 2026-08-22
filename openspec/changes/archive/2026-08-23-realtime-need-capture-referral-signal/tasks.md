## 1. Optional referral-signal field(Optional referral-signal field)

- [x] 1.1 在 `.claude/skills/realtime-need-capture/SKILL.md` 的「即時拆解」段落新增第六格「引薦/轉介機會」規則：只在逐字稿出現對應訊號時才填寫，沒訊號不出現這格，沿用既有三態標記；驗證：內容包含「沒有訊號就不出現這個欄位」對應措辭，且明確標註跟既有五分類「真的問不出來就標待確認」的差異
- [x] 1.2 新增「我猜的引薦訊號不能自動升級成已確認」規則，沿用既有「我猜的項目不能被系統自動升級成已確認」慣例；驗證：內容包含對應措辭，跟既有「Every decomposed item carries a confirmation status」規則寫法一致，沒有重複定義

## 2. 一致性驗證

- [x] 2.1 通讀修改後的 SKILL.md，確認新增的第六格規則沒有跟既有五分類「每次都要填」的規則互相矛盾；驗證：列出核對結果
- [x] 2.2 `spectra validate "realtime-need-capture-referral-signal"` 通過；驗證：指令實跑輸出
