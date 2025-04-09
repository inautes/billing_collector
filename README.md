# Settlement Crawler

A Node.js application for crawling settlement data from multiple websites, extracting information, and storing it in a PostgreSQL database.

## Features

- Automatic login to settlement data websites
- Navigation to settlement management pages
- Date selection and data extraction
- Storage of settlement data in PostgreSQL database
- Admin interface for managing sites and running crawlers
- Extensible architecture for adding new sites

## Tech Stack

- Node.js with Express
- Puppeteer for web scraping
- Sequelize ORM with PostgreSQL
- MVC architecture pattern
- ES Modules (import/export)

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up PostgreSQL database
4. Configure environment variables in `.env` file
5. Run the application:
   ```
   npm start
   ```

## Development

For development with auto-reload:
```
npm run dev
```

## Database Design

See [DATABASE_DESIGN.md](DATABASE_DESIGN.md) for detailed database schema information.

## Project Structure

```
settlement-crawler/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── models/         # Sequelize models
│   ├── routes/         # Express routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── views/          # Admin interface
│   └── app.js          # Application entry point
├── .env                # Environment variables
└── package.json        # Project metadata
```

## Usage

1. Access the admin interface at http://localhost:3000
2. Add or edit sites with their login credentials and CSS selectors
3. Run the crawler for specific sites or all active sites
4. View the extracted settlement data

## Adding New Sites

To add a new site:

1. Add the site details through the admin interface
2. If the site has a unique structure, create a custom crawler implementation in `src/services/crawlerService.js`
3. The system will automatically use the appropriate crawler based on the site name

## License

MIT
