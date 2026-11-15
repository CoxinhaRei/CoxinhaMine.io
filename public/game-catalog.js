(function(root){
  // Radius in world units. PRIMORDIAL's diameter is half the garden's width.
  const ORE_RADII=[18,24,32,44,58,76,110,320,1500,4500,10000,25000];
  const NAMES=['Comum','Incomum','Raro','Épico','Lendário','Mítico','ULTRA','SUPER','ABSOLUT','QUANTIUM','ALEPH','PRIMORDIAL'];
  const PRIMORDIAL={name:'PRIMORDIAL',color:'#ffc5f7',hp:1e12,mult:160000,adminOnly:true};
  const catalog={
    ORE_RADII,NAMES,PRIMORDIAL,
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
