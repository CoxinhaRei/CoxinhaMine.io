'use strict';
const jungleWorkshopTalk=document.createElement('button');jungleWorkshopTalk.id='jungle-workshop-talk';jungleWorkshopTalk.className='world-interact';jungleWorkshopTalk.hidden=true;jungleWorkshopTalk.textContent='[E] Conversar · Mestra das Raízes';document.body.append(jungleWorkshopTalk);
const jungleWorkshopStyle=document.createElement('style');jungleWorkshopStyle.textContent='#jungle-workshop-talk{bottom:184px;background:#efe4bd;border-color:#688456;color:#284434;min-height:44px}.mobile-mode #jungle-workshop-talk{bottom:262px;max-width:86vw}.mobile-mode #combat-workshop button{min-height:44px}';document.head.append(jungleWorkshopStyle);
async function talkToJungleWorkshop(){if(!nearJungleWorkshop())return;combatTab='upgrade';combatChoice='';await openCombatWorkshop();}
jungleWorkshopTalk.onclick=talkToJungleWorkshop;
document.addEventListener('keydown',event=>{if(typeof event.key!=='string'||event.key.toLowerCase()!=='e'||event.repeat||event.ctrlKey||event.metaKey||event.target.closest?.('input,textarea,select,dialog')||isUiBlocking()||!nearJungleWorkshop())return;event.preventDefault();talkToJungleWorkshop();});
const jungleWorkshopHudBefore=updateGameHud;updateGameHud=function(){jungleWorkshopHudBefore();jungleWorkshopTalk.hidden=!nearJungleWorkshop()||isUiBlocking();};
function drawJungleArtisan(npc){
 const c=ctx,time=performance.now()/1000;
 c.save();c.translate(npc.x,npc.y);
 // A compact workbench and a leaf shelter identify the peaceful workshop.
 c.fillStyle='#142c3150';c.beginPath();c.ellipse(17,57,140,39,0,0,Math.PI*2);c.fill();
 c.fillStyle='#9aa580';c.strokeStyle='#456347';c.lineWidth=4;c.beginPath();c.ellipse(0,40,159,76,0,0,Math.PI*2);c.fill();c.stroke();
 c.strokeStyle='#c9d9a0';c.lineWidth=2;c.setLineDash([8,14]);c.beginPath();c.ellipse(0,40,143,62,0,0,Math.PI*2);c.stroke();c.setLineDash([]);
 c.lineCap='round';c.lineJoin='round';
 c.strokeStyle='#4a412d';c.lineWidth=5;c.fillStyle='#96754b';c.fillRect(83,41,13,42);c.strokeRect(83,41,13,42);c.fillRect(158,41,13,42);c.strokeRect(158,41,13,42);c.fillStyle='#c2995b';c.fillRect(74,25,107,25);c.strokeRect(74,25,107,25);
 c.fillStyle='#6f8990';c.strokeStyle='#2d4b4f';c.beginPath();c.moveTo(100,12);c.lineTo(91,0);c.lineTo(152,0);c.lineTo(169,-13);c.lineTo(174,0);c.lineTo(151,14);c.lineTo(141,16);c.lineTo(145,25);c.lineTo(106,25);c.lineTo(113,17);c.closePath();c.fill();c.stroke();
 c.strokeStyle='#d9e9dc';c.lineWidth=2;c.beginPath();c.moveTo(99,3);c.lineTo(150,3);c.stroke();
 c.save();c.translate(150,-20);c.rotate(-.4);c.fillStyle='#95663e';c.strokeStyle='#4c4936';c.lineWidth=3;c.fillRect(-4,-4,8,36);c.strokeRect(-4,-4,8,36);c.fillStyle='#aec5c2';c.fillRect(-17,-16,34,15);c.strokeRect(-17,-16,34,15);c.restore();
 const pastry=c.createLinearGradient(-53,-90,53,69);pastry.addColorStop(0,'#ffe179');pastry.addColorStop(.45,'#f7ac31');pastry.addColorStop(1,'#cb7624');
 c.fillStyle='#885127';c.beginPath();c.ellipse(-12,62,58,16,0,0,Math.PI*2);c.fill();c.fillStyle=pastry;c.strokeStyle='#875523';c.lineWidth=5;c.beginPath();c.moveTo(-10,-102);c.bezierCurveTo(-18,-71,-70,-34,-69,17);c.bezierCurveTo(-68,82,45,88,49,22);c.bezierCurveTo(52,-24,6,-68,-10,-102);c.closePath();c.fill();c.stroke();
 c.strokeStyle='#ffe5a1';c.lineWidth=3;c.beginPath();c.moveTo(-16,-76);c.quadraticCurveTo(-42,-36,-49,-16);c.stroke();
 c.fillStyle='#3e7353';c.strokeStyle='#2d513b';c.lineWidth=4;c.beginPath();c.moveTo(-40,23);c.lineTo(20,23);c.lineTo(30,63);c.quadraticCurveTo(-10,80,-50,59);c.closePath();c.fill();c.stroke();c.fillStyle='#c9d5a2';c.fillRect(-29,39,36,18);c.strokeRect(-29,39,36,18);
 c.strokeStyle='#3e6341';c.lineWidth=4;c.beginPath();c.moveTo(-10,-75);c.quadraticCurveTo(18,-102,30,-88);c.quadraticCurveTo(26,-70,-10,-75);c.fillStyle='#85b965';c.fill();c.stroke();c.beginPath();c.moveTo(-6,-76);c.lineTo(22,-85);c.stroke();
 const aim=Math.atan2(player.y-npc.y,player.x-npc.x);for(const x of [-32,8]){c.fillStyle='#253839';c.beginPath();c.ellipse(x,-8,7,11,0,0,Math.PI*2);c.fill();c.fillStyle='#fff8d5';c.beginPath();c.arc(x+Math.cos(aim)*2-1,-11+Math.sin(aim)*2,2.5,0,Math.PI*2);c.fill();}
 c.strokeStyle='#694b2e';c.lineWidth=3;c.beginPath();c.arc(-12,8,10,.2,Math.PI-.2);c.stroke();
 if(settings.particles)for(let n=0;n<5;n++){const a=time*.4+n*Math.PI*.4;c.globalAlpha=.35+.35*Math.sin(time*2+n);c.fillStyle='#e1f5a0';c.beginPath();c.arc(Math.cos(a)*130,Math.sin(a)*45-25,2.5,0,Math.PI*2);c.fill();}c.restore();
 c.save();const z=Math.max(.3,cameraZoom());c.textAlign='center';c.lineJoin='round';c.lineWidth=3/z;c.strokeStyle='#244b39';c.font='700 '+14/z+'px Ubuntu';c.strokeText(npc.name,npc.x,npc.y-117);c.fillStyle='#fff3cb';c.fillText(npc.name,npc.x,npc.y-117);c.font='700 '+10/z+'px Ubuntu';c.strokeText(npc.title,npc.x,npc.y-117+17/z);c.fillStyle='#c9edb3';c.fillText(npc.title,npc.x,npc.y-117+17/z);c.restore();
}
const jungleWorkshopGroundBefore=drawGroundLoot;drawGroundLoot=function(){jungleWorkshopGroundBefore();if(multiplayer.workshop&&currentRealm==='jungle')drawJungleArtisan(multiplayer.workshop);};
