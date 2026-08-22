## ADDED Requirements

### Requirement: Automatic trigger during live conversation

The system SHALL monitor the growing transcript file produced by `tools/realtime-voice/server.py` while a recording session is active, and SHALL trigger a real-time need-capture analysis without requiring the salesperson to manually stop recording or manually invoke the analysis.

#### Scenario: Analysis fires on pause, not on button press

- **WHEN** the salesperson is recording a live conversation and has not clicked "停止收音"
- **THEN** the system SHALL still produce at least one analysis update during the session, triggered automatically by the conditions defined below

### Requirement: Dual trigger condition — pause detection or time cap

The system SHALL trigger an analysis pass when either of the following conditions is met, whichever occurs first: (a) silence is detected for longer than the pause threshold after new transcript content was appended, or (b) newly appended transcript content has accumulated for between 30 and 60 seconds without a pause-triggered analysis occurring.

#### Scenario: Pause after client speech triggers analysis

- **WHEN** new transcript content is appended and the microphone then registers silence continuously for longer than the configured pause threshold
- **THEN** the system SHALL trigger one analysis pass using all transcript content appended since the previous analysis

#### Scenario: Continuous speech without pause still triggers within the time cap

- **WHEN** the salesperson or client speaks continuously for more than 60 seconds without a silence period exceeding the pause threshold
- **THEN** the system SHALL trigger an analysis pass once the accumulated new content reaches the 30-to-60-second window, without waiting for a pause

#### Scenario: Pause threshold is independent from the segment-flush threshold

- **WHEN** the existing voice-activity detection in `tools/realtime-voice/static/index.html` flushes a recording segment for transcription purposes
- **THEN** that segment-flush event SHALL NOT be treated as satisfying the analysis pause-trigger condition unless the silence duration also independently exceeds the analysis pause threshold, because the two thresholds serve different purposes and MUST be configured and evaluated separately

### Requirement: On-device analysis via Apple Foundation Models Guided Generation

The system SHALL perform the real-time analysis (client response extraction, decomposition, next-step suggestion) using Apple's on-device Foundation Models framework with Guided Generation (schema-constrained structured output), and SHALL NOT send conversation transcript content to any cloud-based large language model API for this analysis.

#### Scenario: Structured output instead of free-form rewriting

- **WHEN** the system calls the on-device model to analyze a transcript segment
- **THEN** the call SHALL use a Guided Generation schema that constrains the model's output to the defined decomposition fields, confirmation-state enum, and suggestion field, rather than requesting free-form text that the caller must parse

#### Scenario: On-device model unavailable

- **WHEN** `SystemLanguageModel.default.availability` reports a value other than `available`
- **THEN** the system SHALL disable the automatic analysis feature for the session, SHALL display a message in the analysis panel stating that on-device analysis is unavailable, and SHALL NOT interrupt or degrade the existing transcription-and-write-to-file functionality

#### Scenario: Analysis call fails or times out

- **WHEN** a triggered analysis call raises an error or does not complete within the call's timeout
- **THEN** the system SHALL skip that analysis cycle, SHALL mark the analysis panel to indicate the most recent attempt failed and a retry will occur at the next trigger, and SHALL NOT silently show stale results as if they were current

### Requirement: Analysis results delivered over the existing WebSocket connection

The system SHALL deliver each analysis result to the recording page over the existing `/stream` WebSocket connection used for transcription, using a distinct message type that the frontend can distinguish from transcript messages.

#### Scenario: Frontend renders analysis without a new connection

- **WHEN** the frontend receives a WebSocket message with `type: "analysis"`
- **THEN** it SHALL render the message's `client_response`, `decomposition`, and `suggestion` fields into a dedicated analysis panel on the same page, without opening any additional network connection

### Requirement: Analysis panel shows three fixed sections in order

The system SHALL render, for each analysis update, exactly three sections in this order: what the client expressed, the current decomposition state (with confirmation-state tags), and one next-step suggestion for the salesperson.

#### Scenario: Client has not spoken yet

- **WHEN** the transcript content analyzed in this cycle contains no content attributable to the client (e.g. the salesperson is speaking alone)
- **THEN** the "what the client expressed" section SHALL explicitly state that the client has not responded yet, rather than being left blank or inventing client statements

#### Scenario: One suggestion, not a checklist

- **WHEN** the decomposition contains more than one field in `pending-confirmation` or `assumed-guess` state
- **THEN** the suggestion section SHALL contain exactly one recommended next question or action, chosen as the most relevant gap, rather than listing all outstanding gaps as a checklist

### Requirement: Automatic monitoring stops when recording stops

The system SHALL stop the transcript-monitoring and auto-trigger behavior when the recording session ends (the salesperson clicks "停止收音" or the page/service is closed), and SHALL NOT persist any background monitoring process after the session ends.

#### Scenario: No residual process after stopping

- **WHEN** the salesperson clicks "停止收音"
- **THEN** any in-progress or scheduled analysis polling for that session SHALL be cancelled, and no monitoring process SHALL remain running once the recording service process exits
