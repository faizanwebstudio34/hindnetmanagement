async function runCheck(){
  const o=$('#diag');o.textContent='Checking...';const rows=[],add=(n,ok,t)=>rows.push((ok===null?'-   ':ok?'OK  ':'FAIL')+' '+n+(t?': '+t:'')),wt=(p,ms)=>Promise.race([p,new Promise((_,j)=>setTimeout(()=>j(new Error('timed out after '+ms/1000+'s')),ms))]);
  add('Secure connection (HTTPS)',isSecureContext);
  add('Firebase library loaded',FB,FB?'':(CFG.apiKey?'blocked or offline, running in local mode':'no config'));
  add('Signed in',!!(auth&&auth.currentUser),auth&&auth.currentUser?auth.currentUser.email:(FB?'not signed in':'local mode'));
  if(FB){
    let t0=Date.now();try{await wt(db.collection('meta').doc('shop').get({source:'server'}),7000);add('Database read (server)',true,(Date.now()-t0)+' ms')}catch(e){add('Database read (server)',false,e.message)}
    t0=Date.now();try{const r=db.collection('meta').doc('_check');await wt(r.set({t:Date.now()}),7000);await wt(r.delete(),7000);add('Database write',true,(Date.now()-t0)+' ms')}catch(e){add('Database write',false,e.message+' (check the Firestore rules)')}
  }
  try{await new Promise((res,rej)=>{const r=indexedDB.open('__t');r.onsuccess=()=>{r.result.close();indexedDB.deleteDatabase('__t');res()};r.onerror=()=>rej(r.error)});add('Offline storage (IndexedDB)',true)}catch(e){add('Offline storage (IndexedDB)',false,'private mode? '+(e&&e.message||''))}
  add('Camera access available',!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia));
  add('Native barcode reader',null,'BarcodeDetector' in window?'yes':'no (the app uses its own reader)');
  add('File sharing (PDF / image)',!!(navigator.canShare&&navigator.canShare({files:[new File(['a'],'a.txt',{type:'text/plain'})]})));
  add('Browser',null,navigator.userAgent);
  o.textContent=rows.join('\n');
}
const dq=debounce(()=>draw());
let q='',loaded=0;
const th=()=>{const d=document.documentElement.dataset.theme==='dark';$('#tl').classList.toggle('p',!d);$('#td').classList.toggle('p',d)};
const draw=()=>{const a=L.filter(l=>match(l,q));$('#list').innerHTML=a.length?a.slice(0,100).map(l=>row(l,'editUI')).join(''):'<div class="sub">No entries yet.</div>'};
const saveShop=()=>Store.put('meta','shop',{name:h_name.value.trim(),wa:h_wa.value.trim(),phone:h_phone.value.trim(),addr:h_addr.value.trim(),tag:h_tag.value.trim(),idPrefix:(h_pfx.value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'')||'HN')}).then(()=>toast('Shop information saved'));

boot(()=>{
  $('#app').innerHTML=`<h2>Settings</h2>
  <div class="card"><b>Theme</b><div class="btns"><button id="tl" onclick="setTheme('light');th()">White</button><button id="td" onclick="setTheme('dark');th()">Black</button></div></div>
  <div class="card"><b>Shop information (shown on the customer catalog)</b><div class="fg"><div><label>Shop name</label><input id="h_name"></div><div><label>WhatsApp number (with country code)</label><input id="h_wa" placeholder="919876543210"></div><div><label>Laptop ID prefix (new IDs only)</label><input id="h_pfx" maxlength="6" placeholder="HN" autocapitalize="characters" autocorrect="off"></div><div><label>Phone</label><input id="h_phone"></div><div><label>Address</label><input id="h_addr"></div><div class="w2"><label>Tagline</label><input id="h_tag"></div></div>
  <div class="btns"><button class="p" onclick="saveShop()">Save</button><button onclick="copyLink()">Copy customer link</button></div></div>
  <div class="card"><b>Edit entries and upload photos</b><input style="margin:10px 0" placeholder="Search" oninput="q=this.value;dq()"><div id="list"><div class="card skel"></div><div class="card skel"></div><div class="card skel"></div></div></div>
  <div class="card"><b>Device check</b><div class="sub" style="margin:6px 0 10px">If something does not work on this phone or computer, run this and send me the result.</div><div class="btns"><button onclick="runCheck()">Run check</button><button onclick="navigator.clipboard&&navigator.clipboard.writeText($('#diag').textContent).then(()=>toast('Copied'))">Copy result</button></div><pre id="diag" class="diag"></pre></div>
  <div class="card"><b>Data</b><div class="btns"><button onclick="exportCSV()">Export CSV</button></div></div>`;
  th();watch(draw);
  Store.on('meta',a=>{const s=a.find(x=>x.id==='shop');if(s&&!loaded){loaded=1;h_name.value=s.name||'';h_wa.value=s.wa||'';h_phone.value=s.phone||'';h_addr.value=s.addr||'';h_tag.value=s.tag||'';h_pfx.value=s.idPrefix||''}});
});
