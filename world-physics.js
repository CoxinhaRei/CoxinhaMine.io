const checkpointCatalog=require('./public/checkpoint-catalog');
const physics=require('./public/body-physics'),atlas=require('./public/map-atlas'),expansion=require('./public/expansion');
class SpatialIndex{
  constructor(cell=400){this.cell=cell;this.cells=new Map();this.large=new Set();this.bodies=new Set();this.buckets=new WeakMap();}
  insert(body){
    this.bodies.add(body);const keys=[],r=body.radius || 0;if(r>1600){this.large.add(body);this.buckets.set(body,keys);return;}
    for(let x=Math.floor((body.x-r)/this.cell);x<=Math.floor((body.x+r)/this.cell);x++)for(let y=Math.floor((body.y-r)/this.cell);y<=Math.floor((body.y+r)/this.cell);y++){
      const key=x+','+y;if(!this.cells.has(key))this.cells.set(key,new Set());this.cells.get(key).add(body);keys.push(key);
    }
    this.buckets.set(body,keys);
  }
  update(body){for(const key of this.buckets.get(body)||[]){const cell=this.cells.get(key);cell?.delete(body);if(!cell?.size)this.cells.delete(key);}this.large.delete(body);this.insert(body);}
  query(x,y,r){const found=new Set(this.large);if(r>1600){for(const body of this.bodies)if(Math.abs(body.x-x)<=r+body.radius&&Math.abs(body.y-y)<=r+body.radius)found.add(body);return found;}for(let ix=Math.floor((x-r)/this.cell);ix<=Math.floor((x+r)/this.cell);ix++)for(let iy=Math.floor((y-r)/this.cell);iy<=Math.floor((y+r)/this.cell);iy++)for(const body of this.cells.get(ix+','+iy) || [])found.add(body);return found;}
}
function oreIndex(world){
  const g=world.game;
  if(world.physicsOres!==g.ores || world.physicsOreCount!==g.ores.length){world.physicsOres=g.ores;world.physicsOreCount=g.ores.length;world.oreIndex=new SpatialIndex();world.oreCellCounts=new Map();for(const ore of g.ores){world.oreIndex.insert({id:ore.id,x:ore.x,y:ore.y,radius:ore.size,rarity:ore.rarity,state:ore});const cell=Math.floor(ore.x/600)+','+Math.floor(ore.y/600);world.oreCellCounts.set(cell,(world.oreCellCounts.get(cell) || 0)+1);}}
  return world.oreIndex;
}
function moveOre(world,entry,x,y){
  const ore=entry.state;if(!ore)return;const before={x:ore.x,y:ore.y},radius=ore.size,realm=world.realm||'garden',map=expansion.mapFor(realm),home=atlas.spawn(realm),portals=expansion.portalsFor(realm);
  function allowed(nx,ny){
    if(!Number.isFinite(nx)||!Number.isFinite(ny)||nx<radius||ny<radius||nx>map.w-radius||ny>map.h-radius)return false;
    if(realm==='cave'?world.game.wall(nx,ny,radius):atlas.blocked(realm,nx,ny,radius))return false;
    if(realm!=='cave'&&Math.hypot(nx-home.x,ny-home.y)<radius+1350)return false;
    if(!checkpointCatalog.clear(realm,nx,ny,radius+100))return false;
    for(const portal of portals)if(Math.hypot(nx-portal.x,ny-portal.y)<radius+portal.r+120)return false;
    for(const other of world.oreIndex.query(nx,ny,radius)){if(other.id===ore.id)continue;const min=radius+other.radius-.01,old=Math.hypot(ore.x-other.x,ore.y-other.y),next=Math.hypot(nx-other.x,ny-other.y);if(next<min&&next<old-.0001)return false;}
    return true;
  }
  const steps=Math.max(1,Math.ceil(Math.hypot(x-ore.x,y-ore.y)/Math.max(8,Math.min(40,radius*.5)))),dx=(x-ore.x)/steps,dy=(y-ore.y)/steps;
  for(let n=0;n<Math.min(16,steps);n++){if(allowed(ore.x+dx,ore.y+dy)){ore.x+=dx;ore.y+=dy;}else{if(allowed(ore.x+dx,ore.y))ore.x+=dx;if(allowed(ore.x,ore.y+dy))ore.y+=dy;}}
  if(Math.hypot(ore.x-before.x,ore.y-before.y)>.000001){
    const oldKey=Math.floor(before.x/600)+','+Math.floor(before.y/600),newKey=Math.floor(ore.x/600)+','+Math.floor(ore.y/600);
    if(oldKey!==newKey){world.oreCellCounts.set(oldKey,Math.max(0,(world.oreCellCounts.get(oldKey)||0)-1));world.oreCellCounts.set(newKey,(world.oreCellCounts.get(newKey)||0)+1);}
    entry.x=ore.x;entry.y=ore.y;world.oreIndex.update(entry);world.oreRevision=(world.oreRevision||0)+1;
  }
}
function resolveOreContact(world,state,radius,mass){
  for(const entry of oreIndex(world).query(state.x,state.y,radius)){
    const ore=entry.state||entry,c=physics.contact(state,radius,mass,ore,entry.radius,physics.oreMass(entry.radius));if(!c)continue;
    const before={x:ore.x,y:ore.y},push=Math.min(40,c.overlap*(1-c.share));moveOre(world,entry,ore.x-c.nx*push,ore.y-c.ny*push);
    const shifted=Math.max(0,(before.x-ore.x)*c.nx+(before.y-ore.y)*c.ny),remaining=Math.max(0,c.overlap-shifted);world.game.moveEntity(state,state.x+c.nx*remaining,state.y+c.ny*remaining,radius);
  }
}
function movePlayerBody(world,state,x,y){
  const radius=state.size||20;world.game.moveEntity(state,x,y,radius);
  resolveOreContact(world,state,radius,400*(radius/20)**2);
}
function syncPlayerBody(world,state){
  const radius=require('./public/game-catalog').playerRadius(world.game.utility(state).size);if(state.size===radius)return;
  const blocked=(x,y)=>world.realm==='cave'?world.game.wall(x,y,radius):atlas.blocked(world.realm,x,y,radius);
  if(blocked(state.x,state.y)){
    let spot=null;for(let distance=10;distance<=180&&!spot;distance+=10)for(let n=0;n<16;n++){const angle=n*Math.PI/8,x=state.x+Math.cos(angle)*distance,y=state.y+Math.sin(angle)*distance;if(!blocked(x,y)){spot={x,y};break;}}
    if(!spot)return;state.x=spot.x;state.y=spot.y;
  }
  state.size=radius;
}
function resolveWorldCollisions(world,actors){
  const g=world.game;oreIndex(world);
  const relevant=g.mobs.filter(m=>actors.some(a=>Math.hypot(a.state.x-m.x,a.state.y-m.y)<Math.max(3000,a.viewRadius || 3000)+m.size));
  const bodies=[...actors.map(a=>({id:'p:'+a.profile.id,x:a.state.x,y:a.state.y,radius:a.state.size||20,mass:400*((a.state.size||20)/20)**2,player:true,state:a.state})),...relevant.map(m=>({id:'m:'+m.id,x:m.x,y:m.y,radius:m.size*.7,mass:physics.mass(m),state:m})),...(world.arcana?.allies||[]).filter(m=>m.hp>0).map(m=>({id:'a:'+m.id,x:m.x,y:m.y,radius:m.size,mass:physics.mass(m),ally:true,state:m}))],index=new SpatialIndex();
  for(const body of bodies)index.insert(body);
  for(const body of bodies){
    resolveOreContact(world,body.state,body.radius,body.mass);
    for(const other of index.query(body.state.x,body.state.y,body.radius)){
      if((body.player&&world.safe?.(body.state))||(other.player&&world.safe?.(other.state))||body.id>=other.id||(body.ally&&other.player)||(body.player&&other.ally))continue;const c=physics.contact(body.state,body.radius,body.mass,other.state,other.radius,other.mass);if(!c)continue;
      g.moveEntity(body.state,body.state.x+c.nx*c.overlap*c.share,body.state.y+c.ny*c.overlap*c.share,body.radius);
      g.moveEntity(other.state,other.state.x-c.nx*c.overlap*(1-c.share),other.state.y-c.ny*c.overlap*(1-c.share),other.radius);
      other.x=other.state.x;other.y=other.state.y;index.update(other);
    }
    body.x=body.state.x;body.y=body.state.y;index.update(body);
  }
}
function segmentHitsCircle(ax,ay,bx,by,x,y,radius){const dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy,t=length ? Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/length)) : 0;return (ax+dx*t-x)**2+(ay+dy*t-y)**2<radius*radius;}
function segmentCircleEntry(ax,ay,bx,by,x,y,radius){const fx=ax-x,fy=ay-y,c=fx*fx+fy*fy-radius*radius;if(c<=0)return 0;const dx=bx-ax,dy=by-ay,a=dx*dx+dy*dy;if(!a)return null;const b=2*(fx*dx+fy*dy),discriminant=b*b-4*a*c;if(discriminant<0)return null;const t=(-b-Math.sqrt(discriminant))/(2*a);return t>=0&&t<=1?t:null;}
module.exports={SpatialIndex,resolveWorldCollisions,segmentHitsCircle,segmentCircleEntry,moveOre,movePlayerBody,syncPlayerBody,oreIndex,resolveOreContact};
