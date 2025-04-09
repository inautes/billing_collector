import puppeteer from 'puppeteer';

export const crawlerLogs = [];

/**
 * Add log entry
 */
export const addLog = (message, type = 'info') => {
  const logEntry = {
    timestamp: new Date(),
    message,
    type
  };
  console.log(`[${type.toUpperCase()}] ${message}`);
  crawlerLogs.push(logEntry);
  
  if (crawlerLogs.length > 100) {
    crawlerLogs.shift();
  }
  
  return logEntry;
};

/**
 * Base crawler class with common functionality
 */
class BaseCrawler {
  constructor(site) {
    this.site = site;
    this.browser = null;
    this.page = null;
  }

  /**
   * Initialize browser and page
   */
  async initialize() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1366, height: 768 });
    await this.page.setDefaultNavigationTimeout(60000);
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Navigate to URL
   */
  async navigateTo(url) {
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2' });
      return true;
    } catch (error) {
      console.error(`Failed to navigate to ${url}:`, error);
      return false;
    }
  }

  /**
   * Login to site
   */
  async login() {
    try {
      addLog(`Navigating to ${this.site.url} for ${this.site.name}`, 'info');
      await this.navigateTo(this.site.url);
      
      await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_login_page.png` });
      addLog(`Login page loaded for ${this.site.name}`, 'info');
      
      addLog(`Waiting for login form elements for ${this.site.name}`, 'info');
      
      const pageContent = await this.page.content();
      addLog(`Page title: ${await this.page.title()}`, 'debug');
      
      try {
        if (this.site.loginSelector) {
          await this.page.waitForSelector(this.site.loginSelector, { timeout: 5000 });
          addLog(`Found login form for ${this.site.name}`, 'info');
        }
      } catch (error) {
        addLog(`Login form not found for ${this.site.name}, will try to find input fields directly`, 'warning');
      }
      
      try {
        addLog(`Looking for username field: ${this.site.usernameSelector}`, 'info');
        await this.page.waitForSelector(this.site.usernameSelector, { timeout: 10000 });
        addLog(`Found username field for ${this.site.name}`, 'info');
      } catch (error) {
        addLog(`Username field not found with selector ${this.site.usernameSelector}`, 'error');
        const inputFields = await this.page.$$('input[type="text"], input:not([type]), input[type="email"]');
        addLog(`Found ${inputFields.length} potential username fields`, 'debug');
        if (inputFields.length > 0) {
          addLog(`Using first text input as username field`, 'warning');
          await inputFields[0].type(this.site.username);
        } else {
          throw new Error(`Cannot find any username input fields`);
        }
      }
      
      try {
        addLog(`Looking for password field: ${this.site.passwordSelector}`, 'info');
        await this.page.waitForSelector(this.site.passwordSelector, { timeout: 10000 });
        addLog(`Found password field for ${this.site.name}`, 'info');
      } catch (error) {
        addLog(`Password field not found with selector ${this.site.passwordSelector}`, 'error');
        const passwordFields = await this.page.$$('input[type="password"]');
        addLog(`Found ${passwordFields.length} potential password fields`, 'debug');
        if (passwordFields.length > 0) {
          addLog(`Using first password input field`, 'warning');
          await passwordFields[0].type(this.site.password);
        } else {
          throw new Error(`Cannot find any password input fields`);
        }
      }
      
      try {
        await this.page.type(this.site.usernameSelector, this.site.username);
        await this.page.type(this.site.passwordSelector, this.site.password);
        addLog(`Entered credentials for ${this.site.name}`, 'info');
      } catch (error) {
        addLog(`Error typing credentials: ${error.message}`, 'error');
      }
      
      try {
        addLog(`Looking for submit button: ${this.site.submitSelector}`, 'info');
        await this.page.waitForSelector(this.site.submitSelector, { timeout: 10000 });
        await this.page.click(this.site.submitSelector);
        addLog(`Clicked submit button for ${this.site.name}`, 'info');
      } catch (error) {
        addLog(`Submit button not found with selector ${this.site.submitSelector}`, 'error');
        const buttons = await this.page.$$('button[type="submit"], input[type="submit"], button:not([type]), .login-button, .btn-login');
        addLog(`Found ${buttons.length} potential submit buttons`, 'debug');
        if (buttons.length > 0) {
          addLog(`Using first submit button`, 'warning');
          await buttons[0].click();
        } else {
          throw new Error(`Cannot find any submit buttons`);
        }
      }
      
      addLog(`Waiting for navigation after login for ${this.site.name}`, 'info');
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      
      await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_after_login.png` });
      
      const url = this.page.url();
      if (url.includes('login') || url.includes('signin')) {
        addLog(`Login failed for ${this.site.name} - still on login page`, 'error');
        return false;
      }
      
      addLog(`Successfully logged in to ${this.site.name}`, 'success');
      return true;
    } catch (error) {
      addLog(`Login failed for ${this.site.name}: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Navigate to settlement page
   */
  async navigateToSettlementPage() {
    try {
      addLog(`Attempting to navigate to settlement page for ${this.site.name}`, 'info');
      
      try {
        await this.page.waitForSelector(this.site.settlementMenuSelector, { timeout: 5000 });
        addLog(`Found settlement menu for ${this.site.name}`, 'info');
        await this.page.click(this.site.settlementMenuSelector);
        await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      } catch (menuError) {
        addLog(`Menu navigation failed: ${menuError.message}. Trying direct URL navigation.`, 'warning');
        await this.page.goto('https://copyright.filesun.com/sales', { waitUntil: 'networkidle2' });
      }
      
      await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_settlement_page.png` });
      addLog(`Successfully navigated to settlement page for ${this.site.name}`, 'success');
      
      return true;
    } catch (error) {
      addLog(`Failed to navigate to settlement page for ${this.site.name}: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Set date to yesterday and search
   */
  async setDateToYesterdayAndSearch() {
    try {
      addLog(`Looking for date inputs and search elements for ${this.site.name}`, 'info');
      
      await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_before_date_search.png` });
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const formattedDate = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format
      const koreanFormattedDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      
      addLog(`Setting date to yesterday: ${koreanFormattedDate}`, 'info');
      
      const dateInputs = await this.page.$$('input[type="date"], input.date, input[name*="date"], input[id*="date"]');
      addLog(`Found ${dateInputs.length} potential date inputs`, 'debug');
      
      if (dateInputs.length > 0) {
        try {
          await this.page.waitForSelector(this.site.datePickerSelector, { timeout: 5000 });
          addLog(`Found date picker with selector: ${this.site.datePickerSelector}`, 'info');
          
          await this.page.evaluate((selector) => {
            document.querySelector(selector).value = '';
          }, this.site.datePickerSelector);
          
          await this.page.type(this.site.datePickerSelector, koreanFormattedDate);
        } catch (dateError) {
          addLog(`Date picker not found with selector ${this.site.datePickerSelector}: ${dateError.message}`, 'warning');
          addLog(`Using first date input found`, 'info');
          
          await dateInputs[0].evaluate(el => el.value = '');
          await dateInputs[0].type(koreanFormattedDate);
        }
      } else {
        addLog(`No date inputs found, looking for date select elements`, 'warning');
        
        const selects = await this.page.$$('select');
        if (selects.length >= 3) {
          addLog(`Found ${selects.length} select elements, trying to set date using selects`, 'info');
          
          await selects[0].select(yesterday.getFullYear().toString());
          await selects[1].select((yesterday.getMonth() + 1).toString());
          await selects[2].select(yesterday.getDate().toString());
        } else {
          addLog(`Could not find date input elements`, 'error');
        }
      }
      
      try {
        await this.page.waitForSelector(this.site.searchButtonSelector, { timeout: 5000 });
        addLog(`Found search button with selector: ${this.site.searchButtonSelector}`, 'info');
        await this.page.click(this.site.searchButtonSelector);
      } catch (searchError) {
        addLog(`Search button not found with selector ${this.site.searchButtonSelector}: ${searchError.message}`, 'warning');
        
        const searchButtons = await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
          return buttons
            .filter(btn => {
              const text = btn.textContent || btn.value || '';
              return text.includes('검색') || text.includes('Search') || 
                     btn.className.includes('search') || btn.id.includes('search');
            })
            .map((el, index) => ({ 
              index,
              text: el.textContent || el.value || '',
              tagName: el.tagName.toLowerCase()
            }));
        });
        
        addLog(`Found ${searchButtons.length} potential search buttons`, 'debug');
        
        if (searchButtons.length > 0) {
          addLog(`Using search button with text: ${searchButtons[0].text}`, 'info');
          
          if (searchButtons[0].tagName === 'input') {
            await this.page.click(`input[type="button"]:nth-of-type(${searchButtons[0].index + 1}), input[type="submit"]:nth-of-type(${searchButtons[0].index + 1})`);
          } else {
            await this.page.click(`button:nth-of-type(${searchButtons[0].index + 1})`);
          }
        } else {
          const allButtons = await this.page.$$('button, input[type="button"], input[type="submit"]');
          
          if (allButtons.length > 0) {
            addLog(`No search button found, trying first button on page`, 'warning');
            await allButtons[0].click();
          } else {
            addLog(`Could not find any buttons on page`, 'error');
            throw new Error('No buttons found on page');
          }
        }
      }
      
      await this.page.waitForTimeout(3000);
      
      try {
        await this.page.waitForSelector(this.site.tableSelector, { timeout: 10000 });
        addLog(`Found results table with selector: ${this.site.tableSelector}`, 'success');
      } catch (tableError) {
        addLog(`Table not found with selector ${this.site.tableSelector}: ${tableError.message}`, 'warning');
        
        const tables = await this.page.$$('table');
        if (tables.length > 0) {
          addLog(`Found ${tables.length} tables on page, using first one`, 'info');
        } else {
          addLog(`No tables found on page`, 'error');
          throw new Error('No results table found');
        }
      }
      
      await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_after_search.png` });
      addLog(`Successfully set date and searched for ${this.site.name}`, 'success');
      
      return true;
    } catch (error) {
      addLog(`Failed to set date and search for ${this.site.name}: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Extract data from table
   */
  async extractTableData() {
    try {
      await this.page.waitForSelector(this.site.tableSelector);
      
      const data = await this.extractCurrentPageData();
      let allData = [...data];
      
      const hasPagination = await this.page.$(this.site.paginationSelector) !== null;
      
      if (hasPagination) {
        const totalPages = await this.getTotalPages();
        
        for (let i = 2; i <= totalPages; i++) {
          await this.goToPage(i);
          const pageData = await this.extractCurrentPageData();
          allData = [...allData, ...pageData];
        }
      }
      
      return allData;
    } catch (error) {
      console.error(`Failed to extract table data for ${this.site.name}:`, error);
      return [];
    }
  }

  /**
   * Extract data from current page
   * This method should be implemented by site-specific crawlers
   */
  async extractCurrentPageData() {
    throw new Error('Method not implemented');
  }

  /**
   * Get total number of pages
   * This method should be implemented by site-specific crawlers
   */
  async getTotalPages() {
    throw new Error('Method not implemented');
  }

  /**
   * Go to specific page
   * This method should be implemented by site-specific crawlers
   */
  async goToPage(pageNumber) {
    throw new Error('Method not implemented');
  }

  /**
   * Run the crawler
   */
  async run() {
    try {
      addLog(`Starting crawler for ${this.site.name}`, 'info');
      await this.initialize();
      
      addLog(`Initialized browser for ${this.site.name}`, 'info');
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        throw new Error(`Failed to login to ${this.site.name}`);
      }
      
      addLog(`Navigating to settlement page for ${this.site.name}`, 'info');
      const navigateSuccess = await this.navigateToSettlementPage();
      if (!navigateSuccess) {
        throw new Error(`Failed to navigate to settlement page for ${this.site.name}`);
      }
      
      addLog(`Setting date to yesterday and searching for ${this.site.name}`, 'info');
      const searchSuccess = await this.setDateToYesterdayAndSearch();
      if (!searchSuccess) {
        throw new Error(`Failed to set date and search for ${this.site.name}`);
      }
      
      addLog(`Extracting table data for ${this.site.name}`, 'info');
      const data = await this.extractTableData();
      addLog(`Extracted ${data.length} records for ${this.site.name}`, 'success');
      
      await this.close();
      addLog(`Crawler completed successfully for ${this.site.name}`, 'success');
      
      return {
        success: true,
        data,
        message: `Successfully crawled ${this.site.name} (${data.length} records)`
      };
    } catch (error) {
      addLog(`Crawler failed for ${this.site.name}: ${error.message}`, 'error');
      
      if (this.browser) {
        await this.close();
      }
      
      return {
        success: false,
        data: [],
        message: error.message
      };
    }
  }
}

export default BaseCrawler;
