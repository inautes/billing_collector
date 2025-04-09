import express from 'express';
import * as siteController from '../controllers/siteController.js';

const router = express.Router();

router.get('/', siteController.getAllSites);

router.get('/:id', siteController.getSiteById);

router.post('/', siteController.createSite);

router.put('/:id', siteController.updateSite);

router.delete('/:id', siteController.deleteSite);

router.get('/:id/data', siteController.getSiteData);

export default router;
