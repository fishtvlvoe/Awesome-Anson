# Quote Data Pack 模板

複製此模板到案件的工作目錄，填完後才進入正式拆價。未確認欄位保留 `pending`，不要用猜測補成正式內容。

```yaml
project_name: ""
client_profile:
  company: ""
  contact: ""
  email: ""
issuer_profile:
  company: ""
  contact: ""
document:
  quote_date: ""
  valid_until: ""
  quote_number: ""
business_goal: ""
users_and_decision_makers: []
confirmed_scope: []
non_goals: []
third_party_integrations: []
deployment_responsibility: ""
commercial_model: ""
pricing:
  required: []
  optional: []
  add_ons: []
  confirmed_total: null
timeline: ""
payment_terms: ""
warranty_and_support: ""
security_and_data_responsibility: ""
assumptions_exclusions: []
confirmed_decisions: []
open_questions: []
evidence_sources: []
```

每個價格列建議使用：`name`、`scope`、`amount`、`status`、`notes`。`amount` 為 `null` 時禁止進入正式總價。
