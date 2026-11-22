const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../public/game-catalog'),E=require('../public/expansion');

test('Aleph drops occupy exactly 300 of a million outcomes, with unchanged lower boss tiers and precise boundaries',()=>{
 const counts={};for(let n=0;n<1000000;n++){const tier=C.lootTier(10,()=>(n+.5)/1000000);counts[tier]=(counts[tier]||0)+1;}assert.deepEqual(counts,{8:600000,9:50000,10:300,[-1]:349700});
 for(const [roll,expected] of [[0,8],[.5999999,8],[.6,9],[.6499999,9],[.65,10],[.65029999,10],[.6503,-1],[.9999999,-1]])assert.equal(C.lootTier(10,()=>roll),expected);
 for(const tier of [7,8,9]){assert.equal(C.lootTier(tier,()=>.655),tier);assert.equal(C.lootTier(tier,()=>.66),-1);assert.equal(C.lootChances(tier).same,.01);}
});

test('Super, Quantium and Aleph generate matching ground loot; Aleph misses still give XP and helpers give nothing',async t=>{
 const low=require('lowdb'),Memory=require('lowdb/adapters/Memory'),s=await require('../server').createGameServer({env:{},storage:{db:low(new Memory()),mode:'memory',flush:async()=>true,close(){}}});t.after(()=>s.close());for(const w of Object.values(s.worlds)){w.nextSpawn=Infinity;w.game.ores=[];w.game.mobs=[];}
 const profile=s.store.create('DropFixture',{level:100,progressionVersion:3}).profile,events=[],a={profile,state:profile.state,name:profile.name,inLobby:false,socket:{id:'drop-fixture',emit:(...e)=>events.push(e)}},w=s.worlds.garden;s.actors[a.socket.id]=a;Object.assign(a.state,{realm:'garden',x:82000,y:75000});
 for(const [tier,roll,rarity] of [[7,.655,'SUPER'],[9,.655,'QUANTIUM'],[10,.2,'ABSOLUT'],[10,.62,'QUANTIUM'],[10,.65015,'ALEPH'],[10,.655,null]]){
  w.drops=[];let rolls=0;w.lootRandom=()=>{rolls++;return roll;};const m=w.game.createCreature('bee',w.game.rarities[tier],82100,75000);m.hp=m.maxHp=100;w.game.mobs=[m];const xp=a.state.journal.experienceEarned||0;w.damage(a,m,100,true);assert.equal(rolls,1);assert.ok(a.state.journal.experienceEarned>xp);assert.equal(w.drops.length,rarity?2:0);for(const drop of w.drops){assert.equal(drop.item.rarity,rarity);assert.equal(drop.claims.has(profile.id),true);}if(rarity){const item=w.drops.find(d=>d.item.type==='accessory').item;assert.equal(E.ACCESSORIES.find(d=>d.id===item.accessoryId).kind,'bee');}const result=events.filter(e=>e[0]==='lootResult').at(-1)[1];assert.equal(result.dropRarity,rarity);assert.equal(result.itemDropped,!!rarity);
 }
 w.drops=[];w.lootRandom=()=>assert.fail('Enemy helpers must not roll loot');const helper=w.game.createCreature('bee',w.game.rarities[10],82100,75000);helper.noRewards=true;helper.summoned=true;helper.hp=helper.maxHp=100;w.game.mobs=[helper];const xp=a.state.journal.experienceEarned;w.damage(a,helper,100,true);assert.equal(w.drops.length,0);assert.equal(a.state.journal.experienceEarned,xp);
 const rock={id:'aleph-rock',x:82100,y:75000,size:20,hp:100,maxHp:100,rarity:w.game.rarities[10]};w.game.ores=[rock];w.damage(a,rock,100,false);assert.equal(w.drops.length,1);assert.equal(w.drops[0].item.oreRarity,'ALEPH','Mining does not use the mob drop roll');
});

test('mob details show the authoritative Aleph odds and preserve the old odds on Super and Quantium',()=>{
 const details=require('../public/item-details'),env={catalog:C,expansion:E,creatures:[{kind:'bee',name:'Abelha',hp:25,damage:8}],rarities:E.RARITIES.map(name=>({name,color:'#fff'}))};
 const note=rarity=>details.describe({type:'mob',kind:'bee',rarity},env).note;assert.match(note('ALEPH'),/0,03% da mesma raridade; 34,97% sem item/);for(const rarity of ['SUPER','QUANTIUM'])assert.match(note(rarity),/1% da mesma raridade; 34% sem item/);
});

function chatFixture(saved='0',brokenStorage=false){
 const elements=[],storage=new Map([['coxinha_chat_hidden_v155',saved]]),state={menu:false,messages:['one'],renders:0,sent:0,focused:0,typing:false};
 class El{constructor(){this.children=[];this.hidden=false;this.attributes={};this.id='';}append(...nodes){this.children.push(...nodes);}prepend(...nodes){this.children.unshift(...nodes);}setAttribute(k,v){this.attributes[k]=v;}}
 const gameChat=new El(),chatField={value:'unfinished message',blur(){state.typing=false;},onkeydown(e){if(e.key==='Enter')state.sent++;}};
 const context=vm.createContext({document:{createElement(){const el=new El();elements.push(el);return el;},body:new El()},gameChat,chatField,menuVisible:()=>state.menu,localStorage:{getItem:k=>{if(brokenStorage)throw Error('Storage disabled');return storage.get(k);},setItem(k,v){if(brokenStorage)throw Error('Storage disabled');storage.set(k,v);}},renderGameChat(){gameChat.hidden=state.menu;state.renders++;},focusGameChat(){state.focused++;state.typing=true;}});
 vm.runInContext(fs.readFileSync(require.resolve('../public/chat-visibility'),'utf8'),context);return {state,context,storage,gameChat,chatField,open:elements.find(e=>e.id==='chat-open'),close:elements.find(e=>e.id==='chat-close')};
}
test('closing chat releases typing, keeps incoming messages and drafts, and reopens through button or Enter focus without leaking into the menu',()=>{
 const f=chatFixture();f.context.renderGameChat();assert.equal(f.gameChat.hidden,false);f.state.typing=true;f.close.onclick();f.context.renderGameChat();assert.equal(f.gameChat.hidden,true);assert.equal(f.open.hidden,false);assert.equal(f.state.typing,false);assert.equal(f.storage.get('coxinha_chat_hidden_v155'),'1');const renders=f.state.renders;f.state.messages.push('two');f.context.renderGameChat();assert.equal(f.state.renders,renders,'No hidden chat DOM rebuilds');assert.equal(f.chatField.value,'unfinished message');
 f.open.onclick();assert.equal(f.gameChat.hidden,false);assert.equal(f.open.hidden,true);assert.equal(f.open.attributes['aria-expanded'],'true');assert.equal(f.state.typing,true);assert.deepEqual(f.state.messages,['one','two']);f.chatField.onkeydown({key:'Enter'});assert.equal(f.state.sent,1);let stopped=0;f.chatField.onkeydown({key:'Escape',preventDefault(){},stopPropagation(){stopped++;}});assert.equal(stopped,1);assert.equal(f.gameChat.hidden,true);f.context.focusGameChat();assert.equal(f.gameChat.hidden,false);assert.equal(f.state.focused,2);
 f.close.onclick();f.state.menu=true;f.context.renderGameChat();assert.equal(f.gameChat.hidden,true);assert.equal(f.open.hidden,true);f.context.focusGameChat();assert.equal(f.state.focused,2);f.state.menu=false;f.context.renderGameChat();assert.equal(f.open.hidden,false);
});
test('chat visibility is remembered for guests and works with unavailable browser storage',()=>{
 const saved=chatFixture('1');assert.equal(saved.gameChat.hidden,true);assert.equal(saved.open.hidden,false);saved.context.focusGameChat();assert.equal(saved.storage.get('coxinha_chat_hidden_v155'),'0');const blocked=chatFixture('0',true);assert.doesNotThrow(()=>blocked.close.onclick());assert.equal(blocked.gameChat.hidden,true);assert.doesNotThrow(()=>blocked.open.onclick());assert.equal(blocked.gameChat.hidden,false);
});
