# Graph Report - /Users/fishtv/Development/Awesome-Anson  (2026-08-24)

## Corpus Check
- 125 files · ~218,286 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 141 nodes · 190 edges · 10 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]

## God Nodes (most connected - your core abstractions)
1. `assert()` - 11 edges
2. `monitor()` - 8 edges
3. `run_trigger_analysis()` - 7 edges
4. `assertFileExists()` - 7 edges
5. `main()` - 6 edges
6. `read_entries()` - 6 edges
7. `main()` - 6 edges
8. `write_analysis_result()` - 5 edges
9. `invoke_agent()` - 4 edges
10. `generateMediaBlock()` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (10 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (24): assert(), assertFileExists(), AssertionError, { assertFileExists, assert }, content, fs, { assertFileExists, assert }, fs (+16 more)

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (23): analysis_output_path(), build_analysis_prompt(), build_parser(), invoke_agent(), load_skill_text(), main(), monitor(), now_utc() (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (19): analysis_output_path(), append_transcript_line(), build_app(), get_lan_ip(), handle_analysis(), handle_stream(), load_converter(), load_model() (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (15): deployWithErrorHandling(), REQUIRED_FIELDS, activeDeployments, getActiveDeploymentUrl(), registerDeploymentState(), assertEqual(), activeUrl, { assertEqual } (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.31
Nodes (7): callFalAi(), failureNotice(), generateMediaBlock(), REQUIRED_FIELDS, { assert }, { generateMediaBlock }, mediaRequest

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (6): generateServiceIntegrationTemplate(), KNOWN_TEMPLATES, { assert }, { generateServiceIntegrationTemplate }, output, requirement

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (6): { execSync }, fs, path, result, testFiles, testPath

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (5): analyzeDeploymentRequirements(), { analyzeDeploymentRequirements }, { assert }, dataPackage, deploymentPlan

### Community 8 - "Community 8"
Cohesion: 0.33
Nodes (5): { execFileSync }, output, path, PYTHON, SERVER_MODULE_DIR

### Community 9 - "Community 9"
Cohesion: 0.4
Nodes (4): { execFileSync }, output, path, PYTHON

## Knowledge Gaps
- **74 isolated node(s):** `即時語音接案神：本機收音介面 + FunASR 辨識 + 簡轉繁 + 寫入案神可讀的逐字稿檔案。  啟動：venv/bin/python server.py 關`, `載入 FunASR SenseVoiceSmall 模型；失敗就印出真正原因並結束進程，不啟動一個沒有辨識能力的伺服器。`, `取得區域網路 IP，讓手機瀏覽器可以連到同一個服務。`, `瀏覽器送來的是 webm/opus 音訊，FunASR 吃得懂的是 wav。用本機已有的 ffmpeg 轉檔，不重造輪子。`, `把一段音訊轉成繁體文字。音訊太短/太安靜/辨識信心太低時標記 [聽不清楚]，不能靜默丟棄或亂猜。` (+69 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `assert()` connect `Community 0` to `Community 3`, `Community 4`, `Community 5`, `Community 7`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **What connects `即時語音接案神：本機收音介面 + FunASR 辨識 + 簡轉繁 + 寫入案神可讀的逐字稿檔案。  啟動：venv/bin/python server.py 關`, `載入 FunASR SenseVoiceSmall 模型；失敗就印出真正原因並結束進程，不啟動一個沒有辨識能力的伺服器。`, `取得區域網路 IP，讓手機瀏覽器可以連到同一個服務。` to the rest of the system?**
  _74 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._