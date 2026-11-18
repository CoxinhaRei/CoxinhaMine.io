function renderPublicProfile155(p){
  profilePanel.querySelector('.public-profile')?.remove();profilePanel.classList.add('profile-redesign');
  const node=(tag,className,text)=>{const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;};
  const body=node('div','public-profile'),hero=node('section','profile-hero'),portrait=node('div','profile-portrait');
  for(const file of ['player_body.png','player_eyes.png']){const image=node('img');image.src='sprites/'+file;image.alt='';portrait.append(image);}
  portrait.setAttribute('aria-label','Coxinha de '+p.name);portrait.role='img';
  const identity=node('div','profile-identity');identity.append(node('small','profile-eyebrow','DIÁRIO DO AVENTUREIRO'),node('h2','',p.name),node('span','profile-level-badge','Nível '+p.level));
  const time=ItemDetails.number(Math.floor((p.playTimeMs||0)/3600000))+'h '+Math.floor((p.playTimeMs||0)%3600000/60000)+'m';
  identity.append(node('p','profile-playtime',time+' explorando este mundo'));hero.append(portrait,identity);body.append(hero);
  const xp=node('div','profile-xp'),progress=Math.max(0,Math.min(100,p.xp/Math.max(1,p.xpToNext)*100));
  xp.style.setProperty('--progress',progress+'%');xp.role='progressbar';xp.setAttribute('aria-label','Progresso para o próximo nível');xp.setAttribute('aria-valuenow',Math.round(progress));xp.setAttribute('aria-valuemin','0');xp.setAttribute('aria-valuemax','100');xp.append(node('b','',ItemDetails.number(p.xp)+' / '+ItemDetails.number(p.xpToNext)+' XP'),node('small','','Próximo nível: '+(p.level+1)));body.append(xp);
  const loadout=node('section','profile-section profile-gear-section');loadout.append(node('h3','','Equipamentos e acessórios'),node('p','profile-section-note','Passe o mouse ou toque nos drops e acessórios para ver os detalhes.'));
  const gear=node('div','profile-loadout');
  for(const [type,name] of Object.entries(p.gear)){const def=({weapon:SWORDS,armor:ARMORS,pickaxe:pickaxes})[type]?.find(d=>d.name===name);if(def)gear.append(expansionCard({...def,type},1));}
  for(let n=0;n<p.slots;n++){const ref=p.accessories[n];if(ref)gear.append(expansionCard(EXPANSION.accessory(ref.accessoryId,ref.rarity),1));else{const empty=node('span','profile-empty');empty.append(node('b','','+'),node('small','','Slot '+(n+1)));gear.append(empty);}}
  loadout.append(gear,node('p','profile-slot-summary',p.slots+' / 20 slots liberados'+(p.nextSlotLevel?' · próximo no nível '+p.nextSlotLevel:' · todos os slots liberados')));body.append(loadout);
  const overview=node('div','profile-overview'),statsSection=node('section','profile-section'),stats=node('div','profile-stats');statsSection.append(node('h3','','Sua jornada'));
  for(const [label,value,icon] of [['XP total',p.stats.xp,'✦'],['Minérios minerados',p.stats.mined,'◆'],['Pedras obtidas',p.stats.collected,'◈'],['Mobs derrotados',p.kills,'⚔'],['Crafts concluídos',p.stats.crafted,'✧'],['Itens perdidos em crafts',p.stats.destroyed,'◇']]){const card=node('div','profile-stat'),symbol=node('span','profile-stat-icon',icon),content=node('div');content.append(node('strong','',ItemDetails.number(value)),node('small','',label));card.append(symbol,content);stats.append(card);}
  statsSection.append(stats);const collection=node('section','profile-section profile-material-summary');collection.append(node('h3','','Coleção por raridade'));const chips=node('div','profile-rarity-list');
  let total=0;for(const rarity of EXPANSION.RARITIES){const amount=p.inventory[rarity]||0;if(!amount)continue;total+=amount;const chip=node('div','profile-rarity-chip');chip.style.setProperty('--rarity',rarities.find(r=>r.name===rarity)?.color||'#aaa');chip.append(node('b','',ItemDetails.number(amount)),node('span','',rarity));chips.append(chip);}
  if(!total)chips.append(node('p','profile-section-note','A coleção começa na sua próxima exploração.'));collection.append(node('p','profile-section-note',ItemDetails.number(total)+' itens guardados'),chips);overview.append(statsSection,collection);body.append(overview);
  const gallery=node('section','profile-section profile-gallery');gallery.append(node('h3','','Galeria de descobertas'),node('p','profile-section-note','Abates e minérios concluídos por raridade. Passe o mouse ou toque nas criaturas para ver vida, dano e descrição.'));renderCollectionMatrix(gallery,{killTiers:p.killTiers,oreTiers:p.oreTiers});body.append(gallery);profilePanel.append(body);
}
