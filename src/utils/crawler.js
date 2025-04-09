import puppeteer from 'puppeteer';

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
      await this.navigateTo(this.site.url);
      
      await this.page.waitForSelector(this.site.usernameSelector);
      await this.page.waitForSelector(this.site.passwordSelector);
      
      await this.page.type(this.site.usernameSelector, this.site.username);
      await this.page.type(this.site.passwordSelector, this.site.password);
      
      await this.page.click(this.site.submitSelector);
      
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      const url = this.page.url();
      if (url.includes('login') || url.includes('signin')) {
        console.error(`Login failed for ${this.site.name}`);
        return false;
      }
      
      console.log(`Successfully logged in to ${this.site.name}`);
      return true;
    } catch (error) {
      console.error(`Login failed for ${this.site.name}:`, error);
      return false;
    }
  }

  /**
   * Navigate to settlement page
   */
  async navigateToSettlementPage() {
    try {
      await this.page.waitForSelector(this.site.settlementMenuSelector);
      await this.page.click(this.site.settlementMenuSelector);
      
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      return true;
    } catch (error) {
      console.error(`Failed to navigate to settlement page for ${this.site.name}:`, error);
      return false;
    }
  }

  /**
   * Set date to yesterday and search
   */
  async setDateToYesterdayAndSearch() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const formattedDate = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      await this.page.waitForSelector(this.site.datePickerSelector);
      
      await this.page.evaluate((selector) => {
        document.querySelector(selector).value = '';
      }, this.site.datePickerSelector);
      
      await this.page.type(this.site.datePickerSelector, formattedDate);
      
      await this.page.waitForSelector(this.site.searchButtonSelector);
      await this.page.click(this.site.searchButtonSelector);
      
      await this.page.waitForSelector(this.site.tableSelector);
      
      return true;
    } catch (error) {
      console.error(`Failed to set date and search for ${this.site.name}:`, error);
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
      await this.initialize();
      
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        throw new Error(`Failed to login to ${this.site.name}`);
      }
      
      const navigateSuccess = await this.navigateToSettlementPage();
      if (!navigateSuccess) {
        throw new Error(`Failed to navigate to settlement page for ${this.site.name}`);
      }
      
      const searchSuccess = await this.setDateToYesterdayAndSearch();
      if (!searchSuccess) {
        throw new Error(`Failed to set date and search for ${this.site.name}`);
      }
      
      const data = await this.extractTableData();
      
      await this.close();
      
      return {
        success: true,
        data,
        message: `Successfully crawled ${this.site.name}`
      };
    } catch (error) {
      console.error(`Crawler failed for ${this.site.name}:`, error);
      
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
