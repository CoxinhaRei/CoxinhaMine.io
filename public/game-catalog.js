(function(root){
  // Radius in world units. PRIMORDIAL's diameter is half the garden's width.
  const ORE_RADII=[18,24,32,44,58,76,110,320,1500,4500,10000,25000];
  const NAMES=['Comum','Incomum','Raro','Épico','Lendário','Mítico','ULTRA','SUPER','ABSOLUT','QUANTIUM','ALEPH','PRIMORDIAL'];
  const PRIMORDIAL={name:'PRIMORDIAL',color:'#ffc5f7',hp:4e12,mult:160000,adminOnly:true};
  const catalog={
    ORE_RADII,NAMES,PRIMORDIAL,
    PICKAXE_POWER:[30,100,400,1600,10000,45000,120000,280000],
    SWORD_DAMAGE:[45,150,600,2400,18000,60000,170000,360000],
    ORE_HP:[150,350,900,2500,7500,24000,120000,12000000,60000000,200000000,1000000000,4e12],
    XP_REWARDS:[20,60,220,1000,6000,30000,250000,2000000,12000000,80000000,500000000,5000000000],
    MOB_LOOT:{guardian:'Fragmento do Guardião',ladybug:'Élitro Rubro',bee:'Ferrão',ant:'Mandíbula',spider:'Seda de Aranha',beetle:'Carapaça',centipede:'Glândula de Veneno'},
    totalXpForLevel(level){const n=Math.max(0,Number(level)-1);return Math.round(100*n+(100000000000-29900)*Math.pow(n/299,4));},
    xpForLevel(level){return Math.max(100,this.totalXpForLevel(level+1)-this.totalXpForLevel(level));},
    GRADIENTS:{SUPER:['#34e8fa','#f1ffff','#7972ff'],ABSOLUT:['#ffffff','#a4eaff','#ffa6df'],QUANTIUM:['#52a5ff','#7affdc','#d18aff'],ALEPH:['#ffcf51','#fffbd1','#ff93d8'],PRIMORDIAL:['#ffa1f2','#fff5a1','#9eeeff']},
    mobHealth(base,tier){return tier>=7 ? Math.ceil(Math.max(3000000,base/25*3000000)*Math.pow(4.5,tier-7)) : Math.ceil(base*Math.pow(2.2,tier)*(10+tier*6));},
    ability(name){return {
      'Matéria Vermelha':{name:'Ruptura rubra',color:'#ff6868',radius:380,mult:2.5,cooldown:10},
      Diamante:{name:'Prisma',color:'#8df4fa',radius:560,mult:3,cooldown:12},
      Void:{name:'Colapso',color:'#a47aff',radius:900,mult:3.5,cooldown:18},
      Solar:{name:'Explosão solar',color:'#ffe07c',radius:1250,mult:4,cooldown:16}
    }[name] || null;},
    oreRadius(name){return ORE_RADII[Math.max(0,NAMES.findIndex(n=>n.toUpperCase()===String(name).toUpperCase()))];},
    gardenOrePositionValid(x,y,radius,worldSize=100000){
      if(!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius) || radius<=0)return false;
      const margin=radius+100;
      return x>=margin && y>=margin && x<=worldSize-margin && y<=worldSize-margin && Math.hypot(x-worldSize/2,y-worldSize/2)>=radius+1500;
    },
    orePositionsOverlap(x,y,radius,other){
      return !!other?.rarity && Math.hypot(x-other.x,y-other.y)<radius+this.oreRadius(other.rarity.name)+70;
    }
  };
  if(typeof module!=='undefined' && module.exports)module.exports=catalog;
  else root.GAME_CATALOG=catalog;
})(typeof globalThis!=='undefined' ? globalThis : this);
