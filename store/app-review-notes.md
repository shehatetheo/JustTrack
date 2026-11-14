# App Review reply: Guideline 2.1 (Information Needed)

Paste the block under **Notes** into App Store Connect → your app → the 1.0 version page → **App Review Information → Notes**, attach the screen recording link, then click **Resubmit for Review** (or reply in Resolution Center and resubmit).

Make sure the attached build on the version page is the latest one in TestFlight, **1.0.0 (16)**.

---

## Notes (paste this)

```
SCREEN RECORDING
<paste the link here — see below for how to record and host it>

1. PURPOSE AND AUDIENCE
JustTrack is a free, open-source calorie and macro tracker. It solves one problem: logging what you ate quickly and accurately, without an account, ads, subscription or paywall. It is aimed at college students and anyone tracking calories, protein, carbs and fat day to day. The full source code is public on GitHub (github.com/theokkk4/JustTrack), so anyone can verify what the app does with data: everything stays on the phone.

2. SETUP AND HOW TO REACH THE MAIN FEATURES
There is no account, login, registration or subscription. No credentials or sample files are needed.
- First launch: a one-screen welcome asks for a display name (optional) and a daily calorie goal, then opens Home.
- Home: today's calories left, protein/carbs/fat rings, meals for the day, a week strip to view other days.
- Search (center tab button): type any food ("chobani", "banana", "big mac") or pick a restaurant from the grid to browse its full menu. Chipotle, Subway, Jersey Mike's and Panda Express also have a "Build your order" flow where you pick base, protein and toppings and the menu's nutrition is added up.
- Scan (viewfinder tab): photograph a plate; the app returns an estimate of each food, grams and macros. Results are labelled "Estimated" and can be edited or swapped for a database entry before logging. The scan tab also has a barcode scanner for packaged foods, and a "Describe what you ate" option (pencil button) that does the same from a typed sentence.
- Progress tab: today's calories, logging streak, weight with a trend chart (tap the Weight card, then Log weight), balance score, calories by meal, last 7 days. Weight is typed in by the user and stored only on the device; the app does not read from or write to Apple Health.
- A short, skippable set of "welcome back" slides appears if nothing has been logged for three days.
- Profile: goals, units, appearance, meal reminders, privacy policy, support, and "Erase all data", which wipes the on-device log and settings.
- Reminders: optional local notifications that nudge the user to log food, every 1.5 hours or at mealtimes. They are off by default. The app asks once it is open, the user can decline, and they can be switched off in Profile → Meal reminders. They are scheduled on the device; the app does not use push notifications or any notification server.

3. EXTERNAL SERVICES
- Google Gemini API (Google): the photo-scan feature sends the meal photo, and the describe feature sends the typed sentence, to Google's Gemini model to estimate the foods. Neither is stored by the app or by us; the request is made directly from the device. This is the only AI service used.
- Open Food Facts (openfoodfacts.org): an open database queried for packaged-food search and barcode lookups.
- USDA FoodData Central: bundled inside the app (no network call) for generic foods.
- Restaurant menu nutrition: bundled inside the app, compiled from the chains' publicly published nutrition information.
No authentication service, payment processor, analytics SDK, ad network or crash reporter is used. No user data is sent to any server we operate; the app has no backend.

4. REGIONAL DIFFERENCES
None. The app functions identically in every region. Content is English only. The restaurant menu data is for U.S. menus.

5. REGULATED INDUSTRY / THIRD-PARTY MATERIAL
The app is not in a regulated industry and provides no medical advice; calorie figures are presented as tracking information, and photo results are explicitly labelled as estimates.
Third-party material in the app:
- Nutrition facts for 32 restaurant chains are factual data compiled from each chain's publicly published nutrition information. Nutrition facts are not copyrightable.
- Restaurant names appear only to identify which chain's published menu data is being shown (nominative use), the same way any nutrition-tracking app lists restaurant foods. The app shows plain initials for each chain, not logos. We do not claim any affiliation with or endorsement by these chains, and the app states this in its privacy and support pages.
- Open Food Facts data is used under the Open Database License (ODbL). USDA data is public domain.

6. ACCOUNTS AND USER CONTENT
There is no account creation, so no login or account-deletion flow applies. There is no user-generated content shared with anyone: the food log is private, stored only on the device, and can be erased from Profile → Erase all data. No in-app purchases.
```

---

## The screen recording

Apple requires it to be captured **on a physical iPhone running the latest iOS**, starting from the app launch.

1. On your iPhone, install **1.0.0 (16)** from TestFlight and make sure iOS is up to date (Settings → General → Software Update).
2. If the app was already opened on this phone, go to Profile → **Erase all data** first, so the recording starts at the welcome screen.
3. Swipe down from the top-right corner → tap the **Screen Record** button in Control Center (add it under Settings → Control Center if it's missing). The 3-second countdown starts; now open JustTrack from the home screen.
4. Record this flow, about 90 seconds, no narration needed:
   1. App launches → loading screen → welcome: type a name, set a goal, continue.
   2. Home: scroll once so the meals and rings are visible.
   3. Tap the center search button → type "chobani" → open a result → tap Add.
   4. Back in search, tap Chipotle → browse the menu → tap "Build your order" → pick a protein, tap 2× → Add.
   5. Tap the Scan tab → take a photo of any food (or a picture of food on a screen) → wait for the estimate → show the "Estimated" label → tap Add.
   6. Home again: the meal cards now have entries. Swipe one entry to show edit/delete.
   7. Progress tab: scroll through the streak, weight, balance, calories by meal, last 7 days.
   8. Profile: open Privacy policy, go back, then tap **Erase all data** and confirm, to show the data-deletion path.
5. Stop recording (tap the red status bar → Stop). The video lands in Photos.
6. Host it where the reviewer can open it without a login: upload to **iCloud Drive and share a link** (Files app → the video → Share → Copy iCloud Link, set to "Anyone with the link"), or a Google Drive link set to "Anyone with the link", or an unlisted YouTube video. Paste the link at the top of the Notes.

App Store Connect also accepts an attachment: on the version page under App Review Information there is an **Attachments** area where you can upload the .mov directly (keep it under 500 MB). Doing both is fine.

---
