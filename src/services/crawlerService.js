import BaseCrawler from '../utils/crawler.js';

class FilesunCrawler extends BaseCrawler {
  async extractCurrentPageData() {
    return await this.page.evaluate((tableSelector) => {
      const table = document.querySelector(tableSelector);
      if (!table) return [];
      
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return {
          contentId: cells[0]?.textContent.trim() || '',
          contentTitle: cells[1]?.textContent.trim() || '',
          contentType: cells[2]?.textContent.trim() || '',
          views: parseInt(cells[3]?.textContent.trim().replace(/,/g, '') || '0', 10),
          revenue: parseFloat(cells[4]?.textContent.trim().replace(/,/g, '') || '0'),
          rawData: JSON.stringify({
            fullRow: row.innerHTML
          })
        };
      });
    }, this.site.tableSelector);
  }

  async getTotalPages() {
    return await this.page.evaluate((paginationSelector) => {
      const pagination = document.querySelector(paginationSelector);
      if (!pagination) return 1;
      
      const pageLinks = Array.from(pagination.querySelectorAll('a'));
      if (pageLinks.length === 0) return 1;
      
      const lastPageLink = pageLinks[pageLinks.length - 2]; // Assuming last item is "Next" button
      return parseInt(lastPageLink.textContent.trim(), 10) || 1;
    }, this.site.paginationSelector);
  }

  async goToPage(pageNumber) {
    try {
      await this.page.evaluate((paginationSelector, page) => {
        const pagination = document.querySelector(paginationSelector);
        if (!pagination) return false;
        
        const pageLinks = Array.from(pagination.querySelectorAll('a'));
        const targetLink = pageLinks.find(link => link.textContent.trim() === String(page));
        
        if (targetLink) {
          targetLink.click();
          return true;
        }
        
        return false;
      }, this.site.paginationSelector, pageNumber);
      
      await this.page.waitForSelector(this.site.tableSelector);
      await this.page.waitForTimeout(1000); // Additional wait to ensure data is loaded
      
      return true;
    } catch (error) {
      console.error(`Failed to go to page ${pageNumber}:`, error);
      return false;
    }
  }
}

class CUMediaCrawler extends BaseCrawler {
  async extractCurrentPageData() {
    return await this.page.evaluate((tableSelector) => {
      const table = document.querySelector(tableSelector);
      if (!table) return [];
      
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return {
          contentId: cells[0]?.textContent.trim() || '',
          contentTitle: cells[1]?.textContent.trim() || '',
          contentType: cells[2]?.textContent.trim() || '',
          views: parseInt(cells[3]?.textContent.trim().replace(/,/g, '') || '0', 10),
          revenue: parseFloat(cells[4]?.textContent.trim().replace(/,/g, '') || '0'),
          rawData: JSON.stringify({
            fullRow: row.innerHTML
          })
        };
      });
    }, this.site.tableSelector);
  }

  async getTotalPages() {
    return await this.page.evaluate((paginationSelector) => {
      const pagination = document.querySelector(paginationSelector);
      if (!pagination) return 1;
      
      const pageLinks = Array.from(pagination.querySelectorAll('a'));
      if (pageLinks.length === 0) return 1;
      
      const lastPageLink = pageLinks[pageLinks.length - 2]; // Assuming last item is "Next" button
      return parseInt(lastPageLink.textContent.trim(), 10) || 1;
    }, this.site.paginationSelector);
  }

  async goToPage(pageNumber) {
    try {
      await this.page.evaluate((paginationSelector, page) => {
        const pagination = document.querySelector(paginationSelector);
        if (!pagination) return false;
        
        const pageLinks = Array.from(pagination.querySelectorAll('a'));
        const targetLink = pageLinks.find(link => link.textContent.trim() === String(page));
        
        if (targetLink) {
          targetLink.click();
          return true;
        }
        
        return false;
      }, this.site.paginationSelector, pageNumber);
      
      await this.page.waitForSelector(this.site.tableSelector);
      await this.page.waitForTimeout(1000); // Additional wait to ensure data is loaded
      
      return true;
    } catch (error) {
      console.error(`Failed to go to page ${pageNumber}:`, error);
      return false;
    }
  }
}

class ChannelACrawler extends BaseCrawler {
  async extractCurrentPageData() {
    return await this.page.evaluate((tableSelector) => {
      const table = document.querySelector(tableSelector);
      if (!table) return [];
      
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return {
          contentId: cells[0]?.textContent.trim() || '',
          contentTitle: cells[1]?.textContent.trim() || '',
          contentType: cells[2]?.textContent.trim() || '',
          views: parseInt(cells[3]?.textContent.trim().replace(/,/g, '') || '0', 10),
          revenue: parseFloat(cells[4]?.textContent.trim().replace(/,/g, '') || '0'),
          rawData: JSON.stringify({
            fullRow: row.innerHTML
          })
        };
      });
    }, this.site.tableSelector);
  }

  async getTotalPages() {
    return await this.page.evaluate((paginationSelector) => {
      const pagination = document.querySelector(paginationSelector);
      if (!pagination) return 1;
      
      const pageLinks = Array.from(pagination.querySelectorAll('a'));
      if (pageLinks.length === 0) return 1;
      
      const lastPageLink = pageLinks[pageLinks.length - 2]; // Assuming last item is "Next" button
      return parseInt(lastPageLink.textContent.trim(), 10) || 1;
    }, this.site.paginationSelector);
  }

  async goToPage(pageNumber) {
    try {
      await this.page.evaluate((paginationSelector, page) => {
        const pagination = document.querySelector(paginationSelector);
        if (!pagination) return false;
        
        const pageLinks = Array.from(pagination.querySelectorAll('a'));
        const targetLink = pageLinks.find(link => link.textContent.trim() === String(page));
        
        if (targetLink) {
          targetLink.click();
          return true;
        }
        
        return false;
      }, this.site.paginationSelector, pageNumber);
      
      await this.page.waitForSelector(this.site.tableSelector);
      await this.page.waitForTimeout(1000); // Additional wait to ensure data is loaded
      
      return true;
    } catch (error) {
      console.error(`Failed to go to page ${pageNumber}:`, error);
      return false;
    }
  }
}

class TVChosonCrawler extends BaseCrawler {
  async extractCurrentPageData() {
    return await this.page.evaluate((tableSelector) => {
      const table = document.querySelector(tableSelector);
      if (!table) return [];
      
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return {
          contentId: cells[0]?.textContent.trim() || '',
          contentTitle: cells[1]?.textContent.trim() || '',
          contentType: cells[2]?.textContent.trim() || '',
          views: parseInt(cells[3]?.textContent.trim().replace(/,/g, '') || '0', 10),
          revenue: parseFloat(cells[4]?.textContent.trim().replace(/,/g, '') || '0'),
          rawData: JSON.stringify({
            fullRow: row.innerHTML
          })
        };
      });
    }, this.site.tableSelector);
  }

  async getTotalPages() {
    return await this.page.evaluate((paginationSelector) => {
      const pagination = document.querySelector(paginationSelector);
      if (!pagination) return 1;
      
      const pageLinks = Array.from(pagination.querySelectorAll('a'));
      if (pageLinks.length === 0) return 1;
      
      const lastPageLink = pageLinks[pageLinks.length - 2]; // Assuming last item is "Next" button
      return parseInt(lastPageLink.textContent.trim(), 10) || 1;
    }, this.site.paginationSelector);
  }

  async goToPage(pageNumber) {
    try {
      await this.page.evaluate((paginationSelector, page) => {
        const pagination = document.querySelector(paginationSelector);
        if (!pagination) return false;
        
        const pageLinks = Array.from(pagination.querySelectorAll('a'));
        const targetLink = pageLinks.find(link => link.textContent.trim() === String(page));
        
        if (targetLink) {
          targetLink.click();
          return true;
        }
        
        return false;
      }, this.site.paginationSelector, pageNumber);
      
      await this.page.waitForSelector(this.site.tableSelector);
      await this.page.waitForTimeout(1000); // Additional wait to ensure data is loaded
      
      return true;
    } catch (error) {
      console.error(`Failed to go to page ${pageNumber}:`, error);
      return false;
    }
  }
}

class MBNCrawler extends BaseCrawler {
  async extractCurrentPageData() {
    return await this.page.evaluate((tableSelector) => {
      const table = document.querySelector(tableSelector);
      if (!table) return [];
      
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return {
          contentId: cells[0]?.textContent.trim() || '',
          contentTitle: cells[1]?.textContent.trim() || '',
          contentType: cells[2]?.textContent.trim() || '',
          views: parseInt(cells[3]?.textContent.trim().replace(/,/g, '') || '0', 10),
          revenue: parseFloat(cells[4]?.textContent.trim().replace(/,/g, '') || '0'),
          rawData: JSON.stringify({
            fullRow: row.innerHTML
          })
        };
      });
    }, this.site.tableSelector);
  }

  async getTotalPages() {
    return await this.page.evaluate((paginationSelector) => {
      const pagination = document.querySelector(paginationSelector);
      if (!pagination) return 1;
      
      const pageLinks = Array.from(pagination.querySelectorAll('a'));
      if (pageLinks.length === 0) return 1;
      
      const lastPageLink = pageLinks[pageLinks.length - 2]; // Assuming last item is "Next" button
      return parseInt(lastPageLink.textContent.trim(), 10) || 1;
    }, this.site.paginationSelector);
  }

  async goToPage(pageNumber) {
    try {
      await this.page.evaluate((paginationSelector, page) => {
        const pagination = document.querySelector(paginationSelector);
        if (!pagination) return false;
        
        const pageLinks = Array.from(pagination.querySelectorAll('a'));
        const targetLink = pageLinks.find(link => link.textContent.trim() === String(page));
        
        if (targetLink) {
          targetLink.click();
          return true;
        }
        
        return false;
      }, this.site.paginationSelector, pageNumber);
      
      await this.page.waitForSelector(this.site.tableSelector);
      await this.page.waitForTimeout(1000); // Additional wait to ensure data is loaded
      
      return true;
    } catch (error) {
      console.error(`Failed to go to page ${pageNumber}:`, error);
      return false;
    }
  }
}

/**
 * Factory function to create appropriate crawler based on site name
 */
export const createCrawlerForSite = (site) => {
  switch (site.name.toLowerCase()) {
    case 'filesun':
    case '파일썬':
      return new FilesunCrawler(site);
    case 'cumedia':
    case 'cu미디어':
      return new CUMediaCrawler(site);
    case 'channela':
    case '채널a':
      return new ChannelACrawler(site);
    case 'tvchoson':
    case 'tv조선':
      return new TVChosonCrawler(site);
    case 'mbn':
      return new MBNCrawler(site);
    default:
      return new BaseCrawler(site);
  }
};
