// 7.6, caja hack «Dale tus animaciones CSS al reloj» (agente m7b, sesión 4; versión para el Mac de
// rev-m7-6-css-recreada.mjs). ¿Qué le pasa a una CSSAnimation capturada cuando una media query le quita la
// animación (animation: none) y se la vuelve a poner? Tres casos: sin tocar, pausada con pause() y pausada +
// currentTime escrito cada 16 ms (lo que hace hero.js). Sondeo a 50 y 500 ms.
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
try {
  console.log("Chrome", await b.version());
  for (const modo of ["sin tocar", "pause()", "pause() + currentTime cada 16 ms"]) {
    const p = await b.newPage();
    await p.setContent(`<style>#css{width:10px;height:10px;background:red;animation:mover 3s linear infinite}
      @keyframes mover{to{transform:translateX(100px)}} @media (prefers-reduced-motion: reduce){#css{animation:none}}</style><div id="css"></div>`);
    await espera(300);
    await p.evaluate((modo) => {
      const el = document.getElementById("css");
      window.__c = el.getAnimations()[0];
      if (modo !== "sin tocar") window.__c.pause();
      if (modo.includes("currentTime")) { let ms = 0; setInterval(() => { ms += 16; window.__c.currentTime = ms % 3000; }, 16); }
    }, modo);
    const ver = () => p.evaluate(() => {
      const el = document.getElementById("css");
      return {
        mq: matchMedia("(prefers-reduced-motion: reduce)").matches,
        animationName: getComputedStyle(el).animationName,
        capturada: window.__c.playState + "@" + Math.round(window.__c.currentTime ?? -1),
        lista: el.getAnimations().map((a) => (a === window.__c ? "capturada:" : "otra:") + a.playState).join(",") || "(vacía)",
        transform: getComputedStyle(el).transform,
      };
    });
    console.log(`\n${modo} · antes:`, JSON.stringify(await ver()));
    await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    for (const ms of [50, 500]) { await espera(ms); console.log(`  reduce +${ms}:`, JSON.stringify(await ver())); }
    await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await espera(500); console.log("  sin preferencia +500:", JSON.stringify(await ver()));
    await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await espera(500); console.log("  reduce otra vez +500:", JSON.stringify(await ver()));
    await p.close();
  }
} finally { await b.close(); }
