// Reproduce las cifras de «rotacional frente a gradiente» con el gemelo en JS de l75-particulas.js
import fs from "fs";
const src = fs.readFileSync("/home/user/shaders-learning/modulos/07-integracion/recursos/l75-particulas.js", "utf8");
globalThis.window = globalThis; globalThis.Curso = {};
eval(src);
const L = globalThis.L75;
const A = 1000 / 600, N = 20000, dt = 1 / 60, CX = 40, CY = 24;
function stats(xs, ys) {
  const c = new Int32Array(CX * CY);
  for (let i = 0; i < N; i++) {
    const gx = Math.min(CX - 1, Math.floor((xs[i] + A) / (2 * A) * CX));
    const gy = Math.min(CY - 1, Math.floor((ys[i] + 1) / 2 * CY));
    c[gy * CX + gx]++;
  }
  let ocup = 0, s = 0, s2 = 0;
  for (const v of c) { if (v > 0) ocup++; s += v; s2 += v * v; }
  const m = s / c.length, cv = Math.sqrt(s2 / c.length - m * m) / m;
  const ord = Array.from(c).sort((a, b) => b - a);
  const k = Math.round(0.05 * c.length); let top = 0; for (let i = 0; i < k; i++) top += ord[i];
  return { ocupadas: (100 * ocup / c.length).toFixed(1) + "%", cv: cv.toFixed(2), top5: (100 * top / N).toFixed(1) + "%" };
}
// psi no periódico (la versión «sin periodicidad»): mismo ruido sin mod (periodo enorme)
function psiNP(x, y, t) {
  const qx = (x + A) / (2 * A) * 3, qy = (y + 1) / 2 * 2;
  return L.ruidoGradiente(qx, qy + 0.11 * t, 1e6, 1e6) + 0.5 * L.ruidoGradiente(2 * qx + 0.17 * t, 2 * qy + 31.7, 1e6, 1e6);
}
function rotNP(x, y, t, out) { const e = 0.01;
  out[0] = (psiNP(x, y + e, t) - psiNP(x, y - e, t)) / (2 * e); out[1] = (psiNP(x - e, y, t) - psiNP(x + e, y, t)) / (2 * e); return out; }
function correr(modo) {
  const ini = L.estadoInicial(N, A, 7);
  const xs = new Float64Array(N), ys = new Float64Array(N), vx = new Float64Array(N), vy = new Float64Array(N);
  for (let i = 0; i < N; i++) { xs[i] = ini[i * 4]; ys[i] = ini[i * 4 + 1]; }
  const out = [0, 0], res = { inicio: stats(xs, ys) };
  const decae = Math.exp(-2 * dt);
  for (let f = 1; f <= 1800; f++) {
    const t = f * dt;
    for (let i = 0; i < N; i++) {
      let fx, fy;
      if (modo === "grad") { L.rotacional(xs[i], ys[i], t, A, 1, out); fx = -out[1]; fy = out[0]; }   // gradiente = rot girado −90°
      else if (modo === "np") { rotNP(xs[i], ys[i], t, out); fx = out[0]; fy = out[1]; }
      else { L.rotacional(xs[i], ys[i], t, A, 1, out); fx = out[0]; fy = out[1]; }
      fx *= 0.09; fy *= 0.09;
      if (modo === "inercia") { vx[i] = fx + (vx[i] - fx) * decae; vy[i] = fy + (vy[i] - fy) * decae; }
      else { vx[i] = fx; vy[i] = fy; }
      let x = xs[i] + vx[i] * dt, y = ys[i] + vy[i] * dt;
      x = x + A - 2 * A * Math.floor((x + A) / (2 * A)) - A; y = y + 1 - 2 * Math.floor((y + 1) / 2) - 1;
      xs[i] = x; ys[i] = y;
    }
    if (f === 300) res.s5 = stats(xs, ys);
  }
  res.s30 = stats(xs, ys);
  return res;
}
for (const m of process.argv.slice(2)) console.log(m, JSON.stringify(correr(m)));
