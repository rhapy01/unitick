const cron = require('node-cron');
const fetch = require('node-fetch');

// Configuration
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

// Log function
const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

// Function to call the expire listings API
const expireListings = async () => {
  try {
    log('Starting listing expiration check...');
    
    const response = await fetch(`${APP_URL}/api/cron/expire-listings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      log(`Success: ${result.message}`);
      log(`Deactivated ${result.deactivatedCount} listings`);
    } else {
      log(`Error: ${result.error}`);
    }
  } catch (error) {
    log(`Error: ${error.message}`);
  }
};

// Schedule the cron job to run daily at 2 AM
cron.schedule('0 2 * * *', () => {
  log('Running scheduled listing expiration check...');
  expireListings();
});

// Also allow manual trigger
if (process.argv.includes('--run-now')) {
  log('Running manual listing expiration check...');
  expireListings();
}

log('Cron service started. Listing expiration will run daily at 2 AM UTC.');






















