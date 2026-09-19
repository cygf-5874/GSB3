const { chromium } = require("C:/Users/Administrator/node_modules/playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("pageerror", e => errors.push("PAGEERROR: " + e.message));
  page.on("console", m => { if (m.type() === "error") errors.push("CONSOLE: " + m.text()); });
  await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "shot_main.png" });
  // 模拟移动
  await page.keyboard.down("d");
  await page.waitForTimeout(800);
  await page.keyboard.up("d");
  // 切换武器
  await page.keyboard.press("2");
  await page.waitForTimeout(200);
  // 攻击：鼠标点世界
  await page.mouse.move(640, 400);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await page.mouse.up();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "shot_combat.png" });
  // 英雄技能
  await page.keyboard.press("q");
  await page.waitForTimeout(300);
  // 背包
  await page.keyboard.press("i");
  await page.waitForTimeout(400);
  await page.screenshot({ path: "shot_bag.png" });
  await page.keyboard.press("Escape");
  await page.click("#modal-close");
  await page.waitForTimeout(200);
  // 英雄面板
  await page.click("#hero-switch");
  await page.waitForTimeout(400);
  await page.screenshot({ path: "shot_heroes.png" });
  // 副本
  await page.click('[data-close-hero]');
  await page.click('.top-btn[data-open="dungeon"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: "shot_dungeon.png" });
  console.log(errors.length ? errors.join("\n") : "NO RUNTIME ERRORS");
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
