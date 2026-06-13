export const TERMS_LAST_UPDATED = "June 2026";
export const PRIVACY_LAST_UPDATED = "June 2026";

export const PRIVACY_SECTIONS = [
  {
    title: "Our Commitment",
    body: `CampReady does not collect, transmit, or share personal user data or tracking information with remote servers. There are no analytics SDKs, advertising identifiers, or third-party data brokers integrated into the app.`,
  },
  {
    title: "Data Stored on Your Device",
    body: `All trip details, gear checklists, templates, packing status, and preferences are stored locally on your device. Your data remains under your control and is not uploaded to CampReady servers.`,
  },
  {
    title: "Network Activity",
    body: `CampReady may make limited network requests only when you explicitly use optional features, such as weather forecasts for a trip location, location suggestions while typing a place name, opening affiliate product links when you tap the shopping cart icon on an eligible gear item, or completing a Pro upgrade through Stripe in your system browser.

These requests are initiated by your actions. CampReady does not perform background tracking or silent data collection.`,
  },
  {
    title: "Accounts & Authentication",
    body: `CampReady does not require an account, email address, or sign-in to use the core checklist features.`,
  },
  {
    title: "Children's Privacy",
    body: `CampReady is not directed at children under 13, and we do not knowingly collect personal information from anyone.`,
  },
  {
    title: "Changes to This Policy",
    body: `We may update this policy as the app evolves. Material changes will be reflected by updating the "Last Updated" date above.`,
  },
  {
    title: "Contact",
    body: `For privacy questions, use the Feedback option in the CampReady information menu.`,
  },
] as const;

export const TERMS_SECTIONS = [
  {
    title: "1. App Purpose & User Responsibility",
    body: `CampReady is provided strictly as a digital organization and packing checklist utility. Outdoor activities, camping, overlanding, and backcountry travel are inherently dangerous activities that carry risk of property damage, personal injury, or death.

You explicitly agree that you are 100% solely responsible for your own safety, preparation, trip planning, and final validation of all necessary gear, food, water, medical supplies, and emergency equipment.`,
  },
  {
    title: '2. Warranty Disclaimer ("As-Is")',
    body: `This application is provided on an "As-Is" and "As-Available" basis without warranties of any kind, either express or implied. The developer does not guarantee that the provided templates or checklists are exhaustive, accurate, or sufficient for your specific environmental conditions.`,
  },
  {
    title: "3. Limitation of Liability",
    body: `To the maximum extent permitted by applicable law, in no event shall the developer or creator of CampReady be liable for any direct, indirect, incidental, special, exemplary, or consequential damages (including, but not limited to, equipment failure, personal injury, illness, exposure, or financial loss) however caused and on any theory of liability, arising in any way out of the use of this software.`,
  },
  {
    title: "4. Affiliate Disclosure",
    body: `As an Amazon Associate I earn from qualifying purchases. Tapping the shopping cart icon on eligible gear items opens Amazon search links that may reward the creator with a small commission at no additional cost to you. #ad`,
  },
] as const;
