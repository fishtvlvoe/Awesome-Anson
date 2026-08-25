## Why

即時語音接案神目前只給本機／區網網址，這對「拿到案神的其他使用者」是一道過不去的門檻：

- 手機瀏覽器對非 `localhost` 的 http 來源會直接擋掉麥克風權限，所以手機收音一定要 HTTPS
- 之前用自簽憑證解決，但每次連線都跳「不安全」警告，使用者要自己點「進階→繼續前往」，體驗差且看起來像有問題
- 要讓憑證被信任，得綁自己的網域＋Cloudflare 帳號設定，這是一般使用者不會做、也不該被要求做的事

結果是：這個工具只有設定過環境的人能順利用手機收音，別人下載下來會卡在網址跟憑證這關。

## What Changes

- `tools/realtime-voice/server.py` 啟動時，自動附帶啟動一個 Cloudflare Quick Tunnel（`cloudflared tunnel --url http://localhost:<port>`），取得一組 `https://<隨機字串>.trycloudflare.com` 公開網址
- 伺服器本身改回單純 HTTP（移除自簽憑證邏輯），HTTPS 由 Cloudflare 那端提供，憑證是瀏覽器信任的正式憑證，不會有任何安全警告
- 啟動訊息只印**一組**網址（那組 trycloudflare 網址），電腦跟手機都用同一個，不分「本機用這個、手機用那個」，避免使用者搞混
- Quick Tunnel 不需要 Cloudflare 帳號、不需要自有網域、不需要任何前置設定，任何人裝好依賴跑起來就能用
- 服務關閉（Ctrl+C）時一併關掉 tunnel 子行程，不留背景殘留
- `cloudflared` 沒安裝時要明確告知怎麼裝，並退回只能本機 `localhost` 使用，不能讓整個服務啟動失敗

## Non-Goals

- **不提供第二條路徑讓使用者選**：不做「要不要開 tunnel」的選項或旗標。使用者選擇困難本身就是要解決的問題，一條路走到底
- 不使用具名 tunnel（named tunnel）或自有網域固定網址：那需要 Cloudflare 帳號與網域設定，是特定使用者的個人進階設定，不進通用流程
- 不改動辨識、簡轉繁、寫檔、即時分析等既有邏輯

## Capabilities

### New Capabilities

- `realtime-voice-public-https-url`: 收音服務啟動時自動取得一組免設定、憑證受信任的公開 HTTPS 網址，電腦與手機共用同一個網址，關閉服務時一併收掉

### Modified Capabilities

- `realtime-voice-transcription`: 存取方式從「本機 http／區網自簽憑證 https」改為「單一公開 HTTPS 網址」，原本已封存的「手機透過區網 IP 連線」驗收方式不再適用

## Impact

- 修改：`tools/realtime-voice/server.py`（移除自簽憑證邏輯、新增 tunnel 啟動與收尾、改寫啟動訊息）
- 修改：`tools/realtime-voice/README.md`（安裝需求新增 `cloudflared`、更新使用說明、明載隱私取捨）
- 新增依賴：`cloudflared`（Cloudflare 官方跨平台單一執行檔，Mac/Windows/Linux 皆有）
- **隱私影響（必須在 README 明載）**：走 tunnel 代表音訊與逐字稿會經過 Cloudflare 的伺服器，TLS 在 Cloudflare 端終止，技術上 Cloudflare 可見內容。這與本專案原本「完全本機、不上雲端」的設計原則有落差，是為了讓一般使用者能開箱即用而做的取捨，不能默默帶過
- 不影響：`tools/realtime-voice/monitor_transcript.py`、即時分析端點與前端顯示邏輯
