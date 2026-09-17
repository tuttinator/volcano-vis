import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('expanded historical imagery and airport evidence are accessible',async({page})=>{
 await page.goto('/?volcano=263250');
 await page.getByText('Compare daily satellite imagery around this episode').click();
 await page.getByRole('button',{name:'Swipe comparison',exact:true}).click();
 await page.locator('.satellite-comparison').scrollIntoViewIfNeeded();
 let results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
 expect(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
 await page.goto('/?view=replay');
 await page.getByLabel('Inspect airport location').selectOption('halim');
 await page.locator('.airport-location-map').scrollIntoViewIfNeeded();
 results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
 expect(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
});
for(const view of ['explorer','story','compare','replay','directory'])test(`${view} has no automated WCAG A/AA violations`,async({page})=>{
 await page.goto(`/?view=${view}`);
 await expect(page.locator('h1')).toBeVisible();
 await expect(page.locator(view==='compare'?'.footprint':'.volcano-marker').first()).toBeVisible();
 const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
 expect(results.violations.map(v=>({id:v.id,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
});
test('methodology dialog is named and returns keyboard focus',async({page})=>{
 await page.goto('/');
 const trigger=page.getByRole('button',{name:'Sources & method'});
 await trigger.focus();await page.keyboard.press('Enter');
 await expect(page.getByRole('dialog')).toBeVisible();
 const results=await new AxeBuilder({page}).include('dialog').analyze();
 expect(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
 await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
});
