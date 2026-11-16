function rarityPaint(rarity,x,y,width,brush=ctx){
  const colors=GAME_CATALOG.GRADIENTS[rarity?.name];if(!colors)return rarity?.color || '#fff';
  const gradient=brush.createLinearGradient(x,y,x+Math.max(1,width),y+Math.max(1,width)*.3);
  if(!gradient?.addColorStop)return rarity.color;
  colors.forEach((color,index)=>gradient.addColorStop(index/(colors.length-1),color));return gradient;
}
function decorateRarity(element,index){
  const rarity=rarities[index],colors=GAME_CATALOG.GRADIENTS[rarity?.name];
  element.classList.add('rarity-card');element.style.setProperty('--item-color',rarity?.color || '#93bf79');element.style.setProperty('--card-fill',rarity?.color || '#93bf79');
  if(colors){element.classList.add('rare-gradient');element.style.setProperty('--rare-gradient','linear-gradient(125deg,'+colors.join(',')+')');element.style.setProperty('--rare-light',rarity.color);}
}
function drawEnhancedAbility(effect){
  const progress=Math.max(0,Math.min(1,1-effect.life/effect.maxLife)),radius=Math.max(1,effect.radius*progress),color=effect.color || '#c5ffff';
  ctx.save();ctx.translate(effect.x,effect.y);ctx.globalAlpha=1-progress;
  const halo=ctx.createRadialGradient(0,0,radius*.6,0,0,radius);
  halo.addColorStop(0,color+'00');halo.addColorStop(.85,color+'30');halo.addColorStop(1,color+'00');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();
  ctx.shadowColor=color;ctx.shadowBlur=18;ctx.strokeStyle=color;
  for(let ring=0;ring<3;ring++){ctx.lineWidth=5-ring;ctx.globalAlpha=(1-progress)*(1-ring*.2);ctx.beginPath();ctx.arc(0,0,Math.max(1,radius-ring*24),0,Math.PI*2);ctx.stroke();}
  const rays=effect.name==='Colapso' ? 16 : 12;
  for(let n=0;n<rays;n++){
    const angle=n*Math.PI*2/rays+progress*(effect.name==='Colapso' ? -1.4 : .6),outer=radius*(.8+.2*Math.sin(n*3+progress*7));
    ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(Math.cos(angle)*outer*.7,Math.sin(angle)*outer*.7);ctx.lineTo(Math.cos(angle)*outer,Math.sin(angle)*outer);ctx.stroke();
    const sx=Math.cos(angle)*outer,sy=Math.sin(angle)*outer;ctx.fillStyle='#fffce5';ctx.beginPath();ctx.moveTo(sx,sy-7);ctx.lineTo(sx+3,sy);ctx.lineTo(sx,sy+7);ctx.lineTo(sx-3,sy);ctx.closePath();ctx.fill();
  }
  ctx.restore();return true;
}
const presentationStyle=document.createElement('style');
presentationStyle.textContent=`
  .rare-gradient{background-image:linear-gradient(#396f6fbb,#396f6fbb),var(--rare-gradient)!important;background-origin:padding-box,border-box;background-clip:padding-box,border-box;border-color:transparent!important;box-shadow:0 0 9px var(--rare-light),inset 0 0 12px #ffffff22;}
  .rare-gradient small{color:#fff!important;text-shadow:0 1px 2px #233;}
  #network-status{position:fixed;bottom:3px;right:10px;z-index:4;color:#d6f6d4;font:bold 10px 'Trebuchet MS';text-shadow:1px 1px #243a2b;pointer-events:none;}
  #network-notice{position:fixed;z-index:12;left:50%;top:88px;transform:translateX(-50%);max-width:85vw;padding:9px 16px;background:#274f40ed;color:#fff3bd;border:2px solid #a7cf8b;border-radius:7px;font:bold 13px 'Trebuchet MS';text-align:center;pointer-events:none;animation:notice-enter .22s ease-out;}
  #boss-participation{display:block;color:#d4fbef;font-size:11px;margin-top:4px;}
  .panel-exit-ghost{pointer-events:none!important;z-index:20!important;}
  .save-tools{border-top:2px solid #4d809b;padding-top:10px;margin-top:16px}.save-tools h2{font-size:16px}.save-tools p{font-size:12px;line-height:1.5}.save-tools button,.save-import{display:inline-block;padding:9px;background:#466e62;border:2px solid #b7dec2;border-radius:4px;color:#fff;cursor:pointer}.save-import input{display:block;max-width:240px;margin-top:8px}
  @keyframes notice-enter{from{opacity:0;translate:0 15px}to{opacity:1;translate:0 0}}
  @media(prefers-reduced-motion:reduce){#network-notice{animation:none}}
`;
document.head.append(presentationStyle);
const panelBounds=new WeakMap(),panelHidden=new WeakMap();
const transitionPanels=[...document.querySelectorAll('.garden-panel,.death-curtain')];
for(const panel of transitionPanels){
  panelHidden.set(panel,panel.hidden);
  new MutationObserver(()=>{
    const wasHidden=panelHidden.get(panel);if(wasHidden===panel.hidden)return;panelHidden.set(panel,panel.hidden);
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    if(!panel.hidden){
      panelBounds.set(panel,panel.getBoundingClientRect());
      if(panel.classList.contains('garden-panel'))panel.animate([{opacity:0,transform:'translate(-50%,-42%)'},{opacity:1,transform:'translate(-50%,-50%)'}],{duration:230,easing:'cubic-bezier(.2,.7,.2,1)'});
      else panel.animate([{opacity:0},{opacity:1}],{duration:200});
    }else{
      const box=panelBounds.get(panel);if(!box?.width)return;
      const ghost=panel.cloneNode(true);ghost.hidden=false;ghost.setAttribute('aria-hidden','true');ghost.classList.add('panel-exit-ghost');ghost.removeAttribute('id');
      for(const child of ghost.querySelectorAll('[id]'))child.removeAttribute('id');
      Object.assign(ghost.style,{position:'fixed',top:box.top+'px',left:box.left+'px',width:box.width+'px',height:box.height+'px',maxHeight:'none',transform:'none',margin:0});document.body.append(ghost);
      ghost.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(22px)'}],{duration:160,easing:'ease-in',fill:'forwards'}).finished.finally(()=>ghost.remove());
    }
  }).observe(panel,{attributes:true,attributeFilter:['hidden']});
}
const participationLabel=document.createElement('small');participationLabel.id='boss-participation';bossBar.append(participationLabel);
