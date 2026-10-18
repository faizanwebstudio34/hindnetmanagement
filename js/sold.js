let q='';
boot(()=>{
  $('#app').innerHTML=`<h2>Sold laptops</h2><div id="st" class="stats"></div><div class="bar"><input placeholder="Search laptops" oninput="q=this.value;draw()"></div><div id="list"></div>`;
  watch(draw);
});
function draw(){
  const s=L.filter(x=>x.status==='sold').sort((a,b)=>(b.soldDate||'').localeCompare(a.soldDate||'')),rev=s.reduce((t,x)=>t+x.soldPrice,0),pr=s.reduce((t,x)=>t+(x.price?x.soldPrice-x.price:0),0),c=(n,t,cl='')=>`<div class="card"><b style="${cl}">${n}</b><span class="sub">${t}</span></div>`;
  $('#st').innerHTML=c(s.length,'Total sold')+c(money(rev),'Total revenue')+c(money(pr),'Total profit / loss',`color:var(--${pr>=0?'ok':'no'})`);
  const a=s.filter(l=>match(l,q));
  $('#list').innerHTML=a.length?a.slice(0,150).map(l=>row(l)).join(''):'<div class="card sub">No laptops have been sold yet.</div>';
}
