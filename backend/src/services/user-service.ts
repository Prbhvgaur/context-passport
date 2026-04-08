import { dataStore } from './data-store.js';
import { AppError } from '../utils/errors.js';

export class UserService {
  public async getProfile(userId: string) {
    const profile = await dataStore.getUserProfile(userId);
    if (!profile) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User profile not found.');
    }

    return profile;
  }

  public async updatePreferences(
    userId: string,
    preferences: Parameters<typeof dataStore.updateUserPreferences>[1],
  ) {
    return dataStore.updateUserPreferences(userId, preferences);
  }
}

