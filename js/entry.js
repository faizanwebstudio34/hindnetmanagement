boot(()=>{show();watch(()=>{})});
function show(){PH=[null,null];$('#app').innerHTML=`<h2>New laptop entry</h2>${form({})}<button class="p" style="width:100%" onclick="submitEntry()">Save entry</button>`;drawSlots()}
async function submitEntry(){const r=await readForm();if(!r)return;await saveLaptop(r);toast('Entry saved');show();scrollTo(0,0)}
