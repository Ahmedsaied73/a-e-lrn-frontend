'use strict';
/**
 * Regression: login credentials must never appear in the URL.
 *
 * Background: the login <form> SSR-renders with named fields. Before React
 * hydrates, no onSubmit handler is attached, so a click/Enter natively
 * submits the form — default method GET — leaking email+password into the
 * URL (history, proxy logs). The fix: hydration-gated submit button +
 * method="post" backstop.
 *
 * Part 1 (no-JS context = deterministic never-hydrated form): fill with
 * sentinel credentials, submit via click AND via Enter, assert the sentinels
 * never appear in any URL.
 * Part 2 (hydrated): real UI login succeeds (no behavior change) and the
 * real password never appears in any navigated/requested URL.
 *
 * Run (FE server + BE :3005 must be up):
 *   node "C:/Users/Ahmed Saied/.agents/skills/playwright-skill/run.js" e2e/login-credentials-never-in-url.js
 * To target a non-default frontend (e.g. prod server on :3002):
 *   $env:FE_URL='http://localhost:3002'; node ".../run.js" e2e/login-credentials-never-in-url.js
 * (run from the frontend repo root; `playwright` resolves via the skill harness)
 */
const { chromium } = require('playwright');

const FE = process.env.FE_URL || process.argv[2] || 'http://localhost:3000';
const SENTINEL_EMAIL = 'leakprobe@localhost.test';
const SENTINEL_PASS = 'LeakProbe#9999';
const REAL_EMAIL = 'grader-demo@localhost.test';
const REAL_PASS = 'GraderDemo#2026';
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
    console.error(`FAIL ${label}: credentials leaked into URL(s):`);
    for (const u of dirty.slice(0, 5)) console.error(`  ${u}`);
    return false;
  }
  console.log(`ok ${label}: ${urls.length} URLs observed, none contain credentials`);
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
    await page.goto(FE + '/login', { waitUntil: 'domcontentloaded' });
    const hasForm = await page.evaluate(() => !!document.querySelector('form input[name="email"]'));
    if (!hasForm) {
      console.error('FAIL part1: SSR login form not present without JS');
      ok = false;
    } else {
      // Guard 1: SSR markup must render the submit button DISABLED, so a
      // pre-hydration user can neither click it nor Enter-submit through it.
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
      // Guard 2: even forcing the events, nothing submittable may leak.
      // force-click bypasses actionability (a disabled button still swallows
      // the click); Enter must not implicitly submit without an enabled button.
      await page.fill('input[name="email"]', SENTINEL_EMAIL);
      await page.fill('input[name="password"]', SENTINEL_PASS);
      await page.click('button[type="submit"]', { force: true }).catch(() => {});
      await page.press('input[name="password"]', 'Enter');
      await sleep(2000);
      const stayed = page.url() === FE + '/login' || page.url() === FE + '/login/';
      if (!stayed) console.log(`part1 note: navigated to ${page.url()} (asserting no credentials in it)`);
      ok = assertClean(seen, [SENTINEL_EMAIL, SENTINEL_PASS, 'password='], 'part1 never-hydrated') && ok;
    }
    await ctx.close();
  }

  // ── Part 2: hydrated UI login still works, password stays out of URLs ──
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const seen = [];
    urlWatcher(page, seen);
    await page.goto(FE + '/login', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.innerText.length > 200, null, { timeout: 20000 });
    // Submit button must start disabled (hydration guard) and enable after hydrate.
    await page.waitForFunction(
      () => {
        const b = document.querySelector('button[type="submit"]');
        return b && !b.disabled;
      },
      null,
      { timeout: 20000 },
    );
    await page.fill('input[name="email"]', REAL_EMAIL);
    await page.fill('input[name="password"]', REAL_PASS);
    await page.click('button:has-text("تسجيل الدخول")');
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 });
    console.log(`ok part2 login succeeded, landed on ${page.url()}`);
    ok = assertClean(seen, [REAL_PASS, 'password='], 'part2 hydrated') && ok;
    await ctx.close();
  }

  await browser.close();
  console.log(ok ? 'PASS login-credentials-never-in-url' : 'FAIL login-credentials-never-in-url');
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('ERR', e.message); process.exit(2); });
