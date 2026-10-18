let C=[],shop={},q='',br='',so='new',mx=0;
document.body.innerHTML=`<header class="ch"><div><b id="sn">Laptop Store</b><div class="sub" id="tg"></div></div><div class="row"><button onclick="toggleTheme()">Theme</button><a id="wab" class="btn p" target="_blank" style="display:none">WhatsApp</a></div></header>
<main class="cm"><div class="bar"><input placeholder="Search laptops" oninput="q=this.value;draw()"><select onchange="so=this.value;draw()"><option value="new">Newest first</option><option value="lo">Price: low to high</option><option value="hi">Price: high to low</option></select>
<select onchange="mx=+this.value;draw()"><option value="0">Any price</option><option value="20000">Up to ₹20,000</option><option value="30000">Up to ₹30,000</option><option value="40000">Up to ₹40,000</option><option value="60000">Up to ₹60,000</option></select></div>
<div class="chips" id="ch"></div><div class="sub" id="cnt" style="margin-bottom:10px"></div><div class="grid" id="cl"></div><div class="sub" id="ft" style="text-align:center;margin:30px 0"></div></main><div id="ov"></div>`;
const wnum=()=>(shop.wa||'').replace(/\D/g,'');
const wlink=l=>`https://wa.me/${wnum()}?text=`+encodeURIComponent(l?`Hello, I am interested in the ${l.brand} ${l.model} (${money(l.sellPrice)}). Is it still available?`:'Hello, I would like to know more about your laptops.');
Store.on('meta',a=>{
  shop=a.find(x=>x.id==='shop')||{};$('#sn').textContent=document.title=shop.name||'Laptop Store';$('#tg').textContent=shop.tag||'';
  const w=$('#wab');w.style.display=wnum()?'':'none';w.href=wlink();
  $('#ft').innerHTML=[shop.addr,shop.phone&&'Tel: '+shop.phone].filter(Boolean).map(esc).join(' · ');
});
Store.on('catalog',a=>{C=a;draw()});
function draw(){
  const bs=[...new Set(C.map(x=>x.brand))].sort();
  $('#ch').innerHTML=['',...bs].map(b=>`<button class="${b===br?'p':''}" onclick="br='${esc(b).replace(/'/g,'')}';draw()">${b?esc(b):'All'}</button>`).join('');
  const a=C.filter(l=>(!br||l.brand===br)&&(!mx||(l.sellPrice&&l.sellPrice<=mx))&&match(l,q)).sort((x,y)=>so==='lo'?x.sellPrice-y.sellPrice:so==='hi'?y.sellPrice-x.sellPrice:(y.createdAt||0)-(x.createdAt||0));
  $('#cnt').textContent=a.length+' laptops available';
  $('#cl').innerHTML=a.length?a.map(l=>{const im=l.thumb||l.photos?.[0];
    return `<div class="pc" onclick="cdet('${l.id}')"><div class="im">${im?`<img loading="lazy" src="${im}">`:'<span class="nopic">No photo</span>'}${days(l.createdAt)<8?'<span class="tag ok ab">New</span>':''}</div>
    <div class="pb"><b>${esc(l.brand)} ${esc(l.model)}</b><div class="sub">${esc(l.spec)}</div><div class="pr"><b>${l.sellPrice?money(l.sellPrice):'Ask for price'}</b><span class="tag">${esc(l.condition||'')}</span></div></div></div>`}).join(''):'<div class="card sub">No laptops match your filters.</div>';
}
function cdet(id){
  const l=C.find(x=>x.id===id);if(!l)return;const kv=(k,v)=>v?`<div class="kv"><span>${k}</span><span>${esc(v)}</span></div>`:'';
  modal(`<div class="hd"><b style="font-size:18px">${esc(l.brand)} ${esc(l.model)}</b><button onclick="closeM()">✕</button></div>
  ${l.photos?.length?`<div class="gal">${l.photos.map(p=>`<img src="${p}">`).join('')}</div>`:''}
  <div style="font-size:24px;font-weight:700;margin:6px 0">${l.sellPrice?money(l.sellPrice):'Ask for price'}</div>
  ${kv('Company',l.brand)}${kv('Model',l.model)}${kv('Specs',l.spec)}${kv('Condition',l.condition)}${kv('Warranty',l.warranty)}
  <div class="btns">${wnum()?`<a class="btn p" target="_blank" href="${wlink(l)}">Enquire on WhatsApp</a>`:''}${shop.phone?`<a class="btn" href="tel:${esc(shop.phone)}">Call</a>`:''}</div>`);
}
