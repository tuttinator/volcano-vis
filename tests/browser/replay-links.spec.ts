import {test,expect} from '@playwright/test';
test('replay share links retain layer filters, timezone and selected time',async({page})=>{
 await page.goto('/?view=replay');
 await page.getByLabel('Replay altitude band').selectOption('100-200');
 await page.getByLabel('Show advisory ash polygons').uncheck();
 await page.getByLabel('Fit the full ash extent').check();
 await page.getByLabel('WIB labels').uncheck();
 const time=String(Date.parse('2026-09-05T06:30:00Z'));
 await page.getByLabel('Event time').fill(time);
 await expect(page).toHaveURL(/replayBand=100-200/);
 await page.reload();
 await expect(page.getByLabel('Replay altitude band')).toHaveValue('100-200');
 await expect(page.getByLabel('Show advisory ash polygons')).not.toBeChecked();
 await expect(page.getByLabel('Fit the full ash extent')).toBeChecked();
 await expect(page.getByLabel('WIB labels')).not.toBeChecked();
 await expect(page.getByLabel('Event time')).toHaveValue(time);
 await expect(page.locator('.replay-ash-evidence')).toContainText('Advisory overlay hidden.');
 await expect(page.locator('.replay-frame-status')).toContainText('06:30 UTC');
});
test('unsupported replay settings recover to usable defaults',async({page})=>{
 await page.goto('/?view=replay&replayBand=invalid&replayZone=invalid&replayAsh=invalid&replayExtent=invalid');
 await expect(page.getByLabel('Replay altitude band')).toHaveValue('all');
 await expect(page.getByLabel('WIB labels')).toBeChecked();
 await expect(page.getByLabel('Show advisory ash polygons')).toBeChecked();
 await expect(page.getByLabel('Fit the full ash extent')).not.toBeChecked();
 await expect(page).toHaveURL(/replayBand=all/);
});
