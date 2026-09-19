const { chromium } = require("C:/Users/Administrator/node_modules/playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  // 左半屏按下摇杆
  await page.touchscreen.tap(100, 650);
  await page.waitForTimeout(200);
  const mobile = await page.evaluate(() => ({
    touch: document.body.classList.contains("touch"),
    joyVisible: getComputedStyle(document.getElementById("joy-base")).display,
    panelsFit: ["hero-panel","weapon-bar","action-dock","top-bar"].map(id => {
      const r = document.getElementById(id).getBoundingClientRect();
      return { id, ok: r.left>=-1 && r.right<=innerWidth+1 && r.bottom<=innerHeight+1 && r.top>=-1,
               l:r.left|0,t:r.top|0,r:r.right|0,b:r.bottom|0 };
    }),
    weaponW: document.getElementById("weapon-bar").getBoundingClientRect().width
  }));
  console.log(JSON.stringify(mobile, null, 1));
  await page.screenshot({ path: "shot_mobile.png" });
  console.log(errors.length ? "ERRORS:\n"+errors.join("\n") : "无脚本错误");
  await browser.close();
})();
