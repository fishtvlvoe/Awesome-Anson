# realtime-need-capture Specification

## Purpose

TBD - created by archiving change 'realtime-demo-generation'. Update Purpose after archive.

## Requirements

### Requirement: Real-time speech-to-text during client conversation

The system SHALL transcribe spoken conversation between the salesperson and the client into text in near-real-time while the conversation is in progress.

#### Scenario: Low-confidence transcription is flagged, not guessed

- **WHEN** the speech-to-text engine returns a segment below its confidence threshold
- **THEN** the system SHALL mark that segment as "unclear, needs manual review" instead of silently inserting a guessed transcription into the need-decomposition output


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
### Requirement: Real-time need decomposition

The system SHALL decompose the transcribed conversation, as it happens, into the five categories: target audience, scenario, pain point, need, and solution.

#### Scenario: Service-type engagement uses the 4x4 breakdown instead

- **WHEN** the engagement is classified as a service-type task (as opposed to a one-off deliverable)
- **THEN** the system SHALL decompose the need using the 4x4 grid (before-service / during-service / after-service, each with 4 checkpoints) instead of the five-category breakdown


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
### Requirement: Every decomposed item carries a confirmation status

The system SHALL tag every item it produces in the decomposition output with exactly one of: "confirmed", "pending-confirmation", or "assumed-guess", following the same tagging convention already used by the `project-manager` agent's FRD output.

#### Scenario: Guessed item is never presented as confirmed

- **WHEN** the system infers a need that the client did not explicitly state
- **THEN** the output SHALL tag that item as "assumed-guess", and the system SHALL NOT upgrade it to "confirmed" without explicit human confirmation


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
### Requirement: Output feeds the existing PM-to-Quote Data Pack format

The system SHALL produce a data pack compatible with the existing `PM-to-Quote Data Pack` contract, extended with two additional fields: `capture_mode` (one of `realtime` or `post-hoc`) and `decomposition` (the five-category breakdown or the 4x4 grid, as an array).

#### Scenario: Downstream quotation flow consumes the extended pack unchanged

- **WHEN** the `commercial-proposal-quotation-specialist` agent reads a data pack produced in `realtime` capture mode
- **THEN** it SHALL be able to process the pack using its existing logic, treating the two new fields as additive metadata that does not break the existing contract shape

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