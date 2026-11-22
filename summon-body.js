const {oreIndex,segmentCircleEntry}=require('./world-physics');
function move(world,ally,x,y){
 const start={x:ally.x,y:ally.y};world.game.moveEntity(ally,x,y,ally.size);
 const end={x:ally.x,y:ally.y},distance=Math.hypot(end.x-start.x,end.y-start.y);if(!distance)return;
 let first=1;for(const entry of oreIndex(world).query((start.x+end.x)/2,(start.y+end.y)/2,distance/2+ally.size+2)){
  const ore=entry.state;if(!ore||ore.hp<=0)continue;const radius=ally.size+ore.size;
  // Existing overlap must not trap an ally moving away from a rock.
  if(Math.hypot(start.x-ore.x,start.y-ore.y)<=radius&&Math.hypot(end.x-ore.x,end.y-ore.y)>Math.hypot(start.x-ore.x,start.y-ore.y))continue;
  const at=segmentCircleEntry(start.x,start.y,end.x,end.y,ore.x,ore.y,radius);if(at!==null)first=Math.min(first,at);
 }
 if(first<1){ally.x=start.x+(end.x-start.x)*first;ally.y=start.y+(end.y-start.y)*first;}
}
function targets(world,ally){
 const result=[],g=world.game;
 const touching=(entity,radius)=>{if(entity.hp<=0||Math.hypot(entity.x-ally.x,entity.y-ally.y)>ally.size+radius+1)return false;const p=g.surface(entity,ally);return g.lineClear(ally.x,ally.y,p.x,p.y);};
 for(const mob of g.mobs)if(touching(mob,mob.size*.8))result.push({entity:mob,isMob:true});
 for(const entry of oreIndex(world).query(ally.x,ally.y,ally.size+2)){const ore=entry.state;if(ore&&touching(ore,ore.size))result.push({entity:ore,isMob:false});}
 return result;
}
module.exports={move,targets};
