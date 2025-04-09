import express from 'express';
import * as logController from '../controllers/logController.js';

const router = express.Router();

router.get('/', logController.getLogs);
router.get('/clear', logController.clearLogs);

export default router;
