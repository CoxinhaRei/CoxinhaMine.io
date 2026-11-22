(function(root){
 'use strict';
 const combat=typeof module!=='undefined'&&module.exports?require('./game-catalog'):root.GAME_CATALOG;
 const physics=typeof module!=='undefined'&&module.exports?require('./body-physics'):root.BODY_PHYSICS;
 const EGGS=[
  {id:'eggAnt',kind:'ant',name:'Ovo de Formiga',count:4,cooldown:14},
  {id:'eggBeetle',kind:'beetle',name:'Ovo de Besouro',count:1,cooldown:24},
  {id:'eggSand',kind:'sandTornado',name:'Ovo de Tornado de Areia',count:4,cooldown:22},
  {id:'eggIce',kind:'iceTornado',name:'Ovo de Tornado de Gelo',count:4,cooldown:22},
  {id:'eggBee',kind:'bee',name:'Ovo de Abelha',count:3,cooldown:18},
  {id:'eggSpider',kind:'spider',name:'Ovo de Aranha',count:2,cooldown:20},
  {id:'eggMantis',kind:'mantis',name:'Ovo de Louva-a-deus',count:2,cooldown:20},
  {id:'eggGuardian',kind:'guardian',name:'Ovo de Guardião',count:1,cooldown:28},
  {id:'eggLadybug',kind:'ladybug',name:'Ovo de Joaninha',count:2,cooldown:18},
  {id:'eggCentipede',kind:'centipede',name:'Ovo de Centopeia',count:2,cooldown:22},
  {id:'eggCrab',kind:'crab',name:'Ovo de Caranguejo',count:2,cooldown:22},
  {id:'eggHermit',kind:'hermit',name:'Ovo de Ermitão',count:1,cooldown:24},
  {id:'eggTurtle',kind:'turtle',name:'Ovo de Tartaruga',count:1,cooldown:28},
  {id:'eggDragonfly',kind:'dragonfly',name:'Ovo de Libélula',count:3,cooldown:18},
  {id:'eggFrog',kind:'frog',name:'Ovo de Sapo',count:2,cooldown:22},
  {id:'eggIcebeetle',kind:'icebeetle',name:'Ovo de Besouro Glacial',count:1,cooldown:26},
  {id:'eggSnowmoth',kind:'snowmoth',name:'Ovo de Mariposa da Neve',count:3,cooldown:20},
  {id:'eggScorpion',kind:'scorpion',name:'Ovo de Escorpião',count:2,cooldown:24},
  {id:'eggScarab',kind:'scarab',name:'Ovo de Escaravelho',count:1,cooldown:24},
  {id:'eggInverted',kind:'invertedBeetle',name:'Ovo de Besouro Invertido',count:1,cooldown:30}
 ];
 const SPELLS=[
  {id:'spark',name:'Esfera Arcana',icon:'✦',description:'Uma esfera veloz que explode no primeiro inimigo.',mana:14,cooldown:.65,mult:1.6,color:'#82f5ff',requires:null},
  {id:'beam',name:'Raio do Dossel',icon:'ϟ',description:'Um feixe de luz que atravessa inimigos até encontrar uma parede.',mana:38,cooldown:4,mult:3.5,color:'#be9cff',requires:'spark'},
  {id:'nova',name:'Supernova',icon:'☀',description:'Uma onda circular que atinge os inimigos ao seu redor.',mana:52,cooldown:7,mult:5,color:'#ffc283',requires:'spark'},
  {id:'comet',name:'Chuva de Cometas',icon:'☄',description:'Três cometas explodem em sequência na direção da mira.',mana:44,cooldown:5,mult:2.6,color:'#92c7ff',requires:'beam'}
 ];
 const POWER=[1,1.8,3.4,6.8,15,36,100,300,1000,3500,12000,40000];
 const GROWTH=[1,1.15,1.35,1.65,2.1,2.8,4,6,10,17,29,48];
 const LIMIT=24,MENTOR={id:'jungle-sage',name:'Sábio do Dossel',kind:'mantis',x:77400,y:76000,size:68};
 function normalize(raw){const value=raw&&typeof raw==='object'?raw:{},ranks={};for(const s of SPELLS)ranks[s.id]=Math.max(0,Math.min(11,Math.floor(Number(value.ranks?.[s.id])||0)));if(!value.awakened)for(const s of SPELLS)ranks[s.id]=0;return {awakened:!!value.awakened,ranks,selected:SPELLS.some(s=>s.id===value.selected&&ranks[s.id])?value.selected:'spark'};}
 function points(state){const p=normalize(state.magic);return Math.max(0,1+Math.floor(Math.max(1,state.level||1)/10)-SPELLS.reduce((n,s)=>n+p.ranks[s.id],0));}
 function orb(state,E){let best=-1;for(const ref of (state.accessories||[]).slice(0,E.slots(state.level)))if(ref?.accessoryId==='orb'&&combat.canUse(state,ref)&&state.inventory.some(i=>i.type==='accessory'&&i.accessoryId==='orb'&&i.rarity===ref.rarity&&i.amount>0))best=Math.max(best,E.tier(ref.rarity));return best;}
 function spec(id,tier,rank=1){const spell=SPELLS.find(s=>s.id===id);if(!spell||tier<0||tier>11)return null;const growth=GROWTH[tier];return {...spell,tier,rank,damage:90*combat.ACCESSORY_BUFF*POWER[tier]*spell.mult*(1+Math.max(0,rank-1)*.15),radius:(id==='nova'?180:id==='comet'?90:35)*growth,width:50*growth,range:(id==='beam'?650:500)*Math.sqrt(growth),maxMana:(100+tier*24)*combat.ACCESSORY_BUFF,regen:(12+tier*2)*combat.ACCESSORY_BUFF};}
 function summonStats(base,egg,tier,boosts={}){const interval={ant:.45,beetle:1,sandTornado:.6,iceTornado:.6,bee:.55,spider:.65,mantis:.5,guardian:1.1}[egg.kind]||.8,baseDps=2*combat.ACCESSORY_BUFF*Math.max(base.damage*12,base.maxHp*(tier>=7?.10:.16))*(1+Math.max(0,tier)*.03),damage=baseDps*interval/egg.count*(boosts.damage||1),attackInterval=Math.max(.10,interval/(boosts.haste||1)),dps=damage/attackInterval;return {damage,attackInterval,dps,groupDps:dps*egg.count,maxHp:base.maxHp*(14*combat.ACCESSORY_BUFF/10)*(boosts.health||1),speed:Math.max(170,base.speed||120)*2*combat.ACCESSORY_BUFF*(boosts.speed||1),mass:physics.mobMass(base.size)*1.35};}
 const api={summonStats,EGGS,SPELLS,POWER,GROWTH,LIMIT,MENTOR,normalize,points,orb,spec};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ARCANA=api;
})(typeof globalThis!=='undefined'?globalThis:this);
