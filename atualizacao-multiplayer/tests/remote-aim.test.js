const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),vm=require('node:vm');
test('remote avatar follows its own aim and attack, independently of the observer mouse',()=>{
  const html=fs.readFileSync(require('node:path').join(__dirname,'../public/index.html'),'utf8');
  const source=html.slice(html.indexOf('function drawPlayer('),html.indexOf('function saveGame('));
  const angles=[];const draw=new Proxy({}, {get:()=>()=>{}});
  const context=vm.createContext({Date,Math,ctx:draw,canvas:{width:1280,height:720},mouse:{x:1280,y:360},player:{size:20,equipment:{pickaxe:{}},selectedSlot:2},playerBodyImg:{complete:true,naturalWidth:128},playerEyesImg:{complete:true,naturalWidth:128},drawPlayerArmor(){},drawDeadPlayer(){},getRemoteEquipment:()=>({}),drawHeldEquipment:(_item,_x,_y,angle,local)=>angles.push({angle,local})});
  vm.runInContext(source,context);
  vm.runInContext(`const other={size:20,aimAngle:Math.PI/2};drawPlayer(500,400,other);mouse.x=0;drawPlayer(500,400,other);drawPlayer(500,400,player);`,context);
  assert.equal(angles[0].angle,Math.PI/2);assert.equal(angles[1].angle,Math.PI/2);assert.equal(angles[0].local,false);assert.equal(angles[2].angle,Math.PI);assert.equal(angles[2].local,true);
});
