let st='available',so='date',cp='',tab='list',shop={};
const dq=debounce(()=>draw());
const stText={available:'Available laptops',sold:'Sold laptops',all:'All laptops'};
boot(()=>{
  $('#app').innerHTML=`<h2>Lists</h2>
  <div class="seg"><button id="t_list" class="on" onclick="tabTo('list')">Detailed list</button><button id="t_sum" onclick="tabTo('sum')">Model summary</button></div>
  <div class="bar"><select onchange="st=this.value;draw()" aria-label="Status"><option value="available">Available laptops</option><option value="sold">Sold laptops</option><option value="all">All laptops</option></select>
  <select id="l_c" onchange="cp=this.value;draw()" aria-label="Company"></select>
  <select id="l_o" onchange="so=this.value;draw()" aria-label="Order"><option value="date">Order of entry</option><option value="brand">Company / model</option></select></div>
  <div class="btns lact"><button onclick="print()">Print</button><button onclick="doPDF()">Download PDF</button><button onclick="doImg()">Download image</button><button class="p" onclick="doShare()">Share</button></div>
  <div class="sw"><div id="sheet" class="sheet"></div></div>`;
  watch(draw);Store.on('meta',a=>{shop=a.find(x=>x.id==='shop')||{};draw()});
});
function tabTo(t){tab=t;$('#t_list').classList.toggle('on',t==='list');$('#t_sum').classList.toggle('on',t==='sum');$('#l_o').style.display=t==='list'?'':'none';draw()}
function rows(){
  const a=L.filter(l=>(st==='all'||(st==='sold')===(l.status==='sold'))&&(!cp||l.brand===cp));
  return a.sort(tab==='list'&&so==='date'?(x,y)=>(x.createdAt||0)-(y.createdAt||0):(x,y)=>((x.brand||'')+' '+(x.model||'')).localeCompare((y.brand||'')+' '+(y.model||'')));
}
function groups(a){
  const m=new Map();
  a.forEach(l=>{const k=[l.brand,l.model,l.spec].map(s=>(s||'').trim().toLowerCase()).join('|'),g=m.get(k)||{brand:l.brand||'',model:l.model||'',spec:l.spec||'',qty:0};g.qty++;m.set(k,g)});
  return [...m.values()].sort((x,y)=>(x.brand+' '+x.model+' '+x.spec).localeCompare(y.brand+' '+y.model+' '+y.spec));
}
const sub=()=>`${stText[st]}${cp?' · '+cp:''} · ${fdate(today())}`;
function table(){
  const a=rows(),n=a.length,s=n===1?'':'s';
  if(tab==='list')return{title:'Laptop Stock List',head:['No.','Serial No.','Company','Model','Specs','Order ID','Date'],body:a.map((l,i)=>[i+1,l.serial||'',l.brand||'',l.model||'',l.spec||'',l.order||'',fdate(l.date)]),total:`Total: ${n} laptop${s}`};
  const g=groups(a);
  return{title:'Laptop Models Summary',head:['No.','Company','Model','Specs','Qty'],body:g.map((x,i)=>[i+1,x.brand,x.model,x.spec,x.qty]),total:`Total: ${n} laptop${s} in ${g.length} model${g.length===1?'':'s'}`};
}
function draw(){
  const cs=[...new Set(L.map(x=>x.brand).filter(Boolean))].sort(),sel=$('#l_c');
  if(sel.dataset.k!==cs.join('|')){sel.dataset.k=cs.join('|');sel.innerHTML='<option value="">All companies</option>'+cs.map(c=>`<option ${c===cp?'selected':''}>${esc(c)}</option>`).join('')}
  const t=table();
  $('#sheet').innerHTML=`<div class="sh-h"><div><div class="sh-shop">${esc(shop.name||'Laptop Stock')}</div><div class="sh-t">${t.title}</div></div><div class="sh-m">${esc(sub())}</div></div>
  <table class="tbl ${tab}"><thead><tr>${t.head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${t.body.length?t.body.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${t.head.length}" class="em">No laptops to show.</td></tr>`}</tbody></table><div class="sh-f">${t.total}</div>`;
}
const fname=()=>`laptops-${tab==='list'?'list':'summary'}-${today()}`;
async function doPDF(){
  toast('Preparing PDF...');const t=table();
  if(!window.jspdf){await loadJS('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');await loadJS('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js')}
  const d=new window.jspdf.jsPDF({unit:'pt',format:'a4',orientation:tab==='list'?'landscape':'portrait'}),W=d.internal.pageSize.getWidth(),H=d.internal.pageSize.getHeight();
  d.setFont(undefined,'bold');d.setFontSize(16);d.text(shop.name||'Laptop Stock',40,42);
  d.setFont(undefined,'normal');d.setFontSize(12);d.text(t.title,40,62);d.setFontSize(9);d.setTextColor(100);d.text(sub(),40,78);
  d.autoTable({startY:92,head:[t.head],body:t.body,theme:'striped',styles:{fontSize:9,cellPadding:5},headStyles:{fillColor:[29,78,216]},margin:{left:40,right:40,bottom:44},
    didDrawPage:h=>{d.setFontSize(8);d.setTextColor(120);d.text('Page '+h.pageNumber,W-70,H-20)}});
  d.setFontSize(10);d.setTextColor(20);d.text(t.total,40,Math.min(d.lastAutoTable.finalY+20,H-30));
  d.save(fname()+'.pdf');
}
async function sheetBlob(){
  if(!window.html2canvas)await loadJS('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  const c=await html2canvas($('#sheet'),{scale:2,backgroundColor:'#ffffff'});return new Promise(r=>c.toBlob(r,'image/png'));
}
async function doImg(){toast('Preparing image...');const b=await sheetBlob(),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=fname()+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
function listText(){
  const t=table();
  return [shop.name||'Laptop Stock',t.title+' - '+sub(),'',...t.body.map(r=>tab==='list'?`${r[0]}. ${r[2]} ${r[3]} | SN ${r[1]} | ${r[4]} | Order ${r[5]} | ${r[6]}`:`${r[0]}. ${r[1]} ${r[2]} - ${r[3]} x${r[4]}`),'',t.total].join('\n');
}
async function doShare(){
  try{
    const b=await sheetBlob(),f=new File([b],fname()+'.png',{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:table().title});return}
  }catch(e){if(e&&e.name==='AbortError')return}
  open('https://wa.me/?text='+encodeURIComponent(listText().slice(0,1800)));toast('Sharing files is not supported here. Opened WhatsApp with the list as text.');
}
