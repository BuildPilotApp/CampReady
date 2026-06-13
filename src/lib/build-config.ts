/**
 * Release build switches — read before every Play Store upload.
 *
 * PrimeTestLab / closed testing (current):
 *   IS_PRIME_TEST_LAB_BUILD = true
 *
 * Production release (after testing):
 *   IS_PRIME_TEST_LAB_BUILD = false
 *   Then rebuild (`npm run cap:sync`) and upload a new signed AAB.
 */

export const IS_PRIME_TEST_LAB_BUILD = true;

/** Matches package.json version and android versionName. */
export const APP_VERSION = "1.0.0";

/** Shown in About and legal screens. Update before production if needed. */
export const DEVELOPER_NAME = "BuildPilot Apps";

/**
 * Optional Play Console support email for privacy/contact copy.
 * Set before production (e.g. "support@yourdomain.com") or leave null to use in-app Feedback only.
 */
export const DEVELOPER_SUPPORT_EMAIL: string | null = null;
