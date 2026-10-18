# Laptop Stock Manager

## Pages
- `index.html` – New entry (barcode scan, purchase details, photos)
- `stock.html` – All entries with search and filters
- `available.html` – Available laptops (cards, filters, sorting, margin, visibility toggle)
- `sold.html` – Sold laptops with revenue and profit/loss
- `settings.html` – Theme, shop information, edit entries / photos, CSV export
- `catalog.html` – Public customer catalog (no login; purchase price, serial number and account are never exposed)

## Setup
1. In the Firebase console create a project, enable **Firestore Database** (production mode), and enable **Authentication → Email/Password**. Create one user (your email and password).
2. Project settings → Web app → copy the config into `js/config.js`.
3. In `firestore.rules` replace `YOUR-EMAIL@gmail.com` (3 places) with your email, then paste the rules in Firestore → Rules and publish.
4. Deploy: `npm i -g firebase-tools && firebase login && firebase init hosting` (public directory: `.`), then `firebase deploy`.
5. Open Settings, add the shop name and WhatsApp number, and share `catalog.html` with customers.

Without a config the app runs in local mode (data stays in this browser only).
