# realtime-voice-transcription Specification

## Purpose

TBD - created by archiving change 'realtime-voice-transcription'. Update Purpose after archive.

## Requirements

### Requirement: Local push-to-record web interface
The system SHALL provide a locally-hosted web page reachable from both a desktop browser and a phone browser on the same local network, with a single start/stop control to begin and end microphone capture. The page SHALL display only recording controls, microphone permission/recording status, the live transcript, and an advisor connection status indicator ("顧問已連線／未連線"); it SHALL NOT display a multi-column analysis panel, an advisor chat panel, or any hard-coded canned AI reply.

#### Scenario: Operator starts a recording session
- **WHEN** the operator opens the local page and presses "Start"
- **THEN** the browser SHALL request microphone permission and, once granted, begin streaming audio to the local server

#### Scenario: Microphone permission denied
- **WHEN** the operator denies the browser's microphone permission prompt
- **THEN** the page SHALL display an explicit message stating that microphone permission is required to start recording, and SHALL NOT show a blank or silent state

#### Scenario: Phone browser as microphone source
- **WHEN** a phone on the same Wi-Fi network opens the local server's LAN address in its browser
- **THEN** the phone SHALL be able to start and stop recording the same way as the desktop, writing to the same session output file

#### Scenario: Page shows advisor connection status, not advisor output
- **WHEN** the CLI advisor process is running and attached to the current session
- **THEN** the page SHALL show "顧問已連線"; and when the advisor process is not running, the page SHALL show "顧問未連線"; in neither case SHALL the page render the advisor's analysis content, response options, or a chat interface


<!-- @trace
source: realtime-cli-advisor
updated: 2026-08-26
code:
  - tools/realtime-voice/static/realtime-workbench-c.css
  - tools/realtime-voice/static/index-v2-compare.html
  - tests/fixtures/fake_unknown_backend.py
  - tests/fixtures/realtime-cli-advisor-anonymous.md
  - tools/realtime-voice/static/index.html
  - tools/realtime-voice/static/realtime-workbench-autonomous-demo.html
  - scripts/start-realtime-voice.sh
  - tests/fixtures/fake_second_advisor_backend.py
  - tests/fixtures/fake_advisor_backend.py
  - tools/realtime-voice/static/index-v2-conversation.html
  - tools/realtime-voice/advisor_cli.py
  - tools/realtime-voice/advisor_schema.py
  - tests/test-realtime-analysis-options.js
  - tests/fixtures/fake_pm_only_backend.py
  - tools/realtime-voice/monitor_transcript.py
  - tools/realtime-voice/static/index-v2.html
  - tools/realtime-voice/static/realtime-workbench-demo.html
  - tools/realtime-voice/server.py
  - tools/realtime-voice/README.md
  - docs/SR-realtime-cli-advisor.md
  - tests/test-realtime-voice-identity.js
  - tools/realtime-voice/static/index-v2-dark.html
tests:
  - tests/test_advisor_cli.py
  - tests/test_schema_validation.py
-->

---
### Requirement: Local speech-to-text transcription with confidence flagging
The system SHALL transcribe captured audio to text using a locally-run FunASR SenseVoiceSmall model, with no network call to any external transcription API, and SHALL flag low-confidence or inaudible segments instead of silently guessing.

#### Scenario: Clear speech segment is transcribed
- **WHEN** a voice segment with clear audio is detected after a pause
- **THEN** the system SHALL run local inference and return the recognized text for that segment

#### Scenario: Unclear or too-short segment
- **WHEN** a segment is too noisy, too short, or has low recognition confidence
- **THEN** the system SHALL prefix the output for that segment with "[聽不清楚]" instead of silently discarding it or guessing at content

##### Example: model load failure surfaces immediately
- **GIVEN** the SenseVoiceSmall model file at the configured local path is missing or corrupted
- **WHEN** the local server process starts
- **THEN** the process SHALL print the concrete load error and exit, and SHALL NOT start a server that accepts connections without transcription capability


<!-- @trace
source: realtime-voice-transcription
updated: 2026-08-22
code:
  - tools/realtime-voice/static/index.html
  - tests/test-realtime-voice-writes-to-inbox.js
  - graphify-out/.graphify_python
  - CLAUDE.md
  - graphify-out/manifest.json
  - graphify-out/.graphify_root
  - docs/realtime-voice-architecture.html
  - tools/realtime-voice/README.md
  - graphify-out/.graphify_detect.json
  - assets/logo.jpg
  - tests/test-realtime-voice-s2tw-conversion.js
  - tools/realtime-voice/server.py
  - tools/realtime-voice/requirements.txt
-->

---
### Requirement: Simplified-to-traditional Chinese conversion
The system SHALL convert all recognized text from Simplified Chinese to Traditional Chinese using OpenCC's `s2twp` configuration before the text is displayed or written to the session output file.

#### Scenario: Simplified output is converted before delivery
- **WHEN** the local speech-to-text engine returns a Simplified Chinese string for a segment
- **THEN** the system SHALL convert it to Traditional Chinese with `s2twp` before sending it to the browser and before appending it to the output file

##### Example: known conversion pair
| Input (Simplified) | Expected Output (Traditional) |
| ------------------- | ------------------------------ |
| 开放时间早上9点至下午5点。 | 開放時間早上9點至下午5點。 |


<!-- @trace
source: realtime-voice-transcription
updated: 2026-08-22
code:
  - tools/realtime-voice/static/index.html
  - tests/test-realtime-voice-writes-to-inbox.js
  - graphify-out/.graphify_python
  - CLAUDE.md
  - graphify-out/manifest.json
  - graphify-out/.graphify_root
  - docs/realtime-voice-architecture.html
  - tools/realtime-voice/README.md
  - graphify-out/.graphify_detect.json
  - assets/logo.jpg
  - tests/test-realtime-voice-s2tw-conversion.js
  - tools/realtime-voice/server.py
  - tools/realtime-voice/requirements.txt
-->

---
### Requirement: Session transcript file for handoff to realtime-need-capture
The system SHALL append each recognized (and Traditional-converted) segment as a timestamped line to a session-specific output file at a fixed, documented path, so that a human operator can hand this file directly to the `realtime-need-capture` skill instead of typing or pasting the transcript.

#### Scenario: Each recognized segment is appended
- **WHEN** a segment is successfully recognized and converted to Traditional Chinese
- **THEN** the system SHALL append one line to `tools/realtime-voice/output/<session-id>.md` in the format `- [<ISO timestamp>] <text>`

#### Scenario: Session id is unique per run
- **WHEN** the operator starts a new recording session
- **THEN** the system SHALL generate a new `session-id` derived from the server start timestamp, SHALL NOT overwrite a previous session's output file


<!-- @trace
source: realtime-voice-transcription
updated: 2026-08-22
code:
  - tools/realtime-voice/static/index.html
  - tests/test-realtime-voice-writes-to-inbox.js
  - graphify-out/.graphify_python
  - CLAUDE.md
  - graphify-out/manifest.json
  - graphify-out/.graphify_root
  - docs/realtime-voice-architecture.html
  - tools/realtime-voice/README.md
  - graphify-out/.graphify_detect.json
  - assets/logo.jpg
  - tests/test-realtime-voice-s2tw-conversion.js
  - tools/realtime-voice/server.py
  - tools/realtime-voice/requirements.txt
-->

---
### Requirement: Manually-started, non-persistent service
The system SHALL run only while a human operator has explicitly started it in a terminal, SHALL NOT register any startup daemon, cron job, or launchd agent, and SHALL stop accepting new recordings only when the operator manually terminates the process. The single startup command SHALL start both the recording server and the CLI advisor process together, and stopping the session SHALL stop both together, leaving no residual advisor or monitoring process.

#### Scenario: Operator closes the terminal session
- **WHEN** the operator presses Ctrl+C in the terminal running the service
- **THEN** the process SHALL exit and no further recording SHALL be possible until the operator manually restarts it

#### Scenario: No autostart registration exists
- **WHEN** the system is installed following the setup instructions
- **THEN** no launchd plist, cron entry, or other autostart mechanism SHALL be created for this service

#### Scenario: Single command starts both recording and advisor
- **WHEN** the operator runs the single startup command
- **THEN** the recording server and the CLI advisor process SHALL both be started, and the terminal SHALL report both as ready before recording begins

#### Scenario: Stopping the session stops the advisor too
- **WHEN** the operator stops the recording session
- **THEN** the CLI advisor process SHALL also terminate, and no advisor or monitoring process SHALL remain running afterward


<!-- @trace
source: realtime-cli-advisor
updated: 2026-08-26
code:
  - tools/realtime-voice/static/realtime-workbench-c.css
  - tools/realtime-voice/static/index-v2-compare.html
  - tests/fixtures/fake_unknown_backend.py
  - tests/fixtures/realtime-cli-advisor-anonymous.md
  - tools/realtime-voice/static/index.html
  - tools/realtime-voice/static/realtime-workbench-autonomous-demo.html
  - scripts/start-realtime-voice.sh
  - tests/fixtures/fake_second_advisor_backend.py
  - tests/fixtures/fake_advisor_backend.py
  - tools/realtime-voice/static/index-v2-conversation.html
  - tools/realtime-voice/advisor_cli.py
  - tools/realtime-voice/advisor_schema.py
  - tests/test-realtime-analysis-options.js
  - tests/fixtures/fake_pm_only_backend.py
  - tools/realtime-voice/monitor_transcript.py
  - tools/realtime-voice/static/index-v2.html
  - tools/realtime-voice/static/realtime-workbench-demo.html
  - tools/realtime-voice/server.py
  - tools/realtime-voice/README.md
  - docs/SR-realtime-cli-advisor.md
  - tests/test-realtime-voice-identity.js
  - tools/realtime-voice/static/index-v2-dark.html
tests:
  - tests/test_advisor_cli.py
  - tests/test_schema_validation.py
-->
