
(function(){
  const root = document.getElementById("px-hud-root");
  const world = root.querySelector("#pxWorld");
  const canvas = root.querySelector("#pxMap");
  const ctx = canvas.getContext("2d");
  const mini = root.querySelector("#pxMini");
  const mctx = mini.getContext("2d");
  const W = 960, H = 600, TILE = 40;
  const COLS = W/TILE, ROWS = H/TILE;

  /* ---------- 像素地形（分层噪声） ---------- */
  function rnd(x,y,s){ let n = Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453; return n-Math.floor(n); }
  function tileAt(c,r){
    if(c<4 && r>2 && r<11) return 2;                 // 水域
    if((c===4&&r>2&&r<11)) return 3;                 // 沙滩
    const n = rnd(c,r,1), n2 = rnd(c*2,r*2,2);
    if(n>.93) return 4;                               // 岩石
    if(n>.85) return 5;                               // 树丛
    if(n2>.8) return 1;                               // 深草
    return 0;                                         // 草地
  }
  const PAL = ["#5c8a3c","#4f7a34","#3f7fb8","#d9c179","#8d8678","#3a6b2f"];
  function drawTile(c,r){
    const t = tileAt(c,r), x=c*TILE, y=r*TILE;
    ctx.fillStyle = PAL[t]; ctx.fillRect(x,y,TILE,TILE);
    if(t===2){ // 水波
      ctx.fillStyle="rgba(255,255,255,.18)";
      const off = (performance.now()/600|0)%TILE;
      ctx.fillRect(x+6+((off)%20),y+10,12,3);
      ctx.fillRect(x+18-((off)%16),y+26,10,3);
    }
    if(t===5){ // 树
      ctx.fillStyle="#24471c"; ctx.fillRect(x+8,y+12,24,24);
      ctx.fillStyle="#2f5e26"; ctx.fillRect(x+12,y+6,16,12);
      ctx.fillStyle="#5a3d22"; ctx.fillRect(x+17,y+32,6,8);
      ctx.fillStyle="rgba(255,255,255,.12)"; ctx.fillRect(x+12,y+8,6,4);
    }
    if(t===4){ // 岩石
      ctx.fillStyle="#6e685c"; ctx.fillRect(x+8,y+12,24,20);
      ctx.fillStyle="#a8a090"; ctx.fillRect(x+10,y+12,12,6);
      ctx.fillStyle="#544e44"; ctx.fillRect(x+8,y+28,24,4);
    }
    if(t===0||t===1){ // 草点
      const g = rnd(c,r,3);
      ctx.fillStyle = t? "#47702f":"#679a47";
      if(g>.55){ ctx.fillRect(x+8,y+10,3,6); ctx.fillRect(x+26,y+24,3,6); }
    }
    if(t===3){ ctx.fillStyle="#cbb268"; ctx.fillRect(x+8,y+14,5,3); ctx.fillRect(x+24,y+28,5,3); }
  }

  /* ---------- 实体 ---------- */
  const player = { x:480, y:300, tx:480, ty:300, dir:0, step:0, art:"🧕" };
  const monsterDefs = [
    {art:"👺",name:"草原小妖"},{art:"🦂",name:"沙蝎"},{art:"🧟",name:"亡灵"},
    {art:"👹",name:"巨魔"},{art:"🐗",name:"野猪王"}
  ];
  const monsters = [];
  function spawnMonsters(){
    let placed = 0, guard = 0;
    while(placed < 9 && guard < 400){
      guard++;
      const seed = guard * 13.7 + placed * 91.3;
      const c = 7+Math.floor(rnd(seed, placed, 9)*15);
      const r = 2+Math.floor(rnd(placed, seed, 3)*11);
      if(tileAt(c,r)===2||tileAt(c,r)===5||tileAt(c,r)===4) continue;
      const d = monsterDefs[placed%monsterDefs.length];
      monsters.push({x:c*TILE+20, y:r*TILE+20, art:d.art, name:d.name,
        hp:100, vx:(rnd(seed,1,5)-.5)*.3, vy:(rnd(seed,2,5)-.5)*.3, hit:0});
      placed++;
    }
  }
  spawnMonsters();

  /* 建筑设施 */
  const props = [
    {x:760,y:120,art:"🏪",label:"杂货商"},{x:830,y:150,art:"⚒️",label:"铁匠铺"},
    {x:120,y:420,art:"🏰",label:"营地"},{x:880,y:460,art:"💰",label:"宝箱"},
    {x:300,y:90,art:"🌵"},{x:600,y:470,art:"🪨"}
  ];
  /* 其他玩家（NPC） */
  const npcs = [
    {x:700,y:200,art:"🧙",name:"咕咕"},{x:250,y:300,art:"🧛",name:"小恶魔"},
    {x:560,y:150,art:"💀",name:"亡灵术师"}
  ];

  /* ---------- 飘字 ---------- */
  const floats = root.querySelector("#pxFloats");
  function floatText(x,y,text,cls){
    const r = world.getBoundingClientRect();
    const el = document.createElement("span");
    el.className = "px-dmg "+(cls||"hit");
    el.textContent = text;
    el.style.left = (x/W*r.width-14)+"px";
    el.style.top = (y/H*r.height-10)+"px";
    floats.appendChild(el);
    setTimeout(()=>el.remove(),900);
  }

  /* ---------- 输入：点击/触摸移动 ---------- */
  function toWorld(e){
    const r = world.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x:(p.clientX-r.left)/r.width*W, y:(p.clientY-r.top)/r.height*H };
  }
  let moving=false;
  world.addEventListener("pointerdown", e=>{
    if(e.target.closest("button")||e.target.closest(".px-modal")||e.target.closest(".px-hero-panel")||
       e.target.closest(".px-pet-panel")||e.target.closest(".px-minimap")) return;
    const p = toWorld(e); player.tx=p.x; player.ty=p.y; moving=true;
  });
  world.addEventListener("pointermove", e=>{
    if(!moving) return;
    const p = toWorld(e); player.tx=p.x; player.ty=p.y;
  });
  addEventListener("pointerup", ()=>moving=false);

  /* ---------- 状态条 ---------- */
  let hp=3120, hpMax=3120, st=100, idle=0;
  const hpFill=root.querySelector("#pxHpFill"), stFill=root.querySelector("#pxStFill");
  const hpTxt=root.querySelector("#pxHpTxt"), stTxt=root.querySelector("#pxStTxt");
  function useSt(v){ if(st<v){return false;} st-=v; idle=0; return true; }
  function updateBars(){
    hp=Math.max(0,Math.min(hpMax,hp)); st=Math.max(0,Math.min(100,st));
    hpFill.style.width=(hp/hpMax*100)+"%";
    stFill.style.width=st+"%";
    hpTxt.textContent=Math.ceil(hp)+" / "+hpMax;
    stTxt.textContent="体能 "+Math.ceil(st);
    root.querySelectorAll(".px-skill").forEach(b=>{
      const cost=+b.dataset.cost||0;
      b.classList.toggle("low-st", st<cost && !b.classList.contains("px-skill-atk"));
    });
  }

  /* ---------- 战斗 ---------- */
  function nearestMonster(range){
    let best=null,bd=range;
    for(const m of monsters){
      const d=Math.hypot(m.x-player.x,m.y-player.y);
      if(d<bd){bd=d;best=m;}
    }
    return best;
  }
  function damageMonster(m,dmg,heal){
    const crit=Math.random()<.22;
    const v=heal?dmg:(crit?Math.round(dmg*1.8):dmg);
    if(heal){ hp=Math.min(hpMax,hp+v); floatText(player.x,player.y-30,"+"+v,"heal"); }
    else {
      m.hp-=v; m.hit=1;
      floatText(m.x,m.y-18,crit?"CRIT "+v:String(v),crit?"crit":"hit");
      if(m.hp<=0){
        floatText(m.x,m.y,"掉落 +12","heal");
        m.hp=100;
        let tries=0, t=4;
        do{
          m.x=60+rnd(Math.random()*99,tries+1,7)*840;
          m.y=60+rnd(tries+3,Math.random()*99,5)*480;
          t=tileAt(m.x/TILE|0,m.y/TILE|0); tries++;
        } while((t===2||t===4||t===5) && tries<60);
      }
    }
  }
  root.querySelector("#pxAttack").addEventListener("click",()=>{
    if(!useSt(8)){floatText(player.x,player.y-34,"体能不足","hit");return;}
    const m=nearestMonster(78);
    damageMonster(m,120+Math.random()*60);
    player.step=8;
  });
  const skillMeta=[
    {id:0,cost:45,cd:9,act:()=>{damageMonster(null,260,true); root.querySelector("#pxBuff").classList.remove("off");}},
    {id:1,cost:30,cd:6,act:()=>damageMonster(null,480,true)},
    {id:2,cost:35,cd:7,act:()=>{[0,1,2].forEach(i=>{const m=nearestMonster(140); if(m)damageMonster(m,200);});}}
  ];
  skillMeta.forEach(s=>{
    const btn=root.querySelector("#pxSkill"+s.id);
    btn.dataset.cost=s.cost;
    let remain=0;
    btn.addEventListener("click",()=>{
      if(remain>0||!useSt(s.cost)){if(!useSt(0))floatText(player.x,player.y-34,"体能不足","hit");return;}
      s.act(); remain=s.cd;
      btn.classList.add("cooling");
      const cdEl=root.querySelector("#pxCd"+s.id);
      const t=setInterval(()=>{
        remain-=.1; cdEl.textContent=Math.ceil(remain);
        if(remain<=0){clearInterval(t); btn.classList.remove("cooling"); cdEl.textContent="";}
      },100);
    });
  });

  /* ---------- 武器切换（3把，无缝） ---------- */
  const wBtns=[...root.querySelectorAll(".px-weapon")];
  wBtns.forEach(b=>b.addEventListener("click",()=>{
    wBtns.forEach(x=>x.classList.remove("px-w-active"));
    b.classList.add("px-w-active");
    floatText(player.x,player.y-34,"已切换 "+b.querySelector(".px-w-name").textContent,"heal");
  }));
  /* 一键换装 */
  root.querySelector("#pxSwapBtn").addEventListener("click",()=>{
    const order=[1,2,0];
    const cur=wBtns.findIndex(b=>b.classList.contains("px-w-active"));
    wBtns.forEach((x,i)=>x.classList.toggle("px-w-active",i===order[cur]));
    floatText(player.x,player.y-46,"一键换装完成！","crit");
  });

  /* ---------- 英雄切换（全部免费解锁） ---------- */
  const heroes=[
    {art:"🧕",name:"修女 · 赛琳娜",color:"#6d8a4a",sk:["复活圣光","治疗术","神圣新星"]},
    {art:"🐦",name:"咕咕",color:"#4a7d8a",sk:["远程专精","羽盾","疾风射击"]},
    {art:"👿",name:"小恶魔 · 焰",color:"#8a4a3a",sk:["地狱火","眩晕链","烈焰风暴"]},
    {art:"💀",name:"亡灵术师",color:"#6a5a8a",sk:["召唤恶魔","骨盾","亡者大军"]},
    {art:"🧑‍🔧",name:"工程师 · 波顿",color:"#8a7a4a",sk:["自动炮台","护甲包","超载轰炸"]}
  ];
  root.querySelectorAll(".px-hs").forEach(b=>{
    b.addEventListener("click",()=>{
      root.querySelectorAll(".px-hs").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      const h=heroes[+b.dataset.hero];
      player.art=h.art;
      root.querySelector("#pxPortraitArt").textContent=h.art;
      root.querySelector("#pxHeroName").textContent=h.name;
      h.sk.forEach((n,i)=>root.querySelector("#pxSkill"+i+" .px-sk-name").textContent=n);
      floatText(player.x,player.y-34,"已解锁英雄："+h.name.split(" · ")[0],"heal");
    });
  });

  /* ---------- 宠物出战切换 ---------- */
  root.querySelectorAll(".px-pet-card").forEach(c=>{
    c.addEventListener("click",()=>{
      root.querySelectorAll(".px-pet-card").forEach(x=>{
        x.classList.remove("px-pet-active");
        x.querySelector(".px-pet-bar i").style.width="0%";
      });
      c.classList.add("px-pet-active");
      c.querySelector(".px-pet-bar i").style.width="88%";
    });
  });

  /* ---------- 背包 / 仓库 ---------- */
  const mask=root.querySelector("#pxBagMask");
  const grid=root.querySelector("#pxBagGrid");
  const items=[
    {ic:"⚔️",q:"gold"},{ic:"🛡️",q:"purple"},{ic:"💍",q:"blue"},{ic:"👕",q:"white"},
    {ic:"🪄",q:"gold"},{ic:"👢",q:"purple"},{ic:"👑",q:"gold"},{ic:"🧤",q:"blue"},
    {ic:"📿",q:"white"},{ic:"🏹",q:"purple"},{ic:"🔮",q:"gold"},{ic:"",q:""},
    {ic:"🧪",q:"white"},{ic:"",q:""},{ic:"",q:""},{ic:"",q:""},
    {ic:"",q:""},{ic:"",q:""}
  ];
  items.forEach(it=>{
    const cell=document.createElement("div");
    cell.className="px-cell"+(it.q?" px-q-"+it.q+"-cell":"");
    cell.innerHTML = it.ic ? it.ic+'<span class="px-q-edge"></span>'+'<span class="px-c-tag">'+(it.q==="gold"?"★":"")+'</span>' : "";
    grid.appendChild(cell);
  });
  root.querySelector("#pxBagBtn").addEventListener("click",()=>mask.hidden=false);
  root.querySelector("#pxWarehouseBtn").addEventListener("click",()=>{
    mask.hidden=false; root.querySelector(".px-bag-modal header b").textContent="仓库";
  });
  root.querySelector("#pxBagClose").addEventListener("click",()=>{
    mask.hidden=true; root.querySelector(".px-bag-modal header b").textContent="背包";
  });
  mask.addEventListener("click",e=>{ if(e.target===mask){mask.hidden=true; root.querySelector(".px-bag-modal header b").textContent="背包";}});

  /* ---------- 左侧玩法入口提示 ---------- */
  root.querySelectorAll(".px-side-btn").forEach(b=>{
    const map={tower:"爬塔玩法 · 共80层，当前 47F",raid:"团队副本 · 4人组队",trial:"荣誉试炼 · 赛季排行榜",dungeon:"普通副本 · 副本券×3，Boss无限刷"};
    b.addEventListener("click",()=>floatText(player.x,player.y-58,map[b.dataset.entry],"heal"));
  });

  /* ---------- Boss 链 ---------- */
  const bossChain=root.querySelector("#pxBossChain");
  ["🗿","🪱","🐂","👁️"].forEach((ic,i)=>{
    const n=document.createElement("span");
    n.className="px-bt-node"+(i===0?" done":i===1?" now":"");
    n.textContent=ic; bossChain.appendChild(n);
  });

  /* ---------- 小地图 ---------- */
  function drawMini(){
    mctx.fillStyle="#243a1e"; mctx.fillRect(0,0,150,150);
    const s=150/COLS;
    for(let c=0;c<COLS;c++)for(let r=0;r<ROWS;r++){
      const t=tileAt(c,r);
      if(t===2){mctx.fillStyle="#3f7fb8"; mctx.fillRect(c*s,r*s,s+1,s+1);}
      if(t===5){mctx.fillStyle="#2f5e26"; mctx.fillRect(c*s,r*s,s+1,s+1);}
    }
    mctx.fillStyle="#ff5a52";
    monsters.forEach(m=>mctx.fillRect(m.x/W*150-1.5,m.y/H*150-1.5,3,3));
    mctx.fillStyle="#54b4ff";
    npcs.forEach(n=>mctx.fillRect(n.x/W*150-1.5,n.y/H*150-1.5,3,3));
    mctx.fillStyle="#ffe98a";
    mctx.fillRect(player.x/W*150-2.5,player.y/H*150-2.5,5,5);
    mctx.strokeStyle="#8a6c3f"; mctx.lineWidth=2; mctx.strokeRect(1,1,148,148);
  }

  /* ---------- 主循环 ---------- */
  let last=performance.now();
  function pxSprite(x,y,art,size,bounce){
    ctx.font=size+"px serif";
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(art,x,y+bounce);
  }
  function loop(now){
    const dt=Math.min(48,now-last)/16.7; last=now;
    ctx.clearRect(0,0,W,H);
    for(let c=0;c<COLS;c++)for(let r=0;r<ROWS;r++) drawTile(c,r);

    /* 玩家移动 */
    const dx=player.tx-player.x, dy=player.ty-player.y, d=Math.hypot(dx,dy);
    if(d>3){
      const sp=2.6*dt;
      player.x+=dx/d*Math.min(sp,d); player.y+=dy/d*Math.min(sp,d);
      player.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);
      player.step=(player.step+dt*.25)%4;
      idle=0;
    } else { player.step=0; idle+=dt/60; }
    if(idle>.6 && st<100) st=Math.min(100,st+1.4*dt);

    /* 怪物游荡 */
    monsters.forEach(m=>{
      m.x+=m.vx*dt; m.y+=m.vy*dt;
      if(m.x<50||m.x>W-50)m.vx*=-1;
      if(m.y<50||m.y>H-50)m.vy*=-1;
      m.hit=Math.max(0,m.hit-.08*dt);
    });

    /* 投影阴影 */
    const shadow=(x,y,w)=>{ctx.fillStyle="rgba(0,0,0,.28)";ctx.beginPath();ctx.ellipse(x,y+w*.32,w*.34,w*.13,0,0,7);ctx.fill();};
    props.sort((a,b)=>a.y-b.y).forEach(p=>{
      shadow(p.x,p.y,34);
      pxSprite(p.x,p.y,p.art,30,0);
      if(p.label){
        ctx.font="11px ZCOOL KuaiLe,sans-serif"; ctx.fillStyle="rgba(0,0,0,.6)";
        const tw=ctx.measureText(p.label).width;
        ctx.fillRect(p.x-tw/2-4,p.y-26,tw+8,15);
        ctx.fillStyle="#ffe3a1"; ctx.fillText(p.label,p.x,p.y-18);
      }
    });
    npcs.sort((a,b)=>a.y-b.y).forEach(n=>{
      shadow(n.x,n.y,30); pxSprite(n.x,n.y,n.art,28,Math.sin(now/400+n.x)*2);
      ctx.font="10px ZCOOL KuaiLe,sans-serif"; ctx.fillStyle="#9fdcff";
      ctx.fillText(n.name,n.x,n.y-22);
    });
    monsters.sort((a,b)=>a.y-b.y).forEach(m=>{
      shadow(m.x,m.y,28);
      if(m.hit>0){ctx.save();ctx.globalAlpha=1;}
      pxSprite(m.x,m.y,m.art,26,0);
      if(m.hit>0){ /* 受击红闪 */
        ctx.globalCompositeOperation="source-atop";
        ctx.restore();
        ctx.fillStyle="rgba(255,60,50,"+(m.hit*.5)+")";
        ctx.fillRect(m.x-14,m.y-14,28,28);
      }
      /* 血条 */
      ctx.fillStyle="#000"; ctx.fillRect(m.x-14,m.y-24,28,5);
      ctx.fillStyle="#ff5a52"; ctx.fillRect(m.x-13,m.y-23,26*(m.hp/100),3);
    });

    /* 玩家 */
    shadow(player.x,player.y,34);
    const bob=player.step?Math.abs(Math.sin(player.step*1.6))*3:Math.sin(now/500)*1.5;
    pxSprite(player.x,player.y-2,player.art,34,-bob);
    /* 移动目标标记 */
    if(d>6){
      ctx.strokeStyle="rgba(255,233,138,.9)"; ctx.lineWidth=2;
      const rr=8+Math.sin(now/120)*3;
      ctx.strokeRect(player.tx-rr,player.ty-rr,rr*2,rr*2);
    }

    root.querySelector("#pxCoords").textContent=(player.x/8|0)+" , "+(player.y/8|0);
    updateBars();
    drawMini();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  if(globalThis.lucide && lucide.createIcons) lucide.createIcons({attrs:{width:16,height:16}});
})();

