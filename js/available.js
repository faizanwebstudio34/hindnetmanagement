const dq=debounce(()=>draw());
let q='',br='',so='new';
boot(()=>{
  $('#app').innerHTML=`<h2>Available laptops</h2><div id="st" class="stats"></div>
  <div class="bar"><input placeholder="Search laptops" oninput="q=this.value;dq()"><select id="ab" onchange="br=this.value;draw()"></select>
  <select onchange="so=this.value;draw()"><option value="new">Newest first</option><option value="old">Oldest first (longest in stock)</option><option value="lo">Price: low to high</option><option value="hi">Price: high to low</option></select>
  <button onclick="copyLink()">Copy customer link</button></div><div id="list" class="grid"></div>`;
  watch(draw);
});
function draw(){
  const av=L.filter(x=>x.status!=='sold'),cost=av.reduce((s,x)=>s+x.price,0),sell=av.reduce((s,x)=>s+(x.sellPrice||0),0),pr=av.filter(x=>x.price&&x.sellPrice).reduce((s,x)=>s+x.sellPrice-x.price,0),vis=av.filter(x=>x.public!==false).length,c=(n,t)=>`<div class="card"><b>${n}</b><span class="sub">${t}</span></div>`;
  $('#st').innerHTML=c(av.length,'Available')+c(money(cost),'Cost value')+c(money(sell),'Selling value')+c(money(pr),'Estimated profit')+c(vis,'Visible to customers');
  const bs=['',...[...new Set(av.map(x=>x.brand))].sort()],sel=$('#ab');
  if(sel.dataset.k!==bs.join('|')){sel.dataset.k=bs.join('|');sel.innerHTML=bs.map(b=>`<option value="${esc(b)}" ${b===br?'selected':''}>${b?esc(b):'All companies'}</option>`).join('')}
  const a=av.filter(l=>match(l,q)&&(!br||l.brand===br)).sort((x,y)=>so==='old'?(x.createdAt-y.createdAt):so==='lo'?x.sellPrice-y.sellPrice:so==='hi'?y.sellPrice-x.sellPrice:0);
  $('#list').innerHTML=a.length?a.slice(0,120).map(l=>{const im=l.thumb||(l.photos||[])[0],pub=l.public!==false,pf=(l.sellPrice||0)-l.price;
    return `<div class="pc" onclick="showDetail('${l.id}')"><div class="im">${im?`<img loading="lazy" decoding="async" src="${im}">`:'<span class="nopic">No photo</span>'}<span class="nb">${esc(l.uid||'#'+numOf(l))}</span><span class="tag ${pub?'ok':'sd'} ab">${pub?'Public':'Hidden'}</span></div>
    <div class="pb"><b>${esc(l.brand)} ${esc(l.model)}</b><div class="sub">${esc(l.spec)}</div><div class="pr"><b>${mp(l.sellPrice)}</b><span class="tag">${esc(l.condition||'')}</span></div>
    <div class="sub">${l.price?'Cost '+money(l.price)+(l.sellPrice?` · <span style="color:var(--${pf>=0?'ok':'no'})">${pf>=0?'+':''}${money(pf)}</span>`:''):'Cost not entered'}</div><div class="sub">${days(l.date)} days in stock · SN ${esc(l.serial)}</div>
    <div class="row2"><button title="Show or hide on the customer catalog" onclick="event.stopPropagation();patch('${l.id}',{public:${!pub}})">${pub?'Hide':'Show'}</button><button onclick="event.stopPropagation();shareWA('${l.id}')">Share</button><button class="p" onclick="event.stopPropagation();sellUI('${l.id}')">Sold</button></div></div></div>`}).join(''):'<div class="card sub w2">No available laptops.</div>';
}
