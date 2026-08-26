## MODIFIED Requirements

### Requirement: Local push-to-record web interface
The system SHALL provide a locally-hosted web page reachable from both a desktop browser and a phone browser on the same local network, with a single start/stop control to begin and end microphone capture. The page SHALL display only recording controls, microphone permission/recording status, the live transcript, and an advisor connection status indicator ("顧問已連線／未連線"); it SHALL NOT display a multi-column analysis panel, an advisor chat panel, or any hard-coded canned AI reply.

#### Scenario: Operator starts a recording session
- **WHEN** the operator opens the local page and presses "Start"
- **THEN** the browser SHALL request microphone permission and, once granted, begin streaming audio to the local server

#### Scenario: Microphone permission denied
- **WHEN** the operator denies the browser's microphone permission prompt
- **THEN** the page SHALL display an explicit message stating that microphone permission is required to start recording, and SHALL NOT show a blank or silent state

#### Scenario: Phone browser as microphone source
- **WHEN** a phone on the same Wi-Fi network opens the local server's LAN address in its browser
- **THEN** the phone SHALL be able to start and stop recording the same way as the desktop, writing to the same session output file

#### Scenario: Page shows advisor connection status, not advisor output
- **WHEN** the CLI advisor process is running and attached to the current session
- **THEN** the page SHALL show "顧問已連線"; and when the advisor process is not running, the page SHALL show "顧問未連線"; in neither case SHALL the page render the advisor's analysis content, response options, or a chat interface

### Requirement: Manually-started, non-persistent service
The system SHALL run only while a human operator has explicitly started it in a terminal, SHALL NOT register any startup daemon, cron job, or launchd agent, and SHALL stop accepting new recordings only when the operator manually terminates the process. The single startup command SHALL start both the recording server and the CLI advisor process together, and stopping the session SHALL stop both together, leaving no residual advisor or monitoring process.

#### Scenario: Operator closes the terminal session
- **WHEN** the operator presses Ctrl+C in the terminal running the service
- **THEN** the process SHALL exit and no further recording SHALL be possible until the operator manually restarts it

#### Scenario: No autostart registration exists
- **WHEN** the system is installed following the setup instructions
- **THEN** no launchd plist, cron entry, or other autostart mechanism SHALL be created for this service

#### Scenario: Single command starts both recording and advisor
- **WHEN** the operator runs the single startup command
- **THEN** the recording server and the CLI advisor process SHALL both be started, and the terminal SHALL report both as ready before recording begins

#### Scenario: Stopping the session stops the advisor too
- **WHEN** the operator stops the recording session
- **THEN** the CLI advisor process SHALL also terminate, and no advisor or monitoring process SHALL remain running afterward
