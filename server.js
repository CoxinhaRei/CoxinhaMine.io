// ===== LOWDB (VERSÃO ANTIGA - FUNCIONA NO RENDER) =====
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ players: {} }).write();

// ===== EXPRESS + SOCKET =====
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const PORT = process.env.PORT || 3000;

// ===== SERVE SITE =====
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// ===== DADOS =====
let players = {};
let ores = []; // 🔥 ARRAY (corrige erro iterable)
let leaderboard = {};
const guildSystem = require('./guilds')(io, db, players);

// ===== CONFIG =====
const WORLD_SIZE = 100000;
const gameCatalog=require('./public/game-catalog');
const attachAdmin=require('./admin');

const CITY = {
  x: WORLD_SIZE / 2,
  y: WORLD_SIZE / 2
};
const BOSSES = {
  SUPER: {color:"#00ffff", hp:2000000},
  ABSOLUT: {color:"#ffffff", hp:8000000},
  QUANTIUM: {color:'#77e9ed',hp:16000000},
  ALEPH: {color:'#ffe68b',hp:64000000}
};
// ===== RARIDADES =====
const rarities = [
  {name:"Comum",color:"#90ee90",hp:60,mult:1},
  {name:"Incomum",color:"#ffff99",hp:100,mult:2},
  {name:"Raro",color:"#3498db",hp:200,mult:3},
  {name:"Épico",color:"#9b59b6",hp:500,mult:5},
  {name:"Lendário",color:"#e74c3c",hp:1000,mult:10},
  {name:"Mítico",color:"#ff8800",hp:2000,mult:20},
  {name:"ULTRA",color:"#ff00ff",hp:5000,mult:100}
];

// ===== SPAWN ORE =====
function spawnOre(){
  let rarity = rarities[Math.floor(Math.random()*rarities.length)];

  const newOre = {
    id: Math.random().toString(36).substr(2,9),
    x: Math.random() * WORLD_SIZE,
    y: Math.random() * WORLD_SIZE,
    size: gameCatalog.oreRadius(rarity.name),
    hp: rarity.hp,
    maxHp: rarity.hp,
    rarity
  };
  if(!gameCatalog.gardenOrePositionValid(newOre.x,newOre.y,newOre.size,WORLD_SIZE) || ores.some(o=>gameCatalog.orePositionsOverlap(newOre.x,newOre.y,newOre.size,o)))return;
  ores.push(newOre);
  io.emit("oreUpdate", newOre);
}
function spawnBoss(type){

  // evita duplicar boss
  let exists = ores.some(o => o.rarity?.name === type);
  if(exists) return;

  let pos = getEdgePosition();

  let data = BOSSES[type];
  const radius=gameCatalog.oreRadius(type);
  pos.x=Math.max(radius+100,Math.min(WORLD_SIZE-radius-100,pos.x));
  pos.y=Math.max(radius+100,Math.min(WORLD_SIZE-radius-100,pos.y));
  if(!gameCatalog.gardenOrePositionValid(pos.x,pos.y,radius,WORLD_SIZE))return;

  let boss = {
    id: type + "_" + Date.now(),
    x: pos.x,
    y: pos.y,
    size: gameCatalog.oreRadius(type),
    hp: data.hp,
    maxHp: data.hp,
    rarity: {
      name: type,
      color: data.color
    },
    isBoss: true
  };

  ores.push(boss);

  io.emit("oreUpdate", boss);

  io.emit("chat", "🔥 " + type + " apareceu!");
}
function getEdgePosition(){

  let side = Math.floor(Math.random() * 4);
  let margin = 500;

  let x, y;

  if(side === 0){ // topo
    x = Math.random() * WORLD_SIZE;
    y = margin;
  }
  else if(side === 1){ // baixo
    x = Math.random() * WORLD_SIZE;
    y = WORLD_SIZE - margin;
  }
  else if(side === 2){ // esquerda
    x = margin;
    y = Math.random() * WORLD_SIZE;
  }
  else{ // direita
    x = WORLD_SIZE - margin;
    y = Math.random() * WORLD_SIZE;
  }

  return {x, y};
}
function spawnUltra(){

  let rarity = rarities.find(r => r.name === "ULTRA");

  let pos = getEdgePosition();

  let ore = {
    id: "ultra_" + Date.now(),
    x: pos.x,
    y: pos.y,
    size: gameCatalog.oreRadius(rarity.name),
    hp: rarity.hp,
    maxHp: rarity.hp,
    rarity
  };

  if(!gameCatalog.gardenOrePositionValid(ore.x,ore.y,ore.size,WORLD_SIZE) || ores.some(o=>gameCatalog.orePositionsOverlap(ore.x,ore.y,ore.size,o)))return;
  ores.push(ore);

  io.emit("oreUpdate", ore);
}
// spawn inicial
for(let i=0;i<200;i++) spawnOre();

// ===== SOCKET =====
io.on("connection", socket => {

  console.log("Player conectado:", socket.id);

  // spawn no centro
  players[socket.id] = {
    x: CITY.x,
    y: CITY.y,
    name: "Player",
    level: 1,
    xp: 0,
    coins: 0,
    inventory: []
  };
  guildSystem.attach(socket);
  attachAdmin(socket,io,ores,process.env.ADMIN_TOKEN);

  // ===== LOGIN =====
  socket.on("setName", name => {

    if(!players[socket.id]) return;

    name = (name || "").trim().substring(0,12) || "Player";

    players[socket.id].name = name;

    // cria se não existir
    if(!db.get('players').has(name).value()){
      db.get('players').set(name, {
        level:1,
        xp:0,
        coins:0,
        inventory:[]
      }).write();
    }

    // carrega save
    let saved = db.get('players').get(name).value();

   players[socket.id] = {
  ...players[socket.id],
  level: saved.level,
  xp: saved.xp,
  coins: saved.coins,
  inventory: saved.inventory,

  // 🔥 spawn na cidade com leve variação
  x: CITY.x,
  y: CITY.y
};
    db.write();

    socket.emit("loadData", saved);
    guildSystem.sync(socket);
  });

  // ===== INIT =====
socket.emit("init", { id: socket.id, players, ores });



  // ===== MOVIMENTO =====
  socket.on("move", data => {
    if(players[socket.id] && data && Number.isFinite(data.x) && Number.isFinite(data.y)){
      players[socket.id].realm=data.realm==='cave' ? 'cave' : 'garden';
      players[socket.id].x = Math.max(0,Math.min(players[socket.id].realm==='cave' ? WORLD_SIZE*2 : WORLD_SIZE,data.x));
      players[socket.id].y = Math.max(0,Math.min(WORLD_SIZE,data.y));
      players[socket.id].dead=!!data.dead;
      players[socket.id].level=Math.max(1,Math.min(99999,Math.floor(Number(data.level) || players[socket.id].level || 1)));
      players[socket.id].rarityIndex=Math.max(0,Math.min(11,Math.floor(Number(data.rarityIndex) || 0)));
      players[socket.id].weapon = typeof data.weapon==='string' ? data.weapon.slice(0,32) : null;
      players[socket.id].pickaxe = typeof data.pickaxe==='string' ? data.pickaxe.slice(0,32) : null;
      players[socket.id].armor=typeof data.armor==='string' ? data.armor.slice(0,32) : null;
      players[socket.id].utility=typeof data.utility==='string' ? data.utility.slice(0,40) : null;
      players[socket.id].selectedSlot = [0,1,2,3].includes(data.selectedSlot) ? data.selectedSlot : 2;
    }
  });

  // ===== MINERAÇÃO =====
socket.on("mine", data => {

  let ore = ores.find(o => o.id === data.id);
  if(!ore) return;

let dmg = 10;

if(players[socket.id]?.equipment?.pickaxe){
  dmg += players[socket.id].equipment.pickaxe.power || 5;
}

ore.hp -= dmg;
  // 🔥 ATUALIZA PRA TODO MUNDO
  io.emit("oreUpdate", ore);

  if(ore.hp <= 0){

    ores.splice(ores.indexOf(ore),1);

    io.emit("oreRemoved", ore.id);

    spawnOre();

    if(players[socket.id]){
      players[socket.id].xp += 10;
      players[socket.id].coins += 5;

      savePlayer(players[socket.id]);
    }
  }
});
  // ===== CHAT =====
  socket.on("chat", msg => {
    const text=typeof msg==='string' ? msg.trim() : typeof msg?.text==='string' ? msg.text.trim() : '';
    if(players[socket.id] && text){
      const player=players[socket.id];
      if(Date.now()-(player.lastChat || 0)<600)return;
      player.lastChat=Date.now();
      const level=Math.max(1,Math.min(99999,Math.floor(Number(msg?.level) || player.level || 1)));
      const rarityIndex=Math.max(0,Math.min(11,Math.floor(Number(msg?.rarityIndex) || player.rarityIndex || 0)));
      io.emit('chatMessage',{name:(player.guildTag ? '['+player.guildTag+'] ' : '')+player.name,text:text.slice(0,220),level,rarityIndex});
    }
  });

  // ===== LEADERBOARD =====
  socket.on("stats", data => {
    leaderboard[socket.id] = data;
  });

  socket.on("disconnect", () => {
    console.log("Player saiu:", socket.id);

    delete players[socket.id];
    delete leaderboard[socket.id];

    io.emit("playerLeft", socket.id);
  });

});

// ===== SAVE PLAYER =====
function savePlayer(player){

  db.get('players').set(player.name, {
    level: player.level,
    xp: player.xp,
    coins: player.coins,
    inventory: player.inventory
    ,guildId: player.guildId || null
  }).write();
}

// ===== LOOP =====
setInterval(() => {
  io.emit("updatePlayers", players);
}, 50);

// leaderboard update
setInterval(() => {

  let top = Object.values(leaderboard)
    .sort((a,b)=>b.level - a.level)
    .slice(0,10);

  io.emit("leaderboardUpdate", top);

}, 2000);
// ULTRA SPAWN
setInterval(() => {

  if(ores.filter(o => o.rarity.name === "ULTRA").length < 10){
    spawnUltra();
  }

}, 5000);

// BOSS SPAWN
setInterval(() => {

  if(Math.random() < 0.2){
    spawnBoss("SUPER");
  }

  if(Math.random() < 0.1){
    spawnBoss("ABSOLUT");
  }
  if(Math.random()<.003)spawnBoss('QUANTIUM');
  if(Math.random()<.00002)spawnBoss('ALEPH');

}, 15000);
// ===== START =====
http.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
