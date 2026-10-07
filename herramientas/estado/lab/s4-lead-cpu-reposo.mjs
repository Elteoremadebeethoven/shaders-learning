// Sesión 4, lead (§3.2): ¿la rampa de 2,9 s → 0,9 s del primer trozo (s4-lead-cpu-trozos.mjs) es del JIT de Chrome o de
// la CPU (reloj que sube con la carga / hilo que pasa de un núcleo de eficiencia a uno de rendimiento)? Solo Node, sin
// navegador: el MISMO bucle, 30 trozos de 4 096 píxeles (extrapolados al millón, en s) tras distintos reposos.
// El JIT de Node ya está caliente desde la primera ronda (misma función): si los primeros trozos tras un reposo son
// lentos, es la CPU. Ligero (unos segundos de CPU): node estado/lab/s4-lead-cpu-reposo.mjs
const N = 400, PIXELES = 1024 * 1024;
function enCPU(pixeles) {
  let total = 0;
  for (let p = 0; p < pixeles; p++) {
    let a = p * 1e-4, b = a + 0.5, c = a + 0.25, d = a + 0.125;
    for (let i = 0; i < N; i++) {
      a = a * 0.999 + 0.001; b = b * 0.999 + 0.001;
      c = c * 0.999 + 0.001; d = d * 0.999 + 0.001;
    }
    total += a + b + c + d;
  }
  return total;
}
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
function ronda() {
  const t = [];
  for (let k = 0; k < 30; k++) { const t0 = performance.now(); enCPU(4096); t.push((performance.now() - t0) * (PIXELES / 4096) / 1000); }
  return t.map((x) => x.toFixed(1)).join(" ");
}
enCPU(65536); // JIT caliente
console.log("sin reposo      :", ronda());
for (const s of [0.2, 1, 3, 10]) {
  await dormir(s * 1000);
  console.log(`tras ${String(s).padEnd(4)} s reposo:`, ronda());
}
console.log("sin reposo      :", ronda());
