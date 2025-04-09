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
      
      const frames = this.page.frames();
      addLog(`Found ${frames.length} frames on login page`, 'debug');
      
      let loginFrame = null;
      let usernameElement = null;
      let passwordElement = null;
      let submitElement = null;
      
      try {
        usernameElement = await this.page.$(this.site.usernameSelector);
        if (usernameElement) {
          addLog(`Found username field in main page for ${this.site.name}`, 'info');
          loginFrame = this.page;
        }
      } catch (error) {
        addLog(`Username field not found in main page: ${error.message}`, 'debug');
      }
      
      if (!usernameElement) {
        for (let i = 0; i < frames.length; i++) {
          const frame = frames[i];
          try {
            const frameUrl = frame.url();
            addLog(`Checking frame ${i} with URL: ${frameUrl}`, 'debug');
            
            const frameElement = await frame.$(this.site.usernameSelector);
            if (frameElement) {
              addLog(`Found username field in frame ${i} for ${this.site.name}`, 'info');
              loginFrame = frame;
              usernameElement = frameElement;
              break;
            }
          } catch (error) {
            addLog(`Error checking frame ${i}: ${error.message}`, 'debug');
          }
        }
      }
      
      if (!loginFrame) {
        addLog(`Login form not found with specified selectors, trying alternatives`, 'warning');
        const alternativeSelectors = [
          'input[name="user_id"]',
          'input[id="user_id"]',
          'input[name="userid"]',
          'input[id="userid"]',
          'input[type="text"]'
        ];
        
        for (const selector of alternativeSelectors) {
          try {
            const element = await this.page.$(selector);
            if (element) {
              addLog(`Found username field with alternative selector ${selector} in main page`, 'info');
              loginFrame = this.page;
              usernameElement = element;
              break;
            }
          } catch (error) {
          }
        }
        
        if (!loginFrame) {
          for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            for (const selector of alternativeSelectors) {
              try {
                const element = await frame.$(selector);
                if (element) {
                  addLog(`Found username field with alternative selector ${selector} in frame ${i}`, 'info');
                  loginFrame = frame;
                  usernameElement = element;
                  break;
                }
              } catch (error) {
              }
            }
            if (loginFrame) break;
          }
        }
      }
      
      if (!loginFrame) {
        throw new Error(`Cannot find login form in any frame`);
      }
      
      try {
        passwordElement = await loginFrame.$(this.site.passwordSelector);
        if (!passwordElement) {
          const passwordSelectors = ['input[type="password"]'];
          for (const selector of passwordSelectors) {
            passwordElement = await loginFrame.$(selector);
            if (passwordElement) {
              addLog(`Found password field with alternative selector ${selector}`, 'info');
              break;
            }
          }
        }
        
        if (!passwordElement) {
          throw new Error(`Cannot find password field`);
        }
        
        submitElement = await loginFrame.$(this.site.submitSelector);
        if (!submitElement) {
          const submitSelectors = [
            'input[type="image"]',
            'input[type="submit"]',
            'button[type="submit"]',
            'button:not([type])',
            '.login-button',
            '.btn-login'
          ];
          for (const selector of submitSelectors) {
            submitElement = await loginFrame.$(selector);
            if (submitElement) {
              addLog(`Found submit button with alternative selector ${selector}`, 'info');
              break;
            }
          }
        }
        
        if (!submitElement) {
          throw new Error(`Cannot find submit button`);
        }
      } catch (error) {
        addLog(`Error finding login elements: ${error.message}`, 'error');
        throw error;
      }
      
      await usernameElement.type(this.site.username);
      await passwordElement.type(this.site.password);
      addLog(`Entered credentials for ${this.site.name}`, 'info');
      
      await submitElement.click();
      addLog(`Clicked submit button for ${this.site.name}`, 'info');
      
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
        
        addLog(`Waiting for page to load after clicking search button...`, 'info');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_after_search_click.png` });
        
        const pageStructure = await this.page.evaluate(() => {
          const tables = document.querySelectorAll('table');
          const divTables = document.querySelectorAll('div[class*="table"], div[class*="grid"], div[class*="list"]');
          const iframes = document.querySelectorAll('iframe');
          
          return {
            url: window.location.href,
            title: document.title,
            tableCount: tables.length,
            tableDetails: Array.from(tables).map((t, i) => ({
              index: i,
              rows: t.querySelectorAll('tr').length,
              html: t.outerHTML.substring(0, 200)
            })),
            divTableCount: divTables.length,
            iframeCount: iframes.length,
            iframeDetails: Array.from(iframes).map(f => ({
              src: f.src,
              id: f.id,
              name: f.name
            }))
          };
        });
        
        addLog(`Page structure after search: ${JSON.stringify(pageStructure)}`, 'debug');
        
        if (pageStructure.iframeCount > 0) {
          addLog(`Found ${pageStructure.iframeCount} iframes, attempting to access iframe content`, 'info');
          
          const frames = this.page.frames();
          addLog(`Total frames found: ${frames.length}`, 'debug');
          
          for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            try {
              const frameUrl = await frame.evaluate(() => window.location.href);
              addLog(`Frame ${i} URL: ${frameUrl}`, 'debug');
              
              if (frameUrl.includes('googletagmanager.com')) {
                addLog(`Skipping Google Tag Manager frame ${i}`, 'debug');
                continue;
              }
              
              if (frameUrl === 'about:blank') {
                addLog(`Skipping empty frame ${i}`, 'debug');
                continue;
              }
              
              const frameTables = await frame.evaluate(() => {
                const tables = document.querySelectorAll('table');
                return {
                  tableCount: tables.length,
                  tableDetails: Array.from(tables).map((t, i) => ({
                    index: i,
                    rows: t.querySelectorAll('tr').length,
                    html: t.outerHTML.substring(0, 200)
                  }))
                };
              });
              
              addLog(`Frame ${i} has ${frameTables.tableCount} tables`, 'info');
              if (frameTables.tableCount > 0) {
                addLog(`Found tables in iframe ${i}`, 'success');
                
                try {
                  const frameElement = await this.page.$(`iframe:nth-of-type(${i + 1})`);
                  if (frameElement) {
                    await frameElement.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_iframe_${i}_content.png` });
                  }
                } catch (screenshotError) {
                  addLog(`Could not take screenshot of iframe ${i}: ${screenshotError.message}`, 'warning');
                }
                
                this.currentFrame = frame;
                break;
              }
              
              const frameDivTables = await frame.evaluate(() => {
                const divSelectors = [
                  'div[class*="table"]', 'div[class*="grid"]', 'div[class*="list"]',
                  'div.board_list', 'div.tbl_wrap', 'div.data-grid', 
                  'div.list_table', 'div[class*="board"]'
                ];
                
                let divTables = [];
                for (const selector of divSelectors) {
                  const elements = document.querySelectorAll(selector);
                  if (elements.length > 0) {
                    divTables = [...divTables, ...Array.from(elements)];
                  }
                }
                
                return {
                  divTableCount: divTables.length,
                  divTableDetails: divTables.map((t, i) => ({
                    index: i,
                    children: t.children.length,
                    html: t.outerHTML.substring(0, 200)
                  }))
                };
              });
              
              addLog(`Frame ${i} has ${frameDivTables.divTableCount} div-based tables`, 'info');
              if (frameDivTables.divTableCount > 0) {
                addLog(`Found div-based tables in iframe ${i}`, 'success');
                this.currentFrame = frame;
                break;
              }
              
              const frameContent = await frame.evaluate(() => {
                return {
                  bodyText: document.body ? document.body.textContent.trim().length : 0,
                  elements: document.querySelectorAll('*').length,
                  hasNumbers: document.body ? /\d{3,}/.test(document.body.textContent) : false
                };
              });
              
              if (frameContent.bodyText > 500 && frameContent.elements > 50) {
                addLog(`Frame ${i} has significant content (${frameContent.elements} elements, ${frameContent.bodyText} chars)`, 'info');
                
                if (frameContent.hasNumbers) {
                  addLog(`Frame ${i} contains numeric data, likely settlement information`, 'success');
                  this.currentFrame = frame;
                  break;
                }
              }
            } catch (frameError) {
              addLog(`Error accessing frame ${i}: ${frameError.message}`, 'warning');
            }
          }
        }
        
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
      await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_before_table_extraction.png` });
      
      const pageHtml = await this.page.content();
      addLog(`Page HTML length: ${pageHtml.length} characters`, 'debug');
      
      let tableFound = false;
      
      if (this.currentFrame) {
        addLog(`Using previously detected iframe for table extraction`, 'info');
        try {
          const frameTables = await this.currentFrame.$$('table');
          if (frameTables.length > 0) {
            addLog(`Found ${frameTables.length} tables in iframe`, 'success');
            tableFound = true;
          }
        } catch (frameError) {
          addLog(`Error accessing tables in iframe: ${frameError.message}`, 'warning');
        }
      }
      
      if (!tableFound) {
        try {
          await this.page.waitForSelector(this.site.tableSelector, { timeout: 5000 });
          addLog(`Found results table with selector: ${this.site.tableSelector}`, 'success');
          tableFound = true;
        } catch (tableError) {
          addLog(`Table not found with primary selector ${this.site.tableSelector}: ${tableError.message}`, 'warning');
        }
      }
      
      if (!tableFound) {
        const frames = this.page.frames();
        addLog(`Checking ${frames.length} frames for tables`, 'info');
        
        for (let i = 0; i < frames.length; i++) {
          const frame = frames[i];
          try {
            const frameUrl = frame.url();
            addLog(`Checking frame ${i} with URL: ${frameUrl}`, 'debug');
            
            try {
              const tableElement = await frame.$(this.site.tableSelector);
              if (tableElement) {
                addLog(`Found table with selector ${this.site.tableSelector} in frame ${i}`, 'success');
                this.currentFrame = frame;
                tableFound = true;
                break;
              }
            } catch (error) {
            }
            
            const tables = await frame.$$('table');
            if (tables.length > 0) {
              addLog(`Found ${tables.length} tables in frame ${i}`, 'success');
              this.currentFrame = frame;
              tableFound = true;
              
              const tableHtml = await frame.evaluate(table => table.outerHTML, tables[0]);
              addLog(`First table HTML from frame: ${tableHtml.substring(0, 200)}...`, 'debug');
              break;
            }
          } catch (frameError) {
            addLog(`Error checking frame ${i}: ${frameError.message}`, 'debug');
          }
        }
      }
      
      if (!tableFound) {
        const tables = await this.page.$$('table');
        if (tables.length > 0) {
          addLog(`Found ${tables.length} tables on main page, using first one`, 'info');
          
          await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_tables_found.png` });
          
          const tableHtml = await this.page.evaluate(table => table.outerHTML, tables[0]);
          addLog(`First table HTML: ${tableHtml.substring(0, 200)}...`, 'debug');
          tableFound = true;
        }
      }
      
      if (!tableFound) {
        const divSelectors = [
          'div[class*="table"]', 'div[class*="grid"]', 'div[class*="list"]',
          'div.board_list', 'div.tbl_wrap', 'div.data-grid', 
          'div.list_table', 'div[class*="board"]'
        ];
        
        for (const selector of divSelectors) {
          const divTables = await this.page.$$(selector);
          if (divTables.length > 0) {
            addLog(`Found ${divTables.length} div-based tables with selector ${selector}, using first one`, 'info');
            tableFound = true;
            break;
          }
        }
      }
      
      if (!tableFound) {
        const structuredContent = await this.page.evaluate(() => {
          const potentialContainers = Array.from(document.querySelectorAll('div, ul, ol, section'))
            .filter(el => el.children.length > 5)
            .map(el => ({
              tagName: el.tagName,
              id: el.id || '',
              className: el.className || '',
              childCount: el.children.length,
              firstChildHTML: el.children[0]?.outerHTML?.substring(0, 100) || ''
            }));
          
          return potentialContainers;
        });
        
        if (structuredContent.length > 0) {
          addLog(`Found ${structuredContent.length} potential structured content containers`, 'info');
          addLog(`First container: ${JSON.stringify(structuredContent[0])}`, 'debug');
          tableFound = true;
        }
      }
      
      if (!tableFound) {
        const textContent = await this.page.evaluate(() => {
          const contentElements = document.querySelectorAll('#content, .content, main, .main, #main');
          if (contentElements.length > 0) {
            return {
              found: true,
              text: contentElements[0].textContent.trim().substring(0, 500),
              html: contentElements[0].innerHTML.substring(0, 500)
            };
          }
          return { found: false };
        });
        
        if (textContent.found) {
          addLog(`Found text content that might contain data`, 'info');
          addLog(`Content sample: ${textContent.text.substring(0, 200)}...`, 'debug');
          tableFound = true;
        }
      }
      
      if (!tableFound) {
        const elementsWithNumbers = await this.page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'))
            .filter(el => {
              const text = el.textContent.trim();
              return /\d{3,}/.test(text) || // Contains at least 3 digits together
                     /\d+,\d+/.test(text) || // Contains numbers with commas
                     /\d+\.\d+/.test(text); // Contains decimal numbers
            })
            .slice(0, 10) // Limit to first 10 matches
            .map(el => ({
              tagName: el.tagName,
              text: el.textContent.trim().substring(0, 50),
              parent: el.parentElement ? {
                tagName: el.parentElement.tagName,
                className: el.parentElement.className || ''
              } : null
            }));
          
          return elements;
        });
        
        if (elementsWithNumbers.length > 0) {
          addLog(`Found ${elementsWithNumbers.length} elements containing numbers that might be data`, 'info');
          addLog(`First element: ${JSON.stringify(elementsWithNumbers[0])}`, 'debug');
          tableFound = true;
        } else {
          await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_no_data_found.png` });
          addLog(`No data elements found on page`, 'error');
        }
      }
      
      const data = await this.extractCurrentPageData();
      let allData = [...data];
      
      const hasPagination = await this.page.evaluate((selector) => {
        if (selector && document.querySelector(selector)) {
          return true;
        }
        
        const paginationSelectors = [
          '.pagination', '.paging', '.page-navigation', 
          'ul.pages', 'div.pages', 'nav.pagination',
          'a.page-link', 'a[href*="page="]'
        ];
        
        for (const sel of paginationSelectors) {
          if (document.querySelector(sel)) {
            return true;
          }
        }
        
        const pageLinks = Array.from(document.querySelectorAll('a'))
          .filter(a => /^\d+$/.test(a.textContent.trim()));
        
        return pageLinks.length > 1;
      }, this.site.paginationSelector);
      
      if (hasPagination) {
        addLog(`Found pagination on page`, 'info');
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
        addLog(`No pagination found on page`, 'info');
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
      await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_before_data_extraction.png` });
      
      const context = this.currentFrame || this.page;
      addLog(`Using ${this.currentFrame ? 'iframe' : 'main page'} context for data extraction`, 'info');
      
      const tables = await context.$$('table');
      
      if (tables.length > 0) {
        addLog(`Found ${tables.length} standard HTML tables for data extraction`, 'info');
        
        let tableIndex = 0;
        
        if (tables.length > 1) {
          const tableSizes = await context.evaluate(() => {
            return Array.from(document.querySelectorAll('table')).map((table, index) => {
              const rows = table.querySelectorAll('tr').length;
              const headers = Array.from(table.querySelectorAll('tr:first-child th, tr:first-child td'))
                .map(cell => cell.textContent.trim().toLowerCase());
              
              const hasRelevantHeaders = headers.some(header => 
                header.includes('id') || 
                header.includes('title') || 
                header.includes('revenue') || 
                header.includes('views') ||
                header.includes('정산') ||
                header.includes('수익') ||
                header.includes('조회') ||
                header.includes('금액') ||
                header.includes('콘텐츠')
              );
              
              return { index, rows, hasRelevantHeaders, headers };
            });
          });
          
          addLog(`Table analysis: ${JSON.stringify(tableSizes)}`, 'debug');
          
          const relevantTables = tableSizes.filter(t => t.hasRelevantHeaders);
          if (relevantTables.length > 0) {
            tableIndex = relevantTables.sort((a, b) => b.rows - a.rows)[0].index;
            addLog(`Selected table ${tableIndex} with relevant headers and ${tableSizes[tableIndex].rows} rows`, 'info');
          } else {
            tableIndex = tableSizes.sort((a, b) => b.rows - a.rows)[0].index;
            addLog(`Selected table ${tableIndex} with most rows (${tableSizes[tableIndex].rows})`, 'info');
          }
        }
        
        const data = await context.evaluate((tableIndex) => {
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
              const rawData = headers.reduce((obj, header, index) => {
                obj[header] = rowData[index];
                return obj;
              }, {});
              
              const mappedData = {
                rawData: rawData,
                settlementDate: new Date().toISOString().split('T')[0] // Default to today
              };
              
              headers.forEach((header, index) => {
                const headerLower = header.toLowerCase();
                const value = rowData[index];
                
                if (headerLower.includes('id') || headerLower.includes('번호') || headerLower.includes('코드')) {
                  mappedData.contentId = value;
                }
                
                else if (headerLower.includes('title') || headerLower.includes('제목') || 
                        headerLower.includes('name') || headerLower.includes('이름') ||
                        headerLower.includes('콘텐츠')) {
                  mappedData.contentTitle = value;
                }
                
                else if (headerLower.includes('type') || headerLower.includes('종류') || 
                        headerLower.includes('category') || headerLower.includes('카테고리')) {
                  mappedData.contentType = value;
                }
                
                else if (headerLower.includes('view') || headerLower.includes('조회') || 
                        headerLower.includes('count') || headerLower.includes('횟수')) {
                  mappedData.views = parseInt(value.replace(/[^0-9]/g, '')) || 0;
                }
                
                else if (headerLower.includes('revenue') || headerLower.includes('수익') || 
                        headerLower.includes('amount') || headerLower.includes('금액') ||
                        headerLower.includes('정산')) {
                  mappedData.revenue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
                }
                
                else if (headerLower.includes('date') || headerLower.includes('날짜')) {
                  try {
                    const dateMatch = value.match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/);
                    if (dateMatch) {
                      mappedData.settlementDate = dateMatch[0].replace(/\//g, '-');
                    }
                  } catch (e) {
                  }
                }
              });
              
              return mappedData;
            }
            
            return { 
              rawData: rowData,
              settlementDate: new Date().toISOString().split('T')[0]
            };
          });
        }, tableIndex);
        
        if (data.length > 0) {
          addLog(`Extracted ${data.length} rows of data from table`, 'success');
          addLog(`Sample data: ${JSON.stringify(data[0]).substring(0, 200)}...`, 'debug');
          return data;
        }
      }
      
      const divTables = await context.$$('div[class*="table"], div[class*="grid"], div[class*="list"], div.board_list, div.tbl_wrap');
      
      if (divTables.length > 0) {
        addLog(`Found ${divTables.length} div-based tables, attempting to extract data`, 'info');
        
        const divData = await context.evaluate(() => {
          const divTableSelectors = [
            'div[class*="table"]', 'div[class*="grid"]', 'div[class*="list"]',
            'div.board_list', 'div.tbl_wrap', 'div.data-grid'
          ];
          
          let dataRows = [];
          
          for (const selector of divTableSelectors) {
            const containers = document.querySelectorAll(selector);
            
            for (const container of containers) {
              const rowElements = container.querySelectorAll('div[class*="row"], div[class*="item"], li');
              
              if (rowElements.length > 1) {
                const headerRow = rowElements[0];
                const headerCells = headerRow.querySelectorAll('div, span');
                const headers = Array.from(headerCells).map(cell => cell.textContent.trim());
                
                const rows = Array.from(rowElements).slice(1);
                
                const rowsData = rows.map(row => {
                  const cells = row.querySelectorAll('div, span');
                  const values = Array.from(cells).map(cell => cell.textContent.trim());
                  
                  const rawData = {};
                  if (headers.length === values.length) {
                    headers.forEach((header, i) => {
                      rawData[header] = values[i];
                    });
                  } else {
                    values.forEach((value, i) => {
                      rawData[`column${i}`] = value;
                    });
                  }
                  
                  const mappedData = {
                    rawData: rawData,
                    settlementDate: new Date().toISOString().split('T')[0]
                  };
                  
                  const idValue = values.find(v => /^\d+$/.test(v.trim()));
                  if (idValue) mappedData.contentId = idValue;
                  
                  const titleValue = values.reduce((longest, current) => 
                    current.length > longest.length ? current : longest, '');
                  if (titleValue.length > 5) mappedData.contentTitle = titleValue;
                  
                  const viewValue = values.find(v => /^[\d,]+$/.test(v.trim()));
                  if (viewValue) mappedData.views = parseInt(viewValue.replace(/[^0-9]/g, '')) || 0;
                  
                  const revenueValue = values.find(v => /[\d,]+(\.\d+)?/.test(v.trim()) && v !== viewValue);
                  if (revenueValue) mappedData.revenue = parseFloat(revenueValue.replace(/[^0-9.]/g, '')) || 0;
                  
                  return mappedData;
                });
                
                if (rowsData.length > 0) {
                  dataRows = [...dataRows, ...rowsData];
                  break;
                }
              }
            }
            
            if (dataRows.length > 0) break;
          }
          
          return dataRows;
        });
        
        if (divData.length > 0) {
          addLog(`Extracted ${divData.length} rows of data from div-based table`, 'success');
          addLog(`Sample div data: ${JSON.stringify(divData[0]).substring(0, 200)}...`, 'debug');
          return divData;
        }
      }
      
      const structuredData = await context.evaluate(() => {
        const dataElements = Array.from(document.querySelectorAll('*'))
          .filter(el => {
            const text = el.textContent.trim();
            return /\d{3,}/.test(text) || // Contains at least 3 digits together
                   /\d+,\d+/.test(text) || // Contains numbers with commas
                   /\d+\.\d+/.test(text); // Contains decimal numbers
          });
        
        if (dataElements.length === 0) return [];
        
        const parentMap = new Map();
        
        dataElements.forEach(el => {
          const parent = el.parentElement;
          if (parent) {
            if (!parentMap.has(parent)) {
              parentMap.set(parent, []);
            }
            parentMap.get(parent).push(el);
          }
        });
        
        const potentialRows = Array.from(parentMap.entries())
          .filter(([_, children]) => children.length >= 2)
          .map(([parent, _]) => parent);
        
        if (potentialRows.length === 0) return [];
        
        return potentialRows.map(row => {
          const textNodes = Array.from(row.childNodes)
            .filter(node => node.nodeType === 3 || node.nodeType === 1)
            .map(node => node.textContent.trim())
            .filter(text => text.length > 0);
          
          const rawData = {};
          textNodes.forEach((text, i) => {
            rawData[`field${i}`] = text;
          });
          
          const mappedData = {
            rawData: rawData,
            settlementDate: new Date().toISOString().split('T')[0]
          };
          
          const idValue = textNodes.find(v => /^\d+$/.test(v.trim()));
          if (idValue) mappedData.contentId = idValue;
          
          const titleValue = textNodes.reduce((longest, current) => 
            current.length > longest.length ? current : longest, '');
          if (titleValue.length > 5) mappedData.contentTitle = titleValue;
          
          const viewValue = textNodes.find(v => /^[\d,]+$/.test(v.trim()));
          if (viewValue) mappedData.views = parseInt(viewValue.replace(/[^0-9]/g, '')) || 0;
          
          const revenueValue = textNodes.find(v => /[\d,]+(\.\d+)?/.test(v.trim()) && v !== viewValue);
          if (revenueValue) mappedData.revenue = parseFloat(revenueValue.replace(/[^0-9.]/g, '')) || 0;
          
          return mappedData;
        });
      });
      
      if (structuredData.length > 0) {
        addLog(`Extracted ${structuredData.length} rows of data from structured content`, 'success');
        addLog(`Sample structured data: ${JSON.stringify(structuredData[0]).substring(0, 200)}...`, 'debug');
        return structuredData;
      }
      
      addLog('Could not extract any data from the page', 'warning');
      await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_no_data_extracted.png` });
      return [];
    } catch (error) {
      addLog(`Error extracting data from current page: ${error.message}`, 'error');
      await this.page.screenshot({ path: `/tmp/${this.site.name.replace(/\s+/g, '_')}_data_extraction_error.png` });
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
      
      const context = this.currentFrame || this.page;
      addLog(`Using ${this.currentFrame ? 'iframe' : 'main page'} context for pagination`, 'info');
      
      const paginationElement = await context.$(this.site.paginationSelector);
      if (!paginationElement) return 1;
      
      const totalPages = await context.evaluate((selector) => {
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
      
      const context = this.currentFrame || this.page;
      
      const clicked = await context.evaluate((pageNumber, selector) => {
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
      
      if (data.length === 0) {
        addLog(`No data records found for ${this.site.name}, creating placeholder record`, 'warning');
        data.push({
          contentId: 'no-data',
          contentTitle: 'No data found',
          contentType: 'placeholder',
          views: 0,
          revenue: 0,
          rawData: JSON.stringify({
            message: 'No data found but crawler completed successfully',
            timestamp: new Date().toISOString()
          })
        });
      }
      
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
