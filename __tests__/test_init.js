/**
 * Entry point for the test suite
 */

const utils = require('./test_utils');
const { post_tests } = require('./posts.test');
const { user_tests } = require('./users.test');

beforeAll(async () => {
  console.log('Initializing test suite...');
  console.log('Connecting to database...');
  await utils.db_connect();
  console.log('Dropping database...');
  await utils.db_drop_everything();
  console.log('Initializing database content...');
  await utils.db_init_content();
  console.log('Initialized');
});

afterAll(async () => {
  console.log('Test finished, cleaning up...');
  console.log('Dropping database...');
  await utils.db_drop_everything();
  console.log('Disconnecting from database...');
  await utils.db_disconnect();
  console.log('Cleaned up, exiting');
});

test('DB connection', async () => {
  expect(utils.db_connected()).toBe(true);
});

describe('Posts related tests', post_tests);
describe('Users related tests', user_tests);
