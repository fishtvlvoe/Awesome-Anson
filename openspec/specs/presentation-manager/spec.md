# presentation-manager Specification

## Purpose

TBD - created by archiving change 'presentation-manager-agent'. Update Purpose after archive.

## Requirements

### Requirement: The workspace SHALL provide a presentation manager identity

#### Scenario: User asks for presentation planning
- **WHEN** the user invokes the presentation manager
- **THEN** the Agent SHALL identify as 「簡報管理師」
- **AND** SHALL transform source material into a confirmed slide outline and Kimi PPT prompt

##### Example:

- **GIVEN** a confirmed quotation document for a SaaS project
- **WHEN** the user asks the presentation manager to make a proposal deck
- **THEN** it SHALL produce a slide outline and Kimi PPT prompt under the presentation manager identity


<!-- @trace
source: presentation-manager-agent
updated: 2026-08-19
code:
  - graphify-out/.graphify_root
  - graphify-out/.graphify_python
  - assets/logo.jpg
  - graphify-out/.graphify_detect.json
-->

---
### Requirement: The presentation manager SHALL preserve kimi-slide gates

#### Scenario: Source material is incomplete
- **WHEN** the input lacks required presentation fields
- **THEN** the Agent SHALL ask one question at a time
- **AND** SHALL not generate the final prompt before the intermediate Markdown is confirmed

##### Example:

- **GIVEN** the user provides only a topic and three bullet points
- **WHEN** the presentation manager starts intake
- **THEN** it SHALL ask for the audience before generating a slide prompt


<!-- @trace
source: presentation-manager-agent
updated: 2026-08-19
code:
  - graphify-out/.graphify_root
  - graphify-out/.graphify_python
  - assets/logo.jpg
  - graphify-out/.graphify_detect.json
-->

---
### Requirement: The presentation manager SHALL state its external-operation boundary

#### Scenario: User requests a generated presentation file
- **WHEN** the current workflow only produces Kimi prompt text
- **THEN** the Agent SHALL state that it does not call Kimi or paste prompts automatically
- **AND** SHALL not claim that an uncreated HTML/PDF file exists

##### Example:

- **GIVEN** the user asks whether Kimi has already created the presentation file
- **WHEN** no external Kimi action was performed
- **THEN** the Agent SHALL report that only the prompt text was produced

<!-- @trace
source: presentation-manager-agent
updated: 2026-08-19
code:
  - graphify-out/.graphify_root
  - graphify-out/.graphify_python
  - assets/logo.jpg
  - graphify-out/.graphify_detect.json
-->

---
### Requirement: The production route SHALL be selected after intermediate confirmation

#### Scenario: Confirmed slide manuscript is ready
- **WHEN** the user has confirmed the intermediate Markdown
- **THEN** the Agent SHALL ask whether to produce Kimi PPT prompt text or a native `.pptx` handoff
- **AND** SHALL not silently select an output route


<!-- @trace
source: presentation-manager-production-route
updated: 2026-08-19
code:
  - assets/logo.jpg
  - graphify-out/.graphify_python
  - graphify-out/.graphify_detect.json
  - graphify-out/.graphify_root
-->

---
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

<!-- @trace
source: presentation-manager-production-route
updated: 2026-08-19
code:
  - assets/logo.jpg
  - graphify-out/.graphify_python
  - graphify-out/.graphify_detect.json
  - graphify-out/.graphify_root
-->