const { chromium } = require("C:/Users/Administrator/node_modules/playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const results = [];
  const check = (name, cond, extra) => results.push((cond ? "PASS " : "FAIL ") + name + (extra ? " -> " + extra : ""));

  const w1 = await page.evaluate(() => {
    window.__game.switchWeapon(2);
    return document.querySelector(".weapon-slot.active .w-name").textContent.trim();
  });
  check("切换到第3把武器", w1.includes("法杖"), w1);

  await page.click("#loadout-swap");
  await page.waitForTimeout(100);
  const w2 = await page.evaluate(() => document.querySelector(".weapon-slot.active .w-name").textContent.trim());
  check("一键换装切换整套武器", w2.includes("碎山者"), w2);

  const healTest = await page.evaluate(async () => {
    const g = window.__game;
    g.state.hp = 100;
    g.castSkill();
    await new Promise(r => setTimeout(r, 100));
    return { hp: g.state.hp, cd: g.state.skillCd > 0, shield: g.state.shield };
  });
  check("修女技能回血+护盾+冷却", healTest.hp === 300 && healTest.cd && healTest.shield >= 200, JSON.stringify(healTest));

  await page.click("#hero-switch");
  await page.waitForTimeout(300);
  const summonTest = await page.evaluate(async () => {
    document.querySelectorAll(".hero-card")[3].click();
    await new Promise(r => setTimeout(r, 50));
    window.__game.castSkill();
    await new Promise(r => setTimeout(r, 100));
    return window.__game.summons.length;
  });
  check("亡灵术师召唤恶魔", summonTest >= 1, "召唤物=" + summonTest);

  const turretTest = await page.evaluate(async () => {
    document.getElementById("hero-modal").classList.remove("hidden");
    await new Promise(r => setTimeout(r, 50));
    document.querySelectorAll(".hero-card")[4].click();
    await new Promise(r => setTimeout(r, 50));
    window.__game.castSkill();
    await new Promise(r => setTimeout(r, 100));
    return !!window.__game.turret;
  });
  check("工程师部署炮台", turretTest);

  await page.evaluate(() => {
    const g = window.__game;
    document.getElementById("hero-modal").classList.remove("hidden");
  });
  await page.waitForTimeout(50);
  await page.evaluate(() => document.querySelectorAll(".hero-card")[0].click());
  await page.waitForTimeout(50);

  await page.evaluate(() => {
    const g = window.__game;
    const m = g.monsters.find(x => x.alive && !x.boss);
    m.hp = 3;
    g.state.sta = 100;
    g.state.x = m.x - 20; g.state.y = m.y;
  });
  await page.mouse.click(700, 360);
  await page.waitForTimeout(600);
  const killed = await page.evaluate(() => {
    const g = window.__game;
    return { drops: g.drops.length, deadCount: g.monsters.filter(m => !m.alive && !m.boss).length };
  });
  check("击杀怪物产生掉落", killed.deadCount >= 1 && killed.drops >= 1, JSON.stringify(killed));

  const loot = await page.evaluate(async () => {
    const g = window.__game;
    const before = { gold: g.state.gold, hp: g.state.hp, keys: g.state.keys, gem: g.state.gem };
    if (g.drops[0]) { g.state.x = g.drops[0].x; g.state.y = g.drops[0].y; }
    for (let i = 0; i < 60 && g.drops.length; i++) await new Promise(r => setTimeout(r, 50));
    const gained = g.state.gold !== before.gold || g.state.hp !== before.hp ||
                   g.state.keys !== before.keys || g.state.gem !== before.gem;
    return { gained, dropsLeft: g.drops.length };
  });
  check("掉落吸附并拾取（金币/药水/钥匙/钻石）", loot.gained && loot.dropsLeft === 0, JSON.stringify(loot));

  const chestTest = await page.evaluate(() => {
    const g = window.__game;
    const c = g.chests.find(x => !x.open);
    g.state.keys = 5;
    const before = { gold: g.state.gold, gem: g.state.gem };
    g.state.x = c.x; g.state.y = c.y;
    g.tryOpenChest();
    const rewarded = g.state.gold > before.gold || g.state.gem > before.gem || g.state.keys >= 5;
    const keyConsumed = g.state.keys >= 4 && g.state.keys <= 7;
    return { opened: c.open, keyConsumed, rewarded, keys: g.state.keys };
  });
  check("开启宝箱：消耗钥匙并获得随机奖励", chestTest.opened && chestTest.keyConsumed && chestTest.rewarded, JSON.stringify(chestTest));

  const seq = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".boss-seq i")).map(d => d.classList.contains("cur")));
  check("世界Boss序列指示器（石头人→沙虫→牛头→独眼）", seq.length === 4 && seq[0], JSON.stringify(seq));

  const staTest = await page.evaluate(() => { window.__game.state.sta = 0; return window.__game.state.sta; });
  check("体能归零状态正确", staTest === 0);

  console.log(results.join("\n"));
  console.log(errors.length ? "JS错误:\n" + errors.join("\n") : "无JS错误");
  const failed = results.filter(r => r.startsWith("FAIL"));
  process.exit(failed.length || errors.length ? 1 : 0);
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });

