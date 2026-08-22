## ADDED Requirements

### Requirement: Generate a live demo site from confirmed requirements

The system SHALL generate a working demo web application from a confirmed requirements data pack and deploy it to Cloudflare Pages so the client can operate it during the same meeting.

#### Scenario: Deployment succeeds and returns a usable URL

- **WHEN** a confirmed requirements data pack is passed to this capability
- **THEN** the system SHALL deploy the generated demo to Cloudflare Pages using the production branch, and SHALL return a URL that responds with HTTP 200

#### Scenario: Deployment failure is surfaced, not hidden

- **WHEN** the Cloudflare Pages deployment fails for any reason (quota, name collision, build error)
- **THEN** the system SHALL report the actual failure reason to the caller and SHALL leave any previously deployed working version for that client still reachable at its existing URL

### Requirement: Demo includes a D1-backed login backend

The system SHALL provision a Cloudflare D1 database and a minimal login flow for the generated demo when the confirmed requirements call for backend-gated content.

#### Scenario: Demo without backend needs skips D1 provisioning

- **WHEN** the confirmed requirements data pack does not call for any login-gated content
- **THEN** the system SHALL NOT provision a D1 database for that demo

### Requirement: Third-party service embed inside the demo

The system SHALL embed a live-style demonstration of a requested third-party service (for example, a LINE OA conversation simulation) inside the generated demo when the client's requirements mention integrating that service.

#### Scenario: Unsupported third-party service falls back explicitly

- **WHEN** the requirements mention a third-party service this capability has no embed template for
- **THEN** the system SHALL render an explicit "integration demo not yet available for this service" placeholder instead of omitting the section silently

### Requirement: Automatic placeholder media generation

The system SHALL generate placeholder images or video clips for any demo section that requires visual media the client has not supplied, and SHALL visibly mark that generated media as illustrative, not final.

#### Scenario: Media generation API failure is shown, not left blank

- **WHEN** the image or video generation API call fails
- **THEN** the system SHALL render an explicit "this section failed to generate" notice in that section instead of leaving an unexplained blank area

### Requirement: This capability does not deploy through case-page

The `case-page` capability SHALL remain unmodified by this change: it SHALL continue to produce a self-contained HTML file that renders correctly with no network connection and performs no deployment of any kind. All deployment behavior described in this specification SHALL live exclusively in this `demo-generation-deploy` capability.

#### Scenario: case-page's offline guarantee still holds after this change ships

- **WHEN** `case-page` is invoked to produce a static proposal page after this change has shipped
- **THEN** the produced file SHALL still render correctly when opened via the `file://` protocol with no network connection, exactly as before this change

### Requirement: Command handoff to the quote-master project

The system SHALL emit a command document following the `ANSON-TO-QUOTEMASTER-COMMAND` contract once the client's quote is confirmed, containing at minimum: `client_id`, `confirmed_price`, `terms`, and `case_ref`. This capability SHALL NOT implement any dynamic pricing, deadline countdown, or automated follow-up notification logic — that logic belongs exclusively to the separate `quote-master` project.

#### Scenario: Command document is emitted, not the pricing logic itself

- **WHEN** a client's quote is confirmed and this capability is asked to hand off to `quote-master`
- **THEN** the system SHALL write a command document matching the `ANSON-TO-QUOTEMASTER-COMMAND` field shape, and SHALL NOT perform any price escalation, countdown tracking, or notification dispatch itself
