const atlas=require('./public/map-atlas'),catalog=require('./public/checkpoint-catalog');
const WINDOW=5*60*1000,LIMIT=3,STABLE=1500;
function normalize(raw,now=Date.now()){
 const value={version:1,realms:{}};for(const realm of Object.keys(atlas.LAYOUTS)){const cp=raw?.realms?.[realm];if(!cp)continue;const trail=[0];for(const tier of (Array.isArray(cp.trail)?cp.trail:[]).slice(-10))if(Number.isInteger(tier)&&tier>=1&&tier<=9&&!trail.includes(tier))trail.push(tier);const deaths=(Array.isArray(cp.deaths)?cp.deaths:[]).filter(t=>Number.isFinite(t)&&t>=now-WINDOW&&t<=now).slice(-LIMIT);const lock=cp.lock&&Number.isInteger(cp.lock.tier)&&cp.lock.tier>=1&&cp.lock.tier<=9&&Number.isFinite(cp.lock.until)&&cp.lock.until>now&&cp.lock.until<=now+WINDOW?{tier:cp.lock.tier,until:cp.lock.until}:null;value.realms[realm]={trail,deaths,lock};}return value;
}
function ensure(state,realm=state.realm||'garden',now=Date.now()){
 if(!state.checkpoints||state.checkpoints.version!==1)state.checkpoints=normalize(state.checkpoints,now);state.checkpoints.realms||={};return state.checkpoints.realms[realm]||=( {trail:[0],deaths:[],lock:null} );
}
function current(state,realm=state.realm||'garden'){const cp=ensure(state,realm);return catalog.place(realm,cp.trail.at(-1));}
function activate(state,realm,tier,now=Date.now()){
 if(!Number.isInteger(tier)||tier<0||tier>9)return null;const cp=ensure(state,realm,now);if(cp.lock&&cp.lock.until<=now)cp.lock=null;if(cp.trail.at(-1)===tier||cp.lock?.tier===tier)return null;const p=catalog.place(realm,tier);if(p.tier!==tier)return null;const index=cp.trail.indexOf(tier);cp.trail=index>=0?cp.trail.slice(0,index+1):[...cp.trail,tier].slice(-10);cp.deaths=[];return p;
}
function visit(actor,world,now=Date.now()){
 if(actor.inLobby||actor.state.dead)return null;const s=actor.state,region=atlas.at(world.realm,s.x,s.y);if(!region.open)return null;const id=world.realm+':'+region.tier;
 if(actor.checkpointCandidate?.id!==id){actor.checkpointCandidate={id,since:now};return null;}if(now-actor.checkpointCandidate.since<STABLE)return null;
 const p=activate(s,world.realm,region.tier,now);if(p){actor.socket.emit('checkpointActivated',{...p,message:'Checkpoint ativado: '+p.name});world.store.save(actor.profile);}return p;
}
function death(state,now=Date.now()){
 const cp=ensure(state,state.realm,now);cp.deaths=cp.deaths.filter(t=>t>=now-WINDOW&&t<=now);cp.deaths.push(now);let retreated=false;
 if(cp.deaths.length>=LIMIT){if(cp.trail.length>1){const tier=cp.trail.pop();cp.lock={tier,until:now+WINDOW};retreated=true;}cp.deaths=[];}
 return {place:current(state),retreated};
}
function summary(state,now=Date.now()){
 const cp=ensure(state,state.realm,now),p=current(state),deaths=cp.deaths.filter(t=>t>=now-WINDOW&&t<=now);return {...p,deaths:deaths.length,limit:LIMIT,windowSeconds:WINDOW/1000,retreatActive:!!cp.lock&&cp.lock.until>now,unlocked:[...cp.trail]};
}
function prepare(world,state){const p=current(state,world.realm);if(world.realm==='cave')world.game.carveChamber(p.x,p.y,650);return p;}
module.exports={normalize,ensure,current,activate,visit,death,summary,prepare,WINDOW,LIMIT,STABLE};
