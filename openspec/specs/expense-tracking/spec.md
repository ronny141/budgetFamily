# Expense Tracking Specification

## Purpose

Lets a user record, categorize, view, and manage their own expenses, with a starter set of predefined categories plus the ability to add custom ones.

## Requirements

### Requirement: Expense categories
The system SHALL provide a starter set of predefined categories available to every user, and SHALL let a user create their own custom categories.

#### Scenario: Predefined categories available by default
- **WHEN** a user opens the category list for the first time
- **THEN** they see the starter set of predefined categories without having to create any

#### Scenario: Creating a custom category
- **WHEN** a user submits a name for a new category
- **THEN** the system adds it to their category list, available for use on their expenses

#### Scenario: Custom category name required
- **WHEN** a user submits an empty name for a new category
- **THEN** the system rejects the creation and asks for a name

### Requirement: Recording expenses
The system SHALL let a user record an expense with an amount, a category, a date, and an optional description.

#### Scenario: Successful expense creation
- **WHEN** a user submits a positive amount, an existing category, and a date
- **THEN** the system creates the expense, attributed to that user

#### Scenario: Invalid amount rejected
- **WHEN** a user submits an amount that is zero, negative, or not a number
- **THEN** the system rejects the expense and asks for a valid amount

#### Scenario: Missing category rejected
- **WHEN** a user submits an expense without selecting a category
- **THEN** the system rejects the expense and asks them to choose a category

### Requirement: Viewing expenses
The system SHALL let a user see a list of their own recorded expenses.

#### Scenario: Listing expenses
- **WHEN** a user opens their expense list
- **THEN** they see their own recorded expenses, not those of any other user

### Requirement: Editing and deleting expenses
The system SHALL let a user edit or delete an expense they created.

#### Scenario: Editing an expense
- **WHEN** a user changes the amount, category, date, or description of one of their own expenses and saves
- **THEN** the system updates that expense with the new values

#### Scenario: Deleting an expense
- **WHEN** a user deletes one of their own expenses
- **THEN** the system removes it from their expense list
