class SpatialIndex{
  constructor(cell=400){this.cell=cell;this.cells=new Map();this.large=[];}
  insert(body){
    const r=body.radius || 0;if(r>1600){this.large.push(body);return;}
    for(let x=Math.floor((body.x-r)/this.cell);x<=Math.floor((body.x+r)/this.cell);x++)for(let y=Math.floor((body.y-r)/this.cell);y<=Math.floor((body.y+r)/this.cell);y++){
      const key=x+','+y;if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(body);
    }
  }
  query(x,y,r){const found=new Set(this.large);for(let ix=Math.floor((x-r)/this.cell);ix<=Math.floor((x+r)/this.cell);ix++)for(let iy=Math.floor((y-r)/this.cell);iy<=Math.floor((y+r)/this.cell);iy++)for(const body of this.cells.get(ix+','+iy) || [])found.add(body);return found;}
}
function oreIndex(world){
  const g=world.game;
  if(world.physicsOres!==g.ores || world.physicsOreCount!==g.ores.length){world.physicsOres=g.ores;world.physicsOreCount=g.ores.length;world.oreIndex=new SpatialIndex();world.oreCellCounts=new Map();for(const ore of g.ores){world.oreIndex.insert({id:ore.id,x:ore.x,y:ore.y,radius:ore.size,rarity:ore.rarity});const cell=Math.floor(ore.x/600)+','+Math.floor(ore.y/600);world.oreCellCounts.set(cell,(world.oreCellCounts.get(cell) || 0)+1);}}
  return world.oreIndex;
}
function movePlayerBody(world,state,x,y){
  world.game.moveEntity(state,x,y,20);
  for(const ore of oreIndex(world).query(state.x,state.y,20)){
    const dx=state.x-ore.x,dy=state.y-ore.y,d=Math.hypot(dx,dy),minimum=20+ore.radius;
    if(d<minimum)world.game.moveEntity(state,ore.x+(d ? dx/d : 1)*(minimum+.1),ore.y+(d ? dy/d : 0)*(minimum+.1),20);
  }
}
function resolveWorldCollisions(world,actors){
  const g=world.game;oreIndex(world);
  const relevant=g.mobs.filter(m=>actors.some(a=>Math.hypot(a.state.x-m.x,a.state.y-m.y)<Math.max(3000,a.viewRadius || 3000)+m.size));
  const bodies=[...actors.map(a=>({id:'p:'+a.profile.id,x:a.state.x,y:a.state.y,radius:20,state:a.state})),...relevant.map(m=>({id:'m:'+m.id,x:m.x,y:m.y,radius:m.size*.7,state:m}))],index=new SpatialIndex();
  for(const body of bodies)index.insert(body);
  for(const body of bodies){
    for(const ore of world.oreIndex.query(body.state.x,body.state.y,body.radius)){
      const dx=body.state.x-ore.x,dy=body.state.y-ore.y,d=Math.hypot(dx,dy),minimum=body.radius+ore.radius;
      if(d<minimum){const nx=d ? dx/d : 1,ny=d ? dy/d : 0;g.moveEntity(body.state,ore.x+nx*(minimum+.1),ore.y+ny*(minimum+.1),body.radius);}
    }
    for(const other of index.query(body.state.x,body.state.y,body.radius)){
      if(body.id>=other.id)continue;const dx=body.state.x-other.state.x,dy=body.state.y-other.state.y,d=Math.hypot(dx,dy),minimum=body.radius+other.radius;if(d>=minimum)continue;
      const nx=d ? dx/d : 1,ny=d ? dy/d : 0,overlap=minimum-d+.1,massA=body.radius*body.radius,massB=other.radius*other.radius,share=massB/(massA+massB);
      g.moveEntity(body.state,body.state.x+nx*overlap*share,body.state.y+ny*overlap*share,body.radius);
      g.moveEntity(other.state,other.state.x-nx*overlap*(1-share),other.state.y-ny*overlap*(1-share),other.radius);
    }
  }
}
function segmentHitsCircle(ax,ay,bx,by,x,y,radius){const dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy,t=length ? Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/length)) : 0;return (ax+dx*t-x)**2+(ay+dy*t-y)**2<radius*radius;}
module.exports={SpatialIndex,resolveWorldCollisions,segmentHitsCircle,movePlayerBody,oreIndex};
