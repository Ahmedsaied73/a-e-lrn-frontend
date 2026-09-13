'use strict';
/**
 * Regression: register credentials/PII must never appear in the URL.
 *
 * Same flaw class as the login form (see login-credentials-never-in-url.js):
 * SSR <form> with named fields (two password fields + phone number) and no
 * method defaulted to native GET pre-hydration. Fix: hydration-gated submit
 * button + method="post" backstop.
 *
 * Part 1 (no-JS context = deterministic never-hydrated form): SSR markup
 * assertions + forced submit attempts with sentinel values; none may appear
 * in any URL.
 * Part 2 (hydrated): real UI registration of a unique throwaway account
 * succeeds (lands on /) and the password/phone never appear in any URL.
 *
 * NOTE part 2 creates one user row per run in the dev DB
 * (regproof<ts>@localhost.test) — clearly-named throwaway, same as seeded
 * demo accounts.
 *
 * Run (FE server + BE :3005 must be up):
 *   node "C:/Users/Ahmed Saied/.agents/skills/playwright-skill/run.js" e2e/register-credentials-never-in-url.js
 * To target a non-default frontend (e.g. prod server on :3002):
 *   $env:FE_URL='http://localhost:3002'; node ".../run.js" e2e/register-credentials-never-in-url.js
 * (run from the frontend repo root; `playwright` resolves via the skill harness)
 */
const { chromium } = require('playwright');

const FE = process.env.FE_URL || process.argv[2] || 'http://localhost:3000';
const SENTINEL_PASS = 'RegProbe#9999';
const SENTINEL_PHONE = '01099999999';
const SENTINEL_MAIL = 'regprobe@localhost.test';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function urlWatcher(page, collect) {
  page.on('request', (req) => collect.push(req.url()));
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) collect.push(frame.url());
  });
}

function assertClean(urls, secrets, label) {
  const dirty = urls.filter((u) => secrets.some((s) => u.includes(s)));
  if (dirty.length > 0) {
    console.error(`FAIL ${label}: PII leaked into URL(s):`);
    for (const u of dirty.slice(0, 5)) console.error(`  ${u}`);
    return false;
  }
  console.log(`ok ${label}: ${urls.length} URLs observed, none contain PII`);
  return true;
}

(async () => {
  const browser = await chromium.launch();
  let ok = true;

  // ── Part 1: never-hydrated form ──────────────────────────────────────
  {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    const seen = [];
    urlWatcher(page, seen);
    await page.goto(FE + '/register', { waitUntil: 'domcontentloaded' });
    const hasForm = await page.evaluate(() => !!document.querySelector('form input[name="password"]'));
    if (!hasForm) {
      console.error('FAIL part1: SSR register form not present without JS');
      ok = false;
    } else {
      const ssrState = await page.evaluate(() => {
        const form = document.querySelector('form');
        const btn = document.querySelector('button[type="submit"]');
        return { method: form && form.getAttribute('method'), disabled: btn && btn.disabled };
      });
      console.log(`part1 SSR markup: method=${ssrState.method} submitDisabled=${ssrState.disabled}`);
      if (ssrState.disabled !== true) {
        console.error('FAIL part1: submit button not disabled in SSR HTML');
        ok = false;
      }
      if (ssrState.method !== 'post') {
        console.error('FAIL part1: form method is not post (GET backstop missing)');
        ok = false;
      }
      await page.fill('input[name="firstName"]', 'Reg');
      await page.fill('input[name="lastName"]', 'Probe');
      await page.fill('input[name="phone"]', SENTINEL_PHONE);
      await page.fill('input[name="email"]', SENTINEL_MAIL);
      await page.fill('input[name="password"]', SENTINEL_PASS);
      await page.fill('input[name="confirmPassword"]', SENTINEL_PASS);
      await page.click('button[type="submit"]', { force: true }).catch(() => {});
      await page.press('input[name="confirmPassword"]', 'Enter');
      await sleep(2000);
      ok = assertClean(seen, [SENTINEL_PASS, SENTINEL_PHONE, SENTINEL_MAIL, 'password='], 'part1 never-hydrated') && ok;
    }
    await ctx.close();
  }

  // ── Part 2: hydrated UI registration still works, PII stays out of URLs ──
  {
    const ts = Date.now().toString().slice(-8);
    const email = `regproof${ts}@localhost.test`;
    const phone = `015${ts}`;
    const pass = `RegProof#${ts}`;
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const seen = [];
    urlWatcher(page, seen);
    await page.goto(FE + '/register', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.innerText.length > 200, null, { timeout: 20000 });
    await page.waitForFunction(
      () => {
        const b = document.querySelector('button[type="submit"]');
        return b && !b.disabled;
      },
      null,
      { timeout: 20000 },
    );
    await page.fill('input[name="firstName"]', 'Reg');
    await page.fill('input[name="lastName"]', 'Proof');
    await page.fill('input[name="phone"]', phone);
    await page.fill('input[name="email"]', email);
    await page.selectOption('select[name="grade"]', 'FIRST_SECONDARY');
    await page.fill('input[name="password"]', pass);
    await page.fill('input[name="confirmPassword"]', pass);
    await page.click('button[type="submit"]:not([disabled])');
    await page.waitForURL((url) => url.pathname === '/', { timeout: 25000 });
    console.log(`ok part2 registration succeeded for ${email}, landed on /`);
    ok = assertClean(seen, [pass, phone, email, 'password='], 'part2 hydrated') && ok;
    await ctx.close();
  }

  await browser.close();
  console.log(ok ? 'PASS register-credentials-never-in-url' : 'FAIL register-credentials-never-in-url');
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('ERR', e.message); process.exit(2); });
