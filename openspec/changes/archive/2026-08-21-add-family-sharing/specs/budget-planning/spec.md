## MODIFIED Requirements

### Requirement: Viewing, editing, and deleting income
The system SHALL let a user view, edit, or delete their own income entries, plus their household member's, if they belong to a household.

#### Scenario: Listing income
- **WHEN** a user opens their income list
- **THEN** they see their own recorded income entries and, if they belong to a household, their household member's, each showing its original amount/currency and its converted COP amount

#### Scenario: Editing an income entry
- **WHEN** a user changes the amount, currency, exchange rate, date, or description of an income entry visible to them and saves
- **THEN** the system updates that entry, recomputing its COP amount if the amount, currency, or exchange rate changed

#### Scenario: Deleting an income entry
- **WHEN** a user deletes an income entry visible to them
- **THEN** the system removes it from the income list

### Requirement: Category budget limits
The system SHALL let a user set a monthly budget limit for one of their categories, applied to every calendar month. If the user belongs to a household, the limit SHALL be shared: one limit per category for the whole household, not per person.

#### Scenario: Setting a budget limit
- **WHEN** a user submits a positive limit amount for one of their categories
- **THEN** the system saves it as that category's monthly budget limit for the user's household (or just the user, if they don't belong to one)

#### Scenario: Updating a budget limit
- **WHEN** a user changes the limit amount for a category that already has one
- **THEN** the system replaces the existing limit with the new value

#### Scenario: Invalid budget limit rejected
- **WHEN** a user submits a limit that is zero, negative, or not a number
- **THEN** the system rejects it and asks for a valid amount

#### Scenario: Household member sees the same limit
- **WHEN** a user belongs to a household and their household member sets or updates a category's budget limit
- **THEN** the user sees that same limit, since it is shared for the whole household

### Requirement: Monthly overview
The system SHALL let a user see, for the current calendar month, the total income in COP and the spend versus budget limit for each category that has either a limit or recorded expenses — combining both household members' entries when the user belongs to a household.

#### Scenario: Viewing total income for the month
- **WHEN** a user opens the monthly overview
- **THEN** they see the sum, in COP, of their income entries recorded within the current calendar month, plus their household member's if they belong to a household, using each entry's converted COP amount

#### Scenario: Viewing spend vs. budget per category
- **WHEN** a user opens the monthly overview and a category has a budget limit
- **THEN** they see how much has been spent in that category this calendar month — combining both household members' expenses if they belong to one — against that limit

#### Scenario: Category without a budget limit
- **WHEN** a user has recorded expenses (or their household member has) in a category with no budget limit set
- **THEN** the monthly overview still shows the combined spend for that category, without a limit to compare against
