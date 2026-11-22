const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const E=require('../public/expansion'),C=require('../public/game-catalog'),D=require('../public/item-details');
const creatures=[{kind:'bee',name:'Abelha',hp:25,damage:8,temperament:'neutral'},...E.MOBS],env={expansion:E,catalog:C,creatures,rarities:E.RARITIES.map(name=>({name,color:'#abcdef'})),oreValues:{Comum:1}};
test('accessory information uses the real rarity bonuses, including fractional regeneration and revival',()=>{
  for(const def of E.ACCESSORIES)for(const rarity of E.RARITIES){const info=D.describe(E.accessory(def.id,rarity),env);assert.equal(info.name,E.accessory(def.id,rarity).name);assert.equal(info.rarity,rarity);assert.ok(info.rows.length);assert.ok(!JSON.stringify(info).includes('NaN'));}
  const sting=D.describe(E.accessory('sting','SUPER'),env);assert.deepEqual(sting.rows.find(r=>r[0]==='Dano'),['Dano','+65,7%']);
  const silk=D.describe(E.accessory('silk','Comum'),env);assert.deepEqual(silk.rows.find(r=>r[0]==='Regeneração'),['Regeneração','+0,15 vida/s']);
  const revive=D.describe(E.accessory('revival','ALEPH'),env),actual=E.reviveSpec({level:1,accessories:[{accessoryId:'revival',rarity:'ALEPH'}]});assert.equal(revive.rows.find(r=>r[0]==='Recarga')[1],D.number(actual.cooldown/1000)+' s');
  assert.equal(D.describe({type:'accessory',accessoryId:'invalid'},env),null);
});
test('drops identify source, recipes and uses without inventing passive buffs',()=>{
  const info=D.describe({type:'component',kind:'bee',name:'Ferrão',rarity:'Raro',amount:12},env);
  assert.equal(info.name,'Ferrão');assert.equal(info.rows.find(r=>r[0]==='Origem')[1],'Abelha');assert.ok(info.rows.find(r=>r[0]==='Acessórios da espécie')[1].includes('Pingente do Ferrão'));assert.match(info.description,/Não concede bônus/);assert.equal(info.rows[0][1],'12');
  const ore=D.describe({type:'material',name:'Pedra',oreRarity:'Comum'},env);assert.equal(ore.rows.find(r=>r[0]==='Venda por unidade')[1],'5 moedas');
});
test('mob gallery stats match runtime health and damage, while live entities show current life',()=>{
  const info=D.describe({type:'mob',kind:'bee',rarity:'SUPER'},env);assert.equal(info.rows.find(r=>r[0]==='Vida')[1],D.number(C.mobHealth(25,7)));assert.equal(info.rows.find(r=>r[0]==='Dano de contato')[1],D.number(C.mobDamage(8,7)));assert.match(info.description,/ferrão/);
  const live=D.describe({type:'mob',kind:'bee',rarity:{name:'Raro'},hp:17,maxHp:250,damage:25,summoned:true},env);assert.equal(live.rows.find(r=>r[0]==='Vida')[1],'17 / 250');assert.equal(live.rows.find(r=>r[0]==='Dano de contato')[1],'25');assert.match(live.note,/não concede drops nem XP/);
});
test('inspection shortcut guard blocks requested keys without breaking typing, copy or menu controls',()=>{
  let handler;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/inspection-shortcuts.js'),'utf8'),{document:{addEventListener:(name,fn)=>handler=fn}});
  for(const data of [{key:'F12'},{key:'I',ctrlKey:true,shiftKey:true},{key:'j',metaKey:true,altKey:true}]){let prevented=0,stopped=0;handler({...data,preventDefault(){prevented++;},stopImmediatePropagation(){stopped++;}});assert.equal(prevented,1);assert.equal(stopped,1);}
  for(const data of [{key:'a'},{key:'c',ctrlKey:true},{key:'Escape'},{key:'Enter'}])handler({...data,preventDefault(){assert.fail('ordinary controls blocked');},stopImmediatePropagation(){assert.fail();}});
});
test('one tooltip supports hover, keyboard, tap after inventory rerender, scrolling and viewport edges',async()=>{
  class Element{constructor(tag='div'){this.tagName=tag.toUpperCase();this.attributes={};this.children=[];this.hidden=false;this.style={setProperty(){}};this.dataset={};}append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}setAttribute(k,v){this.attributes[k]=v;}removeAttribute(k){delete this.attributes[k];}hasAttribute(k){return k in this.attributes;}closest(){return this.dataset.itemTooltip?this:null;}contains(e){return e===this;}getBoundingClientRect(){return {left:10,top:30,width:290,height:330};}}
  const handlers={},canvasHandlers={},body=new Element(),source=new Element('button'),canvas={addEventListener(n,fn){canvasHandlers[n]=fn;}},document={body,createElement:tag=>new Element(tag),addEventListener(n,fn){(handlers[n]||=[]).push(fn);}};
  const context=vm.createContext({document,Element,window:{addEventListener(){}},EXPANSION:E,GAME_CATALOG:C,CREATURES:creatures,rarities:env.rarities,ORE_VALUES:{},SPECIAL_MOB_ABILITIES:{},ItemDetails:D,canvas,itemPreview:()=>'/preview.png',setTimeout,clearTimeout,innerWidth:390,innerHeight:844,performance:{now:()=>1000},source});vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/item-tooltips.js'),'utf8'),context);
  vm.runInContext("bindItemTooltip(source,EXPANSION.accessory('sting','SUPER'))",context);const tip=body.children[0],fire=(name,data={})=>(handlers[name]||[]).forEach(fn=>fn({target:source,clientX:380,clientY:820,pointerId:2,...data}));
  fire('pointerover',{pointerType:'mouse'});assert.equal(tip.hidden,false);assert.ok(parseFloat(tip.style.left)+290<=380);assert.ok(parseFloat(tip.style.top)+330<=834);assert.equal(source.attributes['aria-describedby'],tip.id);
  fire('pointerout',{relatedTarget:null,pointerType:'mouse'});assert.equal(tip.hidden,true);
  fire('focusin');assert.equal(tip.hidden,false);fire('keydown',{key:'Escape'});assert.equal(tip.hidden,true);
  fire('pointerdown',{pointerType:'touch'});fire('pointerup',{pointerType:'touch'});fire('focusout');await new Promise(r=>setTimeout(r,10));assert.equal(tip.hidden,false,'tap details survive focus loss when inventory cards rerender');fire('scroll');assert.equal(tip.hidden,true);
  fire('pointerdown',{pointerType:'touch'});fire('pointermove',{clientX:340,pointerType:'touch'});fire('pointerup',{pointerType:'touch'});await new Promise(r=>setTimeout(r,10));assert.equal(tip.hidden,true,'swiping the horizontal bar does not open a card');
});
