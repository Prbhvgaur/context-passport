import { dataStore } from '../src/services/data-store';

beforeEach(async () => {
  await dataStore.reset?.();
});
