import sequelize from '../config/database.js';
import Site from '../models/Site.js';

/**
 * Seed initial site data
 */
export const seedSites = async () => {
  try {
    await sequelize.sync({ alter: true });

    const count = await Site.count();
    if (count > 0) {
      console.log('Sites already seeded, skipping...');
      return;
    }

    const sites = [
      {
        name: '파일썬 - JAYE',
        url: 'https://copyright.filesun.com',
        username: 'jaye',
        password: 'jaye1234!',
        loginSelector: 'form',
        usernameSelector: 'input.id',
        passwordSelector: 'input[type="password"]',
        submitSelector: 'input[type="button"].login',
        settlementMenuSelector: 'a[href*="settlement"]',
        datePickerSelector: 'input[type="date"]',
        searchButtonSelector: 'button.search-btn',
        tableSelector: 'table.data-table',
        paginationSelector: 'div.pagination',
        active: true
      },
      {
        name: '파일썬 - CU미디어',
        url: 'https://copyright.filesun.com',
        username: 'jayecu',
        password: 'jaye1234!',
        loginSelector: 'form',
        usernameSelector: 'input.id',
        passwordSelector: 'input[type="password"]',
        submitSelector: 'input[type="button"].login',
        settlementMenuSelector: 'a[href*="settlement"]',
        datePickerSelector: 'input[type="date"]',
        searchButtonSelector: 'button.search-btn',
        tableSelector: 'table.data-table',
        paginationSelector: 'div.pagination',
        active: true
      },
      {
        name: '파일썬 - 채널A',
        url: 'https://copyright.filesun.com',
        username: 'jayecha',
        password: 'jaye1234!',
        loginSelector: 'form',
        usernameSelector: 'input.id',
        passwordSelector: 'input[type="password"]',
        submitSelector: 'input[type="button"].login',
        settlementMenuSelector: 'a[href*="settlement"]',
        datePickerSelector: 'input[type="date"]',
        searchButtonSelector: 'button.search-btn',
        tableSelector: 'table.data-table',
        paginationSelector: 'div.pagination',
        active: true
      },
      {
        name: '파일썬 - TV조선',
        url: 'https://copyright.filesun.com',
        username: 'jayetvcs',
        password: 'jaye1234!',
        loginSelector: 'form',
        usernameSelector: 'input.id',
        passwordSelector: 'input[type="password"]',
        submitSelector: 'input[type="button"].login',
        settlementMenuSelector: 'a[href*="settlement"]',
        datePickerSelector: 'input[type="date"]',
        searchButtonSelector: 'button.search-btn',
        tableSelector: 'table.data-table',
        paginationSelector: 'div.pagination',
        active: true
      },
      {
        name: '파일썬 - MBN',
        url: 'https://copyright.filesun.com',
        username: 'jayembn',
        password: 'jaye1234!',
        loginSelector: 'form',
        usernameSelector: 'input.id',
        passwordSelector: 'input[type="password"]',
        submitSelector: 'input[type="button"].login',
        settlementMenuSelector: 'a[href*="settlement"]',
        datePickerSelector: 'input[type="date"]',
        searchButtonSelector: 'button.search-btn',
        tableSelector: 'table.data-table',
        paginationSelector: 'div.pagination',
        active: true
      }
    ];

    await Site.bulkCreate(sites);

    console.log('Sites seeded successfully');
  } catch (error) {
    console.error('Error seeding sites:', error);
  }
};
