---
name: kuson-knowledge-query
description: "查詢庫神（Awesome-Kuson）的決策心智模型知識庫，找框架佐證業主真實意圖、痛點、風險判斷。project-manager 分析客戶需求、commercial-proposal-quotation-specialist 評估案件風險時使用，不是每次都查，判斷卡住、需要框架佐證時才查。"
user-invocable: false
---

# 查庫神知識庫（決策心智模型）

一句話定位：庫神管的是「人怎麼做決策、為什麼買單」的心智模型與 Fish 自己的接案判斷工具，判斷客戶真假需求、評估風險卡住時來查，不是憑空分析。

## 範圍

只查 `~/Development/Awesome-Kuson/` 底下這六個資料夾（阿金創業大課、顧問小課、事前驗屍法、客戶分析表、SWOT、跨學科理論、人際覺察技巧等，約 270 個檔案）：
`決策心智模型/`、`阿金框架/`、`顧問工具箱/`、`通用MBA工具箱/`、`跨學科底層知識庫/`、`人際覺察與同理框架/`

`個人資料庫/`、`待分類/`、`截圖待OCR/` 是 Fish 個人資料、AI 技術筆記，跟接案判斷無關，技術上不在這份查詢範圍裡（見下方查詢用的圖檔）。

## 查詢步驟（照順序執行，不要跳步）

1. **先 `git pull`**：庫神持續往這個 repo 加新資料，避免用到舊內容。

   ```bash
   cd ~/Development/Awesome-Kuson && git pull -q
   ```

2. **用 `graphify query` 快篩**：吃的是關鍵字／概念名稱，不是完整問句。抓案件裡的關鍵字去查，例如客戶案件出現「痛點」「風險評估」「真假需求」這類線索：

   ```bash
   graphify query "<關鍵字>" --graph 案神知識庫.graph.json      # ✅ 關鍵字，會找到相關節點
   graphify query "怎麼判斷是真需求" --graph 案神知識庫.graph.json  # ❌ 整句問句，查不到
   ```

   不確定關鍵字，先用 `graphify explain "<概念>" --graph 案神知識庫.graph.json`，或看 `決策心智模型/graphify-out/GRAPH_REPORT.md`、`阿金框架/graphify-out/GRAPH_REPORT.md` 等各資料夾自己的報告列出的實際節點名稱。

3. **查無結果不代表沒有相關內容，改用 grep + 自己讀**：`graphify query` 只是機械式比對節點標題文字，不是語意理解，概念換個說法就查不到很正常。這個知識庫量小（約 80 個檔案），查無結果時：

   ```bash
   grep -rli "<概念相關字詞>" 決策心智模型/ 阿金框架/ 顧問工具箱/ 通用MBA工具箱/ 跨學科底層知識庫/ 人際覺察與同理框架/ --include="*.md"
   ```

   抓到候選檔名後用 Read 工具讀內容，**用自己的語意理解判斷是否相關、怎麼引用**——真正做判斷的是你自己（LLM），graphify 只是輔助快篩的機械工具，不是最終答案。查無結果不能就此說「知識庫沒有」。

## 維護

`案神知識庫.graph.json` 是靜態合併檔（`決策心智模型/`、`阿金框架/`、`顧問工具箱/`、`通用MBA工具箱/`、`跨學科底層知識庫/`、`人際覺察與同理框架/` 六份圖合併而成），庫神那邊新增內容不會自動更新這份合併檔。查詢結果感覺過舊，重新合併：

```bash
graphify merge-graphs 決策心智模型/graphify-out/graph.json 阿金框架/graphify-out/graph.json 顧問工具箱/graphify-out/graph.json 通用MBA工具箱/graphify-out/graph.json 跨學科底層知識庫/graphify-out/graph.json 人際覺察與同理框架/graphify-out/graph.json --out 案神知識庫.graph.json
```
