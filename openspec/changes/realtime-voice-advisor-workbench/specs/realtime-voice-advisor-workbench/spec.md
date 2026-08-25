# realtime-voice-advisor-workbench Specification

## Purpose

Provide a local voice-aware conversation workspace for Anson that distinguishes Fish from multiple clients, keeps the conversation readable in a fixed three-panel layout, and exposes the AI advisor's reasoning as an actionable decision trail.

## Requirements

### Requirement: Local operator voice profile

The system SHALL allow any operator to create and inspect a local voice profile by recording their own voice in the browser, without uploading raw audio or committing voice data to Git.

#### Scenario: Profile is created from valid samples

- **WHEN** the operator records at least one valid sample in the browser, reviews it, and confirms profile creation
- **THEN** the system SHALL persist a profile identifier, sample metadata, model version, and creation timestamp locally
- **AND** the system SHALL show the profile as ready for speaker attribution

#### Scenario: Profile samples are insufficient

- **WHEN** the recording is too short, silent, or fails validation
- **THEN** the system SHALL explain the missing condition and SHALL NOT mark the profile ready

#### Scenario: Profile model is unavailable

- **WHEN** the local speaker identity adapter cannot load
- **THEN** the system SHALL show the concrete failure and SHALL continue transcription with speaker status `unknown`

### Requirement: Speaker attribution for multiple clients

The system SHALL attach speaker identity metadata to each transcribed segment using the operator's local voice profile and SHALL never turn low-confidence attribution into a confirmed identity.

#### Scenario: Operator voice matches

- **WHEN** a segment matches the operator profile above the configured confidence threshold
- **THEN** the segment SHALL have `role: pm`, `speaker_id: operator`, and `identity_status: matched`

#### Scenario: Non-Fish voice is detected

- **WHEN** a segment does not match the operator profile and can be separated as a stable non-operator speaker
- **THEN** the segment SHALL have `role: client`, a stable anonymous `speaker_id` such as `client-1`, and `identity_status: unmatched`

#### Scenario: Attribution is uncertain

- **WHEN** the speaker confidence is below the configured threshold or the segment cannot be separated reliably
- **THEN** the segment SHALL have `role: unknown` and `identity_status: pending`
- **AND** the UI SHALL offer manual confirmation without rewriting the original transcript text

### Requirement: Role-aware conversation timeline

The system SHALL render a fixed-height conversation panel with LINE-like left and right message alignment: client messages on the left and Fish messages on the right.

#### Scenario: New message arrives while following latest

- **WHEN** a new transcript segment arrives and the operator is within the latest-message threshold
- **THEN** the conversation panel SHALL append the segment and scroll it into view at the bottom

#### Scenario: Operator reads older messages

- **WHEN** the operator has scrolled away from the bottom
- **THEN** new segments SHALL NOT move the current scroll position
- **AND** the UI SHALL show a control to return to the latest message

#### Scenario: Multiple clients are present

- **WHEN** two or more non-Fish speaker ids occur in one session
- **THEN** each speaker SHALL retain a stable visible label such as `客戶 1` and `客戶 2`
- **AND** the UI SHALL NOT place all speakers on the same side without role labels

### Requirement: Fixed three-panel responsive workspace

The system SHALL provide three independently scrollable panels in the desktop workspace: conversation, AI analysis, and AI advisor chat.

#### Scenario: Desktop workspace is opened

- **WHEN** the operator opens the main recording page at a desktop viewport
- **THEN** all three panels SHALL be visible without page-level infinite scrolling
- **AND** each panel SHALL retain its own scroll rail

#### Scenario: Narrow viewport is opened

- **WHEN** the viewport cannot fit three readable columns
- **THEN** the layout SHALL switch to a readable single-column or tabbed presentation
- **AND** the page SHALL NOT create horizontal overflow that hides panel content

### Requirement: Explainable AI analysis

The system SHALL display the latest analysis with the observed situation, mental model, evidence, conclusion, and one to three response options.

#### Scenario: Analysis is available

- **WHEN** a valid analysis payload is received
- **THEN** the center panel SHALL render all five reasoning fields
- **AND** the response options SHALL be actionable controls that can be sent to the advisor chat

#### Scenario: Analysis is not available

- **WHEN** no active monitor has produced analysis or the payload is malformed
- **THEN** the center panel SHALL show an explicit waiting or error state
- **AND** the conversation and advisor panels SHALL remain usable

### Requirement: Advisor discussion and adoption tracking

The system SHALL let the operator discuss an analysis in the advisor panel and SHALL record whether a suggestion was adopted based on subsequent Fish transcript segments.

#### Scenario: Operator sends a different judgment

- **WHEN** the operator enters a judgment or instruction in the advisor composer
- **THEN** the advisor panel SHALL append the operator message and the AI response without replacing the analysis history

#### Scenario: Fish communicates the suggested intent

- **WHEN** a later `pm` segment semantically covers the active suggestion
- **THEN** the session record SHALL mark the suggestion as `adopted`, `partial`, or `not_adopted` with evidence segment ids

### Requirement: Demo trigger event

The system SHALL record a timestamped demo trigger event when the operator confirms the direction and uses a configured DEMO-start phrase, without generating code inside the recording server process.

#### Scenario: DEMO phrase is detected

- **WHEN** a high-confidence Fish segment matches a configured DEMO-start phrase
- **THEN** the system SHALL write a `demo_triggered` event containing the confirmed direction and source segment id
- **AND** the existing demo-generation capability SHALL remain responsible for downstream generation and deployment gates

### Requirement: Existing transcription compatibility

The system SHALL preserve the existing timestamped Traditional Chinese Markdown transcript output, low-confidence marker behavior, local-only default, and manually-started service lifecycle.

#### Scenario: Legacy transcript consumer reads the session file

- **WHEN** an existing realtime analysis consumer reads the session `.md` file
- **THEN** it SHALL continue to receive timestamped Traditional Chinese lines without requiring speaker metadata

#### Scenario: Service is stopped

- **WHEN** the operator terminates the server process
- **THEN** no speaker monitor, model worker, launchd job, or daemon SHALL remain running
