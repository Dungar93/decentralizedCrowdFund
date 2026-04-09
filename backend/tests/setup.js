// Jest test setup file
// Configures test environment before running tests

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/medtrust_test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing';
process.env.PORT = '5001'; // Use different port for tests

// Increase timeout for blockchain operations
jest.setTimeout(30000);

// Global setup
beforeAll(async () => {
  console.log('Setting up test environment...');
});

// Global cleanup
afterAll(async () => {
  console.log('Cleaning up test environment...');
});
