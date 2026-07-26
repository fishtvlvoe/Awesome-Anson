# Agent operating system

## ADDED Requirements

### Requirement: The workspace SHALL provide two distinct Agent identities

The workspace SHALL provide a Project Manager Agent and a Commercial Proposal & Quotation Specialist with separate responsibilities, inputs, outputs, and stop points.

#### Scenario: Project Manager Agent receives a new case

- **WHEN** a user provides a transcript, project folder, or prototype
- **THEN** the Project Manager Agent SHALL inspect the evidence, classify complexity, and produce a confirmed-or-pending requirements handoff

##### Example:

- **GIVEN** a SaaS request with payment, email, video, and domain integration
- **WHEN** the Agent starts the case
- **THEN** it SHALL route the case through `grill-with-docs` before producing the FRD

#### Scenario: Quotation Agent receives a confirmed handoff

- **WHEN** the PM-to-Quote Data Pack is available
- **THEN** the Commercial Proposal & Quotation Specialist SHALL check completeness before producing a quote draft

##### Example:

- **GIVEN** required scope and deployment responsibility are confirmed but an add-on price is pending
- **WHEN** the Quotation Agent reads the data pack
- **THEN** it SHALL ask for the missing price decision and SHALL not present the add-on as a confirmed total

### Requirement: The workspace SHALL define a stable PM-to-Quote handoff

The handoff SHALL contain project goals, users, success criteria, scope categories, integrations, responsibility boundaries, commercial fields, decisions, open questions, evidence sources, and a status for every field.

#### Scenario: Handoff is incomplete

- **WHEN** a price-impacting scope or responsibility field is `pending` or `inferred`
- **THEN** the handoff SHALL remain unconfirmed and the Quotation Agent SHALL stop for clarification

##### Example:

- **GIVEN** source-code ownership is still `pending`
- **WHEN** the handoff is prepared
- **THEN** it SHALL not state that full source code delivery is included

### Requirement: The client-quote command SHALL preserve human confirmation gates

The command SHALL run the two Agent roles in order but SHALL stop for confirmation after grill alignment, FRD/Data Pack review, pricing review, and HTML review.

#### Scenario: User runs the combined entry point

- **WHEN** the user runs `/client-quote` with a case path
- **THEN** the workflow SHALL reuse the case files, run PM before quotation, and save outputs under the case directory

##### Example:

- **GIVEN** `/client-quote ./cases/demo-client`
- **WHEN** the case has no unresolved grill decision
- **THEN** the workflow SHALL use the existing PM flow and then stop for Data Pack confirmation before quotation

### Requirement: The workspace SHALL protect client data

The workspace SHALL prohibit secrets and unauthorized client data from the Agent repository and SHALL keep case-specific records in the designated case folder.

#### Scenario: A case contains credentials

- **WHEN** a case includes an API key, password, or payment secret
- **THEN** the Agents SHALL exclude it from Git-tracked files and SHALL request a safe reference instead

##### Example:

- **GIVEN** a client transcript contains a payment API key
- **WHEN** the PM Agent creates the Data Pack
- **THEN** the Data Pack SHALL record only the integration name and credential owner, not the secret value
