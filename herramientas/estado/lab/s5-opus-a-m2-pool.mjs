// Sesión 5, opus-a (2.8, ejemplo 2.8.1): simulación de N partículas guardadas como array de objetos (AoS) o como
// Float32Array por campo (SoA), la misma física que la lección (atracción con softening, rozamiento, envoltura).
// Método (trampa de la CPU en frío, GUIA §5.6): en una página headless (Chrome 154, M1), para cada caso 1 s de
// calentamiento con el mismo trabajo y, sin pausa, 100 llamadas seguidas cronometradas una a una → mediana; tres tandas
// alternando el orden AoS/SoA. Uso, desde herramientas/:
//   node turnos.mjs --agente opus-a --motivo "…" -- node estado/lab/s5-opus-a-m2-pool.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new", protocolTimeout: 600000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
try {
  const page = await nav.newPage();
  await page.setContent("<p>lab</p>");
  const r = await page.evaluate(() => {
    const W = 1000, H = 700, EPS2 = 900, F = 2.5e6, dt = 1 / 60, roz = Math.exp(-0.8 * dt), ax0 = 500, ay0 = 350;
    const crearAoS = (n) => Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 100, vy: (Math.random() - 0.5) * 100 }));
    function crearSoA(n) { const o = { n, x: new Float32Array(n), y: new Float32Array(n), vx: new Float32Array(n), vy: new Float32Array(n) }; for (let i = 0; i < n; i++) { o.x[i] = Math.random() * W; o.y[i] = Math.random() * H; o.vx[i] = (Math.random() - 0.5) * 100; o.vy[i] = (Math.random() - 0.5) * 100; } return o; }
    function simAoS(a) { for (let i = 0; i < a.length; i++) { const p = a[i]; const dx = ax0 - p.x, dy = ay0 - p.y, d2 = dx * dx + dy * dy + EPS2, f = F / (d2 * Math.sqrt(d2)); p.vx = (p.vx + dx * f * dt) * roz; p.vy = (p.vy + dy * f * dt) * roz; p.x += p.vx * dt; p.y += p.vy * dt; if (p.x < 0) p.x += W; else if (p.x >= W) p.x -= W; if (p.y < 0) p.y += H; else if (p.y >= H) p.y -= H; } }
    function simSoA(o) { const x = o.x, y = o.y, vx = o.vx, vy = o.vy; for (let i = 0; i < o.n; i++) { const dx = ax0 - x[i], dy = ay0 - y[i], d2 = dx * dx + dy * dy + EPS2, f = F / (d2 * Math.sqrt(d2)); vx[i] = (vx[i] + dx * f * dt) * roz; vy[i] = (vy[i] + dy * f * dt) * roz; x[i] += vx[i] * dt; y[i] += vy[i] * dt; if (x[i] < 0) x[i] += W; else if (x[i] >= W) x[i] -= W; if (y[i] < 0) y[i] += H; else if (y[i] >= H) y[i] -= H; } }
    const med = (v) => { const s = [...v].sort((a, b) => a - b); return +s[s.length >> 1].toFixed(2); };
    function medir(fn) {
      const t0 = performance.now(); while (performance.now() - t0 < 1000) fn();       // calentar, sin pausa
      const v = []; for (let k = 0; k < 100; k++) { const t = performance.now(); fn(); v.push(performance.now() - t); }
      return med(v);
    }
    const out = [];
    for (const n of [100000, 400000]) {
      const a = crearAoS(n), o = crearSoA(n);
      for (let tanda = 0; tanda < 3; tanda++) {
        const orden = tanda % 2 ? [["SoA", () => simSoA(o)], ["AoS", () => simAoS(a)]] : [["AoS", () => simAoS(a)], ["SoA", () => simSoA(o)]];
        for (const [nom, fn] of orden) out.push(`${n} ${nom} tanda ${tanda + 1}: mediana ${medir(fn)} ms`);
      }
    }
    return out;
  });
  console.log(r.join("\n"));
  console.log(await nav.version());
} finally { await nav.close(); }
