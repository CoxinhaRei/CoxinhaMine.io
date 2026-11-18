(function(root){
 'use strict';
 class MenuTour{
  constructor(points,random=Math.random){this.points=points;this.random=random;this.realm=null;this.elapsed=0;this.sceneTime=0;this.last=null;this.index=null;this.bag=[];this.duration=18000;this.fade=2200;this.reduced=false;}
  choose(){
   if(!this.bag.length){this.bag=this.points[this.realm].map((_,i)=>i);for(let i=this.bag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]];}if(this.bag.length>1&&this.bag[0]===this.index)[this.bag[0],this.bag[1]]=[this.bag[1],this.bag[0]];}
   this.index=this.bag.shift();
  }
  select(realm){if(this.realm===realm)return;this.realm=realm;this.elapsed=0;this.sceneTime=0;this.last=null;this.index=null;this.bag=[];this.choose();}
  step(now,visible,reduced=false){this.reduced=reduced;if(!visible){this.last=null;return;}if(this.last!==null&&!reduced){const dt=Math.max(0,Math.min(100,now-this.last));this.elapsed+=dt;this.sceneTime+=dt;while(this.sceneTime>=this.duration){this.sceneTime-=this.duration;this.choose();}}this.last=now;}
  frame(){const point=this.points[this.realm][this.index],ms=this.sceneTime,fade=this.fade/2,opacity=this.reduced?1:Math.max(0,Math.min(1,ms/fade,(this.duration-ms)/fade));return {index:this.index,primary:{point,x:point.x+Math.sin(ms/18000*.95-.6)*320,y:point.y+Math.sin(ms/18000*.8)*110,time:ms},blackout:1-opacity,elapsed:this.elapsed};}
 }
 if(typeof module!=='undefined'&&module.exports)module.exports=MenuTour;else root.MenuTour=MenuTour;
})(typeof globalThis!=='undefined'?globalThis:this);
