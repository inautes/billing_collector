import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Site from './Site.js';

const SettlementData = sequelize.define('SettlementData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  siteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Site,
      key: 'id'
    }
  },
  settlementDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  contentId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Content ID or reference from the site'
  },
  contentTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contentType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  views: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  revenue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  rawData: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Raw JSON data from the site'
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['siteId', 'settlementDate', 'contentId']
    }
  ]
});

SettlementData.belongsTo(Site, { foreignKey: 'siteId' });
Site.hasMany(SettlementData, { foreignKey: 'siteId' });

export default SettlementData;
