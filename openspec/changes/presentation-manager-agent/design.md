# Design

## Agent 邊界

```text
輸入資料
  ↓
簡報管理師：判斷 Path、逐題補齊、整理中繼 Markdown
  ↓ 使用者確認
kimi-slide：依模板產出 Kimi PPT 提詞
  ↓
六要素與頁數檢查
```

簡報管理師只負責簡報需求與提詞交付，不負責呼叫 Kimi 或操作外部服務。

## 確認閘門

1. Path A／Path B 與詳細規格版判斷。
2. 中繼 Markdown。
3. Kimi 提詞品質檢查。

## 可逆性

Agent 定義與入口均為文字文件；未來若要加入 HTML／PDF，新增獨立 Skill 與驗證流程，不修改目前 Kimi 提詞的範圍界線。
