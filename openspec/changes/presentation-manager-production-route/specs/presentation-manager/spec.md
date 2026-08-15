# Presentation Manager Production Route Specification

## ADDED Requirements

### Requirement: The production route SHALL be selected after intermediate confirmation

#### Scenario: Confirmed slide manuscript is ready
- **WHEN** the user has confirmed the intermediate Markdown
- **THEN** the Agent SHALL ask whether to produce Kimi PPT prompt text or a native `.pptx` handoff
- **AND** SHALL not silently select an output route

### Requirement: Both output routes SHALL use the same confirmed source

#### Scenario: User selects either output route
- **WHEN** Kimi PPT or native production is selected
- **THEN** the Agent SHALL use the confirmed intermediate Markdown as the content source
- **AND** SHALL report the selected route and any remaining manual or verification work

##### Example:

- **GIVEN** a confirmed teaching-deck Markdown with 25 page sections
- **WHEN** the user selects the native `.pptx` route
- **THEN** the Agent SHALL hand the same 25 page sections to `ppt-master`
- **AND** SHALL report any missing production or file-verification evidence separately
