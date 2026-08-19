## 1. Agent 規格

- [x] 1.1 在正式 Agent 定義加入輸出路徑確認，對應 Requirement: The production route SHALL be selected after intermediate confirmation。
- [x] 1.2 明確區分 Kimi 提詞與 `ppt-master` 製作交接包。
- [x] 1.3 保留中繼 Markdown 作為兩條路徑的唯一內容來源，對應 Requirement: Both output routes SHALL use the same confirmed source。

## 2. 入口與文件

- [x] 2.1 更新 `/presentation-manager` 入口。
- [x] 2.2 更新 Agent README 與既有規格。

## 3. 驗證

- [x] 3.1 執行 presentation-manager targeted smoke test。
- [x] 3.2 執行 Spectra analyze／validate 與 diff check。
