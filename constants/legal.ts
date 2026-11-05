import type { LegalSection } from '@/components/legal/LegalPage';
import { APP_NAME, REPOSITORY_URL } from '@/constants/brand';

/** Where the app is hosted; the privacy policy and support pages live at /privacy and /support there. */
export const WEBSITE_URL = 'https://justtrack-snowy.vercel.app';
export const PRIVACY_URL = `${WEBSITE_URL}/privacy`;
export const SUPPORT_URL = `${WEBSITE_URL}/support`;
export const ISSUES_URL = `${REPOSITORY_URL}/issues`;

export const LEGAL_DATELINE = 'Updated October 30, 2026';

export const PRIVACY_INTRO = `${APP_NAME} is built so that there is nothing to collect. There is no account, no sign-in, no ads, and no analytics. This page explains the few moments when data leaves your phone and why.`;

export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    heading: 'What stays on your device',
    paragraphs: [
      'Your food log, calorie and macro goals, display name, and preferences are stored only on your device. We have no server that holds them and no way to see them. Deleting the app deletes them; "Clear my log" in Profile deletes the log.',
    ],
  },
  {
    heading: 'Meal photos',
    paragraphs: [
      'When you scan a meal, the photo is sent to Google’s Gemini API so it can estimate what food is on the plate. The request is made with storage turned off: the photo is used to produce the estimate and is not kept by us. A small thumbnail of the photo is saved on your device next to the logged meal so you can recognise it later. Nothing else about you is sent with the photo.',
      'Estimates from a photo are approximate. The app labels them "Estimated" so you can adjust them.',
    ],
  },
  {
    heading: 'Food search',
    paragraphs: [
      'Searching everyday foods uses a database bundled inside the app (USDA FoodData Central), which never leaves your device. Searching packaged foods and scanning barcodes sends the words you typed, or the barcode, to Open Food Facts to look up the product. Restaurant menus are bundled inside the app.',
      'Restaurant nutrition figures are compiled from each chain’s publicly published nutrition information. Restaurant names and logos appear only to identify whose published menu is shown; they are trademarks of their owners, and the app is not affiliated with, sponsored by, or endorsed by any restaurant.',
    ],
  },
  {
    heading: 'What we never do',
    paragraphs: [
      'We do not create accounts or profiles, do not use advertising or analytics SDKs, do not track you across apps or websites, and do not sell or share personal data. The app does not ask for your location or contacts.',
    ],
  },
  {
    heading: 'Children',
    paragraphs: [`${APP_NAME} is intended for adults and students aged 13 and over. It is not directed at children under 13 and collects no personal data from anyone.`],
  },
  {
    heading: 'Changes and contact',
    paragraphs: [
      `If this policy changes, the date at the top changes and the new version is published at ${PRIVACY_URL}. Questions go to the support page or the project’s issue tracker at ${ISSUES_URL}.`,
    ],
  },
];

export const SUPPORT_INTRO = `Something not working, or a food missing? Here is how to get help with ${APP_NAME}.`;

export const SUPPORT_SECTIONS: readonly LegalSection[] = [
  {
    heading: 'Report a problem',
    paragraphs: [`Open an issue at ${ISSUES_URL} with what you expected, what happened, and your phone model and iOS version. Screenshots help.`],
  },
  {
    heading: 'The scanner got a food wrong',
    paragraphs: [
      'Photo estimates are approximate. On the review screen, adjust the grams, remove an item with the ×, or tap "Not quite right? Find it in the database" to swap it for an exact entry. Clear, well-lit photos of the whole plate work best.',
    ],
  },
  {
    heading: 'A restaurant item is missing',
    paragraphs: ['Menus for 32 chains are bundled and updated with each release. Tell us which item at the issue tracker above and it will be in the next update.'],
  },
  {
    heading: 'My data',
    paragraphs: [`Everything you log lives on your device. To delete just the log, use "Clear my log" in Profile. To delete everything the app has stored (log, recent searches, name and goals) and start over, use "Erase all data" in Profile. See the privacy policy at ${PRIVACY_URL} for details.`],
  },
];
