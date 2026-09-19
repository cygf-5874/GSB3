/* ================= 像素精灵库 =================
   所有图都是字符画 -> 调色板渲染。
   '.' = 透明
*/
const SPRITES = {
  /* ---------- 英雄 12x15 ---------- */
  hero_nun: [
    ".....kk.....",
    "....kkkk....",
    "....wffw....",
    "....fsf.....",
    "...fffffff..",
    ".fsfffsfff..",
    ".fsfffsfff..",
    "..ffffffff..",
    "..sssssss...",
    "..sssssss...",
    "..wwwwwWw...",
    "..wwwwwWw...",
    "...wwwww....",
    "...ww.ww....",
    "....w.w....."
  ],
  hero_gugu: [
    "............",
    "....yyyy....",
    "...yyyyyy...",
    "..yyyyyyyy..",
    "..yykwwkyy..",
    "..yykwwkyy..",
    "...yyooyy...",
    "...yyyyyy...",
    "..yyyyyyyy..",
    "..yy.yy.yy..",
    "..yy.yy.yy..",
    "...yyyyyy...",
    "...y....y...",
    "..yy....yy..",
    "...yy..yy..."
  ],
  hero_devil: [
    ".....r.r....",
    "....rrrrr...",
    "...rrrrrrr..",
    "...rkkrrkkr.",
    "...rffrrffr.",
    "....ffrrff..",
    "....ffffff..",
    "....fffff...",
    "..dd.fff.dd.",
    "..ddfffffdd.",
    "...dddddd...",
    "...dd...dd..",
    "...dd...dd..",
    "..ddd...ddd.",
    "............"
  ],
  hero_necro: [
    "....pppp....",
    "...pppppp...",
    "...pkkppk...",
    "...pffppf...",
    "...pffffp...",
    "...sffffs...",
    "....ffff....",
    "...pppppp...",
    "..pppppppp..",
    "..pp.dd.pp..",
    "..pp.dd.pp..",
    "...ppddpp...",
    "...p....p...",
    "..pp....pp..",
    "...p....p..."
  ],
  hero_eng: [
    "....hhhh....",
    "...hhhhhh...",
    "...hkkhhk...",
    "...hffhhf...",
    "...hffffh...",
    "....ffff....",
    "...bbbbbb...",
    "..bbyyyybb..",
    "..bbyyyybb..",
    "...bbbbbb...",
    "....b..b....",
    "....b..b....",
    "...bb..bb...",
    "...b....b...",
    "..bbb..bbb.."
  ],

  /* ---------- 宠物 12x10 ---------- */
  pet_blue: [
    "....bbbb....",
    "...bbbbbb...",
    "..bbkbbkbb..",
    "...bbffbb...",
    "...bbbbbb...",
    "..bbbbbbbb..",
    "...bb..bb...",
    "...b....b...",
    "..bb....bb..",
    "...b....b..."
  ],
  pet_purple: [
    "....pppp....",
    "...pppppp...",
    "..ppkppkpp..",
    "...ppffpp...",
    "...pwffwp...",
    "...pppppp...",
    "..pppppppp..",
    "...pp..pp...",
    "...p....p...",
    "..pp....pp.."
  ],
  pet_orange: [
    "....oooo....",
    "...oooooo...",
    "..ookookoo..",
    "...ooffoo...",
    "...oooooo...",
    "..oooOOooo..",
    "..oo.oo.oo..",
    "...oo..oo...",
    "...o....o...",
    "..oo....oo.."
  ],

  /* ---------- 怪物 ---------- */
  slime: [
    "............",
    "...gggggg...",
    "..gggggggg..",
    ".gkggggggkg.",
    ".gkggggggkg.",
    "..gggwwggg..",
    "...ggwwgg...",
    "..gggggggg..",
    ".gggggggggg."
  ],
  boar: [
    "..bbbbbbbb..",
    "..bkkbbbbb..",
    "..bbbbbbbbt.",
    "..bbbbbbbb..",
    "..bbbbbbbbt.",
    "..bbbbbbbb..",
    "..dddddddd..",
    "...d....d...",
    "...dd..dd...",
    "..ddd..ddd.."
  ],
  bat: [
    "p.p......p.p",
    "ppp......ppp",
    "pppppppppppp",
    "pppkppppkppp",
    ".ppppffffpp.",
    "..pppffppp..",
    "...pppppp...",
    "....pppp....",
    ".....pp....."
  ],
  skeleton: [
    "....wwww....",
    "...wwwwww...",
    "...wkkwwk...",
    "...wwwwww...",
    "...w.ww.w...",
    "....wwww....",
    "...wwwwww...",
    "..w.wwww.w..",
    "..w.wwww.w..",
    "...wwwwww...",
    "....w..w....",
    "....w..w....",
    "...ww..ww..."
  ],
  boss_golem: [
    ".....gggggg.....",
    "...gggggggggg...",
    "..gggggggggggg..",
    "..gkkggggggkkg..",
    "..gggggggggggg..",
    ".gggggggggggggg.",
    "gggglggggggglggg",
    "gggggggggggggggg",
    "ggggggggmmgggggg",
    ".gggggggggggggg.",
    ".gggggggggggggg.",
    "..gggggg..ggggg.",
    "..ggggg....gggg.",
    "..gggg......ggg.",
    ".ggggg......gggg",
    "ggggg........ggg"
  ],

  /* ---------- 召唤物/设施 ---------- */
  summon_demon: [
    "...pppppp...",
    "..pppppppp..",
    "..pkkppkkp..",
    "..pffppffp..",
    "...ppffpp...",
    "...pppppp...",
    "..pppppppp..",
    ".ppp.pp.ppp.",
    "..pp.pp.pp..",
    "...p....p...",
    "..pp....pp..",
    "..p......p.."
  ],
  turret: [
    "....yyyy....",
    "...yyyyyy...",
    "..yyyyyyyy..",
    "..ykyyyyky..",
    "..yyyyyyyy..",
    "...yyyyyy...",
    "..bbbbbbbb..",
    "...bbbbbb...",
    "...b....b...",
    "...bb..bb...",
    "..bbb..bbb.."
  ],

  /* ---------- 场景物件 ---------- */
  obj_tree: [
    ".....gg.....",
    "....gggg....",
    "...gggggg...",
    "..gggggggg..",
    ".gggggggggg.",
    ".gggkgggkgg.",
    ".gggggggggg.",
    "..gggggggg..",
    "...gggggg...",
    "....gggg....",
    ".....BB.....",
    ".....BB.....",
    "....BBBB....",
    "....BBBB....",
    "...BBBBBB..."
  ],
  obj_rock: [
    "...gggg...",
    "..gggggg..",
    ".gggkgggg.",
    ".gggggggg.",
    "gggggggggg",
    ".mgggggggm",
    ".gggggggg.",
    "..m....m.."
  ],
  obj_chest: [
    "............",
    "..oooooooo..",
    "..owCCCCwo..",
    "..oCCCCCCo..",
    "..oooooooo..",
    "..oLwLLwLo..",
    "..oCCCCCCo..",
    "..oooooooo..",
    "............"
  ],
  obj_chest_open: [
    "............",
    "..oCCCCCCo..",
    "............",
    "...kkkkkk...",
    "..kkkkkkkk..",
    "..kCCCCCCk..",
    "..kCwCCwCk..",
    "..oooooooo..",
    "............"
  ],
  obj_flower: [
    ".yyyy.",
    "ypggpy",
    ".yyyy.",
    "..g...",
    "..g...",
    "..g..."
  ],
  obj_grass: [
    ".g..g.",
    "..gg..",
    ".gggg.",
    "..gg..",
    ".g..g."
  ],
  obj_sign: [
    "wwwwwwwwww",
    "wkkkkkkkkw",
    "wk......kw",
    "wk......kw",
    "wk......kw",
    "wwwwwwwwww",
    "...w..w...",
    "..wwwwww.."
  ]
};
Object.assign(SPRITES, {
  /* ---------- 武器图标 11x11 ---------- */
  w_sword: [
    ".....ww....",
    "....wwg....",
    "...wwgg....",
    "..wwgg.....",
    ".wwgg......",
    "wwgg.......",
    "wgg........",
    "..yy.......",
    "..yy.......",
    "..yyy......",
    "..yy......."
  ],
  w_bow: [
    ".B....B....",
    ".BB...BB...",
    "..BB..BB...",
    "...BB.BB...",
    "....BBB....",
    "...........",
    "....BBB....",
    "...BB.BB...",
    "..BB..BB...",
    ".BB...BB..."
  ],
  w_staff: [
    ".....rr....",
    "....rrr....",
    "....ror....",
    "....rrr....",
    ".....r.....",
    ".....BB....",
    ".....BB....",
    ".....BB....",
    ".....BB....",
    "....BBB....",
    "....B.B...."
  ],
  w_hammer: [
    ".ssssssss..",
    ".ssssssss..",
    "..ssyyss...",
    "....yy.....",
    "....yy.....",
    "....yy.....",
    "....yy.....",
    "....yy.....",
    "....yyy....",
    "....y.y....",
    "..........."
  ],
  w_dagger: [
    ".......ww..",
    "......ww...",
    "......wg...",
    ".....wg....",
    "....wg.....",
    "...wg......",
    "..wy.......",
    "..yy.......",
    ".yyy......."
  ],

  /* ---------- 技能图标 11x11 ---------- */
  sk_nun: [
    ".....ww....",
    "....wwww...",
    "....wwww...",
    "wwwwwwwwwww",
    "wwwwYwwYwww",
    "wwwwwwwwwww",
    "..wwwwwwww.",
    "....wwww...",
    "....wwww...",
    "...wwwwww..",
    "..........."
  ],
  sk_gugu: [
    ".......ww..",
    "......www..",
    ".....www...",
    "...wwww....",
    "..wwww.....",
    ".wwww......",
    "wwww.......",
    "www........",
    "ww.........",
    "y..........",
    "..........."
  ],
  sk_devil: [
    "....r.r....",
    "....rrr....",
    "...rrrrr...",
    "..rrrrrrr..",
    ".rrroorrrr.",
    ".rroooorrr.",
    "..roooor...",
    "...rOOr....",
    "....rr.....",
    "....rr.....",
    "..........."
  ],
  sk_necro: [
    "...wwwww...",
    "..wwwwwww..",
    "..wkkkwkw..",
    "..wwwwwww..",
    "..w.www.w..",
    "...wwwww...",
    "..w.....w..",
    ".ww.....ww.",
    ".w.......w.",
    "..ww...ww..",
    "..........."
  ],
  sk_eng: [
    ".......yy..",
    "......yyy..",
    ".....yyy...",
    "....yyy....",
    "...yyy.....",
    "..yyy......",
    ".yyy.......",
    "yyy........",
    "yy.........",
    "y.........."
  ],

  /* ---------- 物品图标 9x9 ---------- */
  it_helmet: [
    ".sssssss..",
    ".sssssss..",
    "sssssssss.",
    "sskssssks.",
    "sssssssss.",
    "sssssssss.",
    ".ss...ss..",
    ".ss...ss..",
    ".........."
  ],
  it_armor: [
    "..sssss...",
    ".sssssss..",
    "sssYssYss.",
    "sssssssss.",
    "sssssssss.",
    "sss...sss.",
    ".ss...ss..",
    ".ss...ss..",
    ".........."
  ],
  it_ring: [
    "...ooo....",
    "..o...o...",
    ".o..g..o..",
    ".o.....o..",
    ".o.....o..",
    "..o...o...",
    "...ooo....",
    "..........",
    ".........."
  ],
  it_gem: [
    "...bbb....",
    "..blbbb...",
    ".blbbbbl..",
    ".bbbbbbb..",
    "..bbbbb...",
    "...bbb....",
    "....b.....",
    "..........",
    ".........."
  ],
  it_scroll: [
    ".ppppppp..",
    "pppppppp..",
    "p..k..kp..",
    "p..k..kp..",
    "p..k..kp..",
    "p.....p...",
    "ppppppp...",
    "..........",
    ".........."
  ],
  it_key: [
    "...ggg....",
    "..g...g...",
    "..g.y.g...",
    "...ggg....",
    "....g.....",
    "....gg....",
    "....g.....",
    "....gg....",
    ".........."
  ],
  it_potion: [
    "...rrr....",
    "...rrr....",
    "...lll....",
    "..wlll w..",
    "..wrrrrw..",
    "..wrrRrw..",
    "..wrrrrw..",
    "...www....",
    ".........."
  ],
  it_coin: [
    "...yyy....",
    "..yyyyy...",
    ".yylyyly..",
    ".yyyyyyy..",
    ".yyLyyy...",
    ".yyyyyyy..",
    "..yyyyy...",
    "...yyy....",
    ".........."
  ]
});

/* 调色板 */
const PAL = {
  k:"#241a2e", w:"#f4ecd8", f:"#f2c49b",
  r:"#e84a4f", R:"#8e1f2b",
  o:"#c9772f", O:"#ff9f1c",
  y:"#f5d33b", Y:"#ffe98a",
  g:"#4fae46", G:"#2f7a2e", l:"#9be36b",
  b:"#3f7fb8", B:"#6b4a2f", m:"#5d7a86",
  p:"#8e5cc9", P:"#5e3a8c",
  t:"#f0e6d2", d:"#4a3558", s:"#b9c2d4", S:"#7d889e",
  c:"#ffd23f", C:"#7a4a1e", L:"#c0c0d0"
};

/* 绘制一张精灵图到 ctx，支持调色板替换与水平翻转 */
function drawSprite(ctx, name, x, y, px, opts = {}) {
  const map = SPRITES[name];
  if (!map) return;
  const pal = Object.assign({}, PAL, opts.pal);
  const flip = !!opts.flip;
  for (let row = 0; row < map.length; row++) {
    const line = map[row];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch === "." || ch === " ") continue;
      const color = pal[ch];
      if (!color) continue;
      const dc = flip ? line.length - 1 - col : col;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x + dc * px), Math.round(y + row * px), px, px);
    }
  }
}

/* 把精灵画到小 canvas 里（UI 图标用） */
function paintIcon(canvas, name, px = 3, pal) {
  const map = SPRITES[name];
  if (!map) return;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = map[0].length * px, h = map.length * px;
  const ox = (canvas.width - w) / 2, oy = (canvas.height - h) / 2;
  drawSprite(ctx, name, ox, oy, px, { pal });
}

