/* ================= 像素大陆 · 主游戏 ================= */
(function () {
"use strict";

/* ---------- DOM ---------- */
const worldCanvas = document.getElementById("world");
const ctx = worldCanvas.getContext("2d");
const floatLayer = document.getElementById("float-layer");
const hpFill = document.getElementById("hp-fill"), hpText = document.getElementById("hp-text");
const staFill = document.getElementById("sta-fill"), staText = document.getElementById("sta-text");
const hint = document.getElementById("interact-hint");
const skillBtn = document.getElementById("skill-btn"), skillCd = document.getElementById("skill-cd");

/* ---------- 常量 ---------- */
const TILE = 32;
const MAP_W = 64, MAP_H = 46;
const PX = 3;                 // 玩家精灵像素缩放
const WORLD_PXW = MAP_W * TILE, WORLD_PXH = MAP_H * TILE;

/* 瓦片类型 */
const T_GRASS = 0, T_SAND = 1, T_WATER = 2, T_PATH = 3, T_STONE = 4;

/* ---------- 画布尺寸 ---------- */
let VW = 0, VH = 0;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  VW = worldCanvas.clientWidth; VH = worldCanvas.clientHeight;
  worldCanvas.width = VW * dpr; worldCanvas.height = VH * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener("resize", resize);

/* ---------- 随机数（固定种子，地图稳定） ---------- */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260919);
const rand = (a, b) => a + rng() * (b - a);
const irand = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(rng() * arr.length)];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

/* ---------- 世界生成 ---------- */
const tiles = new Uint8Array(MAP_W * MAP_H);
const tileNoise = new Uint8Array(MAP_W * MAP_H); // 地面明暗变化
const solids = [];   // {x,y,r,sprite,px,...}
const chests = [];

function inBounds(tx, ty) { return tx >= 0 && ty >= 0 && tx < MAP_W && ty < MAP_H; }
function tileAt(tx, ty) { return inBounds(tx, ty) ? tiles[ty * MAP_W + tx] : T_WATER; }
function isSolidPixel(x, y) {
  const t = tileAt(Math.floor(x / TILE), Math.floor(y / TILE));
  return t === T_WATER;
}

/* 教堂（出生点） */
const church = { tx: 10, ty: 22, w: 7, h: 6 };
function buildWorld() {
  // 基础草地 + 随机噪点
  for (let i = 0; i < tiles.length; i++) {
    tiles[i] = rng() < 0.06 ? T_PATH : T_GRASS;
    tileNoise[i] = irand(0, 3);
  }
  // 一片湖
  blob(52, 10, 5, T_WATER);
  blob(50, 12, 3, T_WATER);
  // 沙滩
  forEachTile((t, x, y) => {
    if (t === T_GRASS || t === T_PATH) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (tileAt(x + dx, y + dy) === T_WATER) { tiles[y * MAP_W + x] = T_SAND; return; }
      }
    }
  });
  // 蜿蜒小路（通往爬塔石碑方向）
  for (let x = 12; x < 46; x++) {
    const y = Math.round(24 + Math.sin(x / 4) * 2);
    setTile(x, y, T_PATH); setTile(x, y + 1, T_PATH);
  }
  // Boss 竞技场（石地）
  for (let y = 34; y < 42; y++) for (let x = 44; x < 56; x++) {
    const edge = (x === 44 || x === 55 || y === 34 || y === 41);
    if (!edge || (x + y) % 2 === 0) tiles[y * MAP_W + x] = T_STONE;
  }
  // 教堂占地
  for (let y = church.ty; y < church.ty + church.h; y++)
    for (let x = church.tx; x < church.tx + church.w; x++) setTile(x, y, T_STONE);

  // 树林
  for (let i = 0; i < 5; i++) {
    const cx = irand(4, 60), cy = irand(3, 18);
    for (let j = 0; j < irand(6, 11); j++) {
      const x = cx + irand(-3, 3), y = cy + irand(-2, 2);
      if (tileAt(x, y) === T_GRASS && !nearChurch(x, y))
        solids.push({ kind: "tree", x: x * TILE + 16, y: y * TILE + 22, r: 12, sprite: "obj_tree", px: 3 });
    }
  }
  // 散树、石头、花草
  for (let i = 0; i < 26; i++) addProp("tree");
  for (let i = 0; i < 20; i++) {
    const x = irand(2, MAP_W - 3), y = irand(2, MAP_H - 3);
    if (freeSpot(x, y)) solids.push({ kind: "rock", x: x * TILE + 16, y: y * TILE + 18, r: 12, sprite: "obj_rock", px: 3 });
  }
  for (let i = 0; i < 90; i++) {
    const x = irand(1, MAP_W - 1), y = irand(1, MAP_H - 1);
    if (tileAt(x, y) === T_GRASS)
      solids.push({ kind: "deco", x: x * TILE + irand(4, 28), y: y * TILE + irand(4, 28), r: 0, sprite: rng() < .5 ? "obj_flower" : "obj_grass", px: 2 });
  }
  // 路标
  solids.push({ kind: "sign", x: 13 * TILE, y: 25 * TILE + 8, r: 6, sprite: "obj_sign", px: 2 });
  // 宝箱
  const chestSpots = [[18, 12], [30, 8], [40, 18], [50, 30], [20, 38], [58, 20], [8, 34], [36, 32]];
  for (const [x, y] of chestSpots) {
    if (tileAt(x, y) !== T_WATER)
      chests.push({ x: x * TILE + 16, y: y * TILE + 16, open: false });
  }
}
function nearChurch(tx, ty) {
  return tx > church.tx - 2 && tx < church.tx + church.w + 2 &&
         ty > church.ty - 2 && ty < church.ty + church.h + 3;
}
function freeSpot(tx, ty) {
  const t = tileAt(tx, ty);
  return (t === T_GRASS || t === T_SAND || t === T_PATH) && !nearChurch(tx, ty);
}
function addProp(kind) {
  for (let tries = 0; tries < 10; tries++) {
    const x = irand(2, MAP_W - 3), y = irand(2, MAP_H - 3);
    if (freeSpot(x, y)) {
      solids.push({ kind, x: x * TILE + 16, y: y * TILE + 22, r: 11, sprite: "obj_tree", px: 3 });
      return;
    }
  }
}
function setTile(x, y, t) { if (inBounds(x, y)) tiles[y * MAP_W + x] = t; }
function forEachTile(fn) {
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) fn(tiles[y * MAP_W + x], x, y);
}
function blob(cx, cy, rad, type) {
  for (let y = cy - rad - 1; y <= cy + rad + 1; y++)
    for (let x = cx - rad - 1; x <= cx + rad + 1; x++) {
      const d = Math.hypot(x - cx, y - cy) + rng() * 1.4;
      if (d <= rad && inBounds(x, y)) tiles[y * MAP_W + x] = type;
    }
}
buildWorld();

/* ---------- 游戏状态 ---------- */
const state = {
  heroIdx: 0, loadoutIdx: 0, weaponIdx: 0, petIdx: 0,
  gold: 12580, gem: 246, ticket: 10, keys: 12,
  hp: 860, maxHp: 860, shield: 200,
  sta: 100, maxSta: 100,
  x: (church.tx + 3) * TILE + 8, y: (church.ty + church.h + 1) * TILE,
  vx: 0, vy: 0, faceX: 1, faceY: 0, flip: false,
  moving: false, lastAct: -99, dead: false, deadT: 0,
  atkCd: 0, skillCd: 0, invuln: 0,
  bossIdx: 0, time: 0
};
state.hp = state.maxHp;

const monsters = [], projectiles = [], effects = [], drops = [], summons = [], npcs = [];
let turret = null;

/* ---------- 怪物生成 ---------- */
const MONSTER_TYPES = [
  { sprite: "slime",  name: "草原史莱姆", hp: 60,  dmg: 12, speed: 55, r: 12, atkRange: 26, atkCd: 1.1, pal: null },
  { sprite: "boar",   name: "野猪",       hp: 110, dmg: 20, speed: 78, r: 13, atkRange: 28, atkCd: 1.3, pal: null },
  { sprite: "bat",    name: "洞穴蝙蝠",   hp: 48,  dmg: 10, speed: 95, r: 11, atkRange: 24, atkCd: .9,  pal: null },
  { sprite: "skeleton", name: "骷髅兵",   hp: 90,  dmg: 17, speed: 62, r: 12, atkRange: 26, atkCd: 1.2, pal: null }
];
const SLIME_PALS = [
  null,
  { g: "#3f8fd0", G: "#245a8e", l: "#8fd0ff" },
  { g: "#8e5cc9", G: "#5e3a8c", l: "#c9a8ff" }
];

function spawnMonster(type, x, y, opts = {}) {
  const m = Object.assign({
    x, y, vx: 0, vy: 0, hurtT: 0, stunT: 0, burnT: 0, burnTick: 0,
    alive: true, respawn: null, aggro: false
  }, type, opts);
  m.maxHp = m.hp;
  monsters.push(m);
  return m;
}

function populateMonsters() {
  const fixed = [
    [16, 12, 1], [24, 10, 0], [28, 16, 0], [34, 9, 1], [40, 12, 2],
    [18, 30, 3], [26, 34, 1], [32, 28, 3], [40, 34, 2], [46, 20, 1],
    [22, 40, 3], [30, 40, 1], [14, 18, 2], [56, 26, 3], [8, 14, 0],
    [36, 18, 0], [44, 8, 2], [58, 34, 1], [16, 36, 0]
  ];
  for (const [tx, ty, ti] of fixed) {
    const t = MONSTER_TYPES[ti];
    const m = spawnMonster(t, tx * TILE + 16, ty * TILE + 16, { homeX: tx * TILE + 16, homeY: ty * TILE + 16 });
    if (t.sprite === "slime") m.pal = SLIME_PALS[irand(0, 2)];
    if (m.pal) { /* 颜色对应不同强度 */
      if (m.pal === SLIME_PALS[1]) { m.hp *= 1.3; m.dmg = 16; }
      if (m.pal === SLIME_PALS[2]) { m.hp *= 1.6; m.dmg = 20; }
      m.maxHp = m.hp;
    }
  }
  spawnBoss();
}
function spawnBoss() {
  const names = WORLD_BOSSES;
  spawnMonster(
    { sprite: "boss_golem", name: names[state.bossIdx], hp: 1400 + state.bossIdx * 400,
      dmg: 38, speed: 46, r: 26, atkRange: 40, atkCd: 1.6 },
    50 * TILE, 38 * TILE,
    { homeX: 50 * TILE, homeY: 38 * TILE, boss: true }
  );
}

/* 其他玩家（社交感） */
function populateNpcs() {
  const defs = [
    { name: "猎人大哥", sprite: "hero_eng", x: 15 * TILE, y: 23 * TILE },
    { name: "咕咕本咕", sprite: "hero_gugu", x: 42 * TILE, y: 16 * TILE }
  ];
  for (const d of defs) npcs.push(Object.assign({ t: rng() * 10, tx: d.x, ty: d.y }, d));
}

populateMonsters();
populateNpcs();
/* ---------- 输入 ---------- */
const keys = {};
let mouseDown = false;
const mouse = { x: 0, y: 0 };

window.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === "1" || k === "2" || k === "3") switchWeapon(+k - 1);
  if (k === "q" || k === " ") { e.preventDefault(); castSkill(); }
  if (k === "e") tryOpenChest();
  if (k === "i") { e.preventDefault(); openBag(); }
});
window.addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });

worldCanvas.addEventListener("mousedown", e => {
  mouseDown = true;
  const r = worldCanvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
});
window.addEventListener("mouseup", () => { mouseDown = false; });
worldCanvas.addEventListener("mousemove", e => {
  const r = worldCanvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
});

/* 触屏：虚拟摇杆 */
let joyVec = { x: 0, y: 0 };
(function setupJoy() {
  const base = document.getElementById("joy-base"), knob = document.getElementById("joy-knob");
  let touchId = null, cx = 0, cy = 0;
  worldCanvas.addEventListener("touchstart", e => {
    document.body.classList.add("touch");
    if (touchId === null && e.touches[0].clientX < window.innerWidth * 0.55) {
      const t = e.touches[0];
      touchId = t.identifier;
      cx = t.clientX; cy = t.clientY;
      base.style.left = (cx - 60) + "px";
      base.style.top = (cy - 60) + "px";
      knob.style.left = "38px"; knob.style.top = "38px";
    }
  }, { passive: true });
  worldCanvas.addEventListener("touchmove", e => {
    for (const t of e.touches) if (t.identifier === touchId) {
      let dx = t.clientX - cx, dy = t.clientY - cy;
      const d = Math.hypot(dx, dy), max = 44;
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      knob.style.left = (38 + dx) + "px"; knob.style.top = (38 + dy) + "px";
      joyVec.x = dx / max; joyVec.y = dy / max;
    }
  }, { passive: true });
  const end = e => {
    for (const t of e.changedTouches) if (t.identifier === touchId) {
      touchId = null; joyVec.x = joyVec.y = 0;
      base.style.left = "34px"; base.style.top = ""; base.style.bottom = "120px";
      knob.style.left = "38px"; knob.style.top = "38px";
    }
  };
  worldCanvas.addEventListener("touchend", end);
  worldCanvas.addEventListener("touchcancel", end);
  /* 右半屏点按攻击 */
  worldCanvas.addEventListener("touchstart", e => {
    for (const t of e.changedTouches) if (t.clientX >= window.innerWidth * 0.55) {
      mouseDown = true;
      const r = worldCanvas.getBoundingClientRect();
      mouse.x = t.clientX - r.left; mouse.y = t.clientY - r.top;
    }
  }, { passive: true });
  worldCanvas.addEventListener("touchend", () => { mouseDown = false; });
})();

/* ---------- 碰撞 ---------- */
function moveEntity(e, dt, radius) {
  const nx = e.x + e.vx * dt, ny = e.y + e.vy * dt;
  if (!blocked(nx, e.y, radius)) e.x = nx; else e.vx = 0;
  if (!blocked(e.x, ny, radius)) e.y = ny; else e.vy = 0;
  e.x = clamp(e.x, 16, WORLD_PXW - 16);
  e.y = clamp(e.y, 18, WORLD_PXH - 14);
}
function blocked(x, y, r) {
  if (isSolidPixel(x - r, y - r) || isSolidPixel(x + r, y - r) ||
      isSolidPixel(x - r, y + r) || isSolidPixel(x + r, y + r)) return true;
  // 教堂
  if (x > (church.tx - 0.4) * TILE && x < (church.tx + church.w + 0.4) * TILE &&
      y > (church.ty - 0.6) * TILE && y < (church.ty + church.h - 0.2) * TILE) return true;
  for (const s of solids) {
    if (!s.r) continue;
    if (Math.hypot(x - s.x, y - (s.y - 6)) < r + s.r * .7) return true;
  }
  return false;
}

/* ---------- 战斗 ---------- */
function curWeapon() { return LOADOUTS[state.loadoutIdx].weapons[state.weaponIdx]; }
function curHero() { return HEROES[state.heroIdx]; }

function switchWeapon(i) {
  if (i === state.weaponIdx) return;
  state.weaponIdx = i; state.lastAct = state.time;
  document.querySelectorAll(".weapon-slot").forEach((el, idx) => el.classList.toggle("active", idx === i));
  rebuildWeaponBar();
  toast("切换武器：" + curWeapon().name);
}

function tryAttack(aimX, aimY) {
  if (state.atkCd > 0 || state.dead) return;
  const w = curWeapon();
  if (state.sta < w.cost) {
    if (!state._lowStaWarn || state.time - state._lowStaWarn > 1) {
      toast("体能不足！", "#ffb340"); state._lowStaWarn = state.time;
    }
    return;
  }
  state.sta -= w.cost;
  state.atkCd = w.cd;
  state.lastAct = state.time;

  let dx = aimX - state.x, dy = aimY - state.y;
  const d = Math.hypot(dx, dy) || 1;
  dx /= d; dy /= d;
  state.faceX = dx; state.faceY = dy; state.flip = dx < 0;

  if (w.type === "melee") {
    effects.push({ type: "slash", x: state.x + dx * 20, y: state.y + dy * 20, t: .22, max: .22, ang: Math.atan2(dy, dx), range: w.range });
    let hitAny = false;
    for (const m of monsters) {
      if (!m.alive) continue;
      const mdx = m.x - state.x, mdy = m.y - state.y, md = Math.hypot(mdx, mdy);
      if (md < w.range + m.r && Math.dot ? false : (mdx / (md || 1) * dx + mdy / (md || 1) * dy > .25)) {
        const crit = rng() < (w.icon === "w_bow" ? 0 : .12);
        damageMonster(m, w.dmg * (crit ? 2 : 1), { crit, burn: state.heroIdx === 2 || w.icon === "w_sword", stun: false });
        hitAny = true;
      }
    }
    if (hitAny) sfxFlash();
  } else {
    // 远程：投射物
    const fire = w.icon === "w_staff";
    projectiles.push({
      x: state.x, y: state.y - 6, vx: dx * (fire ? 300 : 380), vy: dy * (fire ? 300 : 380),
      dmg: w.dmg, life: 1.1, r: fire ? 7 : 5,
      color: fire ? "#ff7a2f" : (w.q === "gold" ? "#ffd23f" : "#f4ecd8"),
      fire, pierce: w.icon === "w_bow", hitSet: new Set(),
      burn: state.heroIdx === 2, homing: w.q === "gold"
    });
  }
  // 小恶魔被动：普攻灼烧已在上面处理
}

function damageMonster(m, dmg, opts = {}) {
  if (!m.alive) return;
  dmg = Math.round(dmg);
  m.hp -= dmg; m.hurtT = .15; m.aggro = true;
  if (opts.burn && m.burnT <= 0) m.burnT = 3;
  if (opts.stun) m.stunT = 1.2;
  popDmg(m.x, m.y - m.r - 8, dmg, opts.crit ? "crit" : "");
  if (m.hp <= 0) killMonster(m);
}

function killMonster(m) {
  m.alive = false;
  popDmg(m.x, m.y - 10, m.boss ? "BOSS 击破！" : "+击杀", "heal");
  // 掉落
  drops.push({ x: m.x, y: m.y, kind: rng() < .5 ? "coin" : "potion", t: 0 });
  if (!m.boss && rng() < .12) drops.push({ x: m.x + 10, y: m.y, kind: "key", t: 0 });
  if (m.boss) {
    state.gold += 500 + state.bossIdx * 200;
    updateRes();
    toast("击败 " + m.name + "！获得金币 " + (500 + state.bossIdx * 200));
    state.bossIdx = (state.bossIdx + 1) % WORLD_BOSSES.length;
    updateBossTrack();
    m.respawn = 12;
    for (const q of document.querySelectorAll(".boss-dot")) q.classList.remove("cur");
  } else {
    m.respawn = irand(8, 16);
    state.gold += irand(5, 20);
    updateRes();
  }
}

function hurtPlayer(dmg, srcX, srcY) {
  if (state.invuln > 0 || state.dead) return;
  state.invuln = .5;
  state.lastAct = state.time;
  if (state.shield > 0) {
    const absorbed = Math.min(state.shield, dmg);
    state.shield -= absorbed; dmg -= absorbed;
  }
  state.hp -= dmg;
  popDmg(state.x, state.y - 26, "-" + Math.round(dmg), "player-hurt");
  if (state.hp <= 0) {
    state.hp = 0;
    // 修女被动：复活（这里简化为自动教堂复活）
    die();
  }
}
function die() {
  state.dead = true; state.deadT = 2.2;
  toast("你被击倒了…将在教堂复活（修女的祝福）");
}
function respawn() {
  state.dead = false;
  state.hp = state.maxHp; state.shield = 200; state.sta = state.maxSta;
  state.x = (church.tx + 3) * TILE + 8;
  state.y = (church.ty + church.h + 1) * TILE;
}

/* ---------- 英雄技能 ---------- */
function castSkill() {
  if (state.skillCd > 0 || state.dead) return;
  const hero = curHero(), sk = hero.skill;
  if (state.sta < sk.cost) { toast("体能不足！", "#ffb340"); return; }
  state.sta -= sk.cost;
  state.skillCd = sk.cd;
  state.lastAct = state.time;

  if (hero.id === "nun") {
    state.hp = Math.min(state.maxHp, state.hp + 200);
    state.shield = Math.max(state.shield, 200);
    popDmg(state.x, state.y - 30, "+200", "heal");
    effects.push({ type: "ring", x: state.x, y: state.y, t: .6, max: .6, color: "#8cff9e", r: 70 });
  } else if (hero.id === "gugu") {
    for (let i = -1; i <= 1; i++) {
      const a = Math.atan2(state.faceY, state.faceX) + i * .25;
      projectiles.push({ x: state.x, y: state.y - 6, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340,
        dmg: 26, life: 1.2, r: 6, color: "#fff6c0", pierce: true, hitSet: new Set(), feather: true });
    }
  } else if (hero.id === "devil") {
    const ax = state.x + state.faceX * 90, ay = state.y + state.faceY * 90;
    effects.push({ type: "fire", x: ax, y: ay, t: .8, max: .8, r: 70 });
    for (const m of monsters) if (m.alive && Math.hypot(m.x - ax, m.y - ay) < 78)
      damageMonster(m, 80, { burn: true, stun: true });
  } else if (hero.id === "necro") {
    summons.push({ x: state.x + 20, y: state.y, t: 20, atkCd: 0 });
    effects.push({ type: "ring", x: state.x, y: state.y, t: .6, max: .6, color: "#c9a8ff", r: 50 });
  } else if (hero.id === "eng") {
    turret = { x: state.x, y: state.y - 8, t: 25, atkCd: 0 };
    toast("炮台已部署");
  }
  toast(sk.name, "#ffe9b0");
}
/* ---------- 宝箱 ---------- */
function nearestChest() {
  let best = null, bd = 42;
  for (const c of chests) {
    if (c.open) continue;
    const d = Math.hypot(c.x - state.x, c.y - state.y);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}
function tryOpenChest() {
  const c = nearestChest();
  if (!c) return;
  if (state.keys <= 0) { toast("没有宝箱钥匙了！", "#ff8fa3"); return; }
  c.open = true;
  state.keys--;
  const reward = rng();
  if (reward < .5) {
    const g = irand(80, 200);
    state.gold += g;
    toast("宝箱：金币 ×" + g);
  } else if (reward < .8) {
    state.gem += 5;
    toast("宝箱：钻石 ×5");
  } else {
    state.gem += 1; state.keys += 2;
    toast("宝箱：钻石 ×1 + 钥匙 ×2（稀有！）");
  }
  drops.push({ x: c.x, y: c.y, kind: "coin", t: 0 });
  drops.push({ x: c.x + 12, y: c.y - 4, kind: "gem", t: 0 });
  updateRes();
}

/* ---------- 更新 ---------- */
function update(dt) {
  state.time += dt;

  if (state.dead) {
    state.deadT -= dt;
    if (state.deadT <= 0) respawn();
  } else {
    updatePlayer(dt);
  }
  updateMonsters(dt);
  updateProjectiles(dt);
  updateSummons(dt);
  updateDrops(dt);
  updateEffects(dt);
  updateNpcs(dt);

  state.atkCd = Math.max(0, state.atkCd - dt);
  state.skillCd = Math.max(0, state.skillCd - dt);
  state.invuln = Math.max(0, state.invuln - dt);

  // 体能恢复：停止操作 1.2 秒后快速恢复
  const idle = state.time - state.lastAct;
  if (idle > 1.2) state.sta = Math.min(state.maxSta, state.sta + dt * 26);
  else state.sta = Math.min(state.maxSta, state.sta + dt * 6);
  if (state.sta > 0) state.sta = Math.min(state.maxSta, state.sta + dt * 2);

  // 自动攻击（按住鼠标/触屏）
  if (mouseDown && !state.dead) {
    const cam = getCam();
    const wx = mouse.x + cam.x, wy = mouse.y + cam.y;
    tryAttack(wx, wy);
  }

  // 交互提示
  const c = nearestChest();
  hint.classList.toggle("hidden", !c || state.dead);

  updateBars();
  updateSkillCd();
}

function updatePlayer(dt) {
  let ix = 0, iy = 0;
  if (keys["w"] || keys["arrowup"]) iy -= 1;
  if (keys["s"] || keys["arrowdown"]) iy += 1;
  if (keys["a"] || keys["arrowleft"]) ix -= 1;
  if (keys["d"] || keys["arrowright"]) ix += 1;
  ix += joyVec.x; iy += joyVec.y;
  const il = Math.hypot(ix, iy);
  state.moving = il > 0.05;
  if (state.moving) {
    ix /= Math.max(1, il); iy /= Math.max(1, il);
    const speed = 168;
    state.vx = ix * speed; state.vy = iy * speed;
    state.faceX = ix; state.faceY = iy; state.flip = ix < -0.1;
    moveEntity(state, dt, 11);
  } else { state.vx = 0; state.vy = 0; }
}

function updateMonsters(dt) {
  for (const m of monsters) {
    if (!m.alive) {
      if (m.respawn != null) {
        m.respawn -= dt;
        if (m.respawn <= 0) {
          if (m.boss) {
            m.alive = true; m.hp = m.maxHp;
            m.x = m.homeX; m.y = m.homeY; m.respawn = null;
            toast("世界Boss " + WORLD_BOSSES[state.bossIdx] + " 已刷新！", "#ff9f1c");
          } else {
            m.alive = true; m.hp = m.maxHp;
            m.x = m.homeX; m.y = m.homeY; m.respawn = null; m.aggro = false;
          }
        }
      }
      continue;
    }
    m.hurtT = Math.max(0, m.hurtT - dt);
    m.stunT = Math.max(0, m.stunT - dt);
    m.atkTimer = (m.atkTimer || 0) - dt;
    // 灼烧
    if (m.burnT > 0) {
      m.burnT -= dt; m.burnTick = (m.burnTick || 0) - dt;
      if (m.burnTick <= 0) {
        m.burnTick = .6;
        damageMonster(m, 8, {});
        if (!m.alive) continue;
      }
    }
    if (m.stunT > 0) { m.vx = m.vy = 0; continue; }

    const d = dist(m, state);
    if (state.dead) {
      // 回家
      const hx = m.homeX - m.x, hy = m.homeY - m.y, hl = Math.hypot(hx, hy) || 1;
      m.vx = hx / hl * m.speed * .4; m.vy = hy / hl * m.speed * .4;
      if (hl < 6) m.vx = m.vy = 0;
    } else if (d < (m.boss ? 520 : 300) || m.aggro) {
      const dx = state.x - m.x, dy = state.y - m.y, dl = d || 1;
      if (d > m.atkRange - 4) {
        m.vx = dx / dl * m.speed; m.vy = dy / dl * m.speed;
      } else {
        m.vx = m.vy = 0;
        if (m.atkTimer <= 0) {
          m.atkTimer = m.atkCd;
          hurtPlayer(m.dmg, m.x, m.y);
        }
      }
      // 与其他怪物的简单避让
      for (const o of monsters) {
        if (o === m || !o.alive) continue;
        const ox = m.x - o.x, oy = m.y - o.y, od = Math.hypot(ox, oy);
        if (od > 0 && od < m.r + o.r) { m.vx += ox / od * 30; m.vy += oy / od * 30; }
      }
    } else {
      // 游荡
      m.wander = (m.wander || 0) - dt;
      if (m.wander <= 0) {
        m.wander = rng() * 3 + 1;
        m.wx = rng() - .5; m.wy = rng() - .5;
      }
      m.vx = (m.wx || 0) * m.speed * .25;
      m.vy = (m.wy || 0) * m.speed * .25;
      const hx = m.homeX - m.x, hy = m.homeY - m.y;
      if (Math.hypot(hx, hy) > 160) { m.vx += hx * .6; m.vy += hy * .6; }
    }
    moveEntity(m, dt, m.r * .7);
  }
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    // 追踪箭
    if (p.homing) {
      let best = null, bd = 220;
      for (const m of monsters) if (m.alive && !p.hitSet.has(m)) {
        const d = Math.hypot(m.x - p.x, m.y - p.y);
        if (d < bd) { bd = d; best = m; }
      }
      if (best) {
        const sp = Math.hypot(p.vx, p.vy);
        const nx = (best.x - p.x) / (bd || 1), ny = (best.y - p.y) / (bd || 1);
        p.vx = p.vx * .85 + nx * sp * .15;
        p.vy = p.vy * .85 + ny * sp * .15;
      }
    }
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    let dead = p.life <= 0 || isSolidPixel(p.x, p.y);
    for (const m of monsters) {
      if (!m.alive || p.hitSet.has(m)) continue;
      if (Math.hypot(m.x - p.x, (m.y - 6) - p.y) < m.r + p.r) {
        damageMonster(m, p.dmg, { burn: p.burn });
        p.hitSet.add(m);
        if (!p.pierce) { dead = true; break; }
      }
    }
    if (dead) projectiles.splice(i, 1);
  }
}

function updateSummons(dt) {
  // 宠物攻击（当前出战宠物）
  const pet = PETS[state.petIdx];
  state._petCd = (state._petCd || 0) - dt;
  if (!state.dead && state._petCd <= 0) {
    let best = null, bd = 150;
    for (const m of monsters) if (m.alive) {
      const d = dist(m, state);
      if (d < bd) { bd = d; best = m; }
    }
    if (best) {
      state._petCd = 1.4;
      const a = Math.atan2(best.y - state.y, best.x - state.x);
      projectiles.push({
        x: state.x, y: state.y - 10, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260,
        dmg: pet.q === "orange" ? 18 : pet.q === "purple" ? 14 : 10,
        life: .8, r: 5,
        color: pet.q === "orange" ? "#ff9f1c" : pet.q === "purple" ? "#c9a8ff" : "#7ec8ff",
        hitSet: new Set(), pet: true, burn: pet.q === "orange"
      });
    }
  }
  // 亡灵召唤物
  for (let i = summons.length - 1; i >= 0; i--) {
    const s = summons[i];
    s.t -= dt; s.atkCd -= dt;
    const hover = state.x + Math.cos(state.time * 2 + i) * 26;
    s.x += (hover - s.x) * 4 * dt;
    s.y += (state.y - 20 - s.y) * 4 * dt;
    if (s.atkCd <= 0) {
      let best = null, bd = 200;
      for (const m of monsters) if (m.alive) {
        const d = Math.hypot(m.x - s.x, m.y - s.y);
        if (d < bd) { bd = d; best = m; }
      }
      if (best) {
        s.atkCd = .9;
        damageMonster(best, 22, { burn: true });
      }
    }
    if (s.t <= 0) summons.splice(i, 1);
  }
  // 炮台
  if (turret) {
    turret.t -= dt; turret.atkCd -= dt;
    if (turret.atkCd <= 0) {
      let best = null, bd = 280;
      for (const m of monsters) if (m.alive) {
        const d = Math.hypot(m.x - turret.x, m.y - turret.y);
        if (d < bd) { bd = d; best = m; }
      }
      if (best) {
        turret.atkCd = .5;
        const a = Math.atan2(best.y - turret.y, best.x - turret.x);
        projectiles.push({
          x: turret.x, y: turret.y - 14, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420,
          dmg: 20, life: .9, r: 4, color: "#ffd23f", hitSet: new Set()
        });
      }
    }
    if (turret.t <= 0) { turret = null; toast("炮台消失了"); }
  }
}

function updateDrops(dt) {
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.t += dt;
    // 吸附
    const dd = Math.hypot(state.x - d.x, state.y - d.y);
    if (dd < 60) {
      d.x += (state.x - d.x) * 4 * dt;
      d.y += (state.y - d.y) * 4 * dt;
    }
    if (dd < 20) {
      if (d.kind === "coin") state.gold += irand(2, 8);
      else if (d.kind === "key") { state.keys++; toast("拾取：宝箱钥匙"); }
      else if (d.kind === "gem") state.gem += 1;
      else { state.hp = Math.min(state.maxHp, state.hp + 40); popDmg(state.x, state.y - 28, "+40", "heal"); }
      updateRes();
      drops.splice(i, 1);
    } else if (d.t > 30) drops.splice(i, 1);
  }
}

function updateEffects(dt) {
  for (let i = effects.length - 1; i >= 0; i--) {
    effects[i].t -= dt;
    if (effects[i].t <= 0) effects.splice(i, 1);
  }
}

function updateNpcs(dt) {
  for (const n of npcs) {
    n.t += dt;
    n.x = n.tx + Math.sin(n.t * .6) * 30;
    n.y = n.ty + Math.cos(n.t * .5) * 20;
  }
}
/* ---------- 渲染 ---------- */
function getCam() {
  return {
    x: clamp(state.x - VW / 2, 0, Math.max(0, WORLD_PXW - VW)),
    y: clamp(state.y - VH / 2, 0, Math.max(0, WORLD_PXH - VH))
  };
}

const TILE_COLORS = {
  [T_GRASS]: ["#7cc95a", "#74c253", "#80cf5e"],
  [T_SAND]:  ["#e8d090", "#e2c885", "#eedb9f"],
  [T_WATER]: ["#4d97d1", "#478fc8", "#58a3da"],
  [T_PATH]:  ["#cbb176", "#c4a86c", "#d3bb82"],
  [T_STONE]: ["#9aa2a8", "#9199a0", "#a4abb0"]
};

function render() {
  const cam = getCam();
  ctx.fillStyle = "#16380f";
  ctx.fillRect(0, 0, VW, VH);

  const tx0 = Math.max(0, Math.floor(cam.x / TILE) - 1);
  const tx1 = Math.min(MAP_W - 1, Math.ceil((cam.x + VW) / TILE) + 1);
  const ty0 = Math.max(0, Math.floor(cam.y / TILE) - 1);
  const ty1 = Math.min(MAP_H - 1, Math.ceil((cam.y + VH) / TILE) + 1);

  // 地面
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const t = tiles[ty * MAP_W + tx];
      const n = tileNoise[ty * MAP_W + tx];
      const pal = TILE_COLORS[t];
      ctx.fillStyle = pal[(tx * 7 + ty * 3 + n) % 3];
      ctx.fillRect(tx * TILE - cam.x, ty * TILE - cam.y, TILE + 1, TILE + 1);
      // 水波纹 / 草丛点缀
      if (t === T_WATER && (tx + ty + Math.floor(state.time * 2)) % 5 === 0) {
        ctx.fillStyle = "rgba(255,255,255,.18)";
        ctx.fillRect(tx * TILE - cam.x + 6, ty * TILE - cam.y + 12, 10, 2);
      }
      if (t === T_GRASS && n === 0) {
        ctx.fillStyle = "rgba(30,90,20,.25)";
        ctx.fillRect(tx * TILE - cam.x + 8, ty * TILE - cam.y + 20, 3, 3);
      }
    }
  }

  drawChurch(cam);

  // 按 y 排序的实体
  const drawList = [];
  for (const s of solids) if (onScreen(s.x, s.y, cam)) drawList.push({ y: s.y, fn: () => drawObject(s, cam) });
  for (const c of chests) if (onScreen(c.x, c.y, cam)) drawList.push({ y: c.y + 8, fn: () => drawChest(c, cam) });
  for (const n of npcs) if (onScreen(n.x, n.y, cam)) drawList.push({ y: n.y, fn: () => drawNpc(n, cam) });
  for (const m of monsters) if (m.alive && onScreen(m.x, m.y, cam)) drawList.push({ y: m.y, fn: () => drawMonster(m, cam) });
  for (const d of drops) if (onScreen(d.x, d.y, cam)) drawList.push({ y: d.y, fn: () => drawDrop(d, cam) });
  for (const s of summons) if (onScreen(s.x, s.y, cam)) drawList.push({ y: s.y, fn: () => drawSummon(s, cam) });
  if (turret && onScreen(turret.x, turret.y, cam)) drawList.push({ y: turret.y, fn: () => drawTurret(turret, cam) });
  drawList.push({ y: state.y, fn: () => drawPlayer(cam) });
  drawList.sort((a, b) => a.y - b.y);
  for (const it of drawList) it.fn();

  // 投射物
  for (const p of projectiles) {
    const x = p.x - cam.x, y = p.y - cam.y;
    ctx.fillStyle = p.color;
    if (p.fire) {
      ctx.fillRect(x - 5, y - 5, 10, 10);
      ctx.fillStyle = "#ffe98a"; ctx.fillRect(x - 2, y - 2, 4, 4);
    } else if (p.feather) {
      ctx.fillRect(x - 3, y - 6, 6, 12);
    } else {
      ctx.fillRect(x - p.r, y - 2, p.r * 2, 4);
      ctx.fillRect(x - 2, y - p.r, 4, p.r * 2);
    }
  }

  // 特效
  for (const e of effects) drawEffect(e, cam);
}

function onScreen(x, y, cam) {
  return x > cam.x - 60 && x < cam.x + VW + 60 && y > cam.y - 80 && y < cam.y + VH + 80;
}
function shadow(x, y, w, cam) {
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.fillRect(x - cam.x - w, y - cam.y, w * 2, 6);
}

function drawChurch(cam) {
  const bx = church.tx * TILE - cam.x, by = (church.ty - 1) * TILE - cam.y;
  // 主体
  ctx.fillStyle = "#e9e2d2"; ctx.fillRect(bx + 14, by + 30, 7 * TILE - 28, 5 * TILE - 10);
  ctx.fillStyle = "#d3c8b0";
  ctx.fillRect(bx + 14, by + 30 + 5 * TILE - 26, 7 * TILE - 28, 16);
  // 屋顶
  ctx.fillStyle = "#a63d4a";
  for (let i = 0; i < 7; i++) ctx.fillRect(bx + 6 + i * 30, by + 18 + i * 0, 34, 14);
  ctx.fillRect(bx + 4, by + 28, 7 * TILE - 8, 8);
  // 钟楼尖塔
  ctx.fillStyle = "#c5b896"; ctx.fillRect(bx + 5 * TILE - 10, by - 4, 40, 36);
  ctx.fillStyle = "#a63d4a";
  ctx.beginPath();
  ctx.moveTo(bx + 5 * TILE - 16, by - 4);
  ctx.lineTo(bx + 5 * TILE + 10, by - 40);
  ctx.lineTo(bx + 5 * TILE + 36, by - 4);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#ffd23f"; ctx.fillRect(bx + 5 * TILE + 7, by - 52, 6, 14);
  // 门与窗
  ctx.fillStyle = "#5d4430"; ctx.fillRect(bx + 3 * TILE - 10, by + 5 * TILE - 20, 26, 42);
  ctx.fillStyle = "#7ec8ff";
  ctx.fillRect(bx + TILE - 2, by + 44, 16, 20);
  ctx.fillRect(bx + 5 * TILE + 4, by + 44, 16, 20);
  // 名牌
  label(bx + 3.5 * TILE, by - 46, "圣光教堂（复活点）", "#ffe9b0"); // 已是屏幕坐标
}

function drawObject(s, cam) {
  const map = SPRITES[s.sprite];
  const x = s.x - map[0].length * s.px / 2;
  const y = s.y - map.length * s.px;
  if (s.kind !== "deco") shadow(s.x, s.y + 4, s.r, cam);
  drawSprite(ctx, s.sprite, x - cam.x, y - cam.y, s.px);
}

function drawChest(c, cam) {
  shadow(c.x, c.y + 6, 13, cam);
  const spr = c.open ? "obj_chest_open" : "obj_chest";
  drawSprite(ctx, spr, c.x - 18 - cam.x, c.y - 14 - cam.y, 3);
  if (!c.open && Math.hypot(c.x - state.x, c.y - state.y) < 42) {
    const bob = Math.sin(state.time * 5) * 2;
    ctx.fillStyle = "#ffd23f";
    ctx.fillRect(c.x - cam.x - 2, c.y - cam.y - 30 + bob, 4, 4);
  }
}

function drawNpc(n, cam) {
  shadow(n.x, n.y + 6, 13, cam);
  drawSprite(ctx, n.sprite, n.x - 18 - cam.x, n.y - 45 - cam.y, PX, { flip: false });
  label(n.x - cam.x, n.y - 52 - cam.y, n.name, "#bff0ff");
}

function drawMonster(m, cam) {
  const map = SPRITES[m.sprite];
  const px = m.boss ? 4 : PX;
  const w = map[0].length * px, h = map.length * px;
  shadow(m.x, m.y + (m.boss ? 14 : 6), m.boss ? 28 : 13, cam);
  if (m.hurtT > 0) {
    // 受击闪白：用白色调色板
    const whitePal = {};
    for (const k in PAL) whitePal[k] = "#ffffff";
    drawSprite(ctx, m.sprite, m.x - w / 2 - cam.x, m.y - h + 6 - cam.y, px, { flip: false, pal: whitePal });
  } else {
    drawSprite(ctx, m.sprite, m.x - w / 2 - cam.x, m.y - h + 6 - cam.y, px, { flip: false, pal: m.pal || undefined });
  }
  if (m.burnT > 0) {
    ctx.fillStyle = "#ff9f1c";
    ctx.fillRect(m.x - cam.x + Math.sin(state.time * 12) * 6, m.y - cam.y - h, 5, 5);
  }
  if (m.stunT > 0) label(m.x - cam.x, m.y - h - 4 - cam.y, "★", "#ffe98a");
  // 血条
  const bw = m.boss ? 64 : 30;
  const ratio = clamp(m.hp / m.maxHp, 0, 1);
  const bx = m.x - bw / 2 - cam.x, by = m.y - h - (m.boss ? 14 : 4) - cam.y;
  ctx.fillStyle = "#000"; ctx.fillRect(bx - 1, by - 1, bw + 2, 6);
  ctx.fillStyle = "#3a1220"; ctx.fillRect(bx, by, bw, 4);
  ctx.fillStyle = m.boss ? "#ff9f1c" : "#ff5d6c"; ctx.fillRect(bx, by, bw * ratio, 4);
  if (m.boss) label(m.x - cam.x, by - 14, m.name + "  Lv." + (30 + state.bossIdx * 5), "#ffb84d");
}

function drawPlayer(cam) {
  const hero = curHero();
  if (state.invuln > 0 && Math.floor(state.time * 20) % 2 === 0) return;
  shadow(state.x, state.y + 8, 13, cam);
  // 移动时上下抖动
  const bob = state.moving ? (Math.floor(state.time * 10) % 2) * 2 : 0;
  const map = SPRITES[hero.sprite];
  const w = map[0].length * PX, h = map.length * PX;
  drawSprite(ctx, hero.sprite, state.x - w / 2 - cam.x, state.y - h + 6 - bob - cam.y, PX, { flip: state.flip });
  label(state.x - cam.x, state.y - h - 6 - cam.y, "你", "#ffe9b0");
  // 护盾
  if (state.shield > 0) {
    ctx.strokeStyle = "rgba(126,200,255,.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(state.x - cam.x, state.y - h / 2 - cam.y, 26 + Math.sin(state.time * 4) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawSummon(s, cam) {
  shadow(s.x, s.y + 4, 12, cam);
  const flick = s.t < 4 && Math.floor(state.time * 8) % 2 === 0;
  if (!flick) drawSprite(ctx, "summon_demon", s.x - 18 - cam.x, s.y - 38 - cam.y, PX,
    { pal: { p: "#a86bff", P: "#6a3fb0", k: PAL.k, f: PAL.f } });
}
function drawTurret(t, cam) {
  shadow(t.x, t.y + 6, 14, cam);
  drawSprite(ctx, "turret", t.x - 16 - cam.x, t.y - 34 - cam.y, PX);
}

function drawDrop(d, cam) {
  const bob = Math.sin(state.time * 4 + d.x) * 3;
  if (d.kind === "coin") {
    ctx.fillStyle = "#ffd23f";
    ctx.fillRect(d.x - cam.x - 4, d.y - cam.y - 4 + bob, 8, 8);
    ctx.fillStyle = "#c8941a"; ctx.fillRect(d.x - cam.x - 4, d.y - cam.y + 1 + bob, 8, 3);
  } else if (d.kind === "gem") {
    ctx.fillStyle = "#5ec8ff";
    ctx.fillRect(d.x - cam.x - 4, d.y - cam.y - 4 + bob, 8, 8);
  } else if (d.kind === "key") {
    ctx.fillStyle = "#f5d33b";
    ctx.fillRect(d.x - cam.x - 3, d.y - cam.y - 6 + bob, 6, 6);
    ctx.fillRect(d.x - cam.x - 1, d.y - cam.y + bob, 2, 8);
  } else {
    ctx.fillStyle = "#ff5d6c";
    ctx.fillRect(d.x - cam.x - 4, d.y - cam.y - 6 + bob, 8, 10);
    ctx.fillStyle = "#cdd"; ctx.fillRect(d.x - cam.x - 2, d.y - cam.y - 8 + bob, 4, 3);
  }
}

function drawEffect(e, cam) {
  const k = e.t / e.max;
  const x = e.x - cam.x, y = e.y - cam.y;
  if (e.type === "slash") {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(e.ang);
    ctx.strokeStyle = "rgba(255,255,255," + (.8 * k) + ")";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, e.range * .7, -0.7, 0.7);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,210,63," + k + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, e.range * .7 + 4, -0.7, 0.7);
    ctx.stroke();
    ctx.restore();
  } else if (e.type === "ring") {
    ctx.strokeStyle = e.color; ctx.globalAlpha = k; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, y, e.r * (1 - k) + 8, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (e.type === "fire") {
    const r = e.r * (1 - k * .3);
    ctx.fillStyle = "rgba(255,120,40," + k * .5 + ")";
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,220,120," + k * .8 + ")";
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + state.time * 3;
      ctx.fillRect(x + Math.cos(a) * r * .5 - 4, y + Math.sin(a) * r * .5 - 4, 8, 8);
    }
  }
}

function label(x, y, text, color) {
  ctx.font = "12px 'ZCOOL KuaiLe', sans-serif";
  ctx.textAlign = "center";
  const sx = x, sy = y;
  // 屏幕坐标换算在调用处完成：这里 x,y 已是世界坐标，需相机…
  // 为简化，本函数直接接收屏幕坐标
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fillText(text, sx + 1, sy + 1);
  ctx.fillStyle = color || "#fff";
  ctx.fillText(text, sx, sy);
}


/* ---------- 小地图 ---------- */
const mini = document.getElementById("minimap");
const mctx = mini.getContext("2d");
mctx.imageSmoothingEnabled = false;
const MM_COLORS = ["#7cc95a", "#e8d090", "#4d97d1", "#cbb176", "#9aa2a8"];
let miniTimer = 0;
function renderMinimap(dt) {
  miniTimer -= dt;
  if (miniTimer > 0) {
    // 动态实体仍画
  } else {
    miniTimer = .25;
    mctx.fillStyle = "#16380f";
    mctx.fillRect(0, 0, mini.width, mini.height);
    const sx = mini.width / MAP_W, sy = mini.height / MAP_H;
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++) {
        mctx.fillStyle = MM_COLORS[tiles[y * MAP_W + x]];
        mctx.fillRect(x * sx, y * sy, Math.ceil(sx), Math.ceil(sy));
      }
    // 宝箱
    mctx.fillStyle = "#ffd23f";
    for (const c of chests) if (!c.open) mctx.fillRect(c.x / WORLD_PXW * mini.width - 1, c.y / WORLD_PXH * mini.height - 1, 3, 3);
    // 教堂
    mctx.fillStyle = "#fff";
    mctx.fillRect(church.tx / MAP_W * mini.width, church.ty / MAP_H * mini.height, 8, 6);
  }
  // 怪物
  for (const m of monsters) if (m.alive) {
    mctx.fillStyle = m.boss ? "#ff9f1c" : "#e84a4f";
    const px = m.x / WORLD_PXW * mini.width, py = m.y / WORLD_PXH * mini.height;
    mctx.fillRect(px - (m.boss ? 3 : 1), py - (m.boss ? 3 : 1), m.boss ? 6 : 3, m.boss ? 6 : 3);
  }
  // NPC
  mctx.fillStyle = "#7ec8ff";
  for (const n of npcs) mctx.fillRect(n.x / WORLD_PXW * mini.width - 1, n.y / WORLD_PXH * mini.height - 1, 2, 2);
  // 玩家
  mctx.fillStyle = "#fff";
  const ppx = state.x / WORLD_PXW * mini.width, ppy = state.y / WORLD_PXH * mini.height;
  mctx.fillRect(ppx - 2, ppy - 2, 4, 4);
  mctx.strokeStyle = "#000"; mctx.strokeRect(ppx - 2.5, ppy - 2.5, 5, 5);
}

/* ---------- HUD ---------- */
function updateBars() {
  hpFill.style.width = clamp(state.hp / state.maxHp * 100, 0, 100) + "%";
  hpText.textContent = Math.ceil(state.hp) + "/" + state.maxHp + (state.shield > 0 ? "  🛡" + Math.round(state.shield) : "");
  staFill.style.width = clamp(state.sta / state.maxSta * 100, 0, 100) + "%";
  staText.textContent = Math.floor(state.sta) + "/" + state.maxSta;
  document.querySelector(".bar.sta").classList.toggle("low", state.sta < 25);
}
function updateRes() {
  document.getElementById("res-gold").textContent = state.gold.toLocaleString();
  document.getElementById("res-gem").textContent = state.gem;
  document.getElementById("res-ticket").textContent = state.ticket;
}
function updateSkillCd() {
  const sk = curHero().skill;
  if (state.skillCd > 0) {
    skillBtn.classList.add("cooling");
    skillCd.textContent = Math.ceil(state.skillCd);
  } else skillBtn.classList.remove("cooling");
}
function updateBossTrack() {
  const dots = document.querySelectorAll(".boss-seq i");
  dots.forEach((d, i) => d.classList.toggle("cur", i === state.bossIdx));
}

/* 伤害数字 */
function popDmg(wx, wy, text, cls) {
  const cam = getCam();
  const el = document.createElement("div");
  el.className = "dmg " + (cls || "");
  el.textContent = text;
  el.style.left = (wx - cam.x) + "px";
  el.style.top = (wy - cam.y) + "px";
  el.style.transform = "translateX(-50%)";
  floatLayer.appendChild(el);
  setTimeout(() => el.remove(), 820);
}

/* toast */
function toast(text, color) {
  const layer = document.getElementById("toast-layer");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = text;
  if (color) { el.style.borderColor = color; el.style.color = color; }
  layer.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}
function sfxFlash() { /* 预留音效位，命中已用闪白+数字反馈 */ }

/* ---------- 武器栏 ---------- */
function rebuildWeaponBar() {
  const slots = document.querySelectorAll(".weapon-slot");
  const loadout = LOADOUTS[state.loadoutIdx];
  slots.forEach((el, i) => {
    const w = loadout.weapons[i];
    el.classList.toggle("active", i === state.weaponIdx);
    el.querySelector(".w-name").textContent = w.name + " ";
    el.querySelector(".w-name").className = "w-name q-" + w.q;
    el.querySelector(".w-name").innerHTML = w.name + ' <i class="q q-' + w.q + '"></i>';
    el.querySelector(".w-skills").textContent = "主动：" + w.active + " · 被动：" + w.passive;
    el.querySelector(".w-cost").textContent = "−" + w.cost + " 体能";
    paintIcon(el.querySelector(".weapon-icon"), w.icon, 3);
  });
}
document.querySelectorAll(".weapon-slot").forEach((el, i) => {
  el.addEventListener("click", () => switchWeapon(i));
});

/* 一键换装 */
document.getElementById("loadout-swap").addEventListener("click", () => {
  state.loadoutIdx = (state.loadoutIdx + 1) % LOADOUTS.length;
  state.weaponIdx = 0;
  rebuildWeaponBar();
  toast("一键换装 → " + LOADOUTS[state.loadoutIdx].name);
});

/* 技能按钮 */
skillBtn.addEventListener("click", castSkill);

/* 宠物切换 */
document.querySelectorAll(".pet-slot").forEach(el => {
  el.addEventListener("click", () => {
    state.petIdx = +el.dataset.pet;
    document.querySelectorAll(".pet-slot").forEach(s => s.classList.toggle("active", s === el));
    toast("出战宠物：" + PETS[state.petIdx].name);
  });
});

/* 英雄头像与切换 */
function paintAvatar() {
  paintIcon(document.getElementById("hero-avatar"), curHero().sprite, 2.6);
}
document.getElementById("hero-switch").addEventListener("click", openHeroModal);
function openHeroModal() {
  const grid = document.getElementById("hero-grid");
  grid.innerHTML = "";
  HEROES.forEach((h, i) => {
    const card = document.createElement("div");
    card.className = "hero-card" + (i === state.heroIdx ? " cur" : "");
    const cv = document.createElement("canvas");
    cv.width = 44; cv.height = 44;
    card.appendChild(cv);
    const info = document.createElement("div");
    info.innerHTML = '<div class="hc-name">' + h.name + "</div>" +
      '<div class="hc-tag">' + h.tag + " · 免费</div>" +
      '<div class="hc-desc">' + h.desc + "<br>主动：" + h.skill.name + "（" + h.skill.text + "）<br>被动：" + h.passive + "</div>";
    card.appendChild(info);
    card.addEventListener("click", () => {
      state.heroIdx = i;
      state.skillCd = 0;
      document.querySelector(".hero-name").textContent = h.name;
      paintAvatar(); paintSkillIcon();
      document.getElementById("hero-modal").classList.add("hidden");
      toast("已切换英雄：" + h.name + "（所有英雄免费解锁）");
    });
    grid.appendChild(card);
    paintIcon(cv, h.sprite, 2.8);
  });
  document.getElementById("hero-modal").classList.remove("hidden");
}
document.querySelectorAll("[data-close-hero]").forEach(b =>
  b.addEventListener("click", () => document.getElementById("hero-modal").classList.add("hidden")));

function paintSkillIcon() {
  paintIcon(document.getElementById("skill-icon"), curHero().skill.icon, 4);
  document.querySelector("#skill-btn .dock-label").textContent = curHero().skill.name;
}
/* ---------- 弹窗：背包 / 仓库 / 副本 ---------- */
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");

function openModal(title, html) {
  modalTitle.textContent = title;
  modalBody.innerHTML = html;
  modal.classList.remove("hidden");
}
function closeModal() { modal.classList.add("hidden"); }
document.getElementById("modal-close").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

function openBag(tab) {
  const equipped = EQUIPPED.map(e =>
    '<div class="eq-slot"><canvas data-icon="' + e.icon + '"></canvas><small>' + e.label + "</small></div>"
  ).join("");
  const cells = BAG_ITEMS.map((it, i) =>
    '<div class="cell" data-i="' + i + '" style="box-shadow:inset 0 0 0 2px var(--' +
      (it.q === "gold" ? "gold" : it.q === "orange" ? "orange" : it.q === "purple" ? "purple" : it.q === "blue" ? "blue" : it.q === "green" ? "sta" : "paper") + ');">' +
      '<canvas data-icon="' + it.icon + '"></canvas>' +
      (it.cnt > 1 ? '<span class="cnt">×' + it.cnt + "</span>" : "") +
    "</div>"
  ).join("");
  openModal("🎒 背包（钥匙 ×" + state.keys + "）",
    '<div class="bag-equipped">' + equipped + "</div>" +
    '<div class="bag-detail" id="bag-detail">点击物品查看详情。金色以上稀有度会解锁装备技能。</div>' +
    '<div class="bag-grid">' + cells + "</div>"
  );
  modalBody.querySelectorAll("canvas[data-icon]").forEach(cv => paintIcon(cv, cv.dataset.icon, 3));
  modalBody.querySelectorAll(".cell").forEach(cell => {
    cell.addEventListener("click", () => {
      const it = BAG_ITEMS[+cell.dataset.i];
      const q = QUALITY[it.q];
      document.getElementById("bag-detail").innerHTML =
        '<b style="color:var(--' + (it.q === "gold" ? "gold" : it.q === "orange" ? "orange" : it.q === "purple" ? "purple" : it.q === "blue" ? "blue" : it.q === "green" ? "sta" : "paper") + ')">' +
        it.name + "</b> [" + q.name + "] · " + it.slot + (it.cnt > 1 ? " ×" + it.cnt : "") +
        '<div class="bd-skill">' + it.skill + "</div>";
    });
  });
}

function openStorage() {
  const cells = Array.from({ length: 18 }, (_, i) => {
    const it = [BAG_ITEMS[4], BAG_ITEMS[7], BAG_ITEMS[8]][i % 3];
    const cnt = it.cnt > 1 ? "×" + it.cnt : "";
    return '<div class="cell" style="box-shadow:inset 0 0 0 2px rgba(255,255,255,.15);">' +
      '<canvas data-icon="' + it.icon + '"></canvas><span class="cnt">' + cnt + "</span></div>";
  }).join("");
  openModal("📦 仓库（容量 60/120）",
    '<div class="bag-detail">存放材料与备用装备，随时存取。世界 Boss 材料请预留用于团队副本强化。</div>' +
    '<div class="bag-grid" style="grid-template-columns:repeat(6,1fr)">' + cells + "</div>");
  modalBody.querySelectorAll("canvas[data-icon]").forEach(cv => paintIcon(cv, cv.dataset.icon, 3));
}

function openDungeon(key) {
  const list = DUNGEONS.map(d =>
    '<div class="dun-item"><div class="dun-emoji">' + d.emoji + "</div>" +
    '<div class="dun-info"><b>' + d.name + '</b><p>' + d.desc + "</p></div>" +
    '<button class="dun-go" data-key="' + d.key + '">' + d.go + "</button></div>"
  ).join("");
  openModal("🏰 副本与 PVE", '<div class="dun-list">' + list + "</div>");
  modalBody.querySelectorAll(".dun-go").forEach(btn =>
    btn.addEventListener("click", () => {
      const d = DUNGEONS.find(x => x.key === btn.dataset.key);
      closeModal();
      if (btn.dataset.key === "sandbox") {
        toast("已在风车草原中，尽情探索吧！");
      } else {
        toast("进入队列：" + d.name + "（Demo 演示入口）");
      }
    })
  );
}

document.querySelectorAll("[data-open]").forEach(btn => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.open;
    if (k === "bag") openBag();
    else if (k === "storage") openStorage();
    else openDungeon(k);
  });
});

/* 世界事件横幅：30 秒后演示一次 */
setTimeout(() => {
  const b = document.getElementById("event-banner");
  b.classList.remove("hidden");
  setTimeout(() => b.classList.add("hidden"), 6000);
}, 8000);

/* ---------- 主循环 ---------- */
let lastT = performance.now();
function loop(now) {
  const dt = Math.min((now - lastT) / 1000, .05);
  lastT = now;
  update(dt);
  render();
  renderMinimap(dt);
  requestAnimationFrame(loop);
}

/* ---------- 启动 ---------- */
resize();
rebuildWeaponBar();
paintAvatar();
paintSkillIcon();
document.querySelectorAll("canvas[data-pet-sprite]").forEach(cv =>
  paintIcon(cv, cv.dataset.petSprite, 2));
updateBars();
updateRes();
updateBossTrack();
setTimeout(() => toast("欢迎来到风车草原！WASD 移动，左键攻击，E 开宝箱"), 600);
requestAnimationFrame(loop);

/* 调试/自动化接口 */
window.__game = {
  get state(){ return state; },
  get monsters(){ return monsters; },
  get chests(){ return chests; },
  get drops(){ return drops; },
  get summons(){ return summons; },
  get turret(){ return turret; },
  castSkill, tryOpenChest, switchWeapon, toast
};

})();


