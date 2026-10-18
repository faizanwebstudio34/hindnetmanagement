/* Smart label scan: photo of the sticker (laptop back / box) -> serial, company, model, specs.
   Barcodes are decoded for the exact serial; printed text is read in the browser with Tesseract OCR. */
const BRANDS=['HP','Dell','Lenovo','ASUS','Acer','MSI','Apple','Samsung','Microsoft','Toshiba','Huawei','Honor','Infinix','Avita','Realme','LG','Gigabyte','Razer','Xiaomi','Chuwi','Fujitsu','Alienware'];
const SERIES={thinkpad:'Lenovo',ideapad:'Lenovo',legion:'Lenovo',loq:'Lenovo',yoga:'Lenovo',vivobook:'ASUS',zenbook:'ASUS',tuf:'ASUS',rog:'ASUS',inspiron:'Dell',latitude:'Dell',vostro:'Dell',xps:'Dell',pavilion:'HP',probook:'HP',elitebook:'HP',victus:'HP',omen:'HP',aspire:'Acer',nitro:'Acer',swift:'Acer',predator:'Acer',macbook:'Apple',surface:'Microsoft',katana:'MSI'};
const cl=s=>s.replace(/\s+/g,' ').trim();
function parseLabel(raw,barcodes=[]){
  const text=raw.replace(/[|_]/g,' ').replace(/[‘’]/g,"'"),lines=text.split(/\n/).map(cl).filter(Boolean),T=cl(text.replace(/\n/g,' '));
  const out={serial:'',serials:[],brand:'',model:'',spec:''},ser=new Set();
  barcodes.forEach(b=>{b=String(b).trim().toUpperCase();if(/^[A-Z0-9\-]{6,25}$/.test(b))ser.add(b)});
  lines.forEach(l=>{const m=l.match(/(?:\bS\s*\/?\s*N\b|\bSerial(?:\s*(?:No\.?|Number|#))?|\bService\s*Tag)\s*[:#.\-]?\s*([A-Z0-9][A-Z0-9\-]{5,24})/i);if(m)ser.add(m[1].toUpperCase())});
  out.serials=[...ser];out.serial=out.serials[0]||'';
  const bm=T.match(new RegExp('\\b('+BRANDS.join('|')+'|Hewlett[- ]Packard)\\b','i'));
  if(bm)out.brand=/hewlett/i.test(bm[1])?'HP':BRANDS.find(b=>b.toLowerCase()===bm[1].toLowerCase());
  else{const s=T.match(new RegExp('\\b('+Object.keys(SERIES).join('|')+')\\b','i'));if(s)out.brand=SERIES[s[1].toLowerCase()]}
  for(const l of lines){const m=l.match(/(?:\bModel(?:\s*(?:No\.?|Name|Number))?|\bM\s*\/\s*N|\bProduct\s*(?:Name|Model))\s*[:#.\-]?\s*(.{3,60})$/i);if(m&&!/^(no|number|name)\b/i.test(m[1])){out.model=cl(m[1]);break}}
  if(!out.model&&out.brand){
    const re=new RegExp('\\b'+out.brand+'\\b','i'),l=lines.find(x=>re.test(x)&&x.split(' ').length>1);
    if(l)out.model=cl(l.replace(re,'').replace(/\s*(\(|\bIntel\b|\bAMD\b|\bCore\b|\bRyzen\b|\bLaptop\b|\bNotebook\b|\b\d+\s*GB\b).*$/i,'')).slice(0,60);
  }
  const cm=T.match(/(Core\s*Ultra\s*[3579](?:\s*\d{3}[A-Z]?)?|Core\s*i[3579](?:[\s-]*\d{4,5}[A-Z0-9]{0,3})?(?:\s*\d{1,2}(?:th|st|nd|rd)\s*Gen)?|Ryzen\s*[3579](?:\s*\d{4}[A-Z]{0,2})?|Celeron(?:\s*N?\d{3,4})?|Pentium(?:\s*\w+)?|\bM[1-4]\b(?:\s*(?:Pro|Max))?)/i);
  let cpu=cm?cl(cm[1]):'';if(cpu&&/^(core|celeron|pentium)/i.test(cpu)&&/intel/i.test(T))cpu='Intel '+cpu;if(/^ryzen/i.test(cpu))cpu='AMD '+cpu;
  let ram='',sto='',m=T.match(/(\d{1,2})\s*GB\s*[\/+]\s*(\d{2,4})\s*(GB|TB)\s*(SSD|HDD|NVMe|eMMC)?/i);
  if(m){ram=m[1];sto=m[2]+m[3].toUpperCase()+(m[4]?' '+m[4].toUpperCase():'')}
  if(!ram){m=T.match(/(\d{1,2})\s*GB\s*(?:RAM|DDR\d?\w*|LPDDR\d\w*|Unified)/i)||T.match(/(?:RAM|Memory)\s*[:\-]?\s*(\d{1,2})\s*GB/i);if(m)ram=m[1]}
  if(!sto){m=T.match(/(\d{1,4})\s*(GB|TB)\s*(?:PCIe\s*)?(?:NVMe\s*)?(SSD|HDD|eMMC)/i)||T.match(/(?:SSD|HDD|Storage)\s*[:\-]?\s*(\d{1,4})\s*(GB|TB)/i);if(m)sto=m[1]+m[2].toUpperCase()+(m[3]?' '+m[3].toUpperCase():'')}
  const sc=T.match(/\b(1[0-9](?:\.\d)?)\s*(?:"|”|inch(?:es)?|-inch|in\b)/i);
  out.spec=[cpu,ram&&ram+'GB RAM',sto,sc&&sc[1]+'"'].filter(Boolean).join(', ');
  return out;
}
if(typeof module!=='undefined')module.exports={parseLabel};

/* ---- UI (browser only) ---- */
function scanUI(){
  modal2(`<div class="hd"><b>Scan label</b><button onclick="closeM2()">✕</button></div>
  <p class="sub">Photograph the sticker on the back of the laptop or the label on the box. Keep it flat, in good light, and fill the frame. You can choose up to 3 photos (for example the sticker and the box); they are read together.</p>
  <div class="btns"><button class="p" onclick="scanPick(true)">Take photo</button><button onclick="scanPick(false)">Choose image(s)</button></div>
  <div id="sc_out"></div><div id="rd" style="display:none"></div>`);
}
function scanPick(cam){const f=document.createElement('input');f.type='file';f.accept='image/*';if(cam)f.capture='environment';else f.multiple=true;f.onchange=()=>f.files.length&&scanRun([...f.files].slice(0,3));f.click()}
async function prep(f){const im=await img(await rd(f)),k=Math.min(1,1800/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;const x=c.getContext('2d');x.filter='grayscale(1) contrast(1.35)';x.drawImage(im,0,0,c.width,c.height);return c.toDataURL('image/png')}
async function readCodes(f){
  const out=[];
  try{if('BarcodeDetector' in window){const bmp=await createImageBitmap(f);(await new BarcodeDetector().detect(bmp)).forEach(b=>out.push(b.rawValue))}}catch(e){}
  if(!out.length){try{if(typeof Html5Qrcode==='undefined')await loadJS('https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js');out.push(await new Html5Qrcode('rd').scanFile(f,false))}catch(e){}}
  return out;
}
async function aiScan(files,codes){
  if(!auth||!auth.currentUser)throw new Error('local');
  const images=await Promise.all(files.map(async f=>(await shrink(f,1600,.88)).split(',')[1]));
  const r=await fetch('/api/scan',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+await auth.currentUser.getIdToken()},body:JSON.stringify({images,barcodes:codes})});
  if(!r.ok){const e=new Error('ai '+r.status);e.status=r.status;throw e}
  return r.json();
}
async function ocrScan(file){
  if(typeof Tesseract==='undefined')await loadJS('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
  const r=await Tesseract.recognize(await prep(file),'eng',{langPath:'https://tessdata.projectnaptha.com/4.0.0_fast',logger:m=>{const p=$('#pg');if(p&&m.status==='recognizing text')p.style.width=Math.round(m.progress*100)+'%'}});
  return r.data.text;
}
async function scanRun(files){
  const o=$('#sc_out');o.innerHTML='<div class="sub" style="margin-top:12px">Reading label…</div><div class="pgb"><i id="pg" style="width:40%"></i></div>';
  const codes=[];for(const f of files)codes.push(...await readCodes(f));
  let res=null,src='ai',why='';
  try{res=await aiScan(files,codes)}catch(e){src='ocr';why=e.status===501?'AI scan is not set up on the server yet.':e.status===401?'Please log in again.':e.status===429?'The free AI limit was reached for now. Wait a minute and try again.':'AI scan is unavailable right now.'}
  if(!res){
    let text='';try{text=await ocrScan(files[0])}catch(e){}
    if(!text&&!codes.length){o.innerHTML=`<div class="sub" style="color:var(--no);margin-top:12px">Could not read the label. ${esc(why)} Try a sharper, brighter photo, or enter the details manually.</div>`;return}
    const p=parseLabel(text,codes);res={serial:p.serial,serials:p.serials,brand:p.brand,model:p.model,spec:p.spec,notes:'',raw:text};
  }else{
    const ok=codes.map(c=>String(c).trim().toUpperCase()).filter(c=>/^[A-Z0-9\-]{6,25}$/.test(c));
    res.serials=[...new Set([...(res.serials||[]),...ok])];if(!res.serial)res.serial=ok[0]||'';
  }
  showScan(res,src,why,codes);
}
function showScan(r,src,why,codes){
  const f=(id,l,v)=>`<label>${l}</label><input id="sc_${id}" value="${esc(v)}">`,up=codes.map(c=>String(c).trim().toUpperCase()),vf=r.serial&&up.includes(r.serial.toUpperCase());
  $('#sc_out').innerHTML=`<div class="sub" style="margin:12px 0 0">${src==='ai'?'Read with AI.':'Read with offline OCR (less accurate). '+esc(why)} Check every field before using it.</div>
  ${vf?'<div class="tag ok" style="display:inline-block;margin-top:8px">Serial number matches the barcode</div>':''}
  ${r.notes?`<div class="sub" style="color:var(--sd);margin-top:8px">Check: ${esc(r.notes)}</div>`:''}
  ${f('serial','Serial number',r.serial)}
  ${r.serials.length>1?`<div class="chips" style="margin-top:6px">${r.serials.map(s=>`<button onclick="$('#sc_serial').value='${esc(s)}'">${esc(s)}</button>`).join('')}</div>`:''}
  ${f('brand','Company',r.brand)}${f('model','Model',r.model)}${f('spec','Specs',r.spec)}
  ${r.raw?`<details style="margin-top:10px"><summary class="sub">Detected text</summary><pre style="white-space:pre-wrap;font-size:12px">${esc(r.raw)}</pre></details>`:''}
  <div class="btns"><button onclick="closeM2()">Cancel</button><button class="p" onclick="scanApply()">Use these details</button></div>`;
}
function scanApply(){
  ['serial','brand','model','spec'].forEach(k=>{const v=$('#sc_'+k).value.trim(),t=$('#f_'+k);if(v&&t)t.value=v});
  closeM2();toast('Details added to the form');
}
