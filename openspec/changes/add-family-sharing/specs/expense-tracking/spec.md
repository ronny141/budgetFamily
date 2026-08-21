## MODIFIED Requirements

### Requirement: Expense categories
The system SHALL provide a starter set of predefined categories available to every user, and SHALL let a user create their own custom categories. A user's custom categories SHALL also be visible to their household member, if they belong to one.

#### Scenario: Predefined categories available by default
- **WHEN** a user opens the category list for the first time
- **THEN** they see the starter set of predefined categories without having to create any

#### Scenario: Creating a custom category
- **WHEN** a user submits a name for a new category
- **THEN** the system adds it to their category list, available for use on their expenses, and visible to their household member if they belong to one

#### Scenario: Custom category name required
- **WHEN** a user submits an empty name for a new category
- **THEN** the system rejects the creation and asks for a name

### Requirement: Viewing expenses
The system SHALL let a user see a list of their own recorded expenses, plus their household member's, if they belong to a household.

#### Scenario: Listing expenses
- **WHEN** a user opens their expense list
- **THEN** they see their own recorded expenses and, if they belong to a household, their household member's, but no one else's

### Requirement: Editing and deleting expenses
The system SHALL let a user edit or delete an expense recorded by themselves or, if they belong to a household, by their household member.

#### Scenario: Editing an expense
- **WHEN** a user changes the amount, category, date, or description of an expense visible to them and saves
- **THEN** the system updates that expense with the new values

#### Scenario: Deleting an expense
- **WHEN** a user deletes an expense visible to them
- **THEN** the system removes it from the expense list
