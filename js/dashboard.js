const bars=(items,unit='')=>{const mx=Math.max(1,...items.map(i=>i[1]));return items.length?items.map(([k,v])=>`<div class="br2"><span>${esc(k)}</span><div><i style="width:${v/mx*100}%"></i></div><b>${v}${unit}</b></div>`).join(''):'<div class="sub">No data yet.</div>'};
function draw(){
  const av=L.filter(x=>x.status!=='sold'),sold=L.filter(x=>x.status==='sold'),m0=new Date();m0.setDate(1);m0.setHours(0,0,0,0);
  const sm=sold.filter(x=>new Date(x.soldDate||0)>=m0),rev=sm.reduce((s,x)=>s+(x.soldPrice||0),0),pf=sm.reduce((s,x)=>s+(x.price?x.soldPrice-x.price:0),0);
  const cost=av.reduce((s,x)=>s+(x.price||0),0),val=av.reduce((s,x)=>s+(x.sellPrice||0),0),c=(n,t,k='')=>`<div class="card"><b ${k}>${n}</b><span class="sub">${t}</span></div>`;
  const cnt=(a,fn)=>Object.entries(a.reduce((m,x)=>{const k=fn(x)||'Unknown';m[k]=(m[k]||0)+1;return m},{})).sort((x,y)=>y[1]-x[1]);
  const age=[['0-7 days',0,7],['8-30 days',8,30],['31-60 days',31,60],['60+ days',61,1e9]].map(([k,a,b])=>[k,av.filter(x=>days(x.date)>=a&&days(x.date)<=b).length]);
  const mon=[];for(let i=5;i>=0;i--){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);const k=d.toISOString().slice(0,7);mon.push([d.toLocaleDateString('en-IN',{month:'short'}),sold.filter(x=>(x.soldDate||'').slice(0,7)===k).length])}
  const old=[...av].sort((x,y)=>days(y.date)-days(x.date)).slice(0,5);
  $('#dash').innerHTML=`<div class="stats">${c(av.length,'Available laptops')}${c(money(cost),'Stock cost value')}${c(money(val),'Selling value')}${c(sm.length+' · '+money(rev),'Sold this month')}${c(money(pf),'Profit this month',`style="color:var(--${pf>=0?'ok':'no'})"`)}</div>
  <div class="dg"><div class="card"><h3>Available by company</h3>${bars(cnt(av,x=>x.brand))}</div><div class="card"><h3>How long in stock</h3>${bars(age)}</div>
  <div class="card"><h3>Sold per month</h3>${bars(mon)}</div><div class="card"><h3>Purchased from</h3>${bars(cnt(L,x=>x.source))}</div></div>
  <h3 class="h3">Longest in stock</h3>${old.length?old.map(l=>row(l)).join(''):'<div class="card sub">No available laptops.</div>'}
  <h3 class="h3">Recent entries</h3>${L.slice(0,5).map(l=>row(l)).join('')||'<div class="card sub">No entries yet.</div>'}`;
}
boot(()=>{$('#app').innerHTML='<h2>Dashboard</h2><div id="dash"><div class="card skel"></div><div class="card skel"></div></div>';watch(draw)});
