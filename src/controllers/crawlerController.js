import Site from '../models/Site.js';
import SettlementData from '../models/SettlementData.js';
import { createCrawlerForSite } from '../services/crawlerService.js';

const crawlerStatus = {
  running: false,
  lastRun: null,
  currentSite: null,
  results: []
};

/**
 * Run crawler for specific site
 */
export const runCrawlerForSite = async (req, res) => {
  try {
    const { siteId } = req.params;
    
    if (crawlerStatus.running) {
      return res.status(409).json({ 
        message: 'Crawler is already running', 
        status: crawlerStatus 
      });
    }
    
    const site = await Site.findByPk(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    crawlerStatus.running = true;
    crawlerStatus.lastRun = new Date();
    crawlerStatus.currentSite = site.name;
    crawlerStatus.results = [];
    
    res.status(202).json({ 
      message: `Crawler started for site: ${site.name}`,
      status: crawlerStatus
    });
    
    try {
      const crawler = createCrawlerForSite(site);
      const result = await crawler.run();
      
      if (result.success && result.data.length > 0) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const settlementDate = yesterday.toISOString().split('T')[0];
        
        for (const item of result.data) {
          await SettlementData.create({
            siteId: site.id,
            settlementDate,
            ...item
          });
        }
        
        crawlerStatus.results.push({
          site: site.name,
          success: true,
          count: result.data.length,
          message: `Successfully crawled ${result.data.length} items`
        });
      } else {
        crawlerStatus.results.push({
          site: site.name,
          success: false,
          count: 0,
          message: result.message
        });
      }
    } catch (error) {
      console.error(`Error running crawler for ${site.name}:`, error);
      crawlerStatus.results.push({
        site: site.name,
        success: false,
        count: 0,
        message: error.message
      });
    }
    
    crawlerStatus.running = false;
    crawlerStatus.currentSite = null;
    
  } catch (error) {
    console.error('Error running crawler:', error);
    
    crawlerStatus.running = false;
    crawlerStatus.currentSite = null;
    
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Failed to run crawler', 
        error: error.message 
      });
    }
  }
};

/**
 * Run crawler for all active sites
 */
export const runCrawlerForAllSites = async (req, res) => {
  try {
    if (crawlerStatus.running) {
      return res.status(409).json({ 
        message: 'Crawler is already running', 
        status: crawlerStatus 
      });
    }
    
    const sites = await Site.findAll({ where: { active: true } });
    
    if (sites.length === 0) {
      return res.status(404).json({ message: 'No active sites found' });
    }
    
    crawlerStatus.running = true;
    crawlerStatus.lastRun = new Date();
    crawlerStatus.currentSite = 'Multiple sites';
    crawlerStatus.results = [];
    
    res.status(202).json({ 
      message: `Crawler started for ${sites.length} sites`,
      status: crawlerStatus
    });
    
    for (const site of sites) {
      crawlerStatus.currentSite = site.name;
      
      try {
        const crawler = createCrawlerForSite(site);
        const result = await crawler.run();
        
        if (result.success && result.data.length > 0) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const settlementDate = yesterday.toISOString().split('T')[0];
          
          for (const item of result.data) {
            await SettlementData.create({
              siteId: site.id,
              settlementDate,
              ...item
            });
          }
          
          crawlerStatus.results.push({
            site: site.name,
            success: true,
            count: result.data.length,
            message: `Successfully crawled ${result.data.length} items`
          });
        } else {
          crawlerStatus.results.push({
            site: site.name,
            success: false,
            count: 0,
            message: result.message
          });
        }
      } catch (error) {
        console.error(`Error running crawler for ${site.name}:`, error);
        crawlerStatus.results.push({
          site: site.name,
          success: false,
          count: 0,
          message: error.message
        });
      }
    }
    
    crawlerStatus.running = false;
    crawlerStatus.currentSite = null;
    
  } catch (error) {
    console.error('Error running crawler for all sites:', error);
    
    crawlerStatus.running = false;
    crawlerStatus.currentSite = null;
    
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Failed to run crawler for all sites', 
        error: error.message 
      });
    }
  }
};

/**
 * Get crawler status
 */
export const getCrawlerStatus = (req, res) => {
  res.status(200).json(crawlerStatus);
};
