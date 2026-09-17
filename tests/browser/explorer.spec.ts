import {test,expect} from '@playwright/test';
test('Merapi retains source uncertainty and shows recovered polygon editions',async({page})=>{
 await page.goto('/?volcano=263250');
 await expect(page.locator('.window-note')).toContainText('12–17 March 2023');
 await page.getByLabel('VIIRS daily true-colour context').check();await expect(page.locator('.real-map')).toHaveAttribute('data-raster-url','/data/imagery/263250-2023-03-12.png');
 await page.getByText('Compare daily satellite imagery around this episode').click();await expect(page.getByRole('img',{name:'VIIRS daily true-colour image of Merapi for 2023-03-11'})).toBeVisible();
 await page.getByRole('button',{name:'Swipe comparison',exact:true}).click();await expect(page.getByLabel('Right satellite date')).toHaveValue('2023-03-17');
 await page.getByText('Compare daily satellite imagery around this episode').click();
 await expect(page.locator('.uncertainty')).toContainText('ash not identifiable');await expect(page.locator('.details h2')).toHaveText('Ash not identifiable');await expect(page.locator('.kind-badge')).toHaveText('ASH NOT IDENTIFIABLE');
 await page.getByRole('button',{name:'Next edition',exact:true}).click();
 await expect(page.locator('.uncertainty')).toHaveCount(0);
 await page.getByRole('button',{name:'Volcano comparison'}).click();
 const merapi=page.locator('.volcano-card').filter({has:page.getByRole('heading',{name:'Merapi',exact:true})});
 await expect(merapi).toContainText('No geometry');await expect(merapi).toContainText('Ash not identifiable');
 await expect(merapi).not.toContainText('Infinity');
});
test('real editions, volcano switching, forecasts and source inspection',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:'Where did the ash go?'})).toBeVisible();
 await expect(page.locator('.volcano-marker').first()).toBeVisible();
 await page.getByLabel('VIIRS daily true-colour context').check();await expect(page.locator('.raster-badge')).toContainText('Daily context');
 await page.getByRole('button',{name:'+6h forecast',exact:true}).click();await expect(page.getByRole('heading',{name:'Forecast +6 hours'})).toBeVisible();
 await page.getByLabel('Volcano',{exact:true}).selectOption('268010');await page.getByLabel('Altitude band').selectOption('200-500');await expect(page.getByText('No polygon overlaps the selected altitude band.')).toBeVisible();
 await page.getByLabel('Altitude band').selectOption('all');await page.getByLabel('Volcano',{exact:true}).selectOption('268010');
 await expect(page.locator('.map-location strong')).toHaveText('Dukono');
 await page.reload();await expect(page.getByLabel('Volcano',{exact:true})).toHaveValue('268010');await expect(page.getByRole('heading',{name:'Forecast +6 hours'})).toBeVisible();
 await page.getByRole('button',{name:'Next edition',exact:true}).click();const edition=await page.getByRole('slider',{name:'Advisory edition',exact:true}).inputValue();expect(Number(edition)).toBe(1);
 await page.getByRole('button',{name:'Sources & method'}).click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByText(/These 104 editions and 470 geometries/)).toBeVisible();await page.keyboard.press('Escape');
 await page.screenshot({path:'test-results/real-explorer.png',fullPage:true});expect(errors).toEqual([]);
});
test('editorial chapters and five-volcano comparison',async({page})=>{
 await page.goto('/?view=story');await expect(page.getByRole('heading',{name:'An archipelago of ash.'})).toBeVisible();
 await page.getByRole('button',{name:'Chapter 2',exact:true}).click();await expect(page.getByRole('heading',{name:'An estimate needs a different line.'})).toBeVisible();
 await page.getByRole('button',{name:'Chapter 4',exact:true}).click();await expect(page.getByRole('button',{name:'Open Dukono in the explorer'})).toBeVisible();
 await page.getByRole('button',{name:'06 Sept',exact:true}).click();await expect(page.locator('.satellite-essay img')).toHaveAttribute('src',/2026-09-06/);
 await page.screenshot({path:'test-results/editorial-story.png',fullPage:true});
 await page.getByRole('button',{name:'Volcano comparison'}).click();await expect(page.locator('.volcano-card')).toHaveCount(6);await expect(page.locator('.footprint')).toHaveCount(6);
 await page.getByText('Inspect the archived editions').click();await expect(page.locator('tbody tr')).toHaveCount(104);await page.getByText('Inspect the archived editions').click();
 await page.screenshot({path:'test-results/comparison.png',fullPage:true});
});
test('every presentation fits a mobile viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const view of ['explorer','story','compare','replay']){await page.goto(`/?view=${view}`);await expect(page.locator('h1')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`test-results/${view}-mobile.png`,fullPage:true});}
});

test('event replay starts on 5 September WIB, preserves gaps and airport uncertainty',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?view=replay');await expect(page.getByLabel('Event time')).toHaveValue(String(Date.parse('2026-09-04T17:00:00Z')));
 await expect(page.locator('.replay-frame-status')).toContainText('05 Sept, 00:00');
 await page.goto('/?view=replay&time='+Date.parse('2026-09-05T02:40:00Z'));
 await expect(page.locator('.replay-frame-status')).toContainText('No frame within');
 await expect(page.locator('.airport-row').first()).toContainText('Status not established');
 await page.getByRole('button',{name:'Jump to reopening of Soekarno–Hatta',exact:true}).click();
 await expect(page.locator('.airport-row').first()).toContainText('Reopening reported');
 await page.screenshot({path:'test-results/event-replay.png',fullPage:true});expect(errors).toEqual([]);
});

test('official directory filters all 127 entries and connects to the ash explorer',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?view=directory');await expect(page.getByRole('heading',{name:'Along the Ring of Fire.'})).toBeVisible();
 await expect(page.locator('.directory-entry')).toHaveCount(127);
 await page.getByLabel('Classification',{exact:true}).selectOption('C');await expect(page.locator('.directory-entry')).toHaveCount(21);
 await page.getByRole('button',{name:'Reset filters'}).click();
 await page.getByLabel('Find a volcano').fill('Sumbing');await expect(page.locator('.directory-entry')).toHaveCount(2);
 await page.getByLabel('Find a volcano').fill('Anak Krakatau');await expect(page.locator('.directory-entry')).toHaveCount(1);
 await page.locator('.directory-entry').click();await expect(page.locator('.directory-selection')).toContainText('TYPE A');
 await page.getByRole('button',{name:'Explore ash advisories'}).click();await expect(page.getByRole('heading',{name:'Where did the ash go?'})).toBeVisible();
 await page.goto('/?view=directory');await expect(page.locator('.directory-entry')).toHaveCount(127);
 await expect(page.locator('.directory-map .type-C').first()).toBeVisible();expect(await page.locator('.directory-map .type-C span').first().evaluate(el=>getComputedStyle(el).color)).toBe('rgb(166, 185, 201)');
 await page.screenshot({path:'test-results/directory-desktop.png',fullPage:false});
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/directory-mobile.png',fullPage:false});expect(errors).toEqual([]);
});

test('report evidence follows replay time instead of retaining a future marker',async({page})=>{
 await page.goto('/?view=replay');await expect(page.getByText('Even clouds below 0°C emit infrared radiation.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Jump to Negative airport paper tests reported',exact:true}).click();
 await expect(page.locator('.event-detail')).toContainText('Negative airport paper tests');
 await page.getByRole('button',{name:'Start of event',exact:true}).click();await expect(page.locator('.event-detail')).toContainText('No documented event marker');
 await page.getByRole('button',{name:'Jump to Continuous eruptive episode begins',exact:true}).click();
 await expect(page.locator('.event-detail')).toContainText('Continuous eruptive episode begins');await expect(page.locator('.event-detail')).not.toContainText('Negative airport');
});

test('replay combines advisory evidence, altitude bands and bounded display windows',async({page})=>{
 await page.goto('/?view=replay');
 await page.getByRole('button',{name:'Jump to advisory 2026/174',exact:true}).click();
 await expect(page.locator('.replay-ash-evidence')).toContainText('Observed ash position');
 await expect(page.locator('.replay-ash-evidence')).toContainText('2 altitude components');
 await page.getByLabel('Replay altitude band').selectOption('200-500');
 await expect(page.locator('.replay-ash-evidence')).toContainText('1 altitude components');
 await page.getByLabel('Fit the full ash extent').check();
 await page.getByLabel('Show advisory ash polygons').uncheck();await expect(page.locator('.replay-ash-evidence')).toContainText('overlay hidden');
 await page.goto('/?view=replay&time='+Date.parse('2026-09-05T07:10:00Z'));
 await expect(page.locator('.replay-ash-evidence')).toContainText('No eligible advisory geometry');
 await page.goto('/?view=replay&time='+Date.parse('2026-09-05T12:10:00Z'));
 await expect(page.locator('.replay-ash-evidence')).toContainText('Forecast');
});

test('satellite comparison supports swipe, keyboard, date swaps and paired views',async({page})=>{
 await page.goto('/?view=story');await page.getByRole('button',{name:'Swipe comparison',exact:true}).click();
 const slider=page.getByRole('slider',{name:'Satellite comparison divider'});await expect(slider).toHaveValue('50');
 await slider.focus();await page.keyboard.press('ArrowRight');await expect(slider).toHaveValue('51');
 await expect(page.locator('.swipe-left')).toHaveCSS('clip-path','inset(0px 49% 0px 0px)');
 await page.locator('.satellite-swipe').click({position:{x:10,y:150}});expect(Number(await slider.inputValue())).toBeLessThan(10);
 await page.getByLabel('Right satellite date').selectOption('2026-09-06');await page.getByRole('button',{name:'Swap dates',exact:true}).click();
 await expect(page.getByLabel('Left satellite date')).toHaveValue('2026-09-06');
 await slider.fill('50');const frameBox=await page.locator('.satellite-swipe').boundingBox();const imageBox=await page.locator('.swipe-left img').boundingBox();expect(Math.abs(frameBox!.height-imageBox!.height)).toBeLessThan(1);
 await page.locator('.satellite-comparison').screenshot({path:'test-results/satellite-swipe.png'});
 await page.getByRole('button',{name:'Side by side',exact:true}).click();await expect(page.locator('.satellite-split img')).toHaveCount(2);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByLabel('Right satellite date').selectOption('2026-09-06');await expect(page.getByText('Same date selected on both sides.')).toBeVisible();
});

test('Ash RGB archive switches product, retains source attribution and source gaps',async({page})=>{
 const archive=await (await page.request.get('/data/ash-rgb.json')).json();
 await page.goto('/?view=replay');await page.getByLabel('Satellite product',{exact:true}).selectOption('ash');
 await expect(page.getByRole('heading',{name:'Reading Ash RGB'})).toBeVisible();
 await page.getByRole('button',{name:'Jump to first Ash RGB scan'}).click();await expect(page.getByLabel('Event time')).toHaveValue(String(archive.frames[0].time));
 await expect(page.locator('.replay-count strong')).toHaveText(String(archive.frames.length));
 await page.getByText('Recipe and source data',{exact:true}).click();await expect(page.getByText('Not an official JMA image product.',{exact:false})).toBeVisible();
 await page.locator('.replay-layout').screenshot({path:'test-results/ash-rgb-replay.png'});
 const gap=archive.missingSourceScans?.[0];if(gap){await page.goto('/?view=replay&time='+Date.parse(gap.time));await page.getByLabel('Satellite product',{exact:true}).selectOption('ash');await expect(page.locator('.replay-frame-status')).toContainText('No frame within');}
 await page.getByLabel('Satellite product',{exact:true}).selectOption('infrared');await expect(page.getByRole('heading',{name:'Infrared brightness temperature',exact:true})).toBeVisible();
});

test('altitude cross-section follows source geometry, transect and forecast selection',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{name:'Where the altitude bands overlap.'})).toBeVisible();
 await expect(page.locator('.section-range')).toHaveCount(2);
 await page.getByLabel('Cross-section latitude').fill('10');await expect(page.locator('.section-range')).toHaveCount(0);await expect(page.locator('.section-status')).toContainText('does not intersect');
 await page.getByLabel('Cross-section latitude').fill('-6.1');
 await page.getByRole('button',{name:'+6h forecast',exact:true}).click();await expect(page.locator('.section-range.forecast')).toHaveCount(2);
 await page.getByLabel('Altitude band',{exact:true}).selectOption('200-500');await expect(page.locator('.section-range')).toHaveCount(1);
 await page.locator('.altitude-section').screenshot({path:'test-results/altitude-section.png'});
 await page.getByLabel('Volcano',{exact:true}).selectOption('268010');await expect(page.locator('.section-caveat')).toContainText('pressure-altitude');
});

test('3D altitude bands retain source semantics and survive shared-link reloads',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('.volcano-marker').first()).toBeVisible();
 await page.getByRole('button',{name:'3D altitude bands',exact:true}).click();
 await expect(page.locator('.map-presentation')).toContainText('not measured ash volumes');
 await expect(page).toHaveURL(/dimension=3d/);await page.reload();await expect(page.getByRole('button',{name:'3D altitude bands',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'+6h forecast',exact:true}).click();await expect(page.getByRole('heading',{name:'Forecast +6 hours'})).toBeVisible();
 await expect(page.locator('.volcano-marker').first()).toBeVisible();await expect(page.locator('.map-error')).toHaveCount(0);
 await page.locator('.explorer-grid').screenshot({path:'test-results/altitude-3d.png'});
 await page.getByLabel('Altitude band',{exact:true}).selectOption('200-500');await expect(page.locator('.section-range.forecast')).toHaveCount(1);
 await page.getByRole('button',{name:'2D footprints',exact:true}).click();await expect(page.locator('.map-presentation')).not.toContainText('Schematic altitude bands');expect(errors).toEqual([]);
});

test('Semeru opens its historical episode and preserves explicit missing forecasts',async({page})=>{
 await page.goto('/');await page.getByLabel('Volcano',{exact:true}).selectOption('263300');await expect(page.getByLabel('Event window')).toHaveValue('263300-2025-11');
 await expect(page.locator('.window-note')).toContainText('19–24 November 2025');
 await page.getByLabel('VIIRS daily true-colour context').check();await expect(page.locator('.real-map')).toHaveAttribute('data-raster-url','/data/imagery/263300-2025-11-19.png');await expect(page.locator('.raster-badge')).toContainText('2025-11-19');
 await page.getByRole('button',{name:'+6h forecast',exact:true}).click();await expect(page.getByText('The source explicitly marks this forecast NOT AVBL. No polygon is supplied.')).toBeVisible();
 await page.getByRole('button',{name:'Next edition',exact:true}).click();await expect(page.locator('.uncertainty')).toHaveCount(0);
 await page.getByLabel('Event window').selectOption('263300-2026-09');await page.reload();await expect(page.getByLabel('Event window')).toHaveValue('263300-2026-09');await expect(page.locator('.window-note')).not.toContainText('November');
});
