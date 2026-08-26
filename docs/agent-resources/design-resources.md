# 案神設計四人組的資源定位

這份文件是四個設計 Agent 共用的資源定位規則。Agent 先找可用的本機資源，再開始設計；找不到時要回報缺少，不可捏造已讀取的案例、套件或分析結果。

## 四個 Agent

- `網頁設計師`：唯一入口，負責需求、整合與 HTML mockup。
- `案例設計師`：從 SaaSFrame 找真實案例，讀完整截圖並做個案分析。
- `風格設計師`：從 VibePrompts 找 pattern，深挖 HTML 與風格規則。
- `前端設計師`：把確認過的風格與案例落成可跑的 HTML／React。

## 資源尋找順序

優先使用環境變數，其次使用 repo 鄰近目錄，再使用使用者家目錄下的開發資料夾：

| 資源 | 環境變數 | repo 鄰近路徑 | 家目錄備援路徑 |
|---|---|---|---|
| VibePrompts | `ANSON_VIBEPROMPTS_ROOT` | `../vibeprompts`、`vendor/vibeprompts` | `~/Development/vibeprompts` |
| SaaSFrame | `ANSON_SAASFRAME_ROOT` | `../saasframe`、`vendor/saasframe` | `~/Development/saasframe` |
| Tabler | `ANSON_TABLER_ROOT` | `../ade/docs/reference/tabler`、`vendor/tabler` | `~/Development/ade/docs/reference/tabler` |
| UIUX Pro Max | `ANSON_UIUX_PRO_MAX_ROOT` | `vendor/ui-ux-pro-max-skill` | `~/.claude/plugins`、`~/.codex/plugins` |

`repo` 指目前案神 checkout 根目錄。用 `rg --files` 找實際的 `INDEX.json`、`search.py`、`package.json` 或元件檔，不依賴桌機的固定絕對路徑。

## 邊界

- 這些資源是設計參考，不是客戶案件資料。
- 真實逐字稿、報價、會議紀錄與 Demo 仍放在外部案件庫，不進 Git。
- Tabler 只借功能骨架；品牌配色、字體與內容依本案設計決策，不照抄 Tabler 品牌。
- UIUX Pro Max 的輸出是建議，不是自動確認的品牌決策。
