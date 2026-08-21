## Why

budgetFamily currently has no way to identify who is using the app. Every other planned capability — tracking expenses, setting a budget, and sharing a household with a family member — needs a concept of an authenticated user to attribute data to and to gate access. Authentication is the foundation everything else builds on.

## What Changes

- Add user registration with email and password.
- Add login with email and password, establishing an authenticated session.
- Add logout, ending the session.
- Add basic session persistence so a user stays logged in across app restarts.
- Add minimal account fields needed later for household sharing (a display name), without building the sharing feature itself.

## Capabilities

### New Capabilities
- `user-auth`: registration, login, logout, and session persistence for a single user account using email and password.

### Modified Capabilities
(none — this is the first capability in the project)

## Impact

- New screens: sign up, log in.
- New app-wide auth state (current user / session), consumed by every future screen that needs to know who is logged in.
- Introduces a backend/auth provider choice (evaluated in design.md) — first change in the project to depend on external infrastructure.
- No existing code changes, since this is the first OpenSpec change for this project.
