// Runs before every test file, so config/index.js sees these values when it is imported.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123456';
process.env.BCRYPT_COST = '4'; // fast hashing in tests only
process.env.APP_TIMEZONE = 'Asia/Kolkata';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://sweety:sweety@localhost:5432/sweety_test';
