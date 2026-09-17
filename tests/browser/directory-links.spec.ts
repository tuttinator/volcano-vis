import {test,expect} from '@playwright/test';
test('directory links preserve official type, region, search and selected entry',async({page})=>{
 await page.goto('/?view=directory');
 await page.getByLabel('Classification',{exact:true}).selectOption('B');
 await page.getByLabel('Region',{exact:true}).selectOption('Jawa');
 await page.getByLabel('Find a volcano').fill('Merbabu');
 await page.locator('.directory-entry').click();
 await expect(page.locator('.directory-selection')).toContainText('Merbabu');
 await expect(page).toHaveURL(/directoryType=B/);
 await page.reload();
 await expect(page.getByLabel('Classification',{exact:true})).toHaveValue('B');
 await expect(page.getByLabel('Region',{exact:true})).toHaveValue('Jawa');
 await expect(page.getByLabel('Find a volcano')).toHaveValue('Merbabu');
 await expect(page.locator('.directory-selection')).toContainText('Merbabu');
 await expect(page.locator('.directory-entry')).toHaveCount(1);
 await page.getByRole('button',{name:'Reset filters'}).click();
 await expect(page.locator('.directory-entry')).toHaveCount(127);
 await expect(page).not.toHaveURL(/directoryType|directoryRegion|directorySearch|directoryVolcano/);
});
test('invalid directory filters recover to the full official inventory',async({page})=>{
 await page.goto('/?view=directory&directoryType=dormant&directoryRegion=invalid&directoryVolcano=missing');
 await expect(page.locator('.directory-entry')).toHaveCount(127);
 await expect(page.locator('.directory-selection')).toHaveCount(0);
 await expect(page).not.toHaveURL(/directoryType|directoryRegion|directoryVolcano/);
});
