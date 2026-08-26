# realtime-cli-advisor Specification

## Purpose

TBD - created by archiving change 'realtime-cli-advisor'. Update Purpose after archive.

## Requirements

### Requirement: Advisor runs as an independent process, not a monitored interactive agent session

The system SHALL run automatic real-time advisory analysis as an independent process (`advisor_cli.py`) that starts and stops together with the recording session, without requiring any interactive AI coding agent session (e.g. an open Claude Code or Codex chat) to be present and actively watching the transcript.

#### Scenario: Advisor operates with no agent session open

- **WHEN** the salesperson runs the single startup command and no separate Claude Code or Codex chat session is open anywhere
- **THEN** the advisor SHALL still automatically detect pauses in the transcript and produce analysis output in the terminal, because the monitoring and triggering logic lives inside the advisor process itself

#### Scenario: Startup command fails loudly if either component cannot start

- **WHEN** the recording server or the advisor process fails to start
- **THEN** the startup command SHALL report an explicit error identifying which component failed, and SHALL NOT leave the other component running in a state that looks normal but has no working advisor


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
### Requirement: Dual automatic trigger condition based on transcript timestamps

The advisor SHALL trigger one analysis pass when either of the following conditions is met, whichever occurs first: (a) no new transcript line has been appended for approximately 2 to 3 seconds since the last new content ("pause"), or (b) newly appended transcript content has accumulated for approximately 30 to 60 seconds without a pause-triggered analysis occurring ("time cap"). Both conditions SHALL be evaluated using timestamps already recorded in the transcript file, not raw audio signal, and SHALL merge consecutive short fragments into one coherent conversational turn before triggering.

#### Scenario: Pause after client speech triggers one analysis

- **WHEN** new transcript content is appended and no further line is appended for longer than the pause threshold
- **THEN** the advisor SHALL trigger exactly one analysis pass using all transcript content appended since the previous analysis

#### Scenario: Continuous speech without pause triggers via time cap

- **WHEN** transcript content keeps appending continuously for more than the time-cap threshold without any pause long enough to trigger
- **THEN** the advisor SHALL force one analysis pass at the time-cap boundary instead of waiting indefinitely for a pause

#### Scenario: In-flight analysis is not duplicated

- **WHEN** a previous analysis pass has not finished and new transcript content keeps arriving
- **THEN** the advisor SHALL NOT start a second concurrent analysis call, and SHALL queue the newly arrived content to be included in the next analysis pass once the current one completes


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
### Requirement: Configurable analysis backend

The advisor SHALL call an analysis backend through a configurable adapter that supports at least Claude Code and Codex as headless CLI invocation targets, and SHALL NOT hard-code a single provider.

#### Scenario: Backend selection via configuration

- **WHEN** the advisor is configured to use a specific backend CLI (e.g. `claude` or `codex`)
- **THEN** the advisor SHALL invoke that CLI for every analysis pass in the session, without requiring code changes to switch backends

#### Scenario: Backend unavailable is reported, not silently skipped

- **WHEN** the configured backend CLI is not installed or not authenticated
- **THEN** the advisor SHALL report an explicit error naming the missing backend at startup, and SHALL NOT proceed as if analysis were working


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
### Requirement: Terminal output shows current state and at most three response options

Each triggered analysis SHALL cause the advisor to print, in the terminal, the client's current state, confirmed items, open questions, quote impact, and at most three numbered response options (`1`/`2`/`3`), followed by a prompt accepting a numeric choice, Enter to skip, or `q` to stop.

#### Scenario: Client answer produces state and options

- **WHEN** an analysis pass is triggered after the client has spoken
- **THEN** the advisor SHALL print the current state summary and up to three response options, and SHALL wait for the salesperson's input

#### Scenario: Choosing an option prints a ready-to-say sentence

- **WHEN** the salesperson enters `1`, `2`, or `3`
- **THEN** the advisor SHALL print the corresponding sentence the salesperson can say directly to the client, and SHALL record an adoption event for that choice

#### Scenario: Client has not responded yet

- **WHEN** only the salesperson has spoken since the last analysis and the client has not yet answered
- **THEN** the advisor SHALL print that the client has not responded yet, and SHALL NOT display any numbered response options or fabricate a client need

#### Scenario: Response options never exceed three

- **WHEN** the analysis backend identifies more than three plausible next moves
- **THEN** the advisor SHALL select and print at most three, and SHALL print exactly one `recommended_next_move`, not a full checklist


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
### Requirement: Accumulated session state carried across analysis passes

The advisor SHALL persist a session state file (`confirmed_facts`, `open_questions`, `current_mental_model`, `quote_signals`, `last_analysis_ts`, `pending_response_options`, `adoption_events`) for the duration of the session, and SHALL pass the accumulated state together with newly added transcript content into every analysis call.

#### Scenario: Previously confirmed facts survive the next analysis

- **WHEN** a fact was marked "confirmed" in an earlier analysis pass and a later analysis pass runs on new transcript content
- **THEN** the later analysis output SHALL still include that previously confirmed fact, and SHALL NOT silently drop it

#### Scenario: Session state stops with the session

- **WHEN** the recording session ends (operator stops recording or enters `q`)
- **THEN** the advisor SHALL stop updating session state, and the existing session state file SHALL remain on disk under the case folder for later review


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
### Requirement: Text-context role inference without voice biometrics

The advisor SHALL infer whether a transcript segment was likely spoken by the PM/salesperson or the client using textual and conversational context (question/confirmation phrasing versus answer/preference phrasing), SHALL treat the session starter as the PM by explicit assignment rather than inference, and SHALL NOT require a voice biometric profile to operate with a single PM and a single client.

#### Scenario: Session starter is assigned PM without inference

- **WHEN** a session starts
- **THEN** the advisor SHALL record the starting operator's role as `pm` directly, without running any inference model on that assignment

#### Scenario: Role inference outputs confidence and falls back to unknown

- **WHEN** the advisor infers a role for a transcript segment
- **THEN** it SHALL output exactly one of `pm`, `client`, or `unknown`, together with a confidence score and a textual reason, and SHALL mark the role `unknown`/`pending` rather than guessing when confidence is low

#### Scenario: Uncertain role is never auto-upgraded to a confirmed client statement

- **WHEN** a segment's role is marked `unknown` or `pending`
- **THEN** the advisor SHALL NOT present the content of that segment as a confirmed client statement in `confirmed_facts`

#### Scenario: Single PM and single client works without any voice profile

- **WHEN** no voice biometric profile exists for the operator or the client
- **THEN** the advisor SHALL still produce automatic analysis and role attribution for a single-PM, single-client conversation, using text-context inference alone


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
### Requirement: Clean shutdown with no residual background process

When the recording session stops, the advisor process SHALL terminate along with the recording server, and the system SHALL NOT register or leave behind any daemon, launchd agent, cron job, or orphaned monitoring process.

#### Scenario: Stopping recording stops the advisor

- **WHEN** the operator stops the recording session (via the browser control or `q` in the advisor terminal)
- **THEN** both the recording server process and the advisor process SHALL exit, and no advisor or monitoring process SHALL remain running afterward

#### Scenario: No autostart registration exists for the advisor

- **WHEN** the system is installed following the setup instructions
- **THEN** no launchd plist, cron entry, or other autostart mechanism SHALL be created for the advisor process

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