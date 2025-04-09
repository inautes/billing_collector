import express from 'express';
import * as crawlerController from '../controllers/crawlerController.js';

const router = express.Router();

router.post('/run/:siteId', crawlerController.runCrawlerForSite);

router.post('/run-all', crawlerController.runCrawlerForAllSites);

router.get('/status', crawlerController.getCrawlerStatus);

export default router;
