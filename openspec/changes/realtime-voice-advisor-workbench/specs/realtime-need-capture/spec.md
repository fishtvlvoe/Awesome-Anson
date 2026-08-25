# realtime-need-capture Delta Specification

## Requirements

### Requirement: Analysis payload exposes the advisor reasoning chain

The system SHALL extend the latest analysis payload with `observed`, `mental_model`, `evidence`, `conclusion`, and one to three `response_options` while preserving existing analysis fields.

#### Scenario: Structured reasoning is available

- **WHEN** the monitor writes a valid analysis result
- **THEN** the payload SHALL contain all five reasoning fields
- **AND** the UI SHALL render the response options as actions for the advisor panel

##### Example: Response options limit

- **GIVEN** the model returns four candidate replies
- **WHEN** the result is validated
- **THEN** the system keeps at most three response options and reports the validation result

### Requirement: Analysis failure does not hide the conversation

The system SHALL preserve the conversation and advisor panels when an analysis payload is missing or malformed.

#### Scenario: Analysis file is malformed

- **WHEN** the polling endpoint cannot parse the analysis file
- **THEN** the center panel shows an explicit analysis error
- **AND** the left and right panels remain usable

##### Example: Missing analysis

- **GIVEN** no monitor has produced an analysis file
- **WHEN** the page polls the endpoint
- **THEN** it shows a waiting state instead of a blank panel
