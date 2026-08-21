# Family Sharing Specification

## Purpose

Lets exactly two people share one household, so they see and manage the same expenses, categories, income, and budget as a single unit instead of two separate accounts.

## Requirements

### Requirement: Household identity
The system SHALL ensure every user belongs to exactly one household, creating one transparently the first time it's needed, with a shareable invite code.

#### Scenario: Household created automatically on first use
- **WHEN** a user who does not yet belong to a household opens their household screen for the first time
- **THEN** the system creates a household for them, adds them as its only member, and shows its invite code

### Requirement: Joining a household
The system SHALL let a user join another household using its invite code, moving them out of their current household, as long as the target household has fewer than two members.

#### Scenario: Successful join
- **WHEN** a user submits a valid invite code for a household that has exactly one member
- **THEN** the system moves the user into that household as its second member

#### Scenario: Invalid invite code rejected
- **WHEN** a user submits an invite code that does not match any household
- **THEN** the system rejects the join and tells them to check the code

#### Scenario: Household already full rejected
- **WHEN** a user submits a valid invite code for a household that already has two members
- **THEN** the system rejects the join

### Requirement: Shared access to household data
The system SHALL let both members of a household view and edit each other's expenses and categories, per the delta to `expense-tracking`, and share one combined budget and monthly overview, per the delta to `budget-planning`.

#### Scenario: Viewing a household member's expense
- **WHEN** a user opens their expense list and their household member has recorded an expense
- **THEN** they see that expense alongside their own

#### Scenario: Editing a household member's expense
- **WHEN** a user edits or deletes an expense recorded by their household member
- **THEN** the system applies the change, the same as if it were their own
