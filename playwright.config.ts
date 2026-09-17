import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser', fullyParallel:false, workers:1,
 use:{baseURL:'http://127.0.0.1:4180',viewport:{width:1440,height:1000},launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}},
 webServer:{command:process.env.TEST_PRODUCTION ? 'npm run preview -- --port 4180 --strictPort' : 'npm run dev -- --port 4180 --strictPort',url:'http://127.0.0.1:4180',reuseExistingServer:false},
});
