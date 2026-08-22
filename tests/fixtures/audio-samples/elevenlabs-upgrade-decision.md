# ElevenLabs 升級路徑判斷（Task 3.2）

## 判斷依據

3.1 實測：Cloudflare Workers AI Whisper（`@cf/openai/whisper-large-v3-turbo`），13 秒語音片段，5 次測試平均延遲 2.81 秒，逐字稿經 Fish 人工核對內容正確。

延遲約為片段長度的 22%，在對談進行中足以做到「講完馬上有文字」，符合 `realtime-need-capture` 即時拆解的需求，不是「錄完再轉」的等級。

## 結論

**不升級 ElevenLabs Scribe v2 Realtime。** Whisper 起手方案延遲可接受，且帳號已現成可用、幾乎免費，沒有理由換成需要額外串接、目前也沒有實測數據的付費方案。

## 保留升級路徑

若之後實際使用中發現延遲不夠（例如對談節奏很快、句子重疊），`bni`/`摩托斯MOLTOS` 專案已有 ElevenLabs Scribe v2 Realtime 帳號可以隨時接上，不需要重新申請。
