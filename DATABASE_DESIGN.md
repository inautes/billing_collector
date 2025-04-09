# Settlement Crawler Database Design

## Overview

This document outlines the database design for the Settlement Crawler application. The application is currently designed to crawl the Filesun website with multiple login credentials, but is structured to accommodate additional websites in the future. It extracts settlement data and stores it in a PostgreSQL database using Sequelize ORM.

## Database Schema

The database consists of two main tables:

1. **Sites** - Stores information about the websites to be crawled
2. **SettlementData** - Stores the settlement data extracted from the websites

### Sites Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique identifier for the site |
| name | STRING | NOT NULL | Name of the website |
| url | STRING | NOT NULL | URL of the website |
| username | STRING | NOT NULL | Username for login |
| password | STRING | NOT NULL | Password for login |
| loginSelector | STRING | | CSS selector for login form |
| usernameSelector | STRING | | CSS selector for username field |
| passwordSelector | STRING | | CSS selector for password field |
| submitSelector | STRING | | CSS selector for submit button |
| settlementMenuSelector | STRING | | CSS selector for settlement menu |
| datePickerSelector | STRING | | CSS selector for date picker |
| searchButtonSelector | STRING | | CSS selector for search button |
| tableSelector | STRING | | CSS selector for data table |
| paginationSelector | STRING | | CSS selector for pagination |
| active | BOOLEAN | DEFAULT true | Whether the site is active |
| createdAt | DATE | | Creation timestamp |
| updatedAt | DATE | | Update timestamp |

### SettlementData Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique identifier for the data |
| siteId | INTEGER | FOREIGN KEY (Sites.id) | Reference to the site |
| settlementDate | DATEONLY | NOT NULL | Date of the settlement |
| contentId | STRING | | Content ID or reference from the site |
| contentTitle | STRING | | Title of the content |
| contentType | STRING | | Type of the content |
| views | INTEGER | | Number of views |
| revenue | DECIMAL(10,2) | | Revenue amount |
| rawData | JSONB | | Raw JSON data from the site |
| createdAt | DATE | | Creation timestamp |
| updatedAt | DATE | | Update timestamp |

## Relationships

- A **Site** can have many **SettlementData** records (One-to-Many relationship)
- Each **SettlementData** record belongs to one **Site** (Many-to-One relationship)

## Indexes

- **SettlementData** table has a unique index on the combination of `siteId`, `settlementDate`, and `contentId` to prevent duplicate entries

## Extensibility

The database design is structured to easily accommodate additional sites in the future:

1. New sites can be added to the **Sites** table with their specific selectors
2. The **SettlementData** table is generic enough to store data from different sites with varying formats
3. The `rawData` JSONB field allows storing site-specific data that doesn't fit into the standard columns

## Data Flow

1. Sites are registered in the **Sites** table with their login credentials and CSS selectors
2. The crawler logs into each site, navigates to the settlement page, and extracts data
3. The extracted data is stored in the **SettlementData** table with a reference to the site
4. The data can be queried by site, date range, or other criteria

## Future Considerations

- Encryption for sensitive data like passwords
- Archiving mechanism for historical data
- Performance optimizations for large datasets
