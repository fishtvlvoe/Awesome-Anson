# cross-platform-voice-profile-sync Specification

## Purpose

TBD - created by archiving change 'cross-platform-voice-profile-sync'. Update Purpose after archive.

## Requirements

### Requirement: macOS selects iCloud profile storage

On macOS, when iCloud Drive is available and no explicit `ANSON_VOICE_PROFILE_DIR` override exists, the installer and service SHALL select `iCloud Drive/Awesome-Anson/voice-profile/` as the profile root.

#### Scenario: Two Macs share one profile

- **GIVEN** both Macs use the same iCloud account and the iCloud Drive root is available
- **WHEN** the second Mac starts the service after the first Mac has created a profile
- **THEN** the second Mac SHALL read the shared profile without requiring a new recording


<!-- @trace
source: cross-platform-voice-profile-sync
updated: 2026-08-26
code:
  - tools/realtime-voice/static/voice-profile.html
  - scripts/setup-realtime-voice.sh
  - scripts/anson-sync.js
  - tools/realtime-voice/README.md
  - tests/test-realtime-voice-profile-sync.js
  - tests/test-anson-agent-roster.js
  - tools/realtime-voice/static/realtime-workbench-c.css
  - tests/test-realtime-voice-identity.js
  - tests/test-anson-sync.js
  - tests/test-design-agents.js
  - tools/realtime-voice/voice_profile_sync.py
  - README.md
  - docs/SR-realtime-cli-advisor.md
  - tools/realtime-voice/server.py
  - docs/agent-resources/design-resources.md
  - tools/realtime-voice/static/index.html
-->

---
### Requirement: Windows selects Google Drive profile storage

On Windows, when Google Drive for Desktop is available and no explicit `ANSON_VOICE_PROFILE_DIR` override exists, the installer and service SHALL select `My Drive/Awesome-Anson/voice-profile/` under the detected Google Drive root.

#### Scenario: Windows devices share one profile

- **GIVEN** both Windows devices use the same Google Drive account and Google Drive for Desktop has synced the folder
- **WHEN** the second device starts the service
- **THEN** the second device SHALL read the shared profile without requiring a new recording


<!-- @trace
source: cross-platform-voice-profile-sync
updated: 2026-08-26
code:
  - tools/realtime-voice/static/voice-profile.html
  - scripts/setup-realtime-voice.sh
  - scripts/anson-sync.js
  - tools/realtime-voice/README.md
  - tests/test-realtime-voice-profile-sync.js
  - tests/test-anson-agent-roster.js
  - tools/realtime-voice/static/realtime-workbench-c.css
  - tests/test-realtime-voice-identity.js
  - tests/test-anson-sync.js
  - tests/test-design-agents.js
  - tools/realtime-voice/voice_profile_sync.py
  - README.md
  - docs/SR-realtime-cli-advisor.md
  - tools/realtime-voice/server.py
  - docs/agent-resources/design-resources.md
  - tools/realtime-voice/static/index.html
-->

---
### Requirement: Profile migration is verified before switching

When a local-only profile exists and a valid sync directory is detected, the system SHALL copy the profile and its sample files, verify their checksums, and only then switch the configured profile root.

#### Scenario: Existing local profile is migrated

- **GIVEN** a valid local profile exists and the sync directory is empty
- **WHEN** setup resolves the sync directory
- **THEN** the profile SHALL be copied and checksum-verified, the local source SHALL remain recoverable, and subsequent reads SHALL use the sync directory


<!-- @trace
source: cross-platform-voice-profile-sync
updated: 2026-08-26
code:
  - tools/realtime-voice/static/voice-profile.html
  - scripts/setup-realtime-voice.sh
  - scripts/anson-sync.js
  - tools/realtime-voice/README.md
  - tests/test-realtime-voice-profile-sync.js
  - tests/test-anson-agent-roster.js
  - tools/realtime-voice/static/realtime-workbench-c.css
  - tests/test-realtime-voice-identity.js
  - tests/test-anson-sync.js
  - tests/test-design-agents.js
  - tools/realtime-voice/voice_profile_sync.py
  - README.md
  - docs/SR-realtime-cli-advisor.md
  - tools/realtime-voice/server.py
  - docs/agent-resources/design-resources.md
  - tools/realtime-voice/static/index.html
-->

---
### Requirement: Conflicting profiles are never silently overwritten

When local and sync profile data both exist but differ, the system SHALL report a profile sync conflict and SHALL NOT overwrite, merge, or delete either profile.

#### Scenario: Local and sync profiles differ

- **GIVEN** both locations contain profiles with different ids or sample checksums
- **WHEN** setup or service startup resolves the profile root
- **THEN** the system SHALL expose `profile_sync_conflict` and require an explicit user decision


<!-- @trace
source: cross-platform-voice-profile-sync
updated: 2026-08-26
code:
  - tools/realtime-voice/static/voice-profile.html
  - scripts/setup-realtime-voice.sh
  - scripts/anson-sync.js
  - tools/realtime-voice/README.md
  - tests/test-realtime-voice-profile-sync.js
  - tests/test-anson-agent-roster.js
  - tools/realtime-voice/static/realtime-workbench-c.css
  - tests/test-realtime-voice-identity.js
  - tests/test-anson-sync.js
  - tests/test-design-agents.js
  - tools/realtime-voice/voice_profile_sync.py
  - README.md
  - docs/SR-realtime-cli-advisor.md
  - tools/realtime-voice/server.py
  - docs/agent-resources/design-resources.md
  - tools/realtime-voice/static/index.html
-->

---
### Requirement: Sync state is visible

The service SHALL expose whether the profile is synchronized, local-only, unavailable, or in conflict, separately from whether the voice identity itself is ready.

#### Scenario: Provider is unavailable

- **GIVEN** no supported sync provider is detected
- **WHEN** the service starts
- **THEN** the service SHALL remain usable with local storage and SHALL visibly report `local_only` or `sync_provider_not_found`

<!-- @trace
source: cross-platform-voice-profile-sync
updated: 2026-08-26
code:
  - tools/realtime-voice/static/voice-profile.html
  - scripts/setup-realtime-voice.sh
  - scripts/anson-sync.js
  - tools/realtime-voice/README.md
  - tests/test-realtime-voice-profile-sync.js
  - tests/test-anson-agent-roster.js
  - tools/realtime-voice/static/realtime-workbench-c.css
  - tests/test-realtime-voice-identity.js
  - tests/test-anson-sync.js
  - tests/test-design-agents.js
  - tools/realtime-voice/voice_profile_sync.py
  - README.md
  - docs/SR-realtime-cli-advisor.md
  - tools/realtime-voice/server.py
  - docs/agent-resources/design-resources.md
  - tools/realtime-voice/static/index.html
-->