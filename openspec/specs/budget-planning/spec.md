# Budget Planning Specification

## Purpose

Lets a user track income — including income received in a currency other than the app's base currency — and set a monthly budget limit per expense category, and see how their spending this month compares to that limit.

## Requirements

### Requirement: Recording income
The system SHALL let a user record income with an amount, a currency, a date, and an optional description. The app's base currency is Colombian pesos (COP). When the currency is not COP, the system SHALL require a positive exchange rate and SHALL convert the amount to COP using it.

#### Scenario: Successful income creation in the base currency
- **WHEN** a user submits a positive amount in COP and a date
- **THEN** the system creates the income entry, attributed to that user, with its COP amount equal to the submitted amount

#### Scenario: Successful income creation in another currency
- **WHEN** a user submits a positive amount in a currency other than COP, a positive exchange rate, and a date
- **THEN** the system creates the income entry, attributed to that user, with its COP amount computed as the submitted amount times the exchange rate

#### Scenario: Invalid income amount rejected
- **WHEN** a user submits an amount that is zero, negative, or not a number
- **THEN** the system rejects the income entry and asks for a valid amount

#### Scenario: Missing exchange rate rejected
- **WHEN** a user submits an income entry in a currency other than COP without a positive exchange rate
- **THEN** the system rejects the income entry and asks for a valid exchange rate

### Requirement: Viewing, editing, and deleting income
The system SHALL let a user view, edit, or delete their own income entries.

#### Scenario: Listing income
- **WHEN** a user opens their income list
- **THEN** they see their own recorded income entries, not those of any other user, each showing its original amount/currency and its converted COP amount

#### Scenario: Editing an income entry
- **WHEN** a user changes the amount, currency, exchange rate, date, or description of one of their own income entries and saves
- **THEN** the system updates that entry, recomputing its COP amount if the amount, currency, or exchange rate changed

#### Scenario: Deleting an income entry
- **WHEN** a user deletes one of their own income entries
- **THEN** the system removes it from their income list

### Requirement: Category budget limits
The system SHALL let a user set a monthly budget limit for one of their categories, applied to every calendar month.

#### Scenario: Setting a budget limit
- **WHEN** a user submits a positive limit amount for one of their categories
- **THEN** the system saves it as that category's monthly budget limit

#### Scenario: Updating a budget limit
- **WHEN** a user changes the limit amount for a category that already has one
- **THEN** the system replaces the existing limit with the new value

#### Scenario: Invalid budget limit rejected
- **WHEN** a user submits a limit that is zero, negative, or not a number
- **THEN** the system rejects it and asks for a valid amount

### Requirement: Monthly overview
The system SHALL let a user see, for the current calendar month, their total income in COP and their spend versus budget limit for each category that has either a limit or recorded expenses.

#### Scenario: Viewing total income for the month
- **WHEN** a user opens the monthly overview
- **THEN** they see the sum, in COP, of their income entries recorded within the current calendar month, using each entry's converted COP amount

#### Scenario: Viewing spend vs. budget per category
- **WHEN** a user opens the monthly overview and a category has a budget limit
- **THEN** they see how much they've spent in that category this calendar month against that limit

#### Scenario: Category without a budget limit
- **WHEN** a user has recorded expenses in a category with no budget limit set
- **THEN** the monthly overview still shows their spend for that category, without a limit to compare against
