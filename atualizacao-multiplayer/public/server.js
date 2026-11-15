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

// ===== CONFIG =====
const WORLD_SIZE = 100000;

const CITY = {
  x: WORLD_SIZE / 2,
  y: WORLD_SIZE / 2
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

  ores.push({
    id: Math.random().toString(36).substr(2,9),
    x: Math.random() * WORLD_SIZE,
    y: Math.random() * WORLD_SIZE,
    size: 10 + rarities.indexOf(rarity)*5,
    hp: rarity.hp,
    maxHp: rarity.hp,
    rarity
  });
}

// spawn inicial
for(let i=0;i<200;i++) spawnOre();

// ===== SOCKET =====
io.on("connection", socket => {

  console.log("Player conectado:", socket.id);

  // spawn no centro
  players[socket.id] = {
    x: CITY.x + (Math.random()*200 - 100),
    y: CITY.y + (Math.random()*200 - 100),
    name: "Player",
    level: 1,
    xp: 0,
    coins: 0,
    inventory: []
  };

  // ===== LOGIN =====
  socket.on("setName", name => {

    if(!players[socket.id]) return;

    name = (name || "").trim().substring(0,12) || "Player";

    players[socket.id].name = name;

    // cria se não existir
    if(!db.data.players[name]){
      db.data.players[name] = {
        level:1,
        xp:0,
        coins:0,
        inventory:[]
      };
    }

    // carrega save
    let saved = db.data.players[name];

    players[socket.id] = {
      ...players[socket.id],
      ...saved
    };

    db.write();

    socket.emit("loadData", saved);
  });

  // ===== INIT =====
  socket.emit("init", {
    id: socket.id,
    players,
    ores
  });

  socket.broadcast.emit("newPlayer", {
    id: socket.id,
    player: players[socket.id]
  });

  // ===== MOVIMENTO =====
  socket.on("move", data => {
    if(players[socket.id]){
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
    }
  });

  // ===== MINERAÇÃO =====
  socket.on("mine", oreId => {

    let ore = ores.find(o => o.id === oreId);
    if(!ore) return;

    ore.hp -= 25;

    if(ore.hp <= 0){

      ores = ores.filter(o => o.id !== oreId);

      io.emit("oreRemoved", oreId);

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
    if(players[socket.id]){
      io.emit("chat", players[socket.id].name + ": " + msg);
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

  db.data.players[player.name] = {
    level: player.level,
    xp: player.xp,
    coins: player.coins,
    inventory: player.inventory
  };

  db.write();
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

// ===== START =====
http.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});