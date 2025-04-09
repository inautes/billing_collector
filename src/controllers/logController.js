import { crawlerLogs } from '../utils/crawler.js';

/**
 * Get all logs
 */
export const getLogs = (req, res) => {
  res.status(200).json(crawlerLogs);
};

/**
 * Clear logs
 */
export const clearLogs = (req, res) => {
  crawlerLogs.length = 0;
  res.status(200).json({ message: 'Logs cleared successfully' });
};
