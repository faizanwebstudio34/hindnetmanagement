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
