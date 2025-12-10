/**
 * Centralized AsyncStorage keys used throughout the app.
 * This prevents typos and makes refactoring easier.
 */

export const STORAGE_KEYS = {
  /** Current authenticated user's email */
  AUTH_EMAIL: '@descalate_current_user_email',

  /** Whether user has completed onboarding slides */
  ONBOARDING_COMPLETE: '@descalate_onboarding_complete',

  /** Whether user has completed their profile setup */
  PROFILE_COMPLETE: '@descalate_profile_complete',

  /** Whether user has completed the tutorial */
  TUTORIAL_COMPLETE: '@descalate_tutorial_complete',

  /** User's selected language preference */
  LANGUAGE: '@descalate_language',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
