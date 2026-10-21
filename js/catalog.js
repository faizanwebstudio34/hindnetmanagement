const CI={search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',heart:'<path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6c-2.5 4.5-9.5 9-9.5 9z"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/>',chat:'<path d="M21 12a8 8 0 01-11.8 7L4 20l1.2-4.6A8 8 0 1121 12z"/>',laptop:'<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',theme:'<circle cx="12" cy="12" r="8"/><path d="M12 4v16"/>'};
const ci=(k,s=18,f='none')=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${f}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${CI[k]}</svg>`;
let C=[],shop={},q='',br='',cond='',mx=null,pmax=10000,so='new',onlySaved=false,BR=[],CO=[],opened=false,saved=LS.get('saved')||[];
const seen=new Set(),sv=id=>saved.includes(id),wnum=()=>(shop.wa||'').replace(/\D/g,'');
const wlink=l=>`https://wa.me/${wnum()}?text=`+encodeURIComponent(l?`Hello, I am interested in the ${l.brand} ${l.model}${l.sellPrice?' ('+money(l.sellPrice)+')':''}. Is it still available?`:'Hello, I would like to know more about your laptops.');
const specs=l=>(l.spec||'').split(',').map(s=>s.trim()).filter(Boolean);
const sk='<div class="cp sk in seen"><div class="im"></div><div class="pb"><i></i><i></i><i style="width:60%"></i></div></div>'.repeat(6);

document.body.innerHTML=`<header class="nav" id="nav"><a class="brand" href="#top"><span class="logo" id="lg">L</span><b id="sn">Laptop Store</b></a>
<div class="nr"><button class="ib" id="svb" onclick="toggleSaved()" aria-label="Saved laptops">${ci('heart')}<span id="svn">0</span></button><button class="ib" onclick="toggleTheme()" aria-label="Switch theme">${ci('theme')}</button></div></header>
<section class="hero" id="top"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div>
<div class="hin"><span class="eyebrow fu" id="eb">Laptops in stock</span><h1 class="fu" style="--d:.1s">Find your next laptop</h1><p class="fu" style="--d:.2s" id="tg">Browse our current stock and message us on WhatsApp to reserve your laptop.</p>
<div class="hbtn fu" style="--d:.3s"><a class="btn p lg" href="#shop">Browse laptops</a><a id="wab" class="btn ghost lg" target="_blank" style="display:none">${ci('chat')} Chat on WhatsApp</a></div>
<div class="hstats fu" style="--d:.45s"><div><b id="n1">0</b><span>Laptops available</span></div><div><b id="n2">0</b><span>Brands</span></div><div><b id="n3">-</b><span>Starting from</span></div></div></div></section>
<main class="cm" id="shop"><div class="tool"><div class="sr">${ci('search')}<input id="qi" placeholder="Search by brand, model or specs" oninput="q=this.value;draw()"></div>
<select onchange="so=this.value;draw()" aria-label="Sort"><option value="new">Newest first</option><option value="lo">Price: low to high</option><option value="hi">Price: high to low</option></select></div>
<div class="rng"><span>Budget</span><input type="range" id="pr" min="0" max="10000" step="1000" oninput="mx=+this.value;draw()"><b id="pv">Any price</b></div>
<div class="chips" id="bch"></div><div class="chips" id="cch"></div>
<div class="meta"><span id="cnt"></span><button onclick="clearF()">Clear filters</button></div><div class="grid" id="cl">${sk}</div></main>
<footer class="ft" id="ft"></footer><a id="fab" class="fab" target="_blank" aria-label="WhatsApp">${ci('chat',26)}</a><div id="ov"></div>`;

const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');seen.add(e.target.dataset.id);io.unobserve(e.target)}}),{threshold:.08});
const reveal=()=>document.querySelectorAll('.rv:not(.in)').forEach(n=>io.observe(n));
function anim(el,to,fmt=v=>v){if(el._v===to)return;const from=el._v||0,t0=performance.now();el._v=to;const st=t=>{const p=Math.min(1,(t-t0)/900),e=1-Math.pow(1-p,3);el.textContent=fmt(Math.round(from+(to-from)*e));if(p<1)requestAnimationFrame(st)};requestAnimationFrame(st)}
const chipHTML=(a,on,fn)=>a.map((t,i)=>`<button class="chip ${i===on?'on':''}" onclick="${fn}(${i-1})">${esc(t)}</button>`).join('');
const setBr=i=>{br=i<0?'':BR[i];draw()},setCo=i=>{cond=i<0?'':CO[i];draw()};
function clearF(){q='';br='';cond='';mx=null;onlySaved=false;$('#qi').value='';draw()}
function toggleSaved(){onlySaved=!onlySaved;draw();if(onlySaved)$('#shop').scrollIntoView()}
function toggleSave(id){saved=sv(id)?saved.filter(x=>x!==id):[...saved,id];LS.set('saved',saved);draw();const b=$('#sbtn');if(b&&b.dataset.id===id)b.innerHTML=`${ci('heart',18,sv(id)?'currentColor':'none')} ${sv(id)?'Saved':'Save'}`;
  document.querySelectorAll(`.hb[data-id="${id}"]`).forEach(h=>h.classList.add('pop'))}

function draw(){
  BR=[...new Set(C.map(x=>x.brand).filter(Boolean))].sort();CO=[...new Set(C.map(x=>x.condition).filter(Boolean))];
  const pr=C.map(x=>x.sellPrice).filter(Boolean);pmax=Math.max(10000,Math.ceil(Math.max(0,...pr)/5000)*5000);
  const sl=$('#pr');sl.max=pmax;sl.step=pmax>100000?5000:1000;if(mx==null||mx>pmax)mx=pmax;sl.value=mx;$('#pv').textContent=mx>=pmax?'Any price':'Up to '+money(mx);
  $('#bch').innerHTML=BR.length>1?chipHTML(['All brands',...BR],br?BR.indexOf(br)+1:0,'setBr'):'';
  $('#cch').innerHTML=CO.length>1?chipHTML(['Any condition',...CO],cond?CO.indexOf(cond)+1:0,'setCo'):'';
  anim($('#n1'),C.length);anim($('#n2'),BR.length);if(pr.length)anim($('#n3'),Math.min(...pr),v=>'₹'+v.toLocaleString('en-IN'));
  $('#svn').textContent=saved.filter(id=>C.some(x=>x.id===id)).length;$('#svb').classList.toggle('on',onlySaved);
  const fl=mx<pmax,qq=q.toLowerCase();
  const a=C.filter(l=>(!br||l.brand===br)&&(!cond||l.condition===cond)&&(!fl||(l.sellPrice&&l.sellPrice<=mx))&&(!onlySaved||sv(l.id))&&(!qq||[l.brand,l.model,l.spec,l.condition].join(' ').toLowerCase().includes(qq)))
    .sort((x,y)=>so==='lo'?(x.sellPrice||1e12)-(y.sellPrice||1e12):so==='hi'?(y.sellPrice||0)-(x.sellPrice||0):(y.createdAt||0)-(x.createdAt||0));
  $('#cnt').textContent=`${a.length} of ${C.length} laptops${onlySaved?' (saved)':''}`;
  $('#cl').innerHTML=a.length?a.map((l,i)=>{const im=l.thumb||l.photos?.[0];
    return `<article class="cp rv ${seen.has(l.id)?'in seen':''}" data-id="${l.id}" style="--d:${(i%6)*70}ms" onclick="cdet('${l.id}')"><div class="im">${im?`<img loading="lazy" src="${im}" alt="${esc(l.brand+' '+l.model)}">`:ci('laptop',56)}
    ${l.condition?`<span class="bd">${esc(l.condition)}</span>`:''}${days(l.createdAt)<8?'<span class="nw">New arrival</span>':''}
    <button class="hb ${sv(l.id)?'on':''}" data-id="${l.id}" onclick="event.stopPropagation();toggleSave('${l.id}')" aria-label="Save">${ci('heart',18,sv(l.id)?'currentColor':'none')}</button></div>
    <div class="pb"><div class="br">${esc(l.brand)}</div><h3>${esc(l.model)}</h3><div class="chp">${specs(l).slice(0,4).map(s=>`<span>${esc(s)}</span>`).join('')}</div>
    <div class="pf"><div class="price">${l.sellPrice?money(l.sellPrice):'Ask for price'}</div><span class="go">View details →</span></div></div></article>`}).join('')
    :`<div class="empty">${ci('laptop',56)}<h3>${C.length?'No laptops match your filters':'New stock is arriving soon'}</h3><p>${C.length?'Try a different search or clear the filters.':'Please check back shortly or message us on WhatsApp.'}</p></div>`;
  reveal();
}
const gal=(ph,l)=>`<div class="mi" id="mi" onclick="$('#mi').classList.toggle('zm')" onmousemove="zoomMove(event)">${ph.length?`<img id="mimg" src="${ph[0]}" alt="${esc(l.brand+' '+l.model)}">`:ci('laptop',72)}</div>${ph.length>1?`<div class="ths">${ph.map((p,i)=>`<button class="th ${i?'':'on'}" onclick="swapImg(this)"><img src="${p}" alt=""></button>`).join('')}</div>`:''}`;
function cdet(id){
  const l=C.find(x=>x.id===id);if(!l)return;history.replaceState(null,'','#'+id);
  const ph=l.photos?.length?l.photos:(l.thumb?[l.thumb]:[]),kv=(k,v)=>v?`<div class="kv"><span>${k}</span><b>${esc(v)}</b></div>`:'',d=days(l.createdAt);
  $('#ov').innerHTML=`<div class="cmo" onclick="if(event.target===this)closeD()"><div class="cmd" role="dialog" aria-modal="true"><button class="x" onclick="closeD()" aria-label="Close">${ci('x',20)}</button>
  <div class="cg"><div id="gl">${gal(ph,l)}</div>
  <div class="ci"><div class="br">${esc(l.brand)}</div><h2>${esc(l.model)}</h2><div class="price big">${l.sellPrice?money(l.sellPrice):'Ask for price'}</div>
  <div class="chp">${specs(l).map(s=>`<span>${esc(s)}</span>`).join('')}</div>
  <div class="kvs">${kv('Condition',l.condition)}${kv('Warranty',l.warranty)}${kv('Listed',d<1?'Today':d+(d===1?' day ago':' days ago'))}</div>
  <div class="acts">${wnum()?`<a class="btn p lg" target="_blank" href="${wlink(l)}">${ci('chat')} Enquire on WhatsApp</a>`:''}${shop.phone?`<a class="btn lg" href="tel:${esc(shop.phone)}">${ci('phone')} Call</a>`:''}
  <button class="btn" onclick="shareL('${id}')">${ci('share')} Share</button><button class="btn" id="sbtn" data-id="${id}" onclick="toggleSave('${id}')">${ci('heart',18,sv(id)?'currentColor':'none')} ${sv(id)?'Saved':'Save'}</button></div>
  <p class="note">Price and availability are subject to change. Please message us to confirm before visiting.</p></div></div></div></div>`;
  document.documentElement.classList.add('lock');
  if(!(l.photos&&l.photos.length)&&l.photoCount>0)Store.get('photos',id).then(d=>{const g=$('#gl');if(g&&d&&d.list&&d.list.length)g.innerHTML=gal(d.list,l)}).catch(()=>{});
}
function zoomMove(e){const m=$('#mi'),i=$('#mimg');if(!i||!m.classList.contains('zm'))return;const r=m.getBoundingClientRect();i.style.transformOrigin=((e.clientX-r.left)/r.width*100)+'% '+((e.clientY-r.top)/r.height*100)+'%'}
function swapImg(b){$('#mimg').src=b.firstElementChild.src;document.querySelectorAll('.th').forEach(x=>x.classList.toggle('on',x===b))}
function closeD(){$('#ov').innerHTML='';document.documentElement.classList.remove('lock');history.replaceState(null,'',location.pathname+location.search)}
function shareL(id){const l=C.find(x=>x.id===id),u=location.origin+location.pathname+'#'+id;navigator.share?navigator.share({title:l.brand+' '+l.model,url:u}).catch(()=>{}):navigator.clipboard.writeText(u).then(()=>toast('Link copied'))}
addEventListener('keydown',e=>{if(e.key==='Escape')closeD()});
addEventListener('scroll',()=>$('#nav').classList.toggle('sc',scrollY>10),{passive:true});
addEventListener('hashchange',()=>{opened=false;deep()});
function deep(){if(opened||location.hash.length<2)return;const id=decodeURIComponent(location.hash.slice(1));if(C.some(x=>x.id===id)){opened=true;cdet(id)}}

Store.on('meta',a=>{
  shop=a.find(x=>x.id==='shop')||{};const n=shop.name||'Laptop Store';
  $('#sn').textContent=document.title=n;$('#lg').textContent=n[0].toUpperCase();$('#eb').textContent=n;if(shop.tag)$('#tg').textContent=shop.tag;
  const w=wnum()?wlink():'';[$('#wab'),$('#fab')].forEach(e=>{e.href=w;e.style.display=w?'':'none'});$('#fab').style.display=w?'grid':'none';
  $('#ft').innerHTML=[shop.addr,shop.phone&&'Tel: '+shop.phone].filter(Boolean).map(esc).join(' · ')+`<div style="margin-top:8px">© ${new Date().getFullYear()} ${esc(n)}</div>`;
});
Store.on('catalog',a=>{C=a;draw();deep()});
