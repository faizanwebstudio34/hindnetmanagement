let LAST={},saving=false;
boot(()=>{show();watch(()=>{})});
function show(){PH=[null,null];PHdirty=false;$('#app').innerHTML=`<h2>New laptop entry</h2>${form(LAST)}<button class="p" id="sv" style="width:100%" onclick="submitEntry()">Save entry</button>`;drawSlots();if(matchMedia('(pointer:fine)').matches)$('#f_serial').focus()}
async function submitEntry(){
  if(saving)return;saving=true;const b=$('#sv');b.disabled=true;b.textContent='Saving...';
  try{const r=await readForm();if(!r)return;await saveLaptop(r,PHdirty?r.photos:undefined);LAST={source:r.source,account:r.account,condition:r.condition,date:r.date};toast('Entry #'+r.no+' saved');show();scrollTo(0,0)}
  catch(e){toast('Could not save: '+e.message)}
  finally{saving=false;const s=$('#sv');if(s){s.disabled=false;s.textContent='Save entry'}}
}
