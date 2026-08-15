# 簡報管理師 → ppt-master 交接包契約

## 用途

這是簡報管理師（presentation-manager）在使用者選擇「本機 ppt-master 路徑」時，交給 ppt-master 執行環境的唯一交接格式。交接包本身不是簡報檔，只是讓 ppt-master 能在不重新詢問使用者的情況下完成製作的結構化輸入。

## 交接包結構

| 區塊 | 內容 |
|---|---|
| `content` | 已確認的簡報中繼 Markdown，是交接包**唯一內容來源**。禁止從原始輸入（逐字稿、文案、PRD 等）另起爐灶重新推導內容。 |
| `metadata` | 受眾（audience）、頁數（page_count）、風格（style）、語氣（tone）、色碼（color_codes，若有）、字體（fonts，若有）。 |
| `production_guidance` | ppt-master repo 位置、路由參考、建議 route、是否可覆寫。 |

### `production_guidance` 必要欄位

- `repo_path`：`/Users/fishtv/Development/ppt-master`
- `routing_reference`：`skills/ppt-master/workflows/routing.md`
- `suggested_route`：簡報管理師依中繼 Markdown 內容與 metadata 建議的 route（例如 Generate PPTX／Beautify／Quick），須附一句理由
- `user_override`：`true`，使用者可在 ppt-master 執行環境中覆寫建議 route，簡報管理師不強制鎖定

## 責任邊界

### presentation-manager 負責

- 整理需求、逐題補齊必要欄位
- 產出已確認的中繼 Markdown
- 執行「輸出路徑選擇」確認閘門
- 組裝並交付本交接包（`content` + `metadata` + `production_guidance`）

### presentation-manager 不負責

- 不執行 ppt-master
- 不產出 `.pptx` 檔案
- 不宣稱 `.pptx` 檔案已存在或已完成

交接包產出後，簡報管理師的任務即結束；後續製作與驗證由執行環境負責。

### ppt-master 執行環境負責

- 接收交接包並依 `production_guidance` 選定或沿用建議 route
- 執行 ppt-master 對應 Skill／流程，實際產出 `.pptx`
- 依「檔案驗證契約」驗證產出結果，驗證失敗不得回報完成

## 檔案驗證契約

完成證據至少要同時滿足「檔案存在且非空」與「內容可被簡報檢查器讀取」兩個條件：

1. `.pptx` 檔案存在且檔案大小 `> 0 bytes`
2. 優先使用 ppt-master 的正式 delivery checker：
   ```bash
   python3 /Users/fishtv/Development/ppt-master/skills/ppt-master/scripts/pptx_delivery_check.py file.pptx
   ```
   該指令必須以 exit code 0 完成；若執行環境沒有 ppt-master，再使用以下 `python-pptx` 可讀性檢查：
   ```bash
   python3 -c "from pptx import Presentation; Presentation('file.pptx')"
   ```
3. 若 ppt-master 產出正式 postflight report，必須一併保留 report 路徑與 `passed`／`passed-with-warnings` 狀態；只有檔案存在不能宣稱交付完成

此驗證**由 ppt-master 執行環境負責執行**。presentation-manager 只在交接包中寫明驗證方式，不執行驗證，也不代為宣告驗證結果。

## 交接包範例（YAML 格式）

```yaml
content: |
  # 簡報標題

  ## 第 1 頁：封面
  - 標題：範例提案簡報
  - 副標：2026 Q3 產品說明

  ## 第 2 頁：問題陳述
  - 要點一：現況痛點
  - 要點二：市場缺口

  ## 第 3 頁：解決方案
  - 要點一：核心功能
  - 要點二：差異化優勢

metadata:
  audience: "B2B 潛在客戶，非技術背景"
  page_count: 12
  style: "商務簡潔"
  tone: "專業、直接"
  color_codes:
    primary: "#1A2B4C"
    accent: "#FF6B35"
  fonts:
    heading: "Noto Sans TC Bold"
    body: "Noto Sans TC Regular"

production_guidance:
  repo_path: "/Users/fishtv/Development/ppt-master"
  routing_reference: "skills/ppt-master/workflows/routing.md"
  suggested_route: "Generate PPTX"
  suggested_route_reason: "全新逐頁結構，無現成範本可套用，需完整生成"
  user_override: true

verification:
  method: "ppt-master delivery checker"
  command: "python3 /Users/fishtv/Development/ppt-master/skills/ppt-master/scripts/pptx_delivery_check.py file.pptx"
  fallback: "python3 -c \"from pptx import Presentation; Presentation('file.pptx')\""
  postflight: "保留 ppt-master validation/<output_stem>.report.json 與 passed 狀態"
  responsible_party: "ppt-master 執行環境"
```
