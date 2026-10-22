# Laptop Stock Manager

Static web app (HTML/CSS/JS) with a Firebase backend (Firestore + Authentication). No server code and no paid APIs.

## Pages
- `dashboard.html` – key numbers, stock by company, stock age, sales per month
- `index.html` – new entry (barcode / label scan, purchase details, photos)
- `stock.html` – all entries: numbering, search, filters, select + bulk actions
- `available.html` – available laptops (cards, margin, show/hide on the customer page)
- `sold.html` – sold laptops with revenue and profit/loss
- `lists.html` – printable lists: numbered detailed list and model summary; print, PDF, image, share
- `settings.html` – theme, shop information, edit entries / photos, CSV export
- `catalog.html` – public customer catalog (no login; purchase price, serial number and account are never exposed)

## Setup
1. Firebase console: create a project, enable **Firestore Database** (production mode) and **Authentication → Email/Password**; create one user (your email and password).
2. Project settings → Web app → copy the config into `js/config.js`.
3. Put your login email in `firestore.rules` (3 places + the photos rule), paste the rules into Firestore → Rules and **Publish** (do this again after every update of this file).
4. Deploy the folder to any static host (Vercel, Netlify, Firebase Hosting, ...). Add the site domain in Authentication → Settings → Authorized domains.
5. Open Settings, add the shop name and WhatsApp number, and share `catalog.html` with customers.

Without a config the app runs in local mode (data stays in this browser only).

## Label scan (free, offline in the browser)
Barcode decoding gives the exact serial number. Text on the label is read with Tesseract OCR in the browser (the text data is downloaded once). Always review the fields before saving; you can also tap a detected line to put it into a field.

## Laptop IDs
Every laptop gets a short unique ID (HN0001, HN0002, ...) when it is saved. The numbers come from one shared counter (a Firestore transaction), so they are unique across phones and computers and are never reused, even after a delete. Old entries without an ID are numbered automatically the next time the app is opened. The prefix (default `HN`) can be changed in Settings and only affects new IDs. Customers see the ID as "Reference" on the catalog.

## If something does not work
Settings → **Device check** tests the connection, login, database read/write, camera and file sharing and shows what fails. A red banner at the bottom of the screen shows any JavaScript error with a **Copy details** button.

## iPhone / iPad
Open the site in Safari, tap Share → **Add to Home Screen** to use it like an app. Camera features need HTTPS (any normal host provides it). PDF / image downloads open the iOS share sheet (choose **Save to Files**).
