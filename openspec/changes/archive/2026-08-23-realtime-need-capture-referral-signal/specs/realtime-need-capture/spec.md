## ADDED Requirements

### Requirement: Optional referral-signal field

The system SHALL include a sixth, optional decomposition field — referral/introduction opportunity — only when the transcript contains a signal that the client may introduce or refer another opportunity. This field SHALL NOT be included when no such signal is present, unlike the five fixed fields which are always filled (using "pending-confirmation" when information is missing).

#### Scenario: Referral field appears only when a signal exists

- **WHEN** the client's speech contains a reference to introducing, referring, or connecting the salesperson to another person or opportunity
- **THEN** the decomposition output SHALL include the referral field, tagged with the existing three-state marking convention (confirmed / pending-confirmation / assumed-guess)

#### Scenario: No referral field when there is no signal

- **WHEN** the transcript contains no reference to introductions, referrals, or third-party opportunities
- **THEN** the decomposition output SHALL NOT include the referral field at all

#### Scenario: Assumed referral signal is never auto-confirmed

- **WHEN** the system infers a possible referral opportunity that the client did not explicitly state
- **THEN** the referral field SHALL be tagged "assumed-guess", and the system SHALL NOT upgrade it to "confirmed" without explicit human confirmation
