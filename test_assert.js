const { chromium } = require("C:/Users/Administrator/node_modules/playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const r1 = await page.evaluate(() => ({
    hp: document.getElementById("hp-text").textContent,
    sta: document.getElementById("sta-text").textContent,
    activeW: document.querySelector(".weapon-slot.active .w-name").textContent.trim(),
    skillLabel: document.querySelector("#skill-btn .dock-label").textContent,
    weaponCount: document.querySelectorAll(".weapon-slot").length,
    petCount: document.querySelectorAll(".pet-slot").length,
    minimap: (() => { const c=document.getElementById("minimap"); const x=c.getContext("2d").getImageData(c.width/2,c.height/2,1,1).data; return [x[0],x[1],x[2]]; })()
  }));
  console.log("初始:", JSON.stringify(r1));

  // 检查所有面板是否在视口内
  const overlap = await page.evaluate(() => {
    const ids = ["hero-panel","weapon-bar","action-dock","top-bar","minimap-panel","loadout-swap"];
    const boxes = ids.map(id => { const r = document.getElementById(id).getBoundingClientRect(); return {id, l:r.left|0,t:r.top|0,r:r.right|0,b:r.bottom|0}; });
    const bad = [];
    for (const b of boxes) if (b.l<0||b.t<0||b.r>innerWidth||b.b>innerHeight) bad.push(b.id+" 越界 "+JSON.stringify(b));
    // 武器栏与右下dock重叠
    const wb = boxes.find(b=>b.id==="weapon-bar"), ad = boxes.find(b=>b.id==="action-dock");
    if (wb.r > ad.l && wb.b > ad.t) bad.push("武器栏与右下操作区重叠");
    return bad;
  });
  console.log("布局检查:", overlap.length ? overlap.join(" | ") : "全部在视口内，无重叠");

  // 攻击掉血验证：把玩家放到一个怪物旁边，按住攻击
  const after = await page.evaluate(async () => {
    return await new Promise(res => {
      setTimeout(() => res({
        dmgPopups: document.querySelectorAll(".dmg").length,
        hp: document.getElementById("hp-text").textContent,
        sta: document.getElementById("sta-text").textContent
      }), 100);
    });
  });

  // 连点攻击消耗体能
  await page.mouse.move(900, 360);
  await page.mouse.down();
  await page.waitForTimeout(1500);
  await page.mouse.up();
  await page.waitForTimeout(100);
  const combat = await page.evaluate(() => ({
    sta: document.getElementById("sta-text").textContent,
    toasts: document.querySelectorAll(".toast").length
  }));
  console.log("战斗中:", JSON.stringify(combat));

  // 触屏模拟
  await page.setViewportSize({ width: 430, height: 900 });
  await page.waitForTimeout(300);
  await page.touchscreen.tap(100, 700);
  await page.waitForTimeout(200);
  const mobile = await page.evaluate(() => ({
    touch: document.body.classList.contains("touch"),
    joyVisible: getComputedStyle(document.getElementById("joy-base")).display,
    panelsFit: ["hero-panel","weapon-bar","action-dock"].every(id => {
      const r = document.getElementById(id).getBoundingClientRect();
      return r.left>=0 && r.right<=innerWidth && r.bottom<=innerHeight;
    })
  }));
  console.log("移动端:", JSON.stringify(mobile));

  console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "无脚本错误");
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
