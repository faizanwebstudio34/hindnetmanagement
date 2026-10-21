const dq=debounce(()=>draw());
let q='',f='all',cp='',so='new',selMode=false,VIEW=[];const SEL=new Set();
function draw(){
  const av=L.filter(x=>x.status!=='sold'),c=(n,t)=>`<div class="card"><b>${n}</b><span class="sub">${t}</span></div>`;
  $('#st').innerHTML=c(L.length,'Total entries')+c(av.length,'Available')+c(L.length-av.length,'Sold')+c(money(av.reduce((s,x)=>s+(x.price||0),0)),'Stock cost value');
  const cs=[...new Set(L.map(x=>x.brand).filter(Boolean))].sort(),sel=$('#sc');
  if(sel.dataset.k!==cs.join('|')){sel.dataset.k=cs.join('|');sel.innerHTML='<option value="">All companies</option>'+cs.map(b=>`<option ${b===cp?'selected':''}>${esc(b)}</option>`).join('')}
  const a=L.filter(l=>match(l,q)&&(f==='all'||(f==='sold')===(l.status==='sold'))&&(!cp||l.brand===cp))
    .sort(so==='old'?(x,y)=>(x.createdAt||0)-(y.createdAt||0):so==='price'?(x,y)=>(y.sellPrice||0)-(x.sellPrice||0):(x,y)=>(y.createdAt||0)-(x.createdAt||0));
  VIEW=a;
  $('#list').innerHTML=a.length?a.slice(0,150).map(l=>row(l,selMode?'tog':'showDetail').replace('class="card item"',`class="card item${SEL.has(l.id)?' sel':''}"`)).join('')+(a.length>150?'<div class="sub">Showing the first 150. Use search or filters to narrow down.</div>':''):'<div class="card sub">No laptops found.</div>';
  document.body.classList.toggle('selmode',selMode);$('#bulk').hidden=!selMode;$('#bn').textContent=SEL.size+' selected';$('#sm').textContent=selMode?'Done':'Select';
}
const tog=id=>{SEL.has(id)?SEL.delete(id):SEL.add(id);draw()};
const toggleSel=()=>{selMode=!selMode;if(!selMode)SEL.clear();draw()};
const selAll=()=>{VIEW.slice(0,150).forEach(l=>SEL.add(l.id));draw()};
async function bulk(op){
  const ids=[...SEL];if(!ids.length)return toast('Select at least one laptop');
  if(op==='del'){if(!confirm(`Delete ${ids.length} laptop${ids.length>1?'s':''} permanently?`))return;fire(ids.flatMap(id=>[Store.del('laptops',id),Store.del('catalog',id),Store.del('photos',id)]));toast('Deleted '+ids.length)}
  else{await Promise.all(ids.map(id=>patch(id,{public:op==='show'})));toast(ids.length+(op==='show'?' shown on':' hidden from')+' the customer page')}
  SEL.clear();selMode=false;draw();
}
boot(()=>{
  $('#app').innerHTML=`<div class="hd2"><h2>Laptop Stock</h2><button id="sm" onclick="toggleSel()">Select</button></div><div id="st" class="stats"></div>
  <div class="bar"><input placeholder="Search by serial, company, model or order ID" oninput="q=this.value;dq()"><select onchange="f=this.value;draw()" aria-label="Status"><option value="all">All</option><option value="available">Available</option><option value="sold">Sold</option></select>
  <select id="sc" onchange="cp=this.value;draw()" aria-label="Company"></select><select onchange="so=this.value;draw()" aria-label="Sort"><option value="new">Newest first</option><option value="old">Oldest first</option><option value="price">Price: high to low</option></select></div>
  <div id="list"><div class="card skel"></div><div class="card skel"></div><div class="card skel"></div></div>
  <div id="bulk" class="bulk" hidden><b id="bn"></b><button onclick="selAll()">Select all</button><button onclick="bulk('show')">Show on customer page</button><button onclick="bulk('hide')">Hide</button><button class="d" onclick="bulk('del')">Delete</button></div>`;
  watch(draw);
});
