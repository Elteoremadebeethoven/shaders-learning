import fs from "fs";
globalThis.window = globalThis; globalThis.Curso = {};
eval(fs.readFileSync("/home/user/shaders-learning/modulos/07-integracion/recursos/l75-particulas.js", "utf8"));
const L = globalThis.L75;
// octava 1 sola: ruidoGradiente(q + (0, 0.11 t), periodo). Correlación cruzada entre t=0 y t=1 para hallar el desplazamiento.
const per = 1e6;
function o1(qx, qy, t) { return L.ruidoGradiente(qx, qy + 0.11 * t, per, per); }
function o2(qx, qy, t) { return L.ruidoGradiente(2 * qx + 0.17 * t, 2 * qy + 31.7, per, per); }
for (const [nombre, f] of [["octava1", o1], ["octava2", o2]]) {
  let mejor = null;
  for (let dx = -0.2; dx <= 0.2001; dx += 0.01) for (let dy = -0.2; dy <= 0.2001; dy += 0.01) {
    let e = 0;
    for (let i = 0; i < 400; i++) { const x = 1 + (i % 20) * 0.37, y = 1 + Math.floor(i / 20) * 0.29; const d = f(x + dx, y + dy, 1) - f(x, y, 0); e += d * d; }
    if (!mejor || e < mejor.e) mejor = { e, dx: +dx.toFixed(2), dy: +dy.toFixed(2) };
  }
  console.log(nombre, "el dibujo de t=0 aparece en t=1 desplazado", { dx: -mejor.dx, dy: -mejor.dy }, "celdas de la octava 1 (error", mejor.e.toExponential(1) + ")");
}
