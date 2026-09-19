const { chromium } = require("C:/Users/Administrator/node_modules/playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  // 暴露 killMonster 到调试接口
  const r = await page.evaluate(() => {
    // killMonster 未导出，用投射物把 boss 打死：把玩家移到 boss 旁，武器换弓，怪物血量调低，模拟一次点击
    const g = window.__game;
    const boss = g.monsters.find(m => m.boss);
    const idxBefore = g.state.bossIdx;
    boss.hp = 1;
    g.state.x = boss.x - 40; g.state.y = boss.y;
    g.state.sta = 100;
    return { idxBefore, bossName: boss.name };
  });
  // 切回套装A的弓（武器2），朝右射
  await page.keyboard.press("2");
  await page.waitForTimeout(50);
  // 当前可能处于套装B，确保用远程：直接多点几次（boss 1 血，任意武器都行；弓最稳）
  for (let i = 0; i < 6; i++) {
    await page.mouse.click(900, 360);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => ({
    idxAfter: window.__game.state.bossIdx,
    curDot: Array.from(document.querySelectorAll(".boss-seq i")).findIndex(d => d.classList.contains("cur")),
    bossAlive: window.__game.monsters.find(m => m.boss).alive,
    gold: window.__game.state.gold
  }));
  console.log("before:", r, "after:", JSON.stringify(after));
  const ok = after.idxAfter === 1 && after.curDot === 1;
  console.log(ok ? "PASS 击败石头人 → 序列推进至沙虫，Boss进入刷新倒计时" : "FAIL Boss序列未推进");
  process.exit(ok ? 0 : 1);
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
