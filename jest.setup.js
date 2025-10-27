// Load test environment variables before running tests
require('dotenv').config({ path: '.env.test' });

const mongoose = require('mongoose');
const { config } = require('./src/config');

// Global setup: Connect to MongoDB before all tests
// NOTE: Migrations are run automatically via the test script in package.json
beforeAll(async () => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('Connected to test database:', config.database.uri);
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
}, 30000); // 30 second timeout for database connection

// Global teardown: Clean up and disconnect after all tests
afterAll(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Clear all collections after tests complete
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
      console.log('Cleared all test data from database');

      await mongoose.disconnect();
      console.log('Disconnected from test database');
    }
  } catch (error) {
    console.error('Error during test cleanup:', error);
  }
}, 30000); // 30 second timeout for cleanup
