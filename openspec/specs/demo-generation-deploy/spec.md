# demo-generation-deploy Specification

## Purpose

TBD - created by archiving change 'realtime-demo-generation'. Update Purpose after archive.

## Requirements

### Requirement: Generate a live demo site from confirmed requirements

The system SHALL generate a working demo web application from a confirmed requirements data pack and deploy it to Cloudflare Pages so the client can operate it during the same meeting.

#### Scenario: Deployment succeeds and returns a usable URL

- **WHEN** a confirmed requirements data pack is passed to this capability
- **THEN** the system SHALL deploy the generated demo to Cloudflare Pages using the production branch, and SHALL return a URL that responds with HTTP 200

#### Scenario: Deployment failure is surfaced, not hidden

- **WHEN** the Cloudflare Pages deployment fails for any reason (quota, name collision, build error)
- **THEN** the system SHALL report the actual failure reason to the caller and SHALL leave any previously deployed working version for that client still reachable at its existing URL


<!-- @trace
source: realtime-demo-generation
updated: 2026-08-22
code:
  - scripts/demo-deploy.sh
  - tests/fixtures/audio-samples/sample-lat-2.wav
  - tools/realtime-voice/README.md
  - assets/logo.jpg
  - .spectra.yaml
  - lib/deployment-versioning.js
  - tests/test-media-generation-failure-shows-notice.js
  - tests/fixtures/audio-samples/elevenlabs-upgrade-decision.md
  - contracts/examples/anson-to-quotemaster-command.example.json
  - tests/fixtures/audio-samples/sample-lat-4.wav
  - tests/fixtures/audio-samples/sample-lat-1.wav
  - tests/fixtures/audio-samples/whisper-latency-log.json
  - tests/test-no-d1-when-no-login-needed.js
  - tests/test-realtime-voice-s2tw-conversion.js
  - CLAUDE.md
  - graphify-out/manifest.json
  - graphify-out/.graphify_detect.json
  - tests/fixtures/audio-samples/sample-70.wav
  - tests/fixtures/audio-samples/sample-mid.wav
  - docs/realtime-voice-architecture.html
  - graphify-out/.graphify_python
  - graphify-out/.graphify_root
  - lib/media-generation.js
  - lib/deployment-analyzer.js
  - tests/test-low-confidence-flagged.js
  - tests/assert.js
  - tests/test-unsupported-third-party-shows-placeholder.js
  - tests/test-case-page-offline-still-works.js
  - tests/test-assumed-guess-never-auto-confirmed.js
  - lib/deployment-engine.js
  - tests/test-command-doc-no-pricing-logic.js
  - tests/test-realtime-voice-writes-to-inbox.js
  - tests/fixtures/demo-test-site/index.html
  - lib/integration-template-generator.js
  - tests/test-deploy-failure-preserves-previous-url.js
  - scripts/demo-deploy-lock.sh
  - tests/fixtures/audio-samples/accuracy-check-transcript.txt
  - tests/test-deploy-failure-surfaces-reason.js
  - tools/realtime-voice/static/index.html
  - tests/fixtures/audio-samples/sample-lat-0.wav
  - tools/realtime-voice/server.py
  - tests/test-service-type-4x4-breakdown.js
  - tests/fixtures/audio-samples/sample-lat-3.wav
  - tests/fixtures/audio-samples/sample-1.wav
  - tests/test-quote-specialist-reads-extended-pack.js
  - tests/run.js
  - tools/realtime-voice/requirements.txt
  - contracts/ANSON-TO-QUOTEMASTER-COMMAND.md
-->

---
### Requirement: Demo includes a D1-backed login backend

The system SHALL provision a Cloudflare D1 database and a minimal login flow for the generated demo when the confirmed requirements call for backend-gated content.

#### Scenario: Demo without backend needs skips D1 provisioning

- **WHEN** the confirmed requirements data pack does not call for any login-gated content
- **THEN** the system SHALL NOT provision a D1 database for that demo


<!-- @trace
source: realtime-demo-generation
updated: 2026-08-22
code:
  - scripts/demo-deploy.sh
  - tests/fixtures/audio-samples/sample-lat-2.wav
  - tools/realtime-voice/README.md
  - assets/logo.jpg
  - .spectra.yaml
  - lib/deployment-versioning.js
  - tests/test-media-generation-failure-shows-notice.js
  - tests/fixtures/audio-samples/elevenlabs-upgrade-decision.md
  - contracts/examples/anson-to-quotemaster-command.example.json
  - tests/fixtures/audio-samples/sample-lat-4.wav
  - tests/fixtures/audio-samples/sample-lat-1.wav
  - tests/fixtures/audio-samples/whisper-latency-log.json
  - tests/test-no-d1-when-no-login-needed.js
  - tests/test-realtime-voice-s2tw-conversion.js
  - CLAUDE.md
  - graphify-out/manifest.json
  - graphify-out/.graphify_detect.json
  - tests/fixtures/audio-samples/sample-70.wav
  - tests/fixtures/audio-samples/sample-mid.wav
  - docs/realtime-voice-architecture.html
  - graphify-out/.graphify_python
  - graphify-out/.graphify_root
  - lib/media-generation.js
  - lib/deployment-analyzer.js
  - tests/test-low-confidence-flagged.js
  - tests/assert.js
  - tests/test-unsupported-third-party-shows-placeholder.js
  - tests/test-case-page-offline-still-works.js
  - tests/test-assumed-guess-never-auto-confirmed.js
  - lib/deployment-engine.js
  - tests/test-command-doc-no-pricing-logic.js
  - tests/test-realtime-voice-writes-to-inbox.js
  - tests/fixtures/demo-test-site/index.html
  - lib/integration-template-generator.js
  - tests/test-deploy-failure-preserves-previous-url.js
  - scripts/demo-deploy-lock.sh
  - tests/fixtures/audio-samples/accuracy-check-transcript.txt
  - tests/test-deploy-failure-surfaces-reason.js
  - tools/realtime-voice/static/index.html
  - tests/fixtures/audio-samples/sample-lat-0.wav
  - tools/realtime-voice/server.py
  - tests/test-service-type-4x4-breakdown.js
  - tests/fixtures/audio-samples/sample-lat-3.wav
  - tests/fixtures/audio-samples/sample-1.wav
  - tests/test-quote-specialist-reads-extended-pack.js
  - tests/run.js
  - tools/realtime-voice/requirements.txt
  - contracts/ANSON-TO-QUOTEMASTER-COMMAND.md
-->

---
### Requirement: Third-party service embed inside the demo

The system SHALL embed a live-style demonstration of a requested third-party service (for example, a LINE OA conversation simulation) inside the generated demo when the client's requirements mention integrating that service.

#### Scenario: Unsupported third-party service falls back explicitly

- **WHEN** the requirements mention a third-party service this capability has no embed template for
- **THEN** the system SHALL render an explicit "integration demo not yet available for this service" placeholder instead of omitting the section silently


<!-- @trace
source: realtime-demo-generation
updated: 2026-08-22
code:
  - scripts/demo-deploy.sh
  - tests/fixtures/audio-samples/sample-lat-2.wav
  - tools/realtime-voice/README.md
  - assets/logo.jpg
  - .spectra.yaml
  - lib/deployment-versioning.js
  - tests/test-media-generation-failure-shows-notice.js
  - tests/fixtures/audio-samples/elevenlabs-upgrade-decision.md
  - contracts/examples/anson-to-quotemaster-command.example.json
  - tests/fixtures/audio-samples/sample-lat-4.wav
  - tests/fixtures/audio-samples/sample-lat-1.wav
  - tests/fixtures/audio-samples/whisper-latency-log.json
  - tests/test-no-d1-when-no-login-needed.js
  - tests/test-realtime-voice-s2tw-conversion.js
  - CLAUDE.md
  - graphify-out/manifest.json
  - graphify-out/.graphify_detect.json
  - tests/fixtures/audio-samples/sample-70.wav
  - tests/fixtures/audio-samples/sample-mid.wav
  - docs/realtime-voice-architecture.html
  - graphify-out/.graphify_python
  - graphify-out/.graphify_root
  - lib/media-generation.js
  - lib/deployment-analyzer.js
  - tests/test-low-confidence-flagged.js
  - tests/assert.js
  - tests/test-unsupported-third-party-shows-placeholder.js
  - tests/test-case-page-offline-still-works.js
  - tests/test-assumed-guess-never-auto-confirmed.js
  - lib/deployment-engine.js
  - tests/test-command-doc-no-pricing-logic.js
  - tests/test-realtime-voice-writes-to-inbox.js
  - tests/fixtures/demo-test-site/index.html
  - lib/integration-template-generator.js
  - tests/test-deploy-failure-preserves-previous-url.js
  - scripts/demo-deploy-lock.sh
  - tests/fixtures/audio-samples/accuracy-check-transcript.txt
  - tests/test-deploy-failure-surfaces-reason.js
  - tools/realtime-voice/static/index.html
  - tests/fixtures/audio-samples/sample-lat-0.wav
  - tools/realtime-voice/server.py
  - tests/test-service-type-4x4-breakdown.js
  - tests/fixtures/audio-samples/sample-lat-3.wav
  - tests/fixtures/audio-samples/sample-1.wav
  - tests/test-quote-specialist-reads-extended-pack.js
  - tests/run.js
  - tools/realtime-voice/requirements.txt
  - contracts/ANSON-TO-QUOTEMASTER-COMMAND.md
-->

---
### Requirement: Automatic placeholder media generation

The system SHALL generate placeholder images or video clips for any demo section that requires visual media the client has not supplied, and SHALL visibly mark that generated media as illustrative, not final.

#### Scenario: Media generation API failure is shown, not left blank

- **WHEN** the image or video generation API call fails
- **THEN** the system SHALL render an explicit "this section failed to generate" notice in that section instead of leaving an unexplained blank area


<!-- @trace
source: realtime-demo-generation
updated: 2026-08-22
code:
  - scripts/demo-deploy.sh
  - tests/fixtures/audio-samples/sample-lat-2.wav
  - tools/realtime-voice/README.md
  - assets/logo.jpg
  - .spectra.yaml
  - lib/deployment-versioning.js
  - tests/test-media-generation-failure-shows-notice.js
  - tests/fixtures/audio-samples/elevenlabs-upgrade-decision.md
  - contracts/examples/anson-to-quotemaster-command.example.json
  - tests/fixtures/audio-samples/sample-lat-4.wav
  - tests/fixtures/audio-samples/sample-lat-1.wav
  - tests/fixtures/audio-samples/whisper-latency-log.json
  - tests/test-no-d1-when-no-login-needed.js
  - tests/test-realtime-voice-s2tw-conversion.js
  - CLAUDE.md
  - graphify-out/manifest.json
  - graphify-out/.graphify_detect.json
  - tests/fixtures/audio-samples/sample-70.wav
  - tests/fixtures/audio-samples/sample-mid.wav
  - docs/realtime-voice-architecture.html
  - graphify-out/.graphify_python
  - graphify-out/.graphify_root
  - lib/media-generation.js
  - lib/deployment-analyzer.js
  - tests/test-low-confidence-flagged.js
  - tests/assert.js
  - tests/test-unsupported-third-party-shows-placeholder.js
  - tests/test-case-page-offline-still-works.js
  - tests/test-assumed-guess-never-auto-confirmed.js
  - lib/deployment-engine.js
  - tests/test-command-doc-no-pricing-logic.js
  - tests/test-realtime-voice-writes-to-inbox.js
  - tests/fixtures/demo-test-site/index.html
  - lib/integration-template-generator.js
  - tests/test-deploy-failure-preserves-previous-url.js
  - scripts/demo-deploy-lock.sh
  - tests/fixtures/audio-samples/accuracy-check-transcript.txt
  - tests/test-deploy-failure-surfaces-reason.js
  - tools/realtime-voice/static/index.html
  - tests/fixtures/audio-samples/sample-lat-0.wav
  - tools/realtime-voice/server.py
  - tests/test-service-type-4x4-breakdown.js
  - tests/fixtures/audio-samples/sample-lat-3.wav
  - tests/fixtures/audio-samples/sample-1.wav
  - tests/test-quote-specialist-reads-extended-pack.js
  - tests/run.js
  - tools/realtime-voice/requirements.txt
  - contracts/ANSON-TO-QUOTEMASTER-COMMAND.md
-->

---
### Requirement: This capability does not deploy through case-page

The `case-page` capability SHALL remain unmodified by this change: it SHALL continue to produce a self-contained HTML file that renders correctly with no network connection and performs no deployment of any kind. All deployment behavior described in this specification SHALL live exclusively in this `demo-generation-deploy` capability.

#### Scenario: case-page's offline guarantee still holds after this change ships

- **WHEN** `case-page` is invoked to produce a static proposal page after this change has shipped
- **THEN** the produced file SHALL still render correctly when opened via the `file://` protocol with no network connection, exactly as before this change


<!-- @trace
source: realtime-demo-generation
updated: 2026-08-22
code:
  - scripts/demo-deploy.sh
  - tests/fixtures/audio-samples/sample-lat-2.wav
  - tools/realtime-voice/README.md
  - assets/logo.jpg
  - .spectra.yaml
  - lib/deployment-versioning.js
  - tests/test-media-generation-failure-shows-notice.js
  - tests/fixtures/audio-samples/elevenlabs-upgrade-decision.md
  - contracts/examples/anson-to-quotemaster-command.example.json
  - tests/fixtures/audio-samples/sample-lat-4.wav
  - tests/fixtures/audio-samples/sample-lat-1.wav
  - tests/fixtures/audio-samples/whisper-latency-log.json
  - tests/test-no-d1-when-no-login-needed.js
  - tests/test-realtime-voice-s2tw-conversion.js
  - CLAUDE.md
  - graphify-out/manifest.json
  - graphify-out/.graphify_detect.json
  - tests/fixtures/audio-samples/sample-70.wav
  - tests/fixtures/audio-samples/sample-mid.wav
  - docs/realtime-voice-architecture.html
  - graphify-out/.graphify_python
  - graphify-out/.graphify_root
  - lib/media-generation.js
  - lib/deployment-analyzer.js
  - tests/test-low-confidence-flagged.js
  - tests/assert.js
  - tests/test-unsupported-third-party-shows-placeholder.js
  - tests/test-case-page-offline-still-works.js
  - tests/test-assumed-guess-never-auto-confirmed.js
  - lib/deployment-engine.js
  - tests/test-command-doc-no-pricing-logic.js
  - tests/test-realtime-voice-writes-to-inbox.js
  - tests/fixtures/demo-test-site/index.html
  - lib/integration-template-generator.js
  - tests/test-deploy-failure-preserves-previous-url.js
  - scripts/demo-deploy-lock.sh
  - tests/fixtures/audio-samples/accuracy-check-transcript.txt
  - tests/test-deploy-failure-surfaces-reason.js
  - tools/realtime-voice/static/index.html
  - tests/fixtures/audio-samples/sample-lat-0.wav
  - tools/realtime-voice/server.py
  - tests/test-service-type-4x4-breakdown.js
  - tests/fixtures/audio-samples/sample-lat-3.wav
  - tests/fixtures/audio-samples/sample-1.wav
  - tests/test-quote-specialist-reads-extended-pack.js
  - tests/run.js
  - tools/realtime-voice/requirements.txt
  - contracts/ANSON-TO-QUOTEMASTER-COMMAND.md
-->

---
### Requirement: Command handoff to the quote-master project

The system SHALL emit a command document following the `ANSON-TO-QUOTEMASTER-COMMAND` contract once the client's quote is confirmed, containing at minimum: `client_id`, `confirmed_price`, `terms`, and `case_ref`. This capability SHALL NOT implement any dynamic pricing, deadline countdown, or automated follow-up notification logic — that logic belongs exclusively to the separate `quote-master` project.

#### Scenario: Command document is emitted, not the pricing logic itself

- **WHEN** a client's quote is confirmed and this capability is asked to hand off to `quote-master`
- **THEN** the system SHALL write a command document matching the `ANSON-TO-QUOTEMASTER-COMMAND` field shape, and SHALL NOT perform any price escalation, countdown tracking, or notification dispatch itself

<!-- @trace
source: realtime-demo-generation
updated: 2026-08-22
code:
  - scripts/demo-deploy.sh
  - tests/fixtures/audio-samples/sample-lat-2.wav
  - tools/realtime-voice/README.md
  - assets/logo.jpg
  - .spectra.yaml
  - lib/deployment-versioning.js
  - tests/test-media-generation-failure-shows-notice.js
  - tests/fixtures/audio-samples/elevenlabs-upgrade-decision.md
  - contracts/examples/anson-to-quotemaster-command.example.json
  - tests/fixtures/audio-samples/sample-lat-4.wav
  - tests/fixtures/audio-samples/sample-lat-1.wav
  - tests/fixtures/audio-samples/whisper-latency-log.json
  - tests/test-no-d1-when-no-login-needed.js
  - tests/test-realtime-voice-s2tw-conversion.js
  - CLAUDE.md
  - graphify-out/manifest.json
  - graphify-out/.graphify_detect.json
  - tests/fixtures/audio-samples/sample-70.wav
  - tests/fixtures/audio-samples/sample-mid.wav
  - docs/realtime-voice-architecture.html
  - graphify-out/.graphify_python
  - graphify-out/.graphify_root
  - lib/media-generation.js
  - lib/deployment-analyzer.js
  - tests/test-low-confidence-flagged.js
  - tests/assert.js
  - tests/test-unsupported-third-party-shows-placeholder.js
  - tests/test-case-page-offline-still-works.js
  - tests/test-assumed-guess-never-auto-confirmed.js
  - lib/deployment-engine.js
  - tests/test-command-doc-no-pricing-logic.js
  - tests/test-realtime-voice-writes-to-inbox.js
  - tests/fixtures/demo-test-site/index.html
  - lib/integration-template-generator.js
  - tests/test-deploy-failure-preserves-previous-url.js
  - scripts/demo-deploy-lock.sh
  - tests/fixtures/audio-samples/accuracy-check-transcript.txt
  - tests/test-deploy-failure-surfaces-reason.js
  - tools/realtime-voice/static/index.html
  - tests/fixtures/audio-samples/sample-lat-0.wav
  - tools/realtime-voice/server.py
  - tests/test-service-type-4x4-breakdown.js
  - tests/fixtures/audio-samples/sample-lat-3.wav
  - tests/fixtures/audio-samples/sample-1.wav
  - tests/test-quote-specialist-reads-extended-pack.js
  - tests/run.js
  - tools/realtime-voice/requirements.txt
  - contracts/ANSON-TO-QUOTEMASTER-COMMAND.md
-->