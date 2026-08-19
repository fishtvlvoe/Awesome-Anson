# case-page Specification

## Purpose

TBD - created by archiving change 'case-page'. Update Purpose after archive.

## Requirements

### Requirement: Generate self-contained HTML page from confirmed content

The system SHALL generate a single self-contained HTML file from confirmed proposal/content input. The file SHALL be viewable by opening it directly in a browser via the `file://` protocol, without requiring a network connection or any login.

#### Scenario: Confirmed content produces a valid standalone page

- **WHEN** the caller provides proposal/content marked as confirmed
- **THEN** case-page generates a single `.html` file containing all necessary CSS and structure inline, and the file renders correctly when opened directly in a browser


<!-- @trace
source: case-page
updated: 2026-08-19
code:
  - graphify-out/.graphify_detect.json
  - assets/logo.jpg
  - graphify-out/.graphify_root
  - graphify-out/.graphify_python
-->

---
### Requirement: Reject unconfirmed input

The system SHALL NOT generate a page when the provided content still contains unresolved markers (for example items tagged as pending or as an unverified guess). The system SHALL instead report which items are unresolved and SHALL NOT produce a placeholder or partial page.

#### Scenario: Input contains unresolved items

- **WHEN** the provided content includes items marked as pending or unconfirmed
- **THEN** case-page does not generate the page and reports which items are unresolved instead


<!-- @trace
source: case-page
updated: 2026-08-19
code:
  - graphify-out/.graphify_detect.json
  - assets/logo.jpg
  - graphify-out/.graphify_root
  - graphify-out/.graphify_python
-->

---
### Requirement: No external service or account dependency

Generated pages SHALL NOT require login, OAuth, or any account-gated external service to render or view. The generation process SHALL NOT call note-bridge or any other Git-backed collaboration platform that requires authentication to write content.

#### Scenario: Page opens without network access

- **WHEN** a generated page is opened with no network connection available
- **THEN** the full content and layout render correctly, because all CSS is inlined and fonts fall back to local system fonts rather than requiring an external CDN


<!-- @trace
source: case-page
updated: 2026-08-19
code:
  - graphify-out/.graphify_detect.json
  - assets/logo.jpg
  - graphify-out/.graphify_root
  - graphify-out/.graphify_python
-->

---
### Requirement: Support light and dark viewer themes

Generated pages SHALL define colors as tokens supporting both light and dark presentation via `prefers-color-scheme`, with legible text-to-background contrast in both modes.

#### Scenario: Dark mode contrast

- **WHEN** the page is opened in a browser with a dark color scheme preference
- **THEN** text remains legible against the background with sufficient contrast

#### Scenario: Light mode contrast

- **WHEN** the page is opened in a browser with a light color scheme preference
- **THEN** text remains legible against the background with sufficient contrast


<!-- @trace
source: case-page
updated: 2026-08-19
code:
  - graphify-out/.graphify_detect.json
  - assets/logo.jpg
  - graphify-out/.graphify_root
  - graphify-out/.graphify_python
-->

---
### Requirement: Generation is out of scope for deployment and account management

The case-page Skill SHALL only produce the HTML file. It SHALL NOT deploy the file to any hosting service, SHALL NOT create or manage any GitHub/GitLab account or access token, and SHALL NOT produce a shareable link with access controls such as a password or expiration time.

#### Scenario: Output is a local file only

- **WHEN** case-page finishes generating a page
- **THEN** the result is a local `.html` file with no deployment, hosting, or link-sharing action performed by the Skill

<!-- @trace
source: case-page
updated: 2026-08-19
code:
  - graphify-out/.graphify_detect.json
  - assets/logo.jpg
  - graphify-out/.graphify_root
  - graphify-out/.graphify_python
-->