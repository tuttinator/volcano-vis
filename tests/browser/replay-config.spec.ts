import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('replay presentation and timezone follow the loaded event configuration',async({page})=>{
 const config=JSON.parse(readFileSync('public/data/events/anak-krakatau-2026-09/event.json','utf8'));
 // A test-only presentation fixture checks configuration plumbing; it is not event evidence.
 config.timeZone='Asia/Jayapura';
 config.assets.airports='/data/test-airport-locations.json';
 const airports=JSON.parse(readFileSync('public/data/airports.json','utf8'));
 airports.airports=airports.airports.filter((a:{id:string})=>a.id==='halim');
 await page.route('**/data/test-airport-locations.json',route=>route.fulfill({json:airports}));
 config.presentation={heading:'Configuration test event',description:'Test-only event description',place:'the test region',timeZoneLabel:'WIT',advisoryCoverageNote:'Test coverage note.',airportSummary:'Test airport summary.'};
 await page.route('**/events/anak-krakatau-2026-09/event.json',route=>route.fulfill({json:config}));
 await page.goto('/?view=replay&time=1788534000000');
 await expect(page.getByRole('heading',{name:'Configuration test event'})).toBeVisible();
 await expect(page.locator('.replay-heading')).toContainText('Test-only event description');
 await expect(page.locator('.map-location')).toContainText('Infrared view of the test region');
 await expect(page.locator('.airport-evidence')).toContainText('Test airport summary.');
 await expect(page.locator('.airport-marker')).toHaveCount(1);
 await expect(page.locator('.airport-location-map')).toContainText('1 report locations have sourced airport reference points');
 await page.getByLabel('Inspect airport location').selectOption('halim');
 await expect(page.getByRole('link',{name:'Official location source'})).toHaveAttribute('href','https://hubud.kemenhub.go.id/bandara/122');
 await page.getByLabel('Event time').fill(String(Date.parse('2026-09-05T00:00:00Z')));
 await expect(page.locator('.replay-frame-status')).toContainText('09:00 WIT');
 await page.getByLabel('WIT labels').uncheck();
 await expect(page.locator('.replay-frame-status')).toContainText('00:00 UTC');
});
test('a replay without airport reports displays unknown status and keeps its clock usable',async({page})=>{
 await page.route('**/airport-status.json',route=>route.fulfill({json:{schemaVersion:1,eventId:'anak-krakatau-2026-09',airports:[],closureReport:null,sources:[],limitations:[]}}));
 await page.goto('/?view=replay');
 await expect(page.locator('.airport-evidence')).toContainText('No airport reports are supplied for this event. Operating status is unknown.');
 await expect(page.locator('.airport-marker')).toHaveCount(0);
 await page.getByLabel('Event time').fill(String(Date.parse('2026-09-05T06:30:00Z')));
 await expect(page.locator('.replay-frame-status')).toContainText('13:30 WIB');
 await expect(page.locator('.event-detail')).not.toContainText('No documented event marker');
});
