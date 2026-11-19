(function(root){
 'use strict';
 const mobMass=size=>Math.max(1,Math.pow(Math.max(1,Number(size)||1)*.7,2));
 const oreMass=size=>Math.max(1,Math.pow(Math.max(1,Number(size)||1),2)*.9);
 function contact(a,ra,ma,b,rb,mb){const dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy),overlap=ra+rb-d;if(overlap<=0)return null;return {nx:d?dx/d:1,ny:d?dy/d:0,overlap:overlap+.05,share:mb/(ma+mb)};}
 function mass(body,type='mob'){if(Number.isFinite(body.mass)&&body.mass>0)return body.mass;return type==='player'?400:type==='ore'?oreMass(body.size):mobMass(body.size);}
 const api={mobMass,oreMass,mass,contact};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BODY_PHYSICS=api;
})(typeof globalThis!=='undefined'?globalThis:this);
