# realtime-voice-transcription Delta Specification

## Requirements

### Requirement: Transcription segments expose optional speaker metadata

The system SHALL preserve the existing timestamped Traditional Chinese Markdown transcript and SHALL expose a parallel structured segment stream containing `speaker_id`, `role`, `confidence`, and `identity_status`.

#### Scenario: Legacy transcript consumer reads a new session

- **WHEN** an existing consumer reads the session `.md` file
- **THEN** it SHALL receive the same timestamped text line format as before
- **AND** missing speaker metadata SHALL NOT break the consumer

##### Example: Backward-compatible line

- **GIVEN** a segment recognized as the operator
- **WHEN** the server appends it
- **THEN** the Markdown file contains `- [2026-08-25T14:20:12+08:00] 第一版先做預約`

### Requirement: Browser-recorded profile remains local

The system SHALL accept a browser-recorded operator voice sample for local profile creation and SHALL not upload the raw recording or commit it to Git.

#### Scenario: Operator records a valid sample

- **WHEN** the operator grants microphone permission and records a non-empty sample
- **THEN** the UI SHALL allow playback and profile confirmation

##### Example: Permission denial

- **GIVEN** the browser denies microphone permission
- **WHEN** recording starts
- **THEN** the UI shows a permission error and keeps the profile unready
