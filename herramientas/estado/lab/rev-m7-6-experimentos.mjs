// Experimentos de la revisión de 7.6 en UN Chrome: WAAPI, canvas, inert, touch-action, DPR emulado y ejercicios.
import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const EXP = new URL('.', import.meta.url).pathname.replace(/\/$/, '');
const LECCION = "file:///home/user/shaders-learning/modulos/07-integracion/06-proyecto-final.html";
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const conTope = (p, ms) => Promise.race([p, espera(ms).then(() => "TOPE")]);
const b = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", headless: "new", args: ["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
try {
  // ---- 1. WAAPI, canvas sin dibujar, inert, getContext tras 2d, CSS recreada ----
  {
    const p = await b.newPage();
    p.on("console", (m) => console.log("  consola", m.type(), m.text()));
    await p.goto("file://" + EXP + "/rev-m7-6-waapi.html", { waitUntil: "load" });
    await espera(1500);
    console.log("WAAPI:", JSON.stringify(await p.evaluate(() => window.R), null, 1));
    await p.screenshot({ path: EXP + "/rev-m7-6-waapi.png", clip: { x: 0, y: 0, width: 300, height: 300 } });
    const pix = await p.evaluate(async () => { return null; });
    const r1 = await p.evaluate(() => { window.__capt = document.getElementById('css').getAnimations()[0]; window.__capt.pause(); return window.__capt.playState; });
    await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await espera(300);
    const r2 = await p.evaluate(() => window.__capt.playState + ' · quedan ' + document.getElementById('css').getAnimations().length);
    await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await espera(300);
    const r3 = await p.evaluate(() => { const l = document.getElementById('css').getAnimations(); return l.length + ' · misma=' + (l[0] === window.__capt) + ' · ' + l[0].playState; });
    console.log("CSS recreada:", r1, "|", r2, "|", r3);
    await p.close();
  }
  // ---- 2. DPR emulado: devicePixelContentBoxSize ----
  for (const dpr of [2, 3]) {
    const p = await b.newPage();
    await p.setViewport({ width: 390, height: 800, deviceScaleFactor: dpr });
    await p.setContent('<canvas id="c" style="display:block;width:390px;height:300px"></canvas>');
    const r = await p.evaluate(() => new Promise((res) => {
      const ro = new ResizeObserver((e) => { const d = e[0].devicePixelContentBoxSize; res({ dpr: devicePixelRatio, disp: d ? d[0].inlineSize + "×" + d[0].blockSize : "sin dpcb", css: e[0].contentBoxSize[0].inlineSize + "×" + e[0].contentBoxSize[0].blockSize }); });
      ro.observe(document.getElementById("c"), { box: "device-pixel-content-box" });
    }));
    console.log("DPR emulado", dpr, "→", JSON.stringify(r));
    await p.close();
  }
  // ---- 3. touch-action con un gesto táctil sintético ----
  for (const ta of ["auto", "none", "pan-y"]) {
    const p = await b.newPage();
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.goto("file://" + EXP + "/rev-m7-6-touch.html", { waitUntil: "load" });
    await p.addStyleTag({ content: "#s{touch-action:" + ta + "}" });
    await espera(500);
    const cdp = await p.target().createCDPSession();
    const r = await conTope(cdp.send("Input.synthesizeScrollGesture", { x: 200, y: 600, yDistance: -400, gestureSourceType: "touch", speed: 800 }), 10000);
    await espera(800);
    console.log("touch-action", ta, "→ scrollY", await p.evaluate(() => scrollY), "eventos", await p.evaluate(() => ev.join(",")), r === "TOPE" ? "(el gesto no terminó en 10 s)" : "");
    await p.close();
  }
  // ---- 4. Ejercicios de la lección: código de partida y solución ----
  {
    const p = await b.newPage();
    await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    p.on("pageerror", (e) => console.log("  EXCEPCIÓN", e.message));
    await p.goto(LECCION, { waitUntil: "load" });
    await p.waitForFunction(() => window.Curso && Curso.listo, { timeout: 30000 });
    const pg = async (titulo) => {
      const hs = await p.$$(".playground");
      for (const h of hs) if ((await h.evaluate((el) => (el.querySelector(".pg-titulo span:nth-child(2)") || {}).textContent)) === titulo) return h;
    };
    // 7.6.1: magenta del chivato en los extremos
    {
      const h = await pg("Ejercicio 7.6.1");
      await h.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await espera(1500);
      const magenta = async (v) => {
        await h.evaluate((el, v) => { const i = el.querySelector(".pg-uniforms input[type=range]"); i.value = v; i.dispatchEvent(new Event("input")); }, v);
        await espera(2500);
        return h.evaluate((el) => { const c = el.querySelector(".pg-lienzo canvas"); const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 250 && d[i + 1] < 5 && d[i + 2] > 250) n++; return n + " de " + d.length / 4; });
      };
      console.log("7.6.1 partida: progreso 0 →", await magenta(0), "· progreso 1 →", await magenta(1));
      await h.evaluate((el) => el.querySelector(".pg-btn.solucion").click());
      await espera(2500);
      console.log("7.6.1 solución: progreso 0 →", await magenta(0), "· progreso 1 →", await magenta(1));
    }
    for (const [titulo, ms] of [["Ejercicio 7.6.2", 4000], ["Ejercicio 7.6.3", 7000], ["Ejercicio 7.6.4", 11000]]) {
      const h = await pg(titulo);
      const leer = () => h.evaluate((el) => [...el.querySelectorAll(".pg-consola > *")].map((x) => x.textContent.trim()).filter((t) => /^[✓✗]/.test(t)).join(" | "));
      await h.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await h.evaluate((el) => { el.querySelector(".pg-consola").innerHTML = ""; const b = [...el.querySelectorAll(".pg-btn")].find((x) => /Ejecutar/.test(x.textContent)); if (b) b.click(); });
      await espera(ms);
      console.log(titulo, "partida:", await leer());
      await h.evaluate((el) => { el.querySelector(".pg-consola").innerHTML = ""; el.querySelector(".pg-btn.solucion").click(); });
      await espera(ms);
      console.log(titulo, "solución:", await leer());
    }
    await p.close();
  }
} finally { await b.close(); }
