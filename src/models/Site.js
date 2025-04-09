import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Site = sequelize.define('Site', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  loginSelector: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'CSS selector for login form'
  },
  usernameSelector: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passwordSelector: {
    type: DataTypes.STRING,
    allowNull: true
  },
  submitSelector: {
    type: DataTypes.STRING,
    allowNull: true
  },
  settlementMenuSelector: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'CSS selector for settlement menu'
  },
  datePickerSelector: {
    type: DataTypes.STRING,
    allowNull: true
  },
  searchButtonSelector: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tableSelector: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'CSS selector for data table'
  },
  paginationSelector: {
    type: DataTypes.STRING,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

export default Site;
