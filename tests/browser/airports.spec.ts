import {test,expect} from '@playwright/test';
test('airport locations preserve report uncertainty as the clock changes',async({page})=>{
 await page.goto('/?view=replay');
 await expect(page.locator('.airport-marker')).toHaveCount(8);
 await page.getByLabel('Inspect airport location').selectOption('soekarno-hatta');
 await expect(page.locator('.airport-map-detail')).toContainText('not established');
 await page.getByLabel('Event time').fill(String(Date.parse('2026-09-07T02:00:00Z')));
 await expect(page.locator('.airport-map-detail')).toContainText('scheduled closure');
 await page.getByLabel('Event time').fill(String(Date.parse('2026-09-07T12:00:00Z')));
 await expect(page.locator('.airport-map-detail')).toContainText('not established');
 await page.getByLabel('Event time').fill(String(Date.parse('2026-09-08T00:00:00Z')));
 await expect(page.locator('.airport-map-detail')).toContainText('Reopening has been reported');
 await expect(page.getByRole('link',{name:'Official location source'})).toHaveAttribute('href','https://hubud.kemenhub.go.id/bandara/222');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
