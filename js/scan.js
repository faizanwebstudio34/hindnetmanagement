/* Offline label scan (no API, no server): barcode decoding + browser OCR (Tesseract) -> serial, company, model, specs. */
const BRANDS=['HP','Dell','Lenovo','ASUS','Acer','MSI','Apple','Samsung','Microsoft','Toshiba','Huawei','Honor','Infinix','Avita','Realme','LG','Gigabyte','Razer','Xiaomi','Chuwi','Fujitsu','Alienware'];
const SERIES={thinkpad:'Lenovo',ideapad:'Lenovo',legion:'Lenovo',loq:'Lenovo',yoga:'Lenovo',vivobook:'ASUS',zenbook:'ASUS',tuf:'ASUS',rog:'ASUS',inspiron:'Dell',latitude:'Dell',vostro:'Dell',xps:'Dell',pavilion:'HP',probook:'HP',elitebook:'HP',victus:'HP',omen:'HP',aspire:'Acer',nitro:'Acer',swift:'Acer',predator:'Acer',macbook:'Apple',surface:'Microsoft',katana:'MSI'};
const cl=s=>s.replace(/\s+/g,' ').trim();
function parseLabel(raw,barcodes=[]){
  const text=raw.replace(/[|_]/g,' ').replace(/[‘’]/g,"'"),lines=text.split(/\n/).map(cl).filter(Boolean),T=cl(text.replace(/\n/g,' '));
  const out={serial:'',serials:[],brand:'',model:'',spec:''},ser=new Set(),loose=new Set();
  barcodes.forEach(b=>{b=String(b).trim().toUpperCase();if(/^[A-Z0-9\-]{6,25}$/.test(b))ser.add(b)});
  lines.forEach(l=>{const m=l.match(/(?:\bS\s*\/?\s*N\b|\bSerial(?:\s*(?:No\.?|Number|#))?|\bService\s*Tag)\s*[:#.\-]?\s*([A-Z0-9][A-Z0-9\-]{5,24})/i);if(m)ser.add(m[1].toUpperCase())});
  (T.toUpperCase().match(/\b[A-Z0-9]{8,20}\b/g)||[]).forEach(t=>{if(/\d/.test(t)&&/[A-Z]/.test(t)&&!ser.has(t))loose.add(t)});
  out.serial=[...ser][0]||'';out.serials=[...ser,...[...loose].slice(0,5)];
  const bm=T.match(new RegExp('\\b('+BRANDS.join('|')+'|Hewlett[- ]Packard)\\b','i'));
  if(bm)out.brand=/hewlett/i.test(bm[1])?'HP':BRANDS.find(b=>b.toLowerCase()===bm[1].toLowerCase());
  else{const s=T.match(new RegExp('\\b('+Object.keys(SERIES).join('|')+')\\b','i'));if(s)out.brand=SERIES[s[1].toLowerCase()];else{const b=T.match(/\bBrand\s*[:\-]\s*([A-Za-z]{2,15})/i);if(b)out.brand=b[1]}}
  for(const l of lines){const m=l.match(/(?:\bModel(?:\s*(?:No\.?|Name|Number))?|\bM\s*\/\s*N|\bProduct\s*(?:Name|Model))\s*[:#.\-]?\s*(.{3,60})$/i);if(m&&!/^(no|number|name)\b/i.test(m[1])){out.model=cl(m[1]);break}}
  if(!out.model&&out.brand){
    const re=new RegExp('\\b'+out.brand+'\\b','i'),l=lines.find(x=>re.test(x)&&x.split(' ').length>1);
    if(l)out.model=cl(l.replace(re,'').replace(/\s*(\(|\bIntel\b|\bAMD\b|\bCore\b|\bRyzen\b|\bLaptop\b|\bNotebook\b|\b\d+\s*GB\b).*$/i,'')).slice(0,60);
  }
  const cm=T.match(/(Core\s*Ultra\s*[3579](?:\s*\d{3}[A-Z]?)?|Core\s*i[3579](?:[\s-]*\d{4,5}[A-Z0-9]{0,3})?(?:\s*\d{1,2}(?:th|st|nd|rd)\s*Gen)?|Ryzen\s*[3579](?:\s*\d{4}[A-Z]{0,2})?|Celeron(?:\s*N?\d{3,4})?|Pentium(?:\s*\w+)?|\bM[1-4]\b(?:\s*(?:Pro|Max))?)/i);
  let cpu=cm?cl(cm[1]):'';if(cpu&&/^(core|celeron|pentium)/i.test(cpu)&&/intel/i.test(T))cpu='Intel '+cpu;if(/^ryzen/i.test(cpu))cpu='AMD '+cpu;
  if(!cpu){const p=T.match(/Processor(?:\s*Name)?\s*[:\-]\s*([A-Za-z0-9 \-]{3,30})/i);if(p)cpu=cl(p[1])}
  let ram='',sto='',m=T.match(/(\d{1,2})\s*GB\s*[\/+]\s*(\d{2,4})\s*(GB|TB)\s*(SSD|HDD|NVMe|eMMC)?/i);
  if(m){ram=m[1];sto=m[2]+m[3].toUpperCase()+(m[4]?' '+m[4].toUpperCase():'')}
  if(!ram){m=T.match(/(\d{1,2})\s*GB\s*(?:RAM|DDR\d?\w*|LPDDR\d\w*|Unified)/i)||T.match(/(?:RAM|Memory)(?:\s*Size)?\s*[:\-]?\s*(\d{1,2})\s*GB/i);if(m)ram=m[1]}
  if(!sto){
    const c=[...T.matchAll(/(\d{1,4})\s*(GB|TB)\s*(?:PCIe\s*)?(?:NVMe\s*)?(SSD|HDD|eMMC)/gi)].map(x=>[x[1],x[2],x[3]]).concat([...text.matchAll(/(SSD|HDD|Hard\s*Disk|Storage|Disk)[^:\n\d]{0,12}[:\-]?\s*(\d{1,4})\s*(GB|TB)/gi)].map(x=>[x[2],x[3],/ssd|hdd/i.test(x[1])?x[1]:'']));
    const g=c.find(([n,u])=>(/tb/i.test(u)?n*1000:+n)>=120);if(g)sto=g[0]+g[1].toUpperCase()+(g[2]?' '+g[2].toUpperCase():'');
  }
  const sc=T.match(/\b(1[0-9](?:\.\d)?)\s*(?:"|”|inch(?:es)?|-inch|in\b)/i);
  out.spec=[cpu,ram&&ram+'GB RAM',sto,sc&&sc[1]+'"'].filter(Boolean).join(', ');
  return out;
}
if(typeof module!=='undefined')module.exports={parseLabel};

/* ---- UI (browser only) ---- */
let scLines=[],scFocus='model';
function scanUI(){
  modal2(`<div class="hd"><b>Scan label</b><button onclick="closeM2()">✕</button></div>
  <p class="sub">Photograph the sticker on the back of the laptop or the label on the box. Hold the phone straight above the label, keep it flat, in bright light, and fill the frame. You can choose up to 3 photos (for example the sticker and the box).</p>
  <div class="btns"><button class="p" onclick="scanPick(true)">Take photo</button><button onclick="scanPick(false)">Choose image(s)</button></div>
  <div id="sc_out"></div><div id="rd" style="display:none"></div>`);
}
function scanPick(cam){pickFile({capture:cam,multiple:!cam},fs=>scanRun(fs.slice(0,3)))}
async function readCodes(f){
  const out=[];
  try{if('BarcodeDetector' in window){const bmp=await createImageBitmap(f);(await new BarcodeDetector().detect(bmp)).forEach(b=>out.push(b.rawValue))}}catch(e){}
  if(!out.length){try{if(typeof Html5Qrcode==='undefined')await loadJS('https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js');out.push(await new Html5Qrcode('rd').scanFile(f,false))}catch(e){}}
  return out;
}
function otsu(h,n){let s=0;for(let i=0;i<256;i++)s+=i*h[i];let sb=0,wb=0,mx=0,t=127;for(let i=0;i<256;i++){wb+=h[i];if(!wb)continue;const wf=n-wb;if(!wf)break;sb+=i*h[i];const mb=sb/wb,mf=(s-sb)/wf,v=wb*wf*(mb-mf)*(mb-mf);if(v>mx){mx=v;t=i}}return t}
/* Two cleaned-up versions of the photo: stretched grayscale and black/white. Upscaled so small label text is readable. */
async function variants(f){
  const im=await img(await rd(f)),k=Math.min(2.5,2200/Math.max(im.width,im.height)),w=Math.round(im.width*k),h=Math.round(im.height*k);
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0,w,h);
  const id=x.getImageData(0,0,w,h),d=id.data,n=w*h,g=new Uint8Array(n),hist=new Array(256).fill(0);let sum=0;
  for(let i=0,j=0;i<d.length;i+=4,j++){const v=Math.round(.299*d[i]+.587*d[i+1]+.114*d[i+2]);g[j]=v;hist[v]++;sum+=v}
  let lo=0,hi=255,a=0;for(let i=0;i<256;i++){a+=hist[i];if(a>n*.02){lo=i;break}}a=0;for(let i=255;i>=0;i--){a+=hist[i];if(a>n*.02){hi=i;break}}
  const sc=255/Math.max(1,hi-lo),t=otsu(hist,n),inv=sum/n<110;
  const out=fn=>{for(let i=0,j=0;i<d.length;i+=4,j++){d[i]=d[i+1]=d[i+2]=fn(g[j]);d[i+3]=255}x.putImageData(id,0,0);return c.toDataURL('image/png')};
  return[[out(v=>{const s=Math.max(0,Math.min(255,(v-lo)*sc));return inv?255-s:s}),'6'],[out(v=>{const b=v>t?255:0;return inv?255-b:b}),'11']];
}
async function ocrText(files){
  if(typeof Tesseract==='undefined')await loadJS('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
  const jobs=[];for(const f of files)jobs.push(...await variants(f));
  let done=0;const bar=p=>{const e=$('#pg');if(e)e.style.width=Math.round((done+p)/jobs.length*100)+'%'};
  const w=await Tesseract.createWorker('eng',1,{langPath:'https://tessdata.projectnaptha.com/4.0.0_fast',logger:m=>{if(m.status==='recognizing text')bar(m.progress)}});
  const texts=[];
  try{for(const [src,psm] of jobs){await w.setParameters({tessedit_pageseg_mode:psm,preserve_interword_spaces:'1'});texts.push((await w.recognize(src)).data.text);done++;bar(0)}}finally{await w.terminate()}
  return texts.join('\n');
}
async function scanRun(files){
  const o=$('#sc_out');o.innerHTML='<div class="sub" id="sc_msg" style="margin-top:12px">Reading barcode...</div><div class="pgb"><i id="pg" style="width:5%"></i></div>';
  const codes=[];for(const f of files)codes.push(...await readCodes(f));
  $('#sc_msg').textContent='Reading text on the label... (the first scan downloads the text data once, up to a minute)';
  let text='';try{text=await ocrText(files)}catch(e){}
  if(!text&&!codes.length){o.innerHTML='<div class="sub" style="color:var(--no);margin-top:12px">Could not read the label. Check your internet connection (needed once for the text data), use a sharper and brighter photo, or enter the details manually.</div>';return}
  showScan(parseLabel(text,codes),text,codes);
}
function showScan(r,text,codes){
  scLines=[...new Map(text.split('\n').map(cl).filter(l=>l.length>2).map(l=>[l.toLowerCase(),l])).values()].slice(0,40);scFocus='model';
  const f=(id,l,v)=>`<label>${l}</label><input id="sc_${id}" value="${esc(v)}" onfocus="scFocus='${id}'">`,up=codes.map(c=>String(c).trim().toUpperCase()),vf=r.serial&&up.includes(r.serial.toUpperCase());
  $('#sc_out').innerHTML=`<div class="sub" style="margin:12px 0 0">Check every field. OCR can misread characters (for example 0 and O), so fix anything that looks wrong.</div>
  ${vf?'<div class="tag ok" style="display:inline-block;margin-top:8px">Serial number read from the barcode</div>':''}
  ${f('serial','Serial number',r.serial)}${r.serials.length>1?`<div class="chips wrap" style="margin-top:6px">${r.serials.map(s=>`<button onclick="$('#sc_serial').value='${esc(s)}'">${esc(s)}</button>`).join('')}</div>`:''}
  ${f('brand','Company',r.brand)}${f('model','Model',r.model)}${f('spec','Specs',r.spec)}
  ${scLines.length?`<div class="sub" style="margin-top:12px">Tap a detected line to put it into the field you selected above:</div><div class="chips wrap" style="margin-top:6px">${scLines.map((l,i)=>`<button onclick="scPut(${i})">${esc(l)}</button>`).join('')}</div>`:''}
  <div class="btns"><button onclick="closeM2()">Cancel</button><button class="p" onclick="scanApply()">Use these details</button></div>`;
}
function scPut(i){const t=$('#sc_'+scFocus),v=scLines[i].replace(/^[A-Za-z][A-Za-z \/.]{0,20}[:#]\s*/,'');t.value=scFocus==='spec'&&t.value?t.value+', '+v:v}
function scanApply(){
  ['serial','brand','model','spec'].forEach(k=>{const v=$('#sc_'+k).value.trim(),t=$('#f_'+k);if(v&&t)t.value=v});
  closeM2();toast('Details added to the form');
}
