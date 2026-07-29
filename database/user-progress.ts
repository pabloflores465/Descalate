import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { expoDb } from '@/database/db';

export type UserProgress = {
  onboardingCompleted: boolean;
  profileCompleted: boolean;
  tutorialCompleted: boolean;
};

type UserProgressRow = {
  onboarding_completed: number;
  profile_completed: number;
  tutorial_completed: number;
};

const LEGACY_PROGRESS_KEYS = [
  STORAGE_KEYS.ONBOARDING_COMPLETE,
  STORAGE_KEYS.PROFILE_COMPLETE,
  STORAGE_KEYS.TUTORIAL_COMPLETE,
] as const;

export async function getUserProgress(email: string): Promise<UserProgress | null> {
  const row = await expoDb.getFirstAsync<UserProgressRow>(
    `SELECT onboarding_completed, profile_completed, tutorial_completed
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  if (!row) {
    return null;
  }

  return {
    onboardingCompleted: row.onboarding_completed === 1,
    profileCompleted: row.profile_completed === 1,
    tutorialCompleted: row.tutorial_completed === 1,
  };
}

export async function setUserProgress(
  email: string,
  field: 'onboarding_completed' | 'profile_completed' | 'tutorial_completed',
  completed: boolean
): Promise<void> {
  const result = await expoDb.runAsync(`UPDATE users SET ${field} = ? WHERE email = ?`, [
    completed ? 1 : 0,
    email,
  ]);

  if (result.changes !== 1) {
    throw new Error(`Cannot update ${field}: user ${email} does not exist`);
  }
}

/**
 * Move the pre-v7 global flags into the currently authenticated user's row.
 * The old keys are removed so they can never leak progress between accounts.
 */
export async function migrateLegacyProgress(email: string): Promise<void> {
  const legacyValues = await AsyncStorage.multiGet(LEGACY_PROGRESS_KEYS);
  const completedFields = legacyValues
    .filter(([, value]) => value === 'true')
    .map(([key]) => {
      switch (key) {
        case STORAGE_KEYS.ONBOARDING_COMPLETE:
          return 'onboarding_completed';
        case STORAGE_KEYS.PROFILE_COMPLETE:
          return 'profile_completed';
        case STORAGE_KEYS.TUTORIAL_COMPLETE:
          return 'tutorial_completed';
      }
    });

  if (completedFields.length > 0) {
    await expoDb.runAsync(
      `UPDATE users
       SET ${completedFields.map((field) => `${field} = 1`).join(', ')}
       WHERE email = ?`,
      [email]
    );
  }

  await AsyncStorage.multiRemove([...LEGACY_PROGRESS_KEYS]);
}
