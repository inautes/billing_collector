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
        name: '파일썬',
        url: 'https://copyright.filesun.com',
        username: 'jaye',
        password: 'jaye1234!',
        loginSelector: 'form.login-form',
        usernameSelector: 'input[name="username"]',
        passwordSelector: 'input[name="password"]',
        submitSelector: 'button[type="submit"]',
        settlementMenuSelector: 'a[href*="settlement"]',
        datePickerSelector: 'input[type="date"]',
        searchButtonSelector: 'button.search-btn',
        tableSelector: 'table.data-table',
        paginationSelector: 'div.pagination',
        active: true
      },
      {
        name: 'CU미디어',
        url: 'https://cumedia.example.com', // Replace with actual URL
        username: 'jayecu',
        password: 'jaye1234!',
        loginSelector: 'form.login-form',
        usernameSelector: 'input[name="username"]',
        passwordSelector: 'input[name="password"]',
        submitSelector: 'button[type="submit"]',
        settlementMenuSelector: 'a[href*="settlement"]',
        datePickerSelector: 'input[type="date"]',
        searchButtonSelector: 'button.search-btn',
        tableSelector: 'table.data-table',
        paginationSelector: 'div.pagination',
        active: true
      },
      {
        name: '채널A',
        url: 'https://channela.example.com', // Replace with actual URL
        username: 'jayecha',
        password: 'jaye1234!',
        loginSelector: 'form.login-form',
        usernameSelector: 'input[name="username"]',
        passwordSelector: 'input[name="password"]',
        submitSelector: 'button[type="submit"]',
        settlementMenuSelector: 'a[href*="settlement"]',
        datePickerSelector: 'input[type="date"]',
        searchButtonSelector: 'button.search-btn',
        tableSelector: 'table.data-table',
        paginationSelector: 'div.pagination',
        active: true
      },
      {
        name: 'TV조선',
        url: 'https://tvchoson.example.com', // Replace with actual URL
        username: 'jayetvcs',
        password: 'jaye1234!',
        loginSelector: 'form.login-form',
        usernameSelector: 'input[name="username"]',
        passwordSelector: 'input[name="password"]',
        submitSelector: 'button[type="submit"]',
        settlementMenuSelector: 'a[href*="settlement"]',
        datePickerSelector: 'input[type="date"]',
        searchButtonSelector: 'button.search-btn',
        tableSelector: 'table.data-table',
        paginationSelector: 'div.pagination',
        active: true
      },
      {
        name: 'MBN',
        url: 'https://mbn.example.com', // Replace with actual URL
        username: 'jayembn',
        password: 'jaye1234!',
        loginSelector: 'form.login-form',
        usernameSelector: 'input[name="username"]',
        passwordSelector: 'input[name="password"]',
        submitSelector: 'button[type="submit"]',
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
