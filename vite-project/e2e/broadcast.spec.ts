import { test, expect } from '@playwright/test';
test('operator, caster and OBS keep separate timelines and recover', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  let dropPackets = false;
  await context.routeWebSocket('**/ws', route => {
    const upstream = route.connectToServer();
    route.onMessage(message => { if (!dropPackets) upstream.send(message); });
    upstream.onMessage(message => { if (!dropPackets) route.send(message); });
  });
  const control = await context.newPage(), caster = await context.newPage(), overlay = await context.newPage();
  const errors: string[] = [];
  for (const page of [control, caster, overlay]) page.on('pageerror', e => errors.push(e.message));
  await control.goto('/control#token=e2e-control');
  await expect(control.locator('.status')).toHaveText('Connected');
  control.on('dialog', dialog => dialog.accept());
  await control.getByRole('button', { name: 'Reset match', exact: true }).click();
  await expect(control.getByRole('button', { name: 'Reset match', exact: true })).toBeEnabled();
  await control.getByLabel('Caster delay seconds').fill('180');
  await control.getByRole('button', { name: 'Set seconds' }).click();
  await expect(control.getByRole('button', { name: 'Set seconds' })).toBeEnabled();
  await caster.goto('/caster#token=e2e-caster');
  await overlay.setViewportSize({ width: 1920, height: 1080 });
  await overlay.goto('/overlay/draft#token=e2e-overlay');
  await expect(caster.locator('.status')).toHaveText('Connected');
  await control.getByTitle('Lam / 澜', { exact: true }).click();
  await expect(control.locator('.blue .bans img')).toHaveCount(1);
  await expect(overlay.locator('.blue .bans img')).toHaveCount(1);
  await expect(caster.locator('.blue .bans img')).toHaveCount(0);
  await expect(caster.locator('.hero-grid')).toHaveCount(0);
  await control.reload();
  await expect(control.locator('.status')).toHaveText('Connected');
  await expect(control.locator('.blue .bans img')).toHaveCount(1);
  await control.getByLabel('Caster delay seconds').fill('0');
  await control.getByRole('button', { name: 'Set seconds' }).click();
  await expect(caster.locator('.blue .bans img')).toHaveCount(1);
  await control.getByRole('button', { name: 'Undo / 撤销上次比赛操作' }).click();
  await expect(overlay.locator('.blue .bans img')).toHaveCount(0);
  await expect(caster.locator('.blue .bans img')).toHaveCount(0);
  for (let i = 0; i < 18; i++) {
    await control.locator('.hero-grid button:not(:disabled)').first().click();
    await expect(control.getByRole('button', { name: 'Reset match', exact: true })).toBeEnabled();
  }
  await expect(overlay.locator('.phase')).toHaveText('DRAFT COMPLETE');
  await expect(caster.locator('.picks img')).toHaveCount(10);
  dropPackets = true;
  await expect(control.locator('.status')).not.toHaveText('Connected', { timeout: 30000 });
  dropPackets = false;
  await expect(control.locator('.status')).toHaveText('Connected', { timeout: 20000 });
  await expect(caster.locator('.status')).toHaveText('Connected', { timeout: 20000 });
  await expect(overlay.locator('.phase')).toHaveText('DRAFT COMPLETE');
  expect(await overlay.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  expect(await overlay.evaluate(() => document.documentElement.scrollWidth)).toBe(1920);
  for (const page of [control, caster, overlay]) {
    const broken = await page.locator('img').evaluateAll(images => images.filter(i => !(i as HTMLImageElement).complete || (i as HTMLImageElement).naturalWidth === 0).map(i => (i as HTMLImageElement).src));
    expect(broken).toEqual([]);
  }
  await control.screenshot({ path: 'artifacts/control.png', fullPage: true });
  await caster.screenshot({ path: 'artifacts/caster.png', fullPage: true });
  await overlay.screenshot({ path: 'artifacts/overlay.png', omitBackground: true });
  expect(errors).toEqual([]);
  await context.close();
});
