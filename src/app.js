import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from './config/database.js';
import siteRoutes from './routes/siteRoutes.js';
import crawlerRoutes from './routes/crawlerRoutes.js';
import { seedSites } from './utils/seedData.js';
import './models/Site.js';
import './models/SettlementData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'views')));

app.use('/api/sites', siteRoutes);
app.use('/api/crawler', crawlerRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');
    
    await seedSites();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Admin interface available at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();

export default app;
