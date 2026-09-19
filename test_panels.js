const { chromium } = require("C:/Users/Administrator/node_modules/playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const out = [];

  // 全部英雄：通过弹窗点击切换后释放技能
  for (let i = 0; i < 5; i++) {
    await page.click("#hero-switch");
    await page.waitForTimeout(80);
    await page.evaluate(() => { const g=window.__game; g.state.skillCd=0; g.state.sta=100; g.state.hp=500; });
    await page.click(".hero-card:nth-child(" + (i+1) + ")");
    await page.waitForTimeout(60);
    const r = await page.evaluate(() => {
      const g = window.__game; g.castSkill();
      return { cd: g.state.skillCd, label: document.querySelector("#skill-btn .dock-label").textContent };
    });
    out.push("英雄" + i + " 技能[" + r.label + "]冷却" + (r.cd > 0 ? "OK" : "FAIL"));
  }
  await page.click("#hero-switch");
  const heroInfo = await page.evaluate(() => Array.from(document.querySelectorAll(".hero-card .hc-name")).map(e=>e.textContent));
  out.push("英雄列表(" + heroInfo.length + "): " + heroInfo.join(" / "));
  await page.click('[data-close-hero]');

  // 背包
  await page.click('.dock-btn[data-open="bag"]');
  const bag = await page.evaluate(() => ({
    cells: document.querySelectorAll(".cell").length,
    eq: document.querySelectorAll(".eq-slot").length,
    detailText: document.getElementById("bag-detail").textContent
  }));
  out.push("背包: 格子" + bag.cells + " 已装备槽" + bag.eq + " | " + bag.detailText.slice(0, 20));
  // 点击金色头盔显示装备技能
  await page.click('.cell[data-i="1"]');
  const detail = await page.evaluate(() => document.getElementById("bag-detail").textContent);
  out.push((detail.includes("装备技能") ? "PASS " : "FAIL ") + "金色品质装备技能描述: " + detail.slice(0, 30));
  await page.click("#modal-close");

  // 仓库
  await page.click('.dock-btn[data-open="storage"]');
  const st = await page.evaluate(() => document.querySelectorAll("#modal-body .cell").length);
  out.push((st === 18 ? "PASS " : "FAIL ") + "仓库格子数: " + st);
  await page.click("#modal-close");

  // 副本列表
  await page.click('.top-btn[data-open="tower"]');
  const dun = await page.evaluate(() => ({
    items: document.querySelectorAll(".dun-item").length,
    has80: document.body.innerText.includes("80 层"),
    hasBossSeq: document.body.innerText.includes("石头人")
  }));
  out.push((dun.items === 5 && dun.has80 && dun.hasBossSeq ? "PASS " : "FAIL ") +
    "副本入口5项/爬塔80层/世界Boss序列: " + JSON.stringify(dun));
  await page.click("#modal-close");

  // 宠物切换
  await page.click('.pet-slot[data-pet="2"]');
  const pet = await page.evaluate(() => document.querySelector(".pet-slot.active .pet-name").textContent);
  out.push((pet.includes("炎龙崽") ? "PASS " : "FAIL ") + "切换出战宠物: " + pet.trim());

  // 世界事件横幅
  await page.waitForTimeout(6500);
  const banner = await page.evaluate(() => !document.getElementById("event-banner").classList.contains("hidden"));
  out.push((banner ? "PASS " : "FAIL ") + "深海入侵世界事件横幅");

  console.log(out.join("\n"));
  console.log(errs.length ? "错误:\n"+errs.join("\n") : "无JS错误");
  process.exit(out.some(x=>x.startsWith("FAIL")) || errs.length ? 1 : 0);
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });

