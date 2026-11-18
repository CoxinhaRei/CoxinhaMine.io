const crypto=require('crypto'),E=require('./public/expansion');
const itemKey=item=>item?.type==='accessory'?'accessory:'+item.accessoryId:item?.type==='component'?'component:'+item.kind:item?.type==='material'?'material:ore':null;
const isChosen=item=>(item?.oreRarity||item?.rarity)==='CHOSEN';
function filteredState(state,profileId,claims){const copy={...state,inventory:(state.inventory||[]).filter(i=>!isChosen(i)||claims[itemKey(i)]?.owner===profileId&&claims[itemKey(i)]?.serial===i.chosenSerial)};copy.accessories=(state.accessories||[]).map(ref=>ref?.rarity==='CHOSEN'&&!copy.inventory.some(i=>i.type==='accessory'&&i.accessoryId===ref.accessoryId&&i.rarity==='CHOSEN')?null:ref);return copy;}
module.exports=function chosenForge(db,store){
 db.defaults({chosenClaims:{}}).write();
 function status(){return Object.entries(db.get('chosenClaims').value()||{}).map(([key,c])=>({key,ownerName:c.ownerName,bid:c.bid,nextBid:c.bid+1}));}
 function reconcile(profile){if(!profile||profile.guest)return false;const before=profile.state.inventory,filtered=filteredState(profile.state,profile.id,db.get('chosenClaims').value()||{});if(filtered.inventory.length===before.length)return false;profile.state.inventory=filtered.inventory;profile.state.accessories=filtered.accessories;store.save(profile);return true;}
 function forge(actor,data={}){
  if(!actor.profile.accountId||actor.profile.guest)throw Error('Crie ou entre em uma conta para registrar a posse de um Chosen.');
  E.normalize(actor.state);if(actor.state.pendingCraft)throw Error('Aguarde a forja anterior terminar.');const type=data.type,key=itemKey(data);if(!key||!['accessory','component','material'].includes(type))throw Error('Selecione um item ALEPH válido.');
  const bid=Number(data.bid??5);if(!Number.isSafeInteger(bid)||bid<5||bid>1e12)throw Error('Ofereça pelo menos 5 itens ALEPH iguais.');const previous=db.get(['chosenClaims',key]).value();if(previous&&bid<=previous.bid)throw Error('Esta forja exige uma oferta maior que '+previous.bid+' ALEPH.');
  const item=actor.state.inventory.find(i=>i.type===type&&(i.oreRarity||i.rarity)==='ALEPH'&&itemKey(i)===key),used=type==='accessory'?(actor.state.accessories||[]).filter(r=>r&&r.accessoryId===data.accessoryId&&r.rarity==='ALEPH').length:0;
  if(!item||item.amount-used<bid)throw Error('Não há ALEPH suficientes fora dos slots equipados.');
  item.amount-=bid;actor.state.inventory=actor.state.inventory.filter(i=>i.amount>0&&(!isChosen(i)||itemKey(i)!==key));const serial=crypto.randomUUID(),chosen=type==='accessory'?E.accessory(item.accessoryId,'CHOSEN'): {...item,amount:1,rarity:'CHOSEN',oreRarity:type==='material'?'CHOSEN':undefined,name:type==='material'?'CHOSEN':item.name};chosen.chosenSerial=serial;chosen.color='#b9bec8';actor.state.inventory.push(chosen);
  const claim={owner:actor.profile.id,ownerName:actor.name,bid,serial,updatedAt:Date.now()};db.set(['chosenClaims',key],claim).write();actor.state.journal.crafted=(actor.state.journal.crafted||0)+1;actor.state.journal.craftAttempts=(actor.state.journal.craftAttempts||0)+1;actor.state.pendingCraft={id:'forge:'+serial,type,accessoryId:item.accessoryId,kind:item.kind,name:type==='material'?'Minério':item.name,from:'ALEPH',to:'CHOSEN',chance:1,success:true,lost:bid,startedAt:Date.now(),forge:true};store.save(actor.profile);return {previous,claim};
 }
 return {forge,reconcile,status};
};
module.exports.filteredState=filteredState;module.exports.itemKey=itemKey;
