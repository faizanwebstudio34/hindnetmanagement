const dq=debounce(()=>draw());
let q='',loaded=0;
const th=()=>{const d=document.documentElement.dataset.theme==='dark';$('#tl').classList.toggle('p',!d);$('#td').classList.toggle('p',d)};
const draw=()=>{const a=L.filter(l=>match(l,q));$('#list').innerHTML=a.length?a.slice(0,100).map(l=>row(l,'editUI')).join(''):'<div class="sub">No entries yet.</div>'};
const saveShop=()=>Store.put('meta','shop',{name:h_name.value.trim(),wa:h_wa.value.trim(),phone:h_phone.value.trim(),addr:h_addr.value.trim(),tag:h_tag.value.trim()}).then(()=>toast('Shop information saved'));

boot(()=>{
  $('#app').innerHTML=`<h2>Settings</h2>
  <div class="card"><b>Theme</b><div class="btns"><button id="tl" onclick="setTheme('light');th()">White</button><button id="td" onclick="setTheme('dark');th()">Black</button></div></div>
  <div class="card"><b>Shop information (shown on the customer catalog)</b><div class="fg"><div><label>Shop name</label><input id="h_name"></div><div><label>WhatsApp number (with country code)</label><input id="h_wa" placeholder="919876543210"></div><div><label>Phone</label><input id="h_phone"></div><div><label>Address</label><input id="h_addr"></div><div class="w2"><label>Tagline</label><input id="h_tag"></div></div>
  <div class="btns"><button class="p" onclick="saveShop()">Save</button><button onclick="copyLink()">Copy customer link</button></div></div>
  <div class="card"><b>Edit entries and upload photos</b><input style="margin:10px 0" placeholder="Search" oninput="q=this.value;dq()"><div id="list"><div class="card skel"></div><div class="card skel"></div><div class="card skel"></div></div></div>
  <div class="card"><b>Data</b><div class="btns"><button onclick="exportCSV()">Export CSV</button></div></div>`;
  th();watch(draw);
  Store.on('meta',a=>{const s=a.find(x=>x.id==='shop');if(s&&!loaded){loaded=1;h_name.value=s.name||'';h_wa.value=s.wa||'';h_phone.value=s.phone||'';h_addr.value=s.addr||'';h_tag.value=s.tag||''}});
});
