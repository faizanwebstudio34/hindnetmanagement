/* Vercel serverless function: reads a laptop sticker / box photo with Google Gemini (free tier) and returns structured details.
   Only the logged-in owner (Firebase ID token) can call it. The Gemini key lives in Vercel Environment Variables, never in the browser. */
const OWNER = (process.env.OWNER_EMAIL || 'hind@manage.com').toLowerCase();
// GEMINI_MODEL can be set in Vercel. Fallbacks are tried if a model name is retired/unavailable (404).
const MODELS = [process.env.GEMINI_MODEL, 'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.6-flash'].filter(Boolean);
const SYSTEM = `You read the printed labels on laptops (sticker on the back, bottom cover) and on laptop boxes.
Copy values exactly as printed. Never guess or invent anything: if a field is not clearly visible, return an empty string.
The serial number is usually marked S/N, SN, Serial No. or Service Tag. Do NOT return a product number (P/N, SKU, MPN), MAC address, IMEI, order number or EAN as the serial number.
Be careful with look-alike characters (0/O, 1/I/l, 5/S, 8/B); use the surrounding text and the decoded barcodes (if provided) to decide. If any character is uncertain, say so in notes.
"brand" is the manufacturer (HP, Dell, Lenovo, ASUS, Acer, ...). "model" is the product/model name or model number printed on the label.
Fill processor, ram, storage and screen only if printed (for example "Intel Core i5-1235U", "16 GB", "512 GB SSD", "15.6 inch").`;
const S = { type: 'STRING' };
const SCHEMA = { type: 'OBJECT', properties: {
  serial_number: S, other_serials: { type: 'ARRAY', items: S }, brand: S, model: S,
  processor: S, ram: S, storage: S, screen: S, notes: S },
  required: ['serial_number', 'brand', 'model'] };
async function ownerEmail(idToken) {
  const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + process.env.FIREBASE_API_KEY,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
  if (!r.ok) return null;
  const j = await r.json();
  return (j.users && j.users[0] && j.users[0].email || '').toLowerCase() || null;
}
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!process.env.GEMINI_API_KEY || !process.env.FIREBASE_API_KEY) return res.status(501).json({ error: 'not_configured' });
  const tok = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!tok || (await ownerEmail(tok)) !== OWNER) return res.status(401).json({ error: 'unauthorized' });
  const { images, barcodes } = req.body || {};
  if (!Array.isArray(images) || !images.length || images.length > 3 || images.some(d => typeof d !== 'string' || d.length > 5.5e6))
    return res.status(400).json({ error: 'bad_images' });
  const codes = Array.isArray(barcodes) ? barcodes.map(String).slice(0, 6) : [];
  const parts = images.map(d => ({ inlineData: { mimeType: 'image/jpeg', data: d.replace(/^data:image\/\w+;base64,/, '') } }));
  parts.push({ text: 'Read the label(s) and return the details as JSON.' + (codes.length ? ' Barcodes decoded from the photo (one may be the serial number): ' + codes.join(', ') + '.' : '') });
  const body = JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: [{ role: 'user', parts }],
    generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: SCHEMA } });
  let r, last = '';
  for (const m of MODELS) {
    try {
      r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + m + ':generateContent',
        { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY }, body });
    } catch (e) { return res.status(502).json({ error: 'ai_unreachable' }); }
    if (r.status !== 404) break;
    last = m;
  }
  if (r.status === 429) return res.status(429).json({ error: 'rate_limited' });
  if (!r.ok) return res.status(502).json({ error: 'ai_failed', detail: (await r.text()).slice(0, 300) });
  const j = await r.json();
  let x = null;
  try {
    const txt = (((j.candidates || [])[0] || {}).content || {}).parts;
    x = JSON.parse((txt || []).map(p => p.text || '').join('').replace(/^```json|```$/g, '').trim());
  } catch (e) {}
  if (!x) return res.status(502).json({ error: 'no_result' });
  const c = v => String(v || '').replace(/\s+/g, ' ').trim();
  const serial = c(x.serial_number).toUpperCase();
  res.status(200).json({
    serial, serials: [...new Set([serial, ...(x.other_serials || []).map(s => c(s).toUpperCase())].filter(Boolean))],
    brand: c(x.brand), model: c(x.model),
    spec: [x.processor, x.ram && (/ram/i.test(x.ram) ? x.ram : c(x.ram) + ' RAM'), x.storage, x.screen].map(c).filter(Boolean).join(', '),
    notes: c(x.notes)
  });
};
