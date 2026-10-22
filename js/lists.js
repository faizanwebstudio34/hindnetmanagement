let st='available',so='date',cp='',tab='list',shop={},d1=today(),d2='';
const dq=debounce(()=>draw());
const stText={available:'Available laptops',sold:'Sold laptops',all:'All laptops'};
const lo=()=>d2&&d2<d1?d2:d1,hi=()=>d2&&d2<d1?d1:(d2||d1);
function tabTo(t){
  tab=t;['list','sum','date'].forEach(x=>$('#t_'+x).classList.toggle('on',x===t));
  $('#l_o').style.display=t==='list'?'':'none';$('#db').style.display=t==='date'?'':'none';$('#dch').style.display=t==='date'?'':'none';
  if(t==='date'){st='all';$('#l_s').value='all'}draw();
}
function pickDate(d){d1=d;d2='';$('#l_d1').value=d;$('#l_d2').value='';draw()}
function rows(){
  let a=L.filter(l=>(st==='all'||(st==='sold')===(l.status==='sold'))&&(!cp||l.brand===cp));
  if(tab==='date')a=a.filter(l=>(l.date||'')>=lo()&&(l.date||'')<=hi());
  const byEntry=(tab==='list'&&so==='date')||tab==='date';
  return a.sort(byEntry?(x,y)=>(x.date||'').localeCompare(y.date||'')||(x.createdAt||0)-(y.createdAt||0):(x,y)=>((x.brand||'')+' '+(x.model||'')).localeCompare((y.brand||'')+' '+(y.model||'')));
}
function groups(a){
  const m=new Map();
  a.forEach(l=>{const k=[l.brand,l.model,l.spec].map(s=>(s||'').trim().toLowerCase()).join('|'),g=m.get(k)||{brand:l.brand||'',model:l.model||'',spec:l.spec||'',qty:0};g.qty++;m.set(k,g)});
  return [...m.values()].sort((x,y)=>(x.brand+' '+x.model+' '+x.spec).localeCompare(y.brand+' '+y.model+' '+y.spec));
}
const sub=()=>`${stText[st]}${cp?' · '+cp:''} · ${tab==='date'?'Generated':''} ${fdate(today())}`.replace('  ',' ');
function table(){
  const a=rows(),n=a.length,s=n===1?'':'s',g=groups(a);
  const det=(l,i,range)=>[i+1,l.uid||'',l.serial||'',l.brand||'',l.model||'',l.spec||'',l.order||'',...(range?[fdate(l.date)]:[])];
  const dline=r=>`${r[0]}. ${r[1]?r[1]+' | ':''}${r[3]} ${r[4]} | SN ${r[2]} | ${r[5]} | Order ${r[6]}${r[7]?' | '+r[7]:''}`;
  if(tab==='list')return{title:'Laptop Stock List',head:['No.','ID','Serial No.','Company','Model','Specs','Order ID','Date'],body:a.map((l,i)=>det(l,i,true)),total:`Total: ${n} laptop${s}`,note:'',line:dline};
  if(tab==='date'){
    const range=lo()!==hi();
    return{title:range?`Laptops received: ${fdate(lo())} to ${fdate(hi())}`:`Laptops received on ${fdate(lo())}`,head:['No.','ID','Serial No.','Company','Model','Specs','Order ID',...(range?['Date']:[])],
      body:a.map((l,i)=>det(l,i,range)),total:`Total: ${n} laptop${s} received`,
      note:g.length?'Model-wise: '+g.slice(0,8).map(x=>`${x.brand} ${x.model} x${x.qty}`).join(', ')+(g.length>8?', ...':''):'',line:dline};
  }
  return{title:'Laptop Models Summary',head:['No.','Company','Model','Specs','Qty'],body:g.map((x,i)=>[i+1,x.brand,x.model,x.spec,x.qty]),total:`Total: ${n} laptop${s} in ${g.length} model${g.length===1?'':'s'}`,note:'',line:r=>`${r[0]}. ${r[1]} ${r[2]} - ${r[3]} x${r[4]}`};
}
function draw(){
  const cs=[...new Set(L.map(x=>x.brand).filter(Boolean))].sort(),sel=$('#l_c');
  if(sel.dataset.k!==cs.join('|')){sel.dataset.k=cs.join('|');sel.innerHTML='<option value="">All companies</option>'+cs.map(c=>`<option ${c===cp?'selected':''}>${esc(c)}</option>`).join('')}
  if(tab==='date'){
    const dc=Object.entries(L.reduce((m,l)=>{if(l.date)m[l.date]=(m[l.date]||0)+1;return m},{})).sort((x,y)=>y[0].localeCompare(x[0])).slice(0,12);
    $('#dch').innerHTML=dc.length?dc.map(([d,n])=>`<button class="${d===d1&&!d2?'p':''}" onclick="pickDate('${d}')">${fdate(d)} (${n})</button>`).join(''):'<span class="sub">No entries yet.</span>';
  }
  const t=table();
  $('#sheet').innerHTML=`<div class="sh-h"><div><div class="sh-shop">${esc(shop.name||'Laptop Stock')}</div><div class="sh-t">${esc(t.title)}</div></div><div class="sh-m">${esc(sub())}</div></div>
  <table class="tbl ${tab}"><thead><tr>${t.head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${t.body.length?t.body.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${t.head.length}" class="em">No laptops to show.</td></tr>`}</tbody></table><div class="sh-f">${t.total}</div>${t.note?`<div class="sh-n">${esc(t.note)}</div>`:''}`;
}
const fname=()=>`laptops-${tab==='list'?'list':tab==='sum'?'summary':'received-'+lo()+(lo()!==hi()?'-to-'+hi():'')}-${today()}`;
async function doPDF(){
  toast('Preparing PDF...');const t=table();
  if(!window.jspdf){await loadJS('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');await loadJS('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js')}
  const d=new window.jspdf.jsPDF({unit:'pt',format:'a4',orientation:tab==='sum'?'portrait':'landscape'}),W=d.internal.pageSize.getWidth(),H=d.internal.pageSize.getHeight();
  d.setFont(undefined,'bold');d.setFontSize(16);d.text(shop.name||'Laptop Stock',40,42);
  d.setFont(undefined,'normal');d.setFontSize(12);d.text(t.title,40,62);d.setFontSize(9);d.setTextColor(100);d.text(sub(),40,78);
  d.autoTable({startY:92,head:[t.head],body:t.body,theme:'striped',styles:{fontSize:9,cellPadding:5},headStyles:{fillColor:[29,78,216]},margin:{left:40,right:40,bottom:44},
    didDrawPage:h=>{d.setFontSize(8);d.setTextColor(120);d.text('Page '+h.pageNumber,W-70,H-20)}});
  const y=Math.min(d.lastAutoTable.finalY+20,H-52);d.setFontSize(10);d.setTextColor(20);d.text(t.total,40,y);
  if(t.note){d.setFontSize(9);d.setTextColor(90);d.text(d.splitTextToSize(t.note,W-80),40,y+15)}
  await saveBlob(d.output('blob'),fname()+'.pdf','application/pdf');
}
function doPrint(){
  const w=window.open('','_blank');if(!w)return toast('Please allow pop-ups to print');
  let done=0;const go=()=>{if(done++)return;w.focus();w.print()};
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(table().title)}</title><link rel="stylesheet" href="${new URL('css/style.css?v=9',location.href).href}"><style>body{background:#fff;margin:0;padding:12px}.sheet{min-width:0!important;padding:0!important;border:0!important}@page{size:A4;margin:12mm}</style></head><body>${$('#sheet').outerHTML}</body></html>`);
  w.document.close();w.onload=go;setTimeout(go,1500);
}
async function sheetBlob(){
  if(!window.html2canvas)await loadJS('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  const el=$('#sheet'),sc=Math.max(1,Math.min(2,Math.sqrt(14e6/(el.offsetWidth*el.offsetHeight))));const c=await html2canvas(el,{scale:sc,backgroundColor:'#ffffff'});return new Promise(r=>c.toBlob(r,'image/png'));
}
async function doImg(){toast('Preparing image...');await saveBlob(await sheetBlob(),fname()+'.png','image/png')}
function listText(){const t=table();return [shop.name||'Laptop Stock',t.title+' - '+sub(),'',...t.body.map(t.line),'',t.total,t.note].filter((x,i,a)=>x!==''||a[i-1]!=='').join('\n')}
async function doShare(){
  try{
    const b=await sheetBlob(),f=new File([b],fname()+'.png',{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:table().title});return}
  }catch(e){if(e&&e.name==='AbortError')return}
  open('https://wa.me/?text='+encodeURIComponent(listText().slice(0,1800)));toast('Sharing files is not supported here. Opened WhatsApp with the list as text.');
}
const safe=f=>async(...a)=>{try{await f(...a)}catch(e){toast('Could not create the file. Check your internet connection and try again.')}};
doPDF=safe(doPDF);doImg=safe(doImg);
boot(()=>{
  $('#app').innerHTML=`<h2>Lists</h2>
  <div class="seg"><button id="t_list" class="on" onclick="tabTo('list')">Detailed list</button><button id="t_sum" onclick="tabTo('sum')">Model summary</button><button id="t_date" onclick="tabTo('date')">By date</button></div>
  <div class="bar" id="db" style="display:none"><div><label>Date laptops were received</label><input type="date" id="l_d1" value="${d1}" onchange="d1=this.value||today();draw()"></div><div><label>To date (optional, for a range)</label><input type="date" id="l_d2" onchange="d2=this.value;draw()"></div></div>
  <div class="chips" id="dch" style="display:none"></div>
  <div class="bar"><select id="l_s" onchange="st=this.value;draw()" aria-label="Status"><option value="available">Available laptops</option><option value="sold">Sold laptops</option><option value="all">All laptops</option></select>
  <select id="l_c" onchange="cp=this.value;draw()" aria-label="Company"></select>
  <select id="l_o" onchange="so=this.value;draw()" aria-label="Order"><option value="date">Order of entry</option><option value="brand">Company / model</option></select></div>
  <div class="btns lact"><button onclick="doPrint()">Print</button><button onclick="doPDF()">Download PDF</button><button onclick="doImg()">Download image</button><button class="p" onclick="doShare()">Share</button></div>
  <div class="sw"><div id="sheet" class="sheet"></div></div>`;
  watch(draw);Store.on('meta',a=>{shop=a.find(x=>x.id==='shop')||{};draw()});
});
