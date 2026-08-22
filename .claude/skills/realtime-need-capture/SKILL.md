---
name: realtime-need-capture
description: "業務員跟客戶對談進行中，即時語音轉文字並即時拆解需求（人群/場景/痛點/需求/解決方案，或服務型任務的 4×4＝12 格拆解），產出可交給報價流程的確認資料包。只在對談進行的當下運作，人啟動才動，不是背景常駐服務。"
user-invocable: true
---

# Realtime Need Capture（即時需求拆解）

一句話定位：對談當下就把需求拆出來，不用等談完才回頭整理逐字稿。

## 觸發時機

- 業務員跟客戶對談進行中，人主動啟動這個 skill
- 對談結束、需求已初步拆解，準備交給 `demo-generation-deploy` 或報價流程時作為輸入來源

## 即時語音轉文字

- **已實作、可直接用的輸入來源**：`tools/realtime-voice/` 是本機收音＋辨識服務（FunASR SenseVoiceSmall，完全本機跑，簡轉繁後輸出）。業務員對談時啟動它，講話同時逐字稿會持續寫進 `tools/realtime-voice/output/<session-id>.md`。這個 skill 被觸發時，若使用者提供或指向這個路徑下的檔案，直接把它當作即時逐字稿讀取即可，不用再手動貼文字。
- 信心度低於門檻的片段，`tools/realtime-voice` 會標「[聽不清楚]」，不能靜默填入猜測文字，這個 skill 讀到時也要原樣保留這個標記，不能自己腦補內容
- 舊規劃（Cloudflare Workers AI Whisper／ElevenLabs Scribe v2 Realtime 雲端串流）尚未實作，目前以 `tools/realtime-voice` 的本機方案為準；若未來需要雲端方案再另外評估

## 即時拆解

- 一般任務：拆成人群/場景/痛點/需求/解決方案五類，五個欄位每次都要填，真的問不出來就標「待確認」，不能留空
- 服務型任務：改用服務前/中/後 × 4 個檢查點的 4×4＝12 格拆解法
- 每個拆解項目標三態：「已確認/待確認/我猜的」（沿用案神既有 project-manager 的標記慣例），「我猜的」項目不能被系統自動升級成「已確認」

## 輸出格式

產出「即時需求拆解資料包」，欄位比照案神既有 PM-to-Quote Data Pack 擴充：

- 新增 `capture_mode`（`realtime` / `post-hoc`）
- 新增 `decomposition`（人群/場景/痛點/需求/解決方案 或 12 格陣列）

這份資料包會被 `commercial-proposal-quotation-specialist` 讀取，既有報價邏輯不受影響地繼續運作。

## 不是什麼

不是常駐系統，不背景一直跑。只在人啟動對談的當下運作，對談結束這個 skill 的任務就結束，不留任何排程。
