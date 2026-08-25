# realtime-voice-advisor-workbench Specification

## Purpose

Provide a local voice-aware conversation workspace for Anson that distinguishes the current operator from multiple clients, keeps the conversation readable in a fixed three-panel layout, and exposes the AI advisor's reasoning as an actionable decision trail.

## Requirements

### Requirement: Local operator voice profile

The system SHALL allow any operator to create and inspect a local voice profile by recording their own voice in the browser, without uploading raw audio or committing voice data to Git.

#### Scenario: Profile is created from valid samples

- **WHEN** the operator records at least one valid sample in the browser, reviews it, and confirms profile creation
- **THEN** the system SHALL persist a profile identifier, sample metadata, model version, and creation timestamp locally
- **AND** the system SHALL show the profile as ready for speaker attribution

##### Example: Browser recording creates a profile

- **GIVEN** the operator records a 20-second sample and plays it back successfully
- **WHEN** the operator confirms profile creation
- **THEN** the local profile status becomes `ready` and stores no raw audio in Git

#### Scenario: Profile samples are insufficient

- **WHEN** the recording is too short, silent, or fails validation
- **THEN** the system SHALL explain the missing condition and SHALL NOT mark the profile ready

##### Example: Silent recording stays unready

- **GIVEN** the browser returns a silent or zero-length recording
- **WHEN** the operator confirms profile creation
- **THEN** the UI shows a validation error and keeps the profile `unready`

#### Scenario: Profile model is unavailable

- **WHEN** the local speaker identity adapter cannot load
- **THEN** the system SHALL show the concrete failure and SHALL continue transcription with speaker status `unknown`

### Requirement: Speaker attribution for multiple clients

The system SHALL attach speaker identity metadata to each transcribed segment using the operator's local voice profile and SHALL never turn low-confidence attribution into a confirmed identity.

#### Scenario: Operator voice matches

- **WHEN** a segment matches the operator profile above the configured confidence threshold
- **THEN** the segment SHALL have `role: pm`, `speaker_id: operator`, and `identity_status: matched`

#### Scenario: Non-operator voice is detected

- **WHEN** a segment does not match the operator profile and can be separated as a stable non-operator speaker
- **THEN** the segment SHALL have `role: client`, a stable anonymous `speaker_id` such as `client-1`, and `identity_status: unmatched`

#### Scenario: Attribution is uncertain

- **WHEN** the speaker confidence is below the configured threshold or the segment cannot be separated reliably
- **THEN** the segment SHALL have `role: unknown` and `identity_status: pending`
- **AND** the UI SHALL offer manual confirmation without rewriting the original transcript text

### Requirement: Role-aware conversation timeline

The system SHALL render a fixed-height conversation panel with LINE-like left and right message alignment: client messages on the left and operator messages on the right.

#### Scenario: New message arrives while following latest

- **WHEN** a new transcript segment arrives and the operator is within the latest-message threshold
- **THEN** the conversation panel SHALL append the segment and scroll it into view at the bottom

##### Example: New operator message follows the bottom

- **GIVEN** the conversation is within 48 pixels of its bottom
- **WHEN** an operator segment arrives
- **THEN** the panel scrolls to show the new segment

#### Scenario: Operator reads older messages

- **WHEN** the operator has scrolled away from the bottom
- **THEN** new segments SHALL NOT move the current scroll position
- **AND** the UI SHALL show a control to return to the latest message

##### Example: Older message reading is preserved

- **GIVEN** the operator has scrolled 300 pixels above the bottom
- **WHEN** a client segment arrives
- **THEN** `scrollTop` remains unchanged and a `回到最新` control appears

#### Scenario: Multiple clients are present

- **WHEN** two or more non-operator speaker ids occur in one session
- **THEN** each speaker SHALL retain a stable visible label such as `客戶 1` and `客戶 2`
- **AND** the UI SHALL NOT place all speakers on the same side without role labels

##### Example: Two clients remain distinguishable

- **GIVEN** segments contain `client-1` and `client-2`
- **WHEN** the timeline renders
- **THEN** it shows `客戶 1` and `客戶 2` as separate left-side identities

### Requirement: Fixed three-panel responsive workspace

The system SHALL provide three independently scrollable panels in the desktop workspace: conversation, AI analysis, and AI advisor chat.

#### Scenario: Desktop workspace is opened

- **WHEN** the operator opens the main recording page at a desktop viewport
- **THEN** all three panels SHALL be visible without page-level infinite scrolling
- **AND** each panel SHALL retain its own scroll rail

##### Example: Desktop three-panel layout

- **GIVEN** a 1440px-wide viewport
- **WHEN** the operator opens the workbench
- **THEN** conversation, analysis, and advisor panels are visible with independent scroll containers

#### Scenario: Narrow viewport is opened

- **WHEN** the viewport cannot fit three readable columns
- **THEN** the layout SHALL switch to a readable single-column or tabbed presentation
- **AND** the page SHALL NOT create horizontal overflow that hides panel content

##### Example: Mobile layout

- **GIVEN** a 320px-wide viewport
- **WHEN** the operator opens the workbench
- **THEN** the page has no horizontal scrollbar and panels remain readable in sequence

### Requirement: Explainable AI analysis

The system SHALL display the latest analysis with the observed situation, mental model, evidence, conclusion, and one to three response options.

#### Scenario: Analysis is available

- **WHEN** a valid analysis payload is received
- **THEN** the center panel SHALL render all five reasoning fields
- **AND** the response options SHALL be actionable controls that can be sent to the advisor chat

##### Example: Two response options

- **GIVEN** the analysis contains two response options
- **WHEN** the center panel renders
- **THEN** both options appear as controls and selecting one sends it to the advisor panel

#### Scenario: Analysis is not available

- **WHEN** no active monitor has produced analysis or the payload is malformed
- **THEN** the center panel SHALL show an explicit waiting or error state
- **AND** the conversation and advisor panels SHALL remain usable

##### Example: Malformed analysis fallback

- **GIVEN** the analysis endpoint returns invalid JSON
- **WHEN** the page polls it
- **THEN** the center panel shows an error while the conversation input remains usable

### Requirement: Advisor discussion and adoption tracking

The system SHALL let the operator discuss an analysis in the advisor panel and SHALL record whether a suggestion was adopted based on subsequent operator transcript segments.

#### Scenario: Operator sends a different judgment

- **WHEN** the operator enters a judgment or instruction in the advisor composer
- **THEN** the advisor panel SHALL append the operator message and the AI response without replacing the analysis history

##### Example: Advisor keeps history

- **GIVEN** the center panel has an active response option
- **WHEN** the operator enters a different judgment
- **THEN** the right panel appends both messages and leaves the center analysis visible

#### Scenario: Operator communicates the suggested intent

- **WHEN** a later `pm` segment semantically covers the active suggestion
- **THEN** the session record SHALL mark the suggestion as `adopted`, `partial`, or `not_adopted` with evidence segment ids

### Requirement: Demo trigger event

The system SHALL record a timestamped demo trigger event when the operator confirms the direction and uses a configured DEMO-start phrase, without generating code inside the recording server process.

#### Scenario: DEMO phrase is detected

- **WHEN** a high-confidence operator segment matches a configured DEMO-start phrase
- **THEN** the system SHALL write a `demo_triggered` event containing the confirmed direction and source segment id
- **AND** the existing demo-generation capability SHALL remain responsible for downstream generation and deployment gates

##### Example: DEMO trigger is an event only

- **GIVEN** a high-confidence operator segment contains the configured DEMO phrase
- **WHEN** the trigger is detected
- **THEN** an event is written and the recording server does not spawn a generator

### Requirement: Existing transcription compatibility

The system SHALL preserve the existing timestamped Traditional Chinese Markdown transcript output, low-confidence marker behavior, local-only default, and manually-started service lifecycle.

#### Scenario: Legacy transcript consumer reads the session file

- **WHEN** an existing realtime analysis consumer reads the session `.md` file
- **THEN** it SHALL continue to receive timestamped Traditional Chinese lines without requiring speaker metadata

#### Scenario: Service is stopped

- **WHEN** the operator terminates the server process
- **THEN** no speaker monitor, model worker, launchd job, or daemon SHALL remain running

##### Example: Manual shutdown

- **GIVEN** the operator presses Ctrl+C
- **WHEN** the server exits
- **THEN** no recording or speaker worker remains listening on the port
