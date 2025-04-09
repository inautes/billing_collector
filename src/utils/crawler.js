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
      
      await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_before_navigation.png` });
      
      let navigationSuccess = false;
      
      try {
        await this.page.waitForSelector(this.site.settlementMenuSelector, { timeout: 5000 });
        addLog(`Found settlement menu for ${this.site.name}`, 'info');
        
        const currentUrl = this.page.url();
        addLog(`Current URL before navigation: ${currentUrl}`, 'debug');
        
        await this.page.click(this.site.settlementMenuSelector);
        
        try {
          await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
          navigationSuccess = true;
          addLog(`Navigation completed after clicking menu`, 'success');
        } catch (navError) {
          addLog(`Navigation timeout after clicking menu: ${navError.message}`, 'warning');
          
          const newUrl = this.page.url();
          if (newUrl !== currentUrl) {
            navigationSuccess = true;
            addLog(`URL changed to ${newUrl} despite navigation timeout`, 'info');
          }
        }
      } catch (menuError) {
        addLog(`Menu navigation failed: ${menuError.message}`, 'warning');
      }
      
      if (!navigationSuccess) {
        addLog(`Trying direct URL navigation to settlement page`, 'info');
        
        const possibleUrls = [
          'https://copyright.filesun.com/sales',
          'https://copyright.filesun.com/settlement',
          'https://copyright.filesun.com/copyright/sales',
          'https://copyright.filesun.com/member/sales'
        ];
        
        for (const url of possibleUrls) {
          try {
            addLog(`Trying direct navigation to: ${url}`, 'info');
            await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
            navigationSuccess = true;
            addLog(`Successfully navigated directly to ${url}`, 'success');
            break;
          } catch (directNavError) {
            addLog(`Direct navigation to ${url} failed: ${directNavError.message}`, 'warning');
          }
        }
      }
      
      if (!navigationSuccess) {
        addLog(`Looking for any settlement/sales related links`, 'info');
        
        const links = await this.page.evaluate(() => {
          return Array.from(document.querySelectorAll('a')).map(a => ({
            href: a.href,
            text: a.textContent.trim(),
            hasSettlementKeywords: a.href.includes('sales') || 
                                  a.href.includes('settlement') || 
                                  a.textContent.toLowerCase().includes('정산') ||
                                  a.textContent.toLowerCase().includes('sales')
          })).filter(link => link.hasSettlementKeywords);
        });
        
        if (links.length > 0) {
          addLog(`Found ${links.length} potential settlement links`, 'info');
          
          for (const link of links) {
            addLog(`Trying to navigate to: ${link.href} (${link.text})`, 'info');
            
            try {
              await this.page.goto(link.href, { waitUntil: 'networkidle2', timeout: 15000 });
              navigationSuccess = true;
              addLog(`Successfully navigated to ${link.href}`, 'success');
              break;
            } catch (linkNavError) {
              addLog(`Navigation to ${link.href} failed: ${linkNavError.message}`, 'warning');
            }
          }
        }
      }
      
      await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_settlement_page.png` });
      
      if (navigationSuccess) {
        addLog(`Successfully navigated to settlement page for ${this.site.name}`, 'success');
        return true;
      } else {
        addLog(`All navigation attempts failed for ${this.site.name}`, 'error');
        return false;
      }
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
        await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_before_search_button.png` });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const pageHtml = await this.page.content();
        addLog(`Page HTML length: ${pageHtml.length} characters`, 'debug');
        
        try {
          await this.page.waitForSelector(this.site.searchButtonSelector, { timeout: 5000 });
          addLog(`Found search button with selector: ${this.site.searchButtonSelector}`, 'info');
          await this.page.click(this.site.searchButtonSelector);
          addLog(`Clicked search button with selector: ${this.site.searchButtonSelector}`, 'success');
        } catch (selectorError) {
          addLog(`Search button not found with selector ${this.site.searchButtonSelector}: ${selectorError.message}`, 'warning');
          
          const searchElements = await this.page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], input[type="image"], a, div, span'));
            
            const allElements = elements.map((el, idx) => ({
              index: idx,
              tagName: el.tagName.toLowerCase(),
              type: el.getAttribute('type') || '',
              id: el.id || '',
              className: el.className || '',
              text: (el.textContent || el.value || '').trim(),
              value: el.value || '',
              onClick: el.hasAttribute('onclick') ? 'yes' : 'no',
              href: el.getAttribute('href') || ''
            }));
            
            const searchElements = elements.filter(el => {
              const text = (el.textContent || el.value || '').trim().toLowerCase();
              const id = (el.id || '').toLowerCase();
              const className = (el.className || '').toLowerCase();
              const type = (el.getAttribute('type') || '').toLowerCase();
              const name = (el.getAttribute('name') || '').toLowerCase();
              
              return text.includes('검색') || text.includes('search') || 
                     id.includes('search') || id.includes('btn') || 
                     className.includes('search') || className.includes('btn') ||
                     name.includes('search') || name.includes('btn') ||
                     (el.tagName.toLowerCase() === 'input' && type === 'image');
            }).map((el, index) => ({ 
              index,
              tagName: el.tagName.toLowerCase(),
              type: el.getAttribute('type') || '',
              id: el.id || '',
              className: el.className || '',
              text: (el.textContent || el.value || '').trim(),
              value: el.value || ''
            }));
            
            return { searchElements, allElements };
          });
          
          addLog(`Found ${searchElements.searchElements.length} potential search elements out of ${searchElements.allElements.length} total elements`, 'debug');
          
          if (searchElements.allElements.length > 0) {
            addLog(`First 5 elements on page: ${JSON.stringify(searchElements.allElements.slice(0, 5))}`, 'debug');
          }
          
          if (searchElements.searchElements.length > 0) {
            const element = searchElements.searchElements[0];
            addLog(`Attempting to click search element: ${JSON.stringify(element)}`, 'info');
            
            if (element.tagName === 'input' && element.type === 'image') {
              await this.page.click(`input[type="image"]`);
              addLog(`Clicked input[type="image"]`, 'success');
            } else if (element.tagName === 'input') {
              await this.page.click(`input[type="${element.type}"]`);
              addLog(`Clicked input[type="${element.type}"]`, 'success');
            } else {
              await this.page.click(`${element.tagName}`);
              addLog(`Clicked ${element.tagName} element`, 'success');
            }
          } else {
            addLog(`No search elements found, trying to find any button-like element`, 'warning');
            
            const imageInputs = await this.page.$$('input[type="image"]');
            if (imageInputs.length > 0) {
              addLog(`Found ${imageInputs.length} input[type="image"] elements, clicking the first one`, 'info');
              await imageInputs[0].click();
              addLog(`Clicked input[type="image"]`, 'success');
            } else {
              const allButtons = await this.page.$$('button, input[type="button"], input[type="submit"]');
              if (allButtons.length > 0) {
                addLog(`Found ${allButtons.length} button elements, clicking the first one`, 'info');
                await allButtons[0].click();
                addLog(`Clicked button element`, 'success');
              } else {
                const clickResult = await this.page.evaluate(() => {
                  const buttonTexts = ['검색', 'search', '조회', 'lookup', 'find', 'go'];
                  for (const text of buttonTexts) {
                    const elements = Array.from(document.querySelectorAll('*')).filter(el => 
                      (el.textContent || '').toLowerCase().includes(text.toLowerCase()) ||
                      (el.value || '').toLowerCase().includes(text.toLowerCase())
                    );
                    
                    if (elements.length > 0) {
                      elements[0].click();
                      return { success: true, text: elements[0].textContent || elements[0].value };
                    }
                  }
                  return { success: false };
                });
                
                if (clickResult.success) {
                  addLog(`Used JavaScript click on element with text: ${clickResult.text}`, 'success');
                } else {
                  addLog(`Could not find any clickable elements on page`, 'error');
                  
                  await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_no_buttons_found.png` });
                  
                  throw new Error('No buttons or clickable elements found on page');
                }
              }
            }
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
          await this.page.waitForSelector(this.site.tableSelector, { timeout: 15000 });
          addLog(`Found results table with selector: ${this.site.tableSelector}`, 'success');
        } catch (tableError) {
          addLog(`Table not found with selector ${this.site.tableSelector}: ${tableError.message}`, 'warning');
          
          await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_before_table_search.png` });
          
          const tables = await this.page.$$('table');
          if (tables.length > 0) {
            addLog(`Found ${tables.length} tables on page, using first one`, 'info');
            
            const tableHtml = await this.page.evaluate(table => table.outerHTML, tables[0]);
            addLog(`First table HTML: ${tableHtml.substring(0, 200)}...`, 'debug');
          } else {
            const alternativeSelectors = [
              'div.board_list', 'div.tbl_wrap', 'div.data-grid', 
              'div.list_table', 'div[class*="table"]', 'div[class*="list"]',
              'div[class*="grid"]', 'div[class*="board"]'
            ];
            
            let found = false;
            for (const selector of alternativeSelectors) {
              const elements = await this.page.$$(selector);
              if (elements.length > 0) {
                addLog(`Found alternative table-like element with selector: ${selector}`, 'info');
                found = true;
                break;
              }
            }
            
            if (!found) {
              const pageHtml = await this.page.content();
              addLog(`Page HTML length: ${pageHtml.length} characters`, 'debug');
              
              await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_no_tables_found.png` });
              
              addLog(`No tables or table-like elements found on page`, 'error');
              throw new Error('No results table found');
            }
          }
        }
        
        await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_after_search.png` });
        addLog(`Successfully set date and searched for ${this.site.name}`, 'success');
        
        return true;
      } catch (error) {
        addLog(`Error during search: ${error.message}`, 'error');
        throw error;
      }
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
      try {
        await this.page.waitForSelector(this.site.tableSelector, { timeout: 15000 });
        addLog(`Found results table with selector: ${this.site.tableSelector}`, 'success');
      } catch (tableError) {
        addLog(`Table not found with primary selector ${this.site.tableSelector}: ${tableError.message}`, 'warning');
        
        const tables = await this.page.$$('table');
        if (tables.length > 0) {
          addLog(`Found ${tables.length} tables on page, using first one`, 'info');
          
          await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_tables_found.png` });
          
          const tableHtml = await this.page.evaluate(table => table.outerHTML, tables[0]);
          addLog(`First table HTML: ${tableHtml.substring(0, 200)}...`, 'debug');
        } else {
          const divTables = await this.page.$$('div[class*="table"], div[class*="grid"], div[class*="list"]');
          if (divTables.length > 0) {
            addLog(`Found ${divTables.length} div-based tables on page, using first one`, 'info');
          } else {
            addLog(`No tables or table-like elements found on page`, 'error');
            
            await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_no_tables_found.png` });
            
            const pageHtml = await this.page.content();
            addLog(`Page HTML length: ${pageHtml.length} characters`, 'debug');
            
            throw new Error('No results table found');
          }
        }
      }
      
      const data = await this.extractCurrentPageData();
      let allData = [...data];
      
      const hasPagination = await this.page.$(this.site.paginationSelector) !== null;
      
      if (hasPagination) {
        addLog(`Found pagination with selector: ${this.site.paginationSelector}`, 'info');
        const totalPages = await this.getTotalPages();
        addLog(`Total pages found: ${totalPages}`, 'info');
        
        for (let i = 2; i <= totalPages; i++) {
          addLog(`Navigating to page ${i} of ${totalPages}`, 'info');
          await this.goToPage(i);
          const pageData = await this.extractCurrentPageData();
          addLog(`Extracted ${pageData.length} records from page ${i}`, 'success');
          allData = [...allData, ...pageData];
        }
      } else {
        addLog(`No pagination found with selector: ${this.site.paginationSelector}`, 'info');
      }
      
      addLog(`Total records extracted: ${allData.length}`, 'success');
      return allData;
    } catch (error) {
      addLog(`Failed to extract table data for ${this.site.name}: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Extract data from current page
   * This method provides a default implementation that can be overridden by site-specific crawlers
   */
  async extractCurrentPageData() {
    try {
      const tables = await this.page.$$('table');
      
      if (tables.length === 0) {
        addLog('No tables found on page for data extraction', 'warning');
        return [];
      }
      
      const tableIndex = 0;
      
      const data = await this.page.evaluate((tableIndex) => {
        const table = document.querySelectorAll('table')[tableIndex];
        if (!table) return [];
        
        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length <= 1) return []; // Only header row or empty table
        
        const headerRow = rows[0];
        const headers = Array.from(headerRow.querySelectorAll('th, td')).map(cell => cell.textContent.trim());
        
        const dataRows = rows.slice(1); // Skip header row
        
        return dataRows.map(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          const rowData = cells.map(cell => cell.textContent.trim());
          
          if (headers.length > 0 && headers.length === rowData.length) {
            return headers.reduce((obj, header, index) => {
              obj[header] = rowData[index];
              return obj;
            }, {});
          }
          
          return rowData;
        });
      }, tableIndex);
      
      addLog(`Extracted ${data.length} rows of data from table`, 'success');
      return data;
    } catch (error) {
      addLog(`Error extracting data from current page: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Get total number of pages
   * This method provides a default implementation that can be overridden by site-specific crawlers
   */
  async getTotalPages() {
    try {
      if (!this.site.paginationSelector) return 1;
      
      const paginationElement = await this.page.$(this.site.paginationSelector);
      if (!paginationElement) return 1;
      
      const totalPages = await this.page.evaluate((selector) => {
        const pagination = document.querySelector(selector);
        if (!pagination) return 1;
        
        const pageLinks = Array.from(pagination.querySelectorAll('a')).filter(a => {
          const text = a.textContent.trim();
          return /^\d+$/.test(text); // Only links with numeric text
        });
        
        if (pageLinks.length === 0) return 1;
        
        const pageNumbers = pageLinks.map(a => parseInt(a.textContent.trim(), 10));
        return Math.max(...pageNumbers);
      }, this.site.paginationSelector);
      
      return totalPages || 1;
    } catch (error) {
      addLog(`Error getting total pages: ${error.message}`, 'warning');
      return 1; // Default to 1 page on error
    }
  }

  /**
   * Go to specific page
   * This method provides a default implementation that can be overridden by site-specific crawlers
   */
  async goToPage(pageNumber) {
    try {
      if (!this.site.paginationSelector) return false;
      
      const clicked = await this.page.evaluate((pageNumber, selector) => {
        const pagination = document.querySelector(selector);
        if (!pagination) return false;
        
        const pageLink = Array.from(pagination.querySelectorAll('a')).find(a => {
          return a.textContent.trim() === pageNumber.toString();
        });
        
        if (pageLink) {
          pageLink.click();
          return true;
        }
        
        return false;
      }, pageNumber, this.site.paginationSelector);
      
      if (clicked) {
        addLog(`Clicked on page ${pageNumber} link`, 'success');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for page to load
        return true;
      }
      
      addLog(`Could not find link for page ${pageNumber}`, 'warning');
      return false;
    } catch (error) {
      addLog(`Error navigating to page ${pageNumber}: ${error.message}`, 'error');
      return false;
    }
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
