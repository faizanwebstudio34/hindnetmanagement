# Laptop Stock Manager

## Pages
- `index.html` – New entry (barcode scan, purchase details, photos)
- `stock.html` – All entries with search and filters
- `available.html` – Available laptops (cards, filters, sorting, margin, visibility toggle)
- `sold.html` – Sold laptops with revenue and profit/loss
- `lists.html` – Printable lists: (1) numbered detailed list, (2) model summary with quantity. Print, PDF, image, share
- `settings.html` – Theme, shop information, edit entries / photos, CSV export
- `catalog.html` – Public customer catalog (no login; purchase price, serial number and account are never exposed)

## Setup
1. In the Firebase console create a project, enable **Firestore Database** (production mode), and enable **Authentication → Email/Password**. Create one user (your email and password).
2. Project settings → Web app → copy the config into `js/config.js`.
3. (Photos are stored in a separate `photos` collection so lists load fast; the rules file already allows this.) In `firestore.rules` replace `hind@manage.com` (3 places) with your email, then paste the rules in Firestore → Rules and publish.
4. Deploy: `npm i -g firebase-tools && firebase login && firebase init hosting` (public directory: `.`), then `firebase deploy`.
5. Open Settings, add the shop name and WhatsApp number, and share `catalog.html` with customers.

Without a config the app runs in local mode (data stays in this browser only).

## AI label scan (free with Google Gemini)
The "Scan label to auto-fill details" button sends the photo to `/api/scan` (a Vercel serverless function) which reads it with Google Gemini. Barcodes decoded in the browser are used to double-check the serial number. If the function is not configured or the free limit is reached, the app falls back to offline OCR (less accurate).
1. Open aistudio.google.com, sign in and create an API key (no billing needed for the free tier). Check your project's free limits in the AI Studio rate-limit page.
2. Vercel → Project → Settings → Environment Variables, add: `GEMINI_API_KEY`, `FIREBASE_API_KEY` (same value as `apiKey` in `js/config.js`); optional `OWNER_EMAIL`, `GEMINI_MODEL`. See `.env.example`.
3. Redeploy. Only the logged-in owner can call the function.

Note: on the free tier Google may use the submitted images to improve its products. Only photograph labels, not people or personal documents.
