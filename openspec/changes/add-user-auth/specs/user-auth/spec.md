## Purpose

Lets a person create an account and sign in with email and password, so every other budgetFamily capability can attribute data to a specific user and gate access behind an authenticated session.

## ADDED Requirements

### Requirement: User registration
The system SHALL let a person create an account with an email, a password, and a display name.

#### Scenario: Successful registration
- **WHEN** a person submits a valid, unused email, a password meeting the minimum strength rules, and a display name
- **THEN** the system creates the account and starts an authenticated session for that user

#### Scenario: Duplicate email rejected
- **WHEN** a person submits an email that already has an account
- **THEN** the system rejects the registration and tells the person the email is already in use, without revealing further account details

#### Scenario: Weak password rejected
- **WHEN** a person submits a password that does not meet the minimum strength rules
- **THEN** the system rejects the registration and explains the password requirements

#### Scenario: Invalid email format rejected
- **WHEN** a person submits a value that is not a valid email address
- **THEN** the system rejects the registration and asks for a valid email

### Requirement: User login
The system SHALL let a registered person authenticate with their email and password.

#### Scenario: Successful login
- **WHEN** a person submits the email and password of an existing account
- **THEN** the system starts an authenticated session for that user

#### Scenario: Invalid credentials rejected
- **WHEN** a person submits an email/password combination that does not match any account
- **THEN** the system rejects the login with a generic invalid-credentials message, without revealing whether the email exists

### Requirement: Session persistence
The system SHALL keep a person signed in across app restarts until they explicitly log out or the session expires.

#### Scenario: Session survives app restart
- **WHEN** an authenticated person closes and reopens the app
- **THEN** the system restores their session without asking them to log in again

### Requirement: Logout
The system SHALL let an authenticated person end their session.

#### Scenario: Successful logout
- **WHEN** an authenticated person triggers logout
- **THEN** the system ends their session and requires login again before accessing user-specific data
