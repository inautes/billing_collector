# Settlement Crawler Project Summary

## Overview

The Settlement Crawler is a Node.js application designed to automate the process of collecting settlement data from multiple websites. It uses Puppeteer for web scraping, Sequelize ORM for database operations, and follows the MVC architecture pattern.

## Key Features

1. **Multi-site Crawling**: Supports crawling multiple settlement data websites with different structures
2. **Automatic Login**: Handles authentication for each site using stored credentials
3. **Data Extraction**: Navigates to settlement pages, sets date filters, and extracts data from tables
4. **Database Storage**: Stores extracted data in a structured database for analysis
5. **Admin Interface**: Web-based interface for managing sites and running crawlers
6. **Extensible Architecture**: Designed to easily add new sites in the future

## Technical Implementation

### Architecture

- **Model-View-Controller (MVC)** pattern
- **ES Modules** for modern JavaScript syntax
- **Express.js** for the web server and API
- **Sequelize ORM** for database operations
- **Puppeteer** for headless browser automation

### Database Schema

The database consists of two main tables:

1. **Sites**: Stores information about the websites to be crawled
   - Site details (name, URL, credentials)
   - CSS selectors for navigation and data extraction
   - Active status

2. **SettlementData**: Stores the extracted settlement data
   - Reference to the source site
   - Settlement date
   - Content details (ID, title, type)
   - Performance metrics (views, revenue)
   - Raw data in JSON format

### Crawler Implementation

The crawler system uses a base class with common functionality:

1. **BaseCrawler**: Provides core functionality for all crawlers
   - Browser initialization
   - Login handling
   - Navigation to settlement pages
   - Date selection
   - Data extraction

2. **Site-specific Crawlers**: Extend the base crawler with site-specific implementations
   - Custom data extraction logic
   - Pagination handling
   - Error handling

### API Endpoints

1. **Site Management**:
   - GET /api/sites - List all sites
   - GET /api/sites/:id - Get site details
   - POST /api/sites - Add new site
   - PUT /api/sites/:id - Update site
   - DELETE /api/sites/:id - Delete site
   - GET /api/sites/:id/data - Get site's settlement data

2. **Crawler Operations**:
   - POST /api/crawler/run/:siteId - Run crawler for specific site
   - POST /api/crawler/run-all - Run crawler for all active sites
   - GET /api/crawler/status - Get crawler status

## Sample Sites

The system is pre-configured with the following sample sites:

1. **파일썬** (Filesun)
   - URL: https://copyright.filesun.com
   - Username: jaye
   - Password: jaye1234!

2. **CU미디어** (CU Media)
   - Username: jayecu
   - Password: jaye1234!

3. **채널A** (Channel A)
   - Username: jayecha
   - Password: jaye1234!

4. **TV조선** (TV Choson)
   - Username: jayetvcs
   - Password: jaye1234!

5. **MBN**
   - Username: jayembn
   - Password: jaye1234!

## Future Enhancements

1. **Scheduled Crawling**: Implement automatic crawling on a schedule
2. **Data Comparison**: Add functionality to compare current data with historical data
3. **Advanced Reporting**: Generate reports and visualizations of settlement data
4. **User Authentication**: Add user authentication for the admin interface
5. **Notification System**: Send alerts for significant changes in settlement data
