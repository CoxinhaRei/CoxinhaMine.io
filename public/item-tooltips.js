// One shared tooltip, event delegation and no per-frame inventory scans.
const itemTooltip155=document.createElement('aside');itemTooltip155.id='item-tooltip155';itemTooltip155.role='tooltip';itemTooltip155.hidden=true;document.body.append(itemTooltip155);
const itemTipBindings155=new WeakMap();let itemTipOwner155=null,itemTipTimer155=0,itemTipTouch155=null,itemTipWorldAt155=0;
function bindItemTooltip(element,item){if(!element||!['accessory','component','material','mob'].includes(item?.type))return;itemTipBindings155.set(element,item);element.dataset.itemTooltip='true';element.removeAttribute('title');if(!element.hasAttribute('tabindex')&&element.tagName!=='BUTTON')element.tabIndex=0;}
function describeItem155(item){return ItemDetails.describe(item,{state:typeof player==='undefined'?undefined:player,expansion:EXPANSION,catalog:GAME_CATALOG,creatures:CREATURES,rarities,oreValues:ORE_VALUES,abilities:SPECIAL_MOB_ABILITIES});}
function hideItemTooltip155(){clearTimeout(itemTipTimer155);itemTipOwner155?.removeAttribute('aria-describedby');itemTipOwner155=null;itemTooltip155.hidden=true;}
function showItemTooltip155(item,owner,x,y,touch=false){
  const info=describeItem155(item);if(!info)return;
  clearTimeout(itemTipTimer155);if(itemTipOwner155!==owner)itemTipOwner155?.removeAttribute('aria-describedby');itemTipOwner155=owner;owner?.setAttribute('aria-describedby',itemTooltip155.id);
  itemTooltip155.replaceChildren();itemTooltip155.dataset.touch=String(touch);itemTooltip155.style.setProperty('--tip-rarity',info.color);
  const head=document.createElement('header'),image=document.createElement('img');
  if(item.type==='mob'){const c=document.createElement('canvas');c.width=c.height=70;drawCreatureModel(item.kind,c.getContext('2d'),35,35,24);image.src=c.toDataURL();}else image.src=itemPreview(item)||'';
  image.alt='';const text=document.createElement('div'),name=document.createElement('h3'),rarity=document.createElement('b');name.textContent=info.name;rarity.className='tip-rarity';rarity.textContent=info.rarity;text.append(name,rarity);head.append(image,text);
  const type=document.createElement('small'),description=document.createElement('p'),stats=document.createElement('dl');type.textContent=info.kind;description.textContent=info.description;
  for(const [label,value] of info.rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;stats.append(dt,dd);}
  itemTooltip155.append(head,type,description,stats);if(info.note){const note=document.createElement('p');note.className='tip-note';note.textContent=info.note;itemTooltip155.append(note);}
  itemTooltip155.hidden=false;itemTooltip155.style.left='0px';itemTooltip155.style.top='0px';
  const rect=itemTooltip155.getBoundingClientRect(),gap=14,left=Math.max(10,Math.min(innerWidth-rect.width-10,x+gap)),top=y+gap+rect.height<innerHeight-10?y+gap:Math.max(10,y-rect.height-gap);
  itemTooltip155.style.left=left+'px';itemTooltip155.style.top=top+'px';if(touch)itemTipTimer155=setTimeout(hideItemTooltip155,6500);
}
function tooltipSource155(target){return target instanceof Element?target.closest('[data-item-tooltip]'):null;}
document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const source=tooltipSource155(e.target);if(source&&source!==itemTipOwner155)showItemTooltip155(itemTipBindings155.get(source),source,e.clientX,e.clientY);});
document.addEventListener('pointerout',e=>{if(e.pointerType!=='touch'&&itemTipOwner155&&tooltipSource155(e.target)===itemTipOwner155&&!itemTipOwner155.contains(e.relatedTarget))hideItemTooltip155();});
document.addEventListener('focusin',e=>{const source=tooltipSource155(e.target);if(source){const r=source.getBoundingClientRect();showItemTooltip155(itemTipBindings155.get(source),source,r.left,r.top);}});
document.addEventListener('focusout',()=>{if(!itemTipTouch155)hideItemTooltip155();});
document.addEventListener('pointerdown',e=>{if(itemTooltip155.contains(e.target)){clearTimeout(itemTipTimer155);itemTipTimer155=setTimeout(hideItemTooltip155,10000);return;}if(e.pointerType!=='touch'){if(!tooltipSource155(e.target))hideItemTooltip155();return;}hideItemTooltip155();const source=tooltipSource155(e.target);itemTipTouch155={id:e.pointerId,x:e.clientX,y:e.clientY,item:source?itemTipBindings155.get(source):null,owner:source,moved:false};},true);
document.addEventListener('pointermove',e=>{const t=itemTipTouch155;if(t?.id===e.pointerId&&Math.hypot(e.clientX-t.x,e.clientY-t.y)>10){t.moved=true;clearTimeout(t.hold);hideItemTooltip155();}},true);
document.addEventListener('pointerup',e=>{const t=itemTipTouch155;if(!t||t.id!==e.pointerId)return;clearTimeout(t.hold);setTimeout(()=>{if(itemTipTouch155!==t)return;itemTipTouch155=null;if(!t.moved&&t.item)showItemTooltip155(t.item,t.owner,e.clientX,e.clientY,true);},0);},true);
document.addEventListener('pointercancel',()=>{clearTimeout(itemTipTouch155?.hold);itemTipTouch155=null;hideItemTooltip155();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideItemTooltip155();},true);
window.addEventListener('blur',hideItemTooltip155);window.addEventListener('resize',hideItemTooltip155);document.addEventListener('scroll',e=>{if(e.target!==itemTooltip155)hideItemTooltip155();},true);document.addEventListener('visibilitychange',hideItemTooltip155);
function worldTooltipItem155(e){
  if(menuVisible()||player.dead||inventoryOpen||shopOpen||craftOpen||talentsOpen||extraPanel)return null;
  const r=canvas.getBoundingClientRect(),pos=renderedPlayerPosition(),z=cameraZoom(),x=pos.x+((e.clientX-r.left)*canvas.width/r.width-canvas.width/2)/z,y=pos.y+((e.clientY-r.top)*canvas.height/r.height-canvas.height/2)/z;
  const drop=(multiplayer.drops||[]).find(d=>Math.hypot(d.x-x,d.y-y)<25);if(drop)return drop.item;
  const mob=mobs.find(m=>Math.hypot(m.x-x,m.y-y)<m.size);return mob?{...mob,type:'mob'}:null;
}
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||performance.now()-itemTipWorldAt155<100)return;itemTipWorldAt155=performance.now();const item=worldTooltipItem155(e);if(item)showItemTooltip155(item,canvas,e.clientX,e.clientY);else if(itemTipOwner155===canvas)hideItemTooltip155();});
canvas.addEventListener('pointerleave',()=>{if(!itemTipTouch155)hideItemTooltip155();});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;const t=itemTipTouch155;if(t)t.hold=setTimeout(()=>{if(!t.moved){t.item=worldTooltipItem155(e);t.owner=canvas;if(t.item)showItemTooltip155(t.item,canvas,e.clientX,e.clientY,true);}},450);});
