const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Date().toISOString().slice(0,10);
const money=n=>n||n===0?'₹'+Number(n).toLocaleString('en-IN'):'-';
const fdate=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'-';
const mp=n=>n?money(n):'-';
const debounce=(f,ms=120)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}};
const days=d=>Math.max(0,Math.floor((Date.now()-new Date(d||Date.now()))/864e5));
const LS={get:k=>JSON.parse(localStorage.getItem(k)||'null'),set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){toast('Browser storage is full. Connect Firebase to store photos.');throw e}}};
const setTheme=t=>{document.documentElement.dataset.theme=t;localStorage.setItem('theme',t)};
const toggleTheme=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
setTheme(localStorage.getItem('theme')||'light');
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),2200)}
const loadJS=u=>new Promise(r=>{const s=document.createElement('script');s.src=u;s.onload=r;document.head.append(s)});

/* ---------- Backend: Firestore (offline cache on) ya localStorage ---------- */
const FB=!!CFG.apiKey&&typeof firebase!=='undefined';let db,auth;
if(FB){firebase.initializeApp(CFG);db=firebase.firestore();db.enablePersistence({synchronizeTabs:true}).catch(()=>{});if(typeof firebase.auth==='function')auth=firebase.auth()}
const subs={};
const Store={
  on(col,cb){
    if(FB)return db.collection(col).onSnapshot(s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))),e=>toast('Firebase: '+e.message));
    (subs[col]??=[]).push(cb);cb(LS.get(col)||[]);addEventListener('storage',e=>e.key===col&&cb(LS.get(col)||[]));
  },
  async put(col,id,data){
    if(FB)return db.collection(col).doc(id).set(data,{merge:true});
    const a=LS.get(col)||[],i=a.findIndex(x=>x.id===id);i<0?a.unshift({...data,id}):a[i]={...a[i],...data};LS.set(col,a);(subs[col]||[]).forEach(f=>f(a));
  },
  async del(col,id){
    if(FB)return db.collection(col).doc(id).delete();
    const a=(LS.get(col)||[]).filter(x=>x.id!==id);LS.set(col,a);(subs[col]||[]).forEach(f=>f(a));
  },
  async get(col,id){if(FB){const d=await db.collection(col).doc(id).get();return d.exists?{id,...d.data()}:null}return(LS.get(col)||[]).find(x=>x.id===id)||null},
  newId:()=>FB?db.collection('x').doc().id:'l'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)
};

/* ---------- Laptop data (private) + customer catalog (public, bina cost/serial/account) ---------- */
let L=[],NUM={};
const watch=cb=>Store.on('laptops',a=>{L=a.sort((x,y)=>(y.createdAt||0)-(x.createdAt||0));[...L].reverse().forEach((l,i)=>NUM[l.id]=l.no||i+1);cb(L)});
const numOf=l=>NUM[l.id]||l.no||'';
const fire=jobs=>jobs.forEach(p=>Promise.resolve(p).catch(e=>toast('Could not save: '+e.message)));
/* ph = new photo list, or undefined when the photos did not change. Photos are stored apart from the laptop so lists stay fast. */
async function saveLaptop(r,ph){
  const isNew=!r.id;r.id=r.id||Store.newId();r.createdAt=r.createdAt||Date.now();
  if(isNew)r.no=Math.max(0,...L.map(x=>x.no||0))+1;
  const {photos,...doc}=r;if(ph)doc.photoCount=ph.length;else if(doc.photoCount==null)doc.photoCount=photos?photos.length:0;
  const jobs=[Store.put('laptops',r.id,doc)];
  if(ph)jobs.push(Store.put('photos',r.id,{list:ph}));
  jobs.push(r.status!=='sold'&&r.public!==false?Store.put('catalog',r.id,{brand:r.brand,model:r.model,spec:r.spec||'',condition:r.condition||'',warranty:r.warranty||'',sellPrice:r.sellPrice||0,thumb:r.thumb||'',photoCount:doc.photoCount,createdAt:r.createdAt}):Store.del('catalog',r.id));
  fire(jobs);return r;
}
const getPhotos=async l=>l.photos&&l.photos.length?l.photos:((await Store.get('photos',l.id))||{}).list||[];
const patch=(id,f)=>saveLaptop({...L.find(x=>x.id===id),...f});
function delLaptop(id){if(!confirm('Delete this entry permanently?'))return;fire([Store.del('laptops',id),Store.del('catalog',id),Store.del('photos',id)]);closeM();toast('Entry deleted')}
const catalogURL=()=>new URL('catalog.html',location.href).href;
const copyLink=()=>navigator.clipboard.writeText(catalogURL()).then(()=>toast('Customer link copied'));
function shareWA(id){const l=L.find(x=>x.id===id);open('https://wa.me/?text='+encodeURIComponent(`${l.brand} ${l.model}\n${l.spec||''}\nPrice: ${money(l.sellPrice)}\nView: ${catalogURL()}#${id}`))}
const match=(l,q)=>!q||[l.serial,l.brand,l.model,l.spec,l.account,l.order,l.source].join(' ').toLowerCase().includes(q.toLowerCase());
const row=(l,fn='showDetail')=>`<div class="card item" onclick="${fn}('${l.id}')"><span class="num">${numOf(l)}</span>${l.thumb?`<img loading="lazy" decoding="async" src="${l.thumb}">`:'<div class="ph"></div>'}<div class="m"><div><b>${esc(l.brand)} ${esc(l.model)}</b></div><div class="sub">SN: ${esc(l.serial)}</div><div class="sub">${esc(l.source)} · ${fdate(l.date)}${l.price?' · '+money(l.price):''}</div></div><span class="tag ${l.status==='sold'?'sd':'ok'}">${l.status==='sold'?'Sold':'Available'}</span></div>`;

/* ---------- Layout: left sidebar + login ---------- */
const NAV=[['index.html','entry','New Entry'],['stock.html','stock','Laptop Stock'],['available.html','avail','Available'],['sold.html','sold','Sold'],['lists.html','list','Lists'],['settings.html','set','Settings']];
const IC={entry:'<path d="M12 5v14M5 12h14"/>',stock:'<path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7"/>',avail:'<path d="M5 12l5 5L20 7"/>',sold:'<path d="M12 3v18M17 7H9.5a3 3 0 000 6h5a3 3 0 010 6H6"/>',set:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',shop:'<path d="M4 9l1-5h14l1 5M4 9v11h16V9M4 9h16"/>',out:'<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>'};
const ico=k=>`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>`;
function boot(start){
  NAV.forEach(n=>{const l=document.createElement('link');l.rel='prefetch';l.href=n[0];document.head.append(l)});
  const pg=location.pathname.split('/').pop()||'index.html';
  document.body.innerHTML=`<div class="top"><button onclick="$('.side').classList.toggle('open')">☰</button><b>Laptop Stock Manager</b></div>
  <aside class="side"><h1>Laptop Stock Manager</h1>${NAV.map(n=>`<a href="${n[0]}" class="${pg===n[0]?'on':''}">${ico(n[1])}${n[2]}</a>`).join('')}
  <a href="catalog.html" target="_blank">${ico('shop')}Customer Page</a><div class="sp"></div>
  ${auth?`<a href="#" onclick="auth.signOut();return false">${ico('out')}Logout</a>`:''}<div class="sub" style="padding:8px 12px">${FB?'Online':'Local mode'}</div></aside><main id="app"><div class="card skel"></div><div class="card skel"></div><div class="card skel"></div></main><div id="ov"></div><div id="ov2"></div>`;
  if(!auth)return start();
  let on=0;auth.onAuthStateChanged(u=>{if(u&&!on){on=1;start()}else if(!u){on?location.reload():login()}});
}
function login(){$('#app').innerHTML=`<div class="card" style="max-width:360px;margin:12vh auto"><h2>Login</h2><label>Email</label><input id="le" type="email"><label>Password</label><input id="lp" type="password" onkeydown="event.key==='Enter'&&doLogin()"><button class="p" style="width:100%;margin-top:14px" onclick="doLogin()">Login</button></div>`}
const doLogin=()=>auth.signInWithEmailAndPassword($('#le').value,$('#lp').value).catch(()=>toast('Incorrect email or password'));
const modal=h=>{$('#ov').innerHTML=`<div class="modal" onclick="if(event.target===this)closeM()"><div>${h}</div></div>`};
const closeM=()=>{const o=$('#ov');if(o)o.innerHTML=''};
const modal2=h=>{$('#ov2').innerHTML=`<div class="modal" onclick="if(event.target===this)closeM2()"><div>${h}</div></div>`};
const closeM2=()=>{const o=$('#ov2');if(o)o.innerHTML=''};
async function smartScan(){if(typeof scanUI==='undefined')await loadJS('js/scan.js');scanUI()}

/* ---------- Form, photos, scan ---------- */
const SRC=['Amazon','Flipkart','Meesho','Croma','Offline / Other'],CON=['New','Open box','Refurbished','Used'];
const opt=(a,v)=>a.map(o=>`<option ${v===o?'selected':''}>${o}</option>`).join('');
let PH=[null,null],scanner=null;
const rd=f=>new Promise(r=>{const x=new FileReader();x.onload=()=>r(x.result);x.readAsDataURL(f)});
const img=s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=s});
async function shrink(src,max,q){if(typeof src!=='string')src=await rd(src);const i=await img(src),k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);return c.toDataURL('image/jpeg',q)}
let PHdirty=false;
function slotClick(i){
  if(PH[i]&&confirm('Remove this photo? (Press Cancel to choose a new one)')){PH[i]=null;PHdirty=true;return drawSlots()}
  const f=document.createElement('input');f.type='file';f.accept='image/*';
  f.onchange=async()=>{if(!f.files[0])return;const s=$('#slot'+i);if(s)s.innerHTML='Processing...';try{PH[i]=await shrink(f.files[0],800,.65);PHdirty=true}catch(e){toast('Could not read this image')}drawSlots()};f.click();
}
const drawSlots=()=>[0,1].forEach(i=>{const s=$('#slot'+i);if(s)s.innerHTML=PH[i]?`<img src="${PH[i]}">`:`Add photo ${i+1}<br>(optional)`});
async function startScan(id){
  modal2('<div class="hd"><b>Scan barcode</b><button onclick="stopScan()">✕</button></div><div id="reader"></div>');
  if(typeof Html5Qrcode==='undefined')await loadJS('https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js');
  scanner=new Html5Qrcode('reader');
  scanner.start({facingMode:'environment'},{fps:10,qrbox:{width:260,height:140}},t=>{$('#'+id).value=t.trim();stopScan();toast('Barcode scanned')}).catch(()=>{toast('Unable to open the camera (HTTPS and camera permission are required)');stopScan()});
}
function stopScan(){const d=()=>{scanner=null;closeM2()};scanner?scanner.stop().then(d,d):d()}
function form(l={}){return `<div class="card"><div class="fg">
<div class="w2" style="margin-bottom:6px"><button type="button" class="p" style="width:100%" onclick="smartScan()">Scan label to auto-fill details</button><div class="sub" style="margin-top:6px">Photograph the sticker on the back of the laptop or on the box. Serial number, company, model and specs are filled in automatically. Review them before saving.</div></div>
<div class="w2"><label>Serial number *</label><div class="row"><input id="f_serial" value="${esc(l.serial)}" placeholder="Scan or type the serial number" onkeydown="if(event.key==='Enter')event.preventDefault()"><button type="button" class="fx" onclick="startScan('f_serial')">Scan</button></div></div>
<div><label>Purchased from</label><select id="f_source">${opt(SRC,l.source)}</select></div>
<div><label>Order ID</label><input id="f_order" value="${esc(l.order)}"></div>
<div class="w2"><label>Purchase account / ID (optional)</label><input id="f_account" value="${esc(l.account)}" placeholder="Email, name or account ID"></div>
<div><label>Company *</label><input id="f_brand" value="${esc(l.brand)}" placeholder="e.g. HP, Dell, Lenovo"></div>
<div><label>Model *</label><input id="f_model" value="${esc(l.model)}"></div>
<div class="w2"><label>Specs (Processor / RAM / SSD)</label><input id="f_spec" value="${esc(l.spec)}" placeholder="i5 12th, 16GB, 512GB SSD"></div>
<div><label>Condition</label><select id="f_condition">${opt(CON,l.condition)}</select></div>
<div><label>Warranty (optional)</label><input id="f_warranty" value="${esc(l.warranty)}" placeholder="e.g. 8 months remaining"></div>
<div><label>Purchase price (₹) (optional, private)</label><input id="f_price" type="number" inputmode="decimal" value="${l.price||''}"></div>
<div><label>Selling price (₹) (shown to customers)</label><input id="f_sellPrice" type="number" inputmode="decimal" value="${l.sellPrice||''}"></div>
<div><label>Date</label><input id="f_date" type="date" value="${esc(l.date||today())}"></div>
<div><label>Customer catalog</label><select id="f_public"><option value="1">Visible</option><option value="0" ${l.public===false?'selected':''}>Hidden</option></select></div>
<div class="w2"><label>Note (private)</label><textarea id="f_note" rows="2">${esc(l.note)}</textarea></div>
<div class="w2"><label>Photos (optional)</label><div class="photos"><div class="slot" id="slot0" onclick="slotClick(0)"></div><div class="slot" id="slot1" onclick="slotClick(1)"></div></div></div></div></div>`}
async function readForm(old={}){
  const v=i=>$('#f_'+i).value.trim();
  const r={...old,serial:v('serial'),source:v('source'),order:v('order'),account:v('account'),brand:v('brand'),model:v('model'),spec:v('spec'),condition:v('condition'),warranty:v('warranty'),price:+v('price')||0,sellPrice:+v('sellPrice')||0,date:v('date')||today(),note:v('note'),public:v('public')!=='0',status:old.status||'available',photos:PH.filter(Boolean)};
  if(!r.serial||!r.brand||!r.model){toast('Serial number, company and model are required');return null}
  if(L.some(x=>x.id!==old.id&&(x.serial||'').toLowerCase()===r.serial.toLowerCase())){toast('This serial number already exists');return null}
  r.thumb=PHdirty?(r.photos[0]?await shrink(r.photos[0],260,.55):''):(old.thumb||'');return r;
}

/* ---------- Detail / Sold / Edit (sab admin pages me shared) ---------- */
function showDetail(id){
  const l=L.find(x=>x.id===id);if(!l)return;const sold=l.status==='sold',kv=(k,v)=>`<div class="kv"><span>${k}</span><span>${esc(v||'-')}</span></div>`;
  modal(`<div class="hd"><b style="font-size:18px"><span class="sub">#${numOf(l)}</span> ${esc(l.brand)} ${esc(l.model)}</b><button onclick="closeM()">✕</button></div>
  <div class="gal" id="dg">${l.thumb?`<img src="${l.thumb}">`:''}</div>
  ${kv('Serial number',l.serial)}${kv('Purchased from',l.source)}${kv('Order ID',l.order)}${kv('Purchase account / ID',l.account)}${kv('Company',l.brand)}${kv('Model',l.model)}${kv('Specs',l.spec)}${kv('Condition',l.condition)}${kv('Warranty',l.warranty)}
  ${kv('Purchase price',mp(l.price))}${kv('Selling price',mp(l.sellPrice))}${kv('Entry date',fdate(l.date))}${kv('Note',l.note)}
  ${sold?kv('Sold price',money(l.soldPrice))+kv('Sold date',fdate(l.soldDate))+kv('Sold to',l.buyer)+kv('Profit / Loss',l.price?money(l.soldPrice-l.price):'-'):''}
  <div class="btns">${sold?`<button onclick="patch('${id}',{status:'available',soldPrice:0,soldDate:'',buyer:''});closeM()">Mark as available</button>`:`<button class="p" onclick="sellUI('${id}')">Mark as sold</button><button onclick="shareWA('${id}')">WhatsApp</button>`}
  <button onclick="editUI('${id}')">Edit</button><button class="d" onclick="delLaptop('${id}')">Delete</button></div>`);
  getPhotos(l).then(p=>{const g=$('#dg');if(g&&p.length)g.innerHTML=p.map(x=>`<img src="${x}">`).join('')}).catch(()=>{});
}
function sellUI(id){const l=L.find(x=>x.id===id);
  modal(`<div class="hd"><b>${esc(l.brand)} ${esc(l.model)} — Mark as sold</b><button onclick="closeM()">✕</button></div>
  <label>Sold price (₹)</label><input id="s_p" type="number" inputmode="decimal" value="${l.sellPrice||''}"><label>Date</label><input id="s_d" type="date" value="${today()}"><label>Sold to (optional)</label><input id="s_b">
  <div class="btns"><button onclick="closeM()">Cancel</button><button class="p" onclick="doSell('${id}')">Save</button></div>`)}
async function doSell(id){const p=+$('#s_p').value;if(!p)return toast('Enter the sold price');await patch(id,{status:'sold',soldPrice:p,soldDate:$('#s_d').value||today(),buyer:$('#s_b').value.trim()});closeM();toast('Marked as sold')}
function editUI(id){const l=L.find(x=>x.id===id);PH=[l.photos?.[0]||null,l.photos?.[1]||null];PHdirty=false;
  modal(`<div class="hd"><b>Edit laptop</b><button onclick="closeM()">✕</button></div>${form(l)}<button class="p" id="sv" style="width:100%" onclick="doEdit('${id}')">Save changes</button>`);drawSlots();
  if(!(l.photos&&l.photos.length)&&l.photoCount!==0)getPhotos(l).then(p=>{if(!PHdirty&&$('#slot0')){PH=[p[0]||null,p[1]||null];drawSlots()}}).catch(()=>{});
}
async function doEdit(id){
  const b=$('#sv');if(b.disabled)return;b.disabled=true;b.textContent='Saving...';
  try{const r=await readForm(L.find(x=>x.id===id));if(!r)return;await saveLaptop(r,PHdirty?r.photos:undefined);closeM();toast('Changes saved')}
  catch(e){toast('Could not save: '+e.message)}finally{const s=$('#sv');if(s){s.disabled=false;s.textContent='Save changes'}}
}
function exportCSV(){
  const h=['serial','source','order','account','brand','model','spec','condition','warranty','price','sellPrice','date','status','soldPrice','soldDate','buyer','note'];
  const c=[h.join(',')].concat(L.map(l=>h.map(k=>'"'+String(l[k]??'').replace(/"/g,'""')+'"').join(','))).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+c],{type:'text/csv'}));a.download='laptops.csv';a.click();
}
