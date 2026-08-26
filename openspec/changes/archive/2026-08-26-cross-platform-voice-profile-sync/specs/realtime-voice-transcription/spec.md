## ADDED Requirements

### Requirement: Voice profile root is resolved from explicit, saved, or platform configuration

The system SHALL resolve the voice profile root using this order: explicit `ANSON_VOICE_PROFILE_DIR`, saved user configuration, supported platform sync directory, then the existing local fallback. The resolution SHALL NOT change the existing profile JSON schema or speaker attribution behavior.

#### Scenario: Explicit profile directory wins

- **GIVEN** `ANSON_VOICE_PROFILE_DIR` points to a valid profile directory
- **WHEN** the service starts
- **THEN** the service SHALL use that directory regardless of detected iCloud or Google Drive paths

#### Scenario: No sync provider is available

- **GIVEN** no explicit directory, saved directory, iCloud, or Google Drive path is available
- **WHEN** the service starts
- **THEN** the service SHALL use the existing local profile fallback and expose that the profile is local-only
