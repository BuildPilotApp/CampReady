/**
 * Release build switches to read before every store upload.
 *
 * PrimeTestLab / closed testing:
 *   IS_PRIME_TEST_LAB_BUILD = true
 *
 * Production release (current):
 *   IS_PRIME_TEST_LAB_BUILD = false
 *   Then rebuild (`npm run cap:sync`) and upload a signed AAB (Android) or Archive (iOS).
 */

export const IS_PRIME_TEST_LAB_BUILD = false;

/** Matches package.json version and android versionName. */
export const APP_VERSION = "1.0.4";

/** Shown in About and legal screens. Update before production if needed. */
export const DEVELOPER_NAME = "BuildPilot Apps";

/**
 * Support email shown in About/Settings and App Store / Play Console listings.
 * Leave null to use in-app Feedback only.
 */
export const DEVELOPER_SUPPORT_EMAIL: string | null = "support@buildpilotapps.com";
