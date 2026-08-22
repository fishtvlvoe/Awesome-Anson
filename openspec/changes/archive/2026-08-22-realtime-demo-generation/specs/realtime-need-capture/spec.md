## ADDED Requirements

### Requirement: Real-time speech-to-text during client conversation

The system SHALL transcribe spoken conversation between the salesperson and the client into text in near-real-time while the conversation is in progress.

#### Scenario: Low-confidence transcription is flagged, not guessed

- **WHEN** the speech-to-text engine returns a segment below its confidence threshold
- **THEN** the system SHALL mark that segment as "unclear, needs manual review" instead of silently inserting a guessed transcription into the need-decomposition output

### Requirement: Real-time need decomposition

The system SHALL decompose the transcribed conversation, as it happens, into the five categories: target audience, scenario, pain point, need, and solution.

#### Scenario: Service-type engagement uses the 4x4 breakdown instead

- **WHEN** the engagement is classified as a service-type task (as opposed to a one-off deliverable)
- **THEN** the system SHALL decompose the need using the 4x4 grid (before-service / during-service / after-service, each with 4 checkpoints) instead of the five-category breakdown

### Requirement: Every decomposed item carries a confirmation status

The system SHALL tag every item it produces in the decomposition output with exactly one of: "confirmed", "pending-confirmation", or "assumed-guess", following the same tagging convention already used by the `project-manager` agent's FRD output.

#### Scenario: Guessed item is never presented as confirmed

- **WHEN** the system infers a need that the client did not explicitly state
- **THEN** the output SHALL tag that item as "assumed-guess", and the system SHALL NOT upgrade it to "confirmed" without explicit human confirmation

### Requirement: Output feeds the existing PM-to-Quote Data Pack format

The system SHALL produce a data pack compatible with the existing `PM-to-Quote Data Pack` contract, extended with two additional fields: `capture_mode` (one of `realtime` or `post-hoc`) and `decomposition` (the five-category breakdown or the 4x4 grid, as an array).

#### Scenario: Downstream quotation flow consumes the extended pack unchanged

- **WHEN** the `commercial-proposal-quotation-specialist` agent reads a data pack produced in `realtime` capture mode
- **THEN** it SHALL be able to process the pack using its existing logic, treating the two new fields as additive metadata that does not break the existing contract shape
