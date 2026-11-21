(function(root){
  'use strict';
  const labels={speed:'Velocidade',mining:'Poder de mineração',damage:'Dano',vision:'Iluminação',zoom:'Campo de visão',haste:'Velocidade de ataque',defense:'Redução de dano',health:'Vida máxima',regen:'Regeneração',vampirism:'Vampirismo',xp:'XP recebido',range:'Alcance',pickup:'Raio de coleta',slowResist:'Resistência à lentidão'};
  const percent=new Set(['speed','mining','damage','zoom','haste','defense','vampirism','xp','slowResist']);
  const descriptions={guardian:'Uma sentinela de pedra que protege os veios e as profundezas.',ladybug:'Patrulha as flores do jardim. Revida quando é atacada.',bee:'Voa entre as flores e protege seu espaço com um ferrão afiado.',ant:'Pequena trabalhadora de mandíbulas fortes.',spider:'Caçadora hostil que espreita o jardim e a selva.',beetle:'Sua carapaça resistente protege um corpo pesado.',centipede:'Uma criatura comprida que guarda veneno em suas glândulas.',crab:'Defende a costa com suas grandes pinças.',hermit:'Carrega uma concha espiral como abrigo.',turtle:'Uma habitante tranquila da praia com escamas resistentes.',mantis:'Predador da selva com lâminas rápidas.',dragonfly:'Cruza a selva com asas leves e prismáticas.',frog:'Habita as lagoas e guarda gotas de orvalho.',icebeetle:'Sua carapaça glacial resiste ao frio das florestas.',snowmoth:'Uma mariposa de asas cobertas de pó lunar.',iceTornado:'Um redemoinho vivo que espalha gelo e lentidão.',scorpion:'Um predador do deserto com um aguilhão venenoso.',scarab:'Percorre as dunas sob o sol do deserto.',sandTornado:'Um redemoinho de areia que percorre as dunas.',invertedBeetle:'Uma variante extremamente rara, de carapaça invertida, que guarda a Semente de Retorno.'};
  const number=value=>Number(value||0).toLocaleString('pt-BR',{maximumFractionDigits:2});
  function describe(item,env){
    if(!item)return null;
    const {expansion:E,catalog:C,creatures=[],rarities=[],oreValues={},abilities={}}=env;
    const rarity=typeof item.rarity==='object'?item.rarity.name:item.oreRarity||item.rarity||'Comum';
    const tier=Math.max(0,E.tier(rarity)),color=rarities.find(r=>r.name===rarity)?.color||'#acd985';
    const info={name:item.name||'Item',rarity,color,kind:'',description:'',rows:[],note:''};
    if(item.type==='accessory'){
      const def=E.ACCESSORIES.find(a=>a.id===item.accessoryId);if(!def)return null;
      info.name=E.accessory(def.id,rarity)?.name||def.name;info.kind='Acessório · efeito passivo';
      info.description='Concede estes bônus enquanto está equipado em um slot de acessório.';
      info.rows=Object.entries(def.bonuses).map(([key,value])=>[labels[key]||key,'+'+number(value*E.SCALE[tier]*(percent.has(key)?100:1))+(percent.has(key)?'%':key==='regen'?' vida/s':['vision','range','pickup'].includes(key)?' unidades':'')]);
      info.note='Os bônus aumentam com a raridade. O total equipado respeita os limites de cada atributo.';
      if(def.id==='magnet'){const spec=E.magnetSpec(rarity),next=E.MAGNET_EVOLUTIONS[spec.tier+1];info.kind='Magneto · evolução '+(spec.tier+1)+'/12';info.description='Recolhe seus drops de minérios, mobs e acessórios, mesmo através de paredes, apenas no mapa atual.';info.rows.push(['Raio de coleta',number(spec.radius)+' unidades'],['Diâmetro do campo',number(spec.radius*2)+' unidades'],['Próxima evolução',next?next.name:'Evolução máxima · Cósmico']);info.note='Equipe para ativar. O maior Magneto define o alcance; vários não somam raios. Só recolhe loot ao qual você tem direito.';}
      if(def.id==='orb'){info.kind='Foco de magia';info.description='Equipe em um slot e desperte sua magia com o Sábio do Dossel na Jungle.';info.rows.push(['Escala arcana',requireArcanaDetail(tier)],['Mana máxima',String(100+tier*24)]);info.note='A raridade aumenta dano, alcance e tamanho das magias. Conjurar consome mana.';}
      if(def.model==='egg'){info.kind='Acessório de invocação';info.description='Invoca automaticamente aliados laranja que atacam criaturas e mineram pedras ao encostar. Eles atravessam jogadores e não dão XP nem drops.';info.rows.push(['Aliados por ovo',String(def.count)],['Vida e tamanho','70% do mob de mesma raridade'],['Recarga após cada morte',def.cooldown+' s'],['Massa','135% do mob original'],['Mineração','Dano de contato; mesmo intervalo dos ataques']);const creature=creatures.find(c=>c.kind===def.kind),arcana=typeof module!=='undefined'&&module.exports?require('./arcana-catalog'):root.ARCANA;if(creature){const stats=arcana.summonStats({size:25,maxHp:C.mobHealth(creature.hp,tier),damage:creature.damage*Math.pow(1.4,tier)},def,tier);info.rows.push(['Dano por golpe (cada aliado)',number(stats.damage)],['Intervalo entre golpes',number(stats.attackInterval)+' s'],['Dano/s do grupo completo',number(stats.groupDps)]);}info.note='Até 24 aliados ativos por jogador. Remover o ovo ou sair do mapa desfaz suas invocações.';}
      if(def.revive){const spec=E.reviveSpec({level:1,accessories:[{accessoryId:def.id,rarity}]});info.rows.push(['Ressuscitar aliado',number(spec.duration/1000)+' s de canalização'],['Recarga',number(spec.cooldown/1000)+' s'],['Vida ao ressuscitar',number(spec.health*100)+'%']);info.note='Use perto de um aliado caído no mesmo mapa. Mover-se ou receber dano interrompe a canalização.';}
    }else if(item.type==='component'){
      const creature=creatures.find(c=>c.kind===item.kind),recipes=E.ACCESSORIES.filter(a=>a.kind===item.kind);
      info.name=item.name||C.MOB_LOOT[item.kind]||creature?.drop||'Drop de criatura';info.kind='Drop de criatura';
      info.description='Material obtido de '+(creature?.name||'uma criatura')+'. Não concede bônus sozinho.';
      info.rows=[['Origem',creature?.name||'Criatura'],['Uso','Criação de acessórios e fusão de raridade'],['Venda por unidade',number(Math.round(8*Math.pow(1.8,tier)))+' moedas']];
      if(recipes.length)info.rows.push(['Receitas',recipes.map(a=>a.name).join(', ')]);
      info.note='5 drops iguais podem ser combinados para tentar a próxima raridade. ALEPH é forjado no Deserto.';
    }else if(item.type==='material'){
      info.kind='Minério · material de craft';info.description='Pedra coletada pela mineração. Serve como ingrediente; não concede bônus ao carregar.';
      info.rows=[['Uso','Equipamentos, acessórios e fusão'],['Venda por unidade',number((oreValues[rarity]||item.value||1)*5)+' moedas']];
      info.note='Combine 5 pedras da mesma raridade no Craft. A forja Chosen recebe ofertas de ALEPH.';
    }else if(item.type==='mob'){
      const def=creatures.find(c=>c.kind===item.kind);if(!def)return null;
      info.name=def.name;info.kind=tier>=7?'Criatura · boss':'Criatura';info.description=descriptions[item.kind]||'Uma criatura deste mundo.';
      const maximum=item.maxHp??C.mobHealth(def.hp,tier);
      info.rows=[['Vida',item.hp===undefined?number(maximum):number(item.hp)+' / '+number(maximum)],['Dano de contato',number(item.damage??def.damage*Math.pow(1.4,tier))],['Comportamento',def.temperament==='hostile'?'Hostil':'Neutro · revida ao ser atacado'],['Drop',C.MOB_LOOT[item.kind]||def.drop||'Material de criatura']];
      if(tier>=7)info.rows.push(['Habilidade especial',abilities[item.kind]?.name||'Ataques especiais de boss']);
      if(item.summoned)info.note='Invocação: não concede drops nem XP.';
    }else return null;
    if(item.amount!==undefined)info.rows.unshift(['Quantidade',number(item.amount)]);
    return info;
  }
  function requireArcanaDetail(tier){const a=typeof module!=='undefined'&&module.exports?require('./arcana-catalog'):root.ARCANA;return number(a.POWER[tier])+'× de poder';}
  const api={describe,number};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ItemDetails=api;
})(typeof globalThis!=='undefined'?globalThis:this);
