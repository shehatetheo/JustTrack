# JustTrack — App Store Connect kit

Everything to fill in at appstoreconnect.apple.com. Copy the text as is; character limits are noted where Apple enforces them.

## Pushing the text automatically

`store.config.json` at the repo root holds everything in this document in EAS Metadata format, and `eas.json` points at it. Once the app record exists in App Store Connect and a build has been uploaded and processed, one command fills in the listing (name, subtitle, promo, description, keywords, URLs, categories, age rating, review notes):

```bash
npx eas-cli@latest metadata:push
```

Before the first push, replace the two placeholders in `store.config.json` under `apple.review`: `email` and `phone` (Apple's contact for review questions). Screenshots can't be pushed this way; upload them by hand in App Store Connect.

## Files in this folder

| File | Use in App Store Connect |
| --- | --- |
| `icon-1024.png` | Not uploaded separately: the icon comes from the build (`assets/justtrack.icon` + `assets/images/icon.png`). Keep it here for the listing preview and press use. |
| `screenshots/iphone-6.9/01…05.png` | App Store → iOS App → Screenshots → **iPhone 6.9" Display** (1320 × 2868). Upload in numbered order. Apple scales this one set for every other iPhone size. |

## App Information

| Field | Value |
| --- | --- |
| Name (30) | `JustTrack: Calorie Counter` (plain "JustTrack" is taken by another developer on the App Store) |
| Subtitle (30) | `Open source, no ads, no login` |
| Bundle ID | `com.theokkk4.justtrack` |
| SKU | `justtrack-ios` |
| Primary language | English (U.S.) |
| Primary category | Health & Fitness |
| Secondary category | Food & Drink |
| Content rights | Does not contain, show, or access third-party content |
| Age rating | 4+ (answer **No** to every question; no unrestricted web access; no gambling) |
| Price | Free |
| Availability | All countries |

## Version Information (1.0)

**Promotional text (170)**

```
Open source. No account, no ads. Snap a photo, search restaurant menus, or build your order. Your data stays on your phone.
```

**Description (4000)**

```
JustTrack is the open-source calorie tracker. No account and no ads. The code is public, so anyone can see exactly what the app does with their data: nothing.

SNAP YOUR FOOD
Take a photo of your plate and JustTrack estimates each food on it: what it is, how much, and the calories, protein, carbs, and fat. Adjust the grams, swap anything for an exact database entry, and log it in one tap. Estimates are labelled so you always know what's measured and what's approximate.

RESTAURANT MENUS BUILT IN
McDonald's, Chick-fil-A, Chipotle, Starbucks, Taco Bell, Dunkin', Wendy's, Burger King, Subway, Panda Express, Domino's, Panera, Popeyes, Raising Cane's, KFC, Jersey Mike's, Sonic, Pizza Hut, Dairy Queen, Wingstop, Arby's, Little Caesars, Papa John's, Jamba, Insomnia Cookies, Freshens, Wawa, 7-Eleven, Applebee's, Auntie Anne's, 7 Brew, and Hangry Joe's. Over 8,500 items with the chains' own nutrition numbers, and they work offline. Tap a restaurant to browse its menu, or search across all of them. JustTrack is not affiliated with or endorsed by any of these restaurants; their names are used only to identify the published nutrition data.

BUILD IT LIKE YOU ORDER IT
Searching Chipotle, Subway, Panda Express, or Jersey Mike's opens an order builder. Pick the protein, rice, beans, toppings, size, and sides exactly as you'd order at the counter. The total comes from the menu.

EVERYDAY FOODS AND BARCODES
Search thousands of everyday foods from the USDA database, scan a barcode for packaged products, or add your own. Smart search groups duplicates so you find the right entry fast.

YOUR DAY, YOUR WEEK
See calories left, protein, carbs, and fat at a glance. Browse any day of the week, check calories by meal, and watch a seven-day trend. Set a daily calorie goal and optional macro targets.

PRIVATE BY DESIGN
There is no sign-up. Your log, goals, and name are stored only on your device. Meal photos are analysed and not kept. No analytics, no tracking, no ads.

OPEN SOURCE
Every feature is included from the first launch, and the source code is public on GitHub (github.com/theokkk4/JustTrack). Read it, improve it, or build it yourself.

Made in Philadelphia for college students, and open to everyone.
```

**Keywords (100, comma-separated, no spaces after commas)**

```
calorie counter,calories,open source,food tracker,macro,diet,macros,fast food,nutrition,photo,meal log
```

**What's New (first release)**

```
First release. Open source. Snap a photo to log a meal, search restaurant menus, build your order, and track calories and macros without an account.
```

| Field | Value |
| --- | --- |
| Support URL | `https://justtrack-snowy.vercel.app/support` |
| Marketing URL | `https://justtrack-snowy.vercel.app` |
| Privacy Policy URL | `https://justtrack-snowy.vercel.app/privacy` |
| Copyright | `2026 Theo King` (change to the name you want shown) |
| Version | `1.0.0` (matches `app.json`; the build number is managed by EAS) |

## App Review Information

| Field | Value |
| --- | --- |
| Sign-in required | **No** (there is no account) |
| Contact | Your name, phone, and email (Apple contacts you here if something fails review) |
| Notes | see below |

**Notes for the reviewer**

```
JustTrack has no account or sign-in; everything works immediately after "Start tracking".

The photo scanner (Scan tab) sends the photo to Google's Gemini API for a nutrition estimate and shows the result labelled "Estimated". Point it at any plate of food. Estimates are approximate by nature and the user can adjust every value before logging.

Food search uses a bundled USDA database and bundled restaurant menus; packaged-food search and barcode scanning query Open Food Facts. No personal data is collected; see the privacy policy URL.
```

## App Privacy (the "nutrition label")

Choose **Data Not Collected**, then confirm. Reasoning, in case Apple asks:

- Log, goals, and name never leave the device. No account, no analytics or advertising SDKs, no identifiers.
- Meal photos are sent to Google's Gemini API only to produce the estimate, with storage off, and are not retained. Apple's definition of "collected" excludes data that is processed transiently and not stored, which is this case.
- Packaged-food search sends the typed query or barcode to Open Food Facts. Search terms are not linked to a person and are not stored by JustTrack.

Privacy manifest and required-reason APIs: Expo SDK 57 ships the privacy manifest for the system APIs the app uses (user defaults, file timestamps). No extra entries needed.

## Export compliance

`app.json` sets `usesNonExemptEncryption: false`, so App Store Connect skips the encryption questions. The app only uses standard HTTPS.

## TestFlight

1. After the build uploads (via `eas submit` or Transporter), it appears under **TestFlight** in App Store Connect after about 10 minutes of processing.
2. **Internal testing**: add yourself and friends (up to 100, must be in your App Store Connect team) to an internal group. No review needed; installs through the TestFlight app.
3. **External testing** (up to 10,000 people, public link): needs the "What to Test" text and a brief Apple review of the build. Use the What's New text above for "What to Test".
4. Test information for TestFlight: Beta App Description = the promotional text above; Feedback email = your contact email.

## Before submitting for App Store review

- [ ] `GEMINI_API_KEY` set on Vercel too, so the web app's scanner works (the TestFlight build carries its own key).
- [ ] Set a spending cap on the Gemini key in Google AI Studio, since the key ships inside the app.
- [ ] Open the privacy and support URLs on your phone to confirm they load.
- [ ] Rotate the Expo access token that was shared in chat.
