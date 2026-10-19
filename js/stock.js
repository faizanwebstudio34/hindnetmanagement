const dq=debounce(()=>draw());
let q='',f='all';
boot(()=>{
  $('#app').innerHTML=`<h2>Laptop Stock</h2><div id="st" class="stats"></div><div class="bar"><input placeholder="Search by serial, company, model or order ID" oninput="q=this.value;dq()"><select onchange="f=this.value;draw()"><option value="all">All</option><option value="available">Available</option><option value="sold">Sold</option></select></div><div id="list"><div class="card skel"></div><div class="card skel"></div><div class="card skel"></div></div>`;
  watch(draw);
});
function draw(){
  const av=L.filter(x=>x.status!=='sold'),c=(n,t)=>`<div class="card"><b>${n}</b><span class="sub">${t}</span></div>`;
  $('#st').innerHTML=c(L.length,'Total entries')+c(av.length,'Available')+c(L.length-av.length,'Sold')+c(money(av.reduce((s,x)=>s+x.price,0)),'Stock cost value');
  const a=L.filter(l=>match(l,q)&&(f==='all'||(f==='sold')===(l.status==='sold')));
  $('#list').innerHTML=a.length?a.slice(0,150).map(l=>row(l)).join('')+(a.length>150?'<div class="sub">Showing the first 150 results. Use search to narrow down.</div>':''):'<div class="card sub">No laptops found.</div>';
}
