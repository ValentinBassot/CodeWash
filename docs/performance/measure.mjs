import { chromium } from 'playwright-core';

const runs = Number(process.argv[2] || 5);
const throttle = Number(process.argv[3] || 1);
const delayFonts = Number(process.argv[4] || 0);
const targets = process.argv.slice(5).map((t) => t.split('='));

const median = (a) => {
    const s = [...a].sort((x, y) => x - y);
    return s[Math.floor(s.length / 2)];
};

const once = async (browser, url) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
    await cdp.send('Performance.enable');
    const reqs = [];
    page.on('response', async (r) => {
        const len = Number(r.headers()['content-length'] || 0);
        reqs.push({ url: r.url(), type: r.request().resourceType(), len });
    });
    const fonts = async (r) => {
        if (delayFonts) await new Promise((x) => setTimeout(x, delayFonts));
        await r.abort();
    };
    await page.route('**/fonts.googleapis.com/**', fonts);
    await page.route('**/fonts.gstatic.com/**', fonts);
    await page.addInitScript(() => {
        window.__lt = [];
        new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(e.duration))).observe({
            type: 'longtask',
            buffered: true,
        });
        window.__ready = 0;
        window.__first = 0;
        new MutationObserver(() => {
            const r = document.getElementById('root');
            if (!window.__first && r && r.children.length) window.__first = performance.now();
            if (!window.__ready && document.querySelector('[aria-label="Open achievements"]'))
                window.__ready = performance.now();
        }).observe(document, { childList: true, subtree: true });
        window.__fcp = 0;
        new PerformanceObserver((l) =>
            l.getEntries().forEach((e) => {
                if (e.name === 'first-contentful-paint') window.__fcp = e.startTime;
            }),
        ).observe({ type: 'paint', buffered: true });
    });
    const t0 = Date.now();
    await page.goto(url, { waitUntil: 'commit' });
    await page.waitForSelector('[aria-label="Open achievements"]', { timeout: 60000 });
    const interactive = await page.evaluate(() => window.__ready);
    const first = await page.evaluate(() => window.__first);
    await page.waitForLoadState('load');
    const nav = await page.evaluate(() => {
        const n = performance.getEntriesByType('navigation')[0];
        return { dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd, fcp: window.__fcp };
    });
    await page.waitForTimeout(3500);
    const atIdle = reqs.length;
    const startup = {
        interactive,
        first,
        fcp: nav.fcp,
        load: nav.load,
        requests: atIdle,
        bytes: reqs.reduce((a, r) => a + r.len, 0),
        images: reqs.filter((r) => r.type === 'image').length,
        media: reqs.filter((r) => /\.wav/.test(r.url)).length,
        js: reqs.filter((r) => r.type === 'script').length,
        longtasks: await page.evaluate(() => window.__lt.reduce((a, b) => a + b, 0)),
    };
    const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
    const menu = await page.evaluate(
        () =>
            new Promise((res) => {
                const b = document.querySelector('[aria-label="Open achievements"]');
                const t = performance.now();
                b.click();
                requestAnimationFrame(() =>
                    requestAnimationFrame(() => {
                        const frame = performance.now() - t;
                        const d = document.querySelector('[role="dialog"][aria-label="Achievements"]');
                        res({ toPaint: frame, open: d ? !d.inert : false });
                    }),
                );
            }),
    );
    await page.waitForTimeout(600);
    const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
    menu.script = (m1.ScriptDuration - m0.ScriptDuration) * 1000;
    menu.layout = (m1.LayoutDuration - m0.LayoutDuration) * 1000;
    menu.style = (m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000;
    menu.requestsAfter = reqs.length - atIdle;
    await page.evaluate(() => document.querySelector('.fixed.inset-0.bg-black\\/50')?.click());
    await page.waitForTimeout(600);
    const c0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
    const fps = await page.evaluate(
        () =>
            new Promise((res) => {
                const frames = [];
                let last = performance.now();
                const start = last;
                let clicks = 0;
                const next = document.querySelector('[aria-label="Next skill"]');
                const iv = setInterval(() => {
                    next.click();
                    clicks++;
                }, 600);
                const loop = (now) => {
                    frames.push(now - last);
                    last = now;
                    if (now - start < 4000) requestAnimationFrame(loop);
                    else {
                        clearInterval(iv);
                        const s = [...frames].sort((a, b) => a - b);
                        res({
                            fps: frames.length / ((now - start) / 1000),
                            p95: s[Math.floor(s.length * 0.95)],
                            max: s[s.length - 1],
                            over50: frames.filter((f) => f > 50).length,
                        });
                    }
                };
                requestAnimationFrame(loop);
            }),
    );
    const c1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
    fps.cpuMsPerSec = ((c1.TaskDuration - c0.TaskDuration) * 1000) / 4;
    fps.domNodes = c1.Nodes;
    await ctx.close();
    return { startup, menu, fps };
};

const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] });
const results = Object.fromEntries(targets.map(([l]) => [l, []]));
for (let i = 0; i < runs; i++) for (const [l, u] of targets) results[l].push(await once(browser, u));
await browser.close();
const agg = (all, f) => {
    const v = all.map(f);
    return { med: +median(v).toFixed(1), min: +Math.min(...v).toFixed(1) };
};
const out = {};
for (const [l, all] of Object.entries(results)) {
    out[l] = {
        throttle,
        runs,
        delayFonts,
        interactiveMs: agg(all, (r) => r.startup.interactive),
        fcpMs: agg(all, (r) => r.startup.fcp),
        requests: agg(all, (r) => r.startup.requests),
        transferKB: agg(all, (r) => r.startup.bytes / 1024),
        scripts: agg(all, (r) => r.startup.js),
        longtaskMs: agg(all, (r) => r.startup.longtasks),
        menuToPaintMs: agg(all, (r) => r.menu.toPaint),
        menuScriptMs: agg(all, (r) => r.menu.script),
        menuStyleMs: agg(all, (r) => r.menu.style),
        menuOpened: all.every((r) => r.menu.open),
        fps: agg(all, (r) => r.fps.fps),
        frameP95: agg(all, (r) => r.fps.p95),
        slowFrames: agg(all, (r) => r.fps.over50),
        cpuMsPerSec: agg(all, (r) => r.fps.cpuMsPerSec),
        domNodes: agg(all, (r) => r.fps.domNodes),
    };
}
console.log(JSON.stringify(out, null, 2));
