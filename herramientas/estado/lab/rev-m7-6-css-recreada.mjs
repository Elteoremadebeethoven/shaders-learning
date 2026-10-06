import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", headless: "new", args: ["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
try {
  for (const pausar of [false, true]) {
    const p = await b.newPage();
    await p.setContent(`<style>#css{width:10px;height:10px;background:red;animation:mover 3s linear infinite}
      @keyframes mover{to{transform:translateX(100px)}} @media (prefers-reduced-motion: reduce){#css{animation:none}}</style><div id="css"></div>`);
    await espera(300);
    await p.evaluate((pausar) => { window.__c = document.getElementById("css").getAnimations()[0]; if (pausar) window.__c.pause(); }, pausar);
    const ver = () => p.evaluate(() => ({ mq: matchMedia("(prefers-reduced-motion: reduce)").matches, nombre: getComputedStyle(document.getElementById("css")).animationName, capt: window.__c.playState, lista: document.getElementById("css").getAnimations().map((a) => (a === window.__c ? "capturada:" : "otra:") + a.playState).join(",") }));
    console.log("pause() =", pausar, "· antes:", JSON.stringify(await ver()));
    await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    for (const ms of [50, 500]) { await espera(ms); console.log("  reduce +" + ms + ":", JSON.stringify(await ver())); }
    await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await espera(500); console.log("  sin preferencia:", JSON.stringify(await ver()));
    await p.close();
  }
} finally { await b.close(); }
