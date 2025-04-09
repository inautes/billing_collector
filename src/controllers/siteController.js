import { Op } from 'sequelize';
import Site from '../models/Site.js';
import SettlementData from '../models/SettlementData.js';

/**
 * Get all sites
 */
export const getAllSites = async (req, res) => {
  try {
    const sites = await Site.findAll();
    res.status(200).json(sites);
  } catch (error) {
    console.error('Error getting all sites:', error);
    res.status(500).json({ message: 'Failed to get sites', error: error.message });
  }
};

/**
 * Get site by ID
 */
export const getSiteById = async (req, res) => {
  try {
    const site = await Site.findByPk(req.params.id);
    
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    res.status(200).json(site);
  } catch (error) {
    console.error('Error getting site by ID:', error);
    res.status(500).json({ message: 'Failed to get site', error: error.message });
  }
};

/**
 * Create new site
 */
export const createSite = async (req, res) => {
  try {
    const newSite = await Site.create(req.body);
    res.status(201).json(newSite);
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({ message: 'Failed to create site', error: error.message });
  }
};

/**
 * Update site
 */
export const updateSite = async (req, res) => {
  try {
    const [updated] = await Site.update(req.body, {
      where: { id: req.params.id }
    });
    
    if (updated === 0) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    const updatedSite = await Site.findByPk(req.params.id);
    res.status(200).json(updatedSite);
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({ message: 'Failed to update site', error: error.message });
  }
};

/**
 * Delete site
 */
export const deleteSite = async (req, res) => {
  try {
    const deleted = await Site.destroy({
      where: { id: req.params.id }
    });
    
    if (deleted === 0) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    res.status(200).json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({ message: 'Failed to delete site', error: error.message });
  }
};

/**
 * Get site's settlement data
 */
export const getSiteData = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    const site = await Site.findByPk(id);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    const query = { where: { siteId: id } };
    
    if (startDate && endDate) {
      query.where.settlementDate = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      query.where.settlementDate = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      query.where.settlementDate = {
        [Op.lte]: endDate
      };
    }
    
    const data = await SettlementData.findAll(query);
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error getting site data:', error);
    res.status(500).json({ message: 'Failed to get site data', error: error.message });
  }
};
