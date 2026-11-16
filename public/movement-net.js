(function(root){
 'use strict';
 function advance(state,input,dt,speed,move=(s,x,y)=>{s.x=x;s.y=y;}){
  let dx=input.dx || 0,dy=input.dy || 0;const length=Math.hypot(dx,dy);if(length>1){dx/=length;dy/=length;}
  const count=Math.max(1,Math.ceil(dt*60)),step=dt/count,decay=Math.exp(-9*step),tx=dx*speed,ty=dy*speed;
  for(let n=0;n<count;n++){
   const vx=state.vx || 0,vy=state.vy || 0,x=state.x+tx*step+(vx-tx)*(1-decay)/9,y=state.y+ty*step+(vy-ty)*(1-decay)/9;
   state.vx=tx+(vx-tx)*decay;state.vy=ty+(vy-ty)*decay;move(state,x,y);
  }
 }
 class Predictor{
  constructor(){this.reset();}
  reset(){this.pending=new Map();this.unsent=[];this.offsetX=0;this.offsetY=0;this.time=0;this.ack=0;}
  input(state,dx,dy,dt,speed,move){
   advance(state,{dx,dy},dt,speed,move);
   if(dx || dy || Math.hypot(state.vx,state.vy)>.01)this.unsent.push({dx,dy,dt});
   if(this.unsent.length>128)this.unsent.splice(0,this.unsent.length-128);
  }
  command(seq){const item={seq,steps:this.unsent.splice(0)};this.pending.set(seq,item);while(this.pending.size>24)this.pending.delete(this.pending.keys().next().value);return item;}
  batch(){return [...this.pending.values()].slice(0,12);}
  reconcile(state,self,serverTime,speed,move){
   if(!Number.isFinite(self.x) || !Number.isFinite(self.y) || serverTime<=this.time || self.seq<this.ack)return;
   this.time=serverTime;this.ack=self.seq;
   for(const seq of this.pending.keys())if(seq<=self.seq)this.pending.delete(seq);
   const visualX=state.x+this.offsetX,visualY=state.y+this.offsetY;
   state.x=self.x;state.y=self.y;state.vx=self.vx || 0;state.vy=self.vy || 0;
   for(const command of this.pending.values())for(const step of command.steps)advance(state,step,step.dt,speed,move);
   for(const step of this.unsent)advance(state,step,step.dt,speed,move);
   const dx=visualX-state.x,dy=visualY-state.y;
   if(Math.hypot(dx,dy)<250){this.offsetX=dx;this.offsetY=dy;}else this.offsetX=this.offsetY=0;
  }
  smooth(dt){const blend=Math.exp(-16*dt);this.offsetX*=blend;this.offsetY*=blend;if(Math.abs(this.offsetX)<.01)this.offsetX=0;if(Math.abs(this.offsetY)<.01)this.offsetY=0;}
 }
 const api={advance,Predictor};if(typeof module!=='undefined' && module.exports)module.exports=api;else root.MovementNet=api;
})(typeof globalThis!=='undefined' ? globalThis : this);
