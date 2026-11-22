(function(root){
 'use strict';
 const mobMass=size=>Math.max(1,Math.pow(Math.max(1,Number(size)||1)*.7,2));
 const oreMass=size=>Math.max(1,Math.pow(Math.max(1,Number(size)||1),2)*.9);
 function contact(a,ra,ma,b,rb,mb){const dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy),overlap=ra+rb-d;if(overlap<=0)return null;return {nx:d?dx/d:1,ny:d?dy/d:0,overlap:overlap+.05,share:mb/(ma+mb)};}
 function mass(body,type='mob'){if(Number.isFinite(body.mass)&&body.mass>0)return body.mass;return type==='player'?400:type==='ore'?oreMass(body.size):mobMass(body.size);}
 function segmentCircleEntry(ax,ay,bx,by,x,y,radius){const fx=ax-x,fy=ay-y,c=fx*fx+fy*fy-radius*radius;if(c<=0)return 0;const dx=bx-ax,dy=by-ay,a=dx*dx+dy*dy;if(!a)return null;const b=2*(fx*dx+fy*dy),discriminant=b*b-4*a*c;if(discriminant<0)return null;const t=(-b-Math.sqrt(discriminant))/(2*a);return t>=0&&t<=1?t:null;}
 const api={segmentCircleEntry,mobMass,oreMass,mass,contact};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BODY_PHYSICS=api;
})(typeof globalThis!=='undefined'?globalThis:this);
