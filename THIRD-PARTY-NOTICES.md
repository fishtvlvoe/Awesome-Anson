# 第三方 Skill 授權聲明

`.claude/skills/` 底下多數 Skill 是本 repo 自己寫的（`pm-discovery-upgrade`、`engagement-quote`、`kimi-slide`）。以下 4 個是從公開 repo 原樣搬入，附上出處與授權：

| Skill | 來源 | 授權 |
|---|---|---|
| `grill-with-docs` | [mattpocock/skills](https://github.com/mattpocock/skills)（`skills/engineering/grill-with-docs`） | MIT |
| `grilling` | [mattpocock/skills](https://github.com/mattpocock/skills)（`skills/productivity/grilling`） | MIT |
| `domain-modeling` | [mattpocock/skills](https://github.com/mattpocock/skills)（`skills/engineering/domain-modeling`） | MIT |
| `im-human` | [chang416/im-human](https://github.com/chang416/im-human) | MIT |
| `ppt-master` | [hugohe3/ppt-master](https://github.com/hugohe3/ppt-master)（只搬 `skills/ppt-master/` 這個 Claude Code Skill 部分，不含 `projects/`；原 repo 完整版含大量範例，1.5GB） | MIT |

修改這 5 個資料夾內容前，先確認上游有沒有更新版本。

`ppt-master` 本身是 Python 工具，需要另外跑 `pip install -r .claude/skills/ppt-master/requirements.txt` 才能用；圖片生成、語音旁白等進階功能需要在 `.env` 填自己的 API Key（範例見 `.claude/skills/ppt-master/.env.example`），純文字轉 PPTX 的基本功能不需要 Key。
