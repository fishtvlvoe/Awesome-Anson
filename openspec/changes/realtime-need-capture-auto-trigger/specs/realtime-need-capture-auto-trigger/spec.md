## ADDED Requirements

### Requirement: Automatic trigger during live conversation, driven by an active agent session

The system SHALL support automatic real-time need-capture analysis while a recording session is active, driven by an active AI coding agent session that monitors the growing transcript file. The system SHALL NOT require the salesperson to manually stop recording or manually invoke the analysis for this to happen.

#### Scenario: Analysis fires while recording is still in progress

- **WHEN** an agent session is actively monitoring a recording session's transcript file and the salesperson has not clicked "停止收音"
- **THEN** the system SHALL produce at least one analysis update during the session, triggered automatically by the conditions defined below

### Requirement: Dual trigger condition based on transcript timestamps

The monitoring logic SHALL trigger an analysis pass when either of the following conditions is met, whichever occurs first: (a) no new transcript line has been appended for longer than the pause threshold since the last new content, or (b) newly appended transcript content has accumulated for between 30 and 60 seconds without a pause-triggered analysis occurring. Both conditions SHALL be evaluated using the timestamps already recorded in the transcript file, not raw audio signal.

#### Scenario: Pause after client speech triggers analysis

- **WHEN** new transcript content is appended and no further line is appended for longer than the configured pause threshold
- **THEN** the monitoring logic SHALL trigger one analysis pass using all transcript content appended since the previous analysis

#### Scenario: Continuous speech without pause still triggers within the time cap

- **WHEN** transcript lines continue to be appended for more than 60 seconds without a gap exceeding the pause threshold
- **THEN** the monitoring logic SHALL trigger an analysis pass once the accumulated new content reaches the 30-to-60-second window, without waiting for a pause

#### Scenario: Trigger detection is independent from the browser's audio VAD

- **WHEN** the monitoring logic evaluates the pause and time-cap conditions
- **THEN** it SHALL do so using only the transcript file's recorded timestamps, and SHALL NOT depend on or interfere with the existing voice-activity detection in `tools/realtime-voice/static/index.html` that governs how recording segments are flushed for transcription

### Requirement: Analysis performed by a lightweight agent, not a dedicated local model

The system SHALL perform each triggered analysis (client response extraction, decomposition, next-step suggestion) using an AI agent invocation — a lightweight/fast-tier agent is sufficient given the task is field extraction against a fixed rule set already defined in the `realtime-need-capture` skill, not open-ended reasoning. The system SHALL NOT install, bundle, or depend on any dedicated local or cloud LLM component (such as an on-device model framework or a separately-run inference server) for this analysis.

#### Scenario: No dedicated model dependency

- **WHEN** the auto-trigger feature is set up
- **THEN** it SHALL require no additional model download, no additional inference runtime installation, and no platform-specific on-device AI capability

#### Scenario: No active agent session monitoring

- **WHEN** no agent session is currently monitoring a given recording session's transcript file
- **THEN** the system SHALL NOT produce any automatic analysis for that session, and the recording and transcription functionality SHALL continue to work unaffected

### Requirement: Analysis results delivered via a polling HTTP endpoint

The system SHALL write each analysis result to a JSON file associated with the recording session, and `tools/realtime-voice/server.py` SHALL expose a read-only HTTP endpoint that returns the current contents of that file for the recording page to poll.

#### Scenario: Endpoint returns current analysis

- **WHEN** the recording page requests the analysis endpoint for an active session that has at least one analysis result
- **THEN** the endpoint SHALL return the most recently written analysis JSON

#### Scenario: No analysis yet

- **WHEN** the recording page requests the analysis endpoint before any analysis has been produced for that session
- **THEN** the endpoint SHALL return a successful response indicating no analysis is available yet, rather than an error status

#### Scenario: Malformed analysis file

- **WHEN** the analysis JSON file exists but cannot be parsed
- **THEN** the endpoint SHALL return a response indicating an analysis error, and the recording page SHALL display that the most recent analysis attempt could not be read, rather than displaying stale or corrupted data as if it were valid

### Requirement: Analysis panel shows three fixed sections in order

The recording page SHALL render, for each analysis update, exactly three sections in this order: what the client expressed, the current decomposition state (with confirmation-state tags), and one next-step suggestion for the salesperson.

#### Scenario: Client has not spoken yet

- **WHEN** the transcript content analyzed in this cycle contains no content attributable to the client
- **THEN** the "what the client expressed" section SHALL explicitly state that the client has not responded yet, rather than being left blank or inventing client statements

#### Scenario: One suggestion, not a checklist

- **WHEN** the decomposition contains more than one field in `pending-confirmation` or `assumed-guess` state
- **THEN** the suggestion section SHALL contain exactly one recommended next question or action, chosen as the most relevant gap, rather than listing all outstanding gaps as a checklist

### Requirement: Graceful degradation when no monitoring is active

The recording page SHALL clearly indicate when no automatic analysis is available, distinguishing this from an error condition, so the salesperson understands the recording and manual-analysis workflow are unaffected.

#### Scenario: No agent session started monitoring

- **WHEN** the analysis endpoint has never returned a result for the current session
- **THEN** the recording page SHALL display a message indicating live analysis is not currently active, without implying a malfunction

### Requirement: Automatic monitoring stops when recording stops

Any agent-driven monitoring process for a given recording session SHALL be understood to stop tracking that session once the session ends (the salesperson clicks "停止收音" or the recording service process exits), and the system SHALL NOT require any server-side background process to persist after the recording service exits.

#### Scenario: No server-side residual process

- **WHEN** the recording service (`tools/realtime-voice/server.py`) process exits
- **THEN** no additional server-side process introduced by this capability SHALL remain running, because this capability introduces no persistent server-side process — only a read-only HTTP endpoint on the existing server and an external agent-driven monitoring loop that is independent of the server's lifecycle
