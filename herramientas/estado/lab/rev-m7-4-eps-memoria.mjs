// Error de truncamiento (float64, sin redondeo) de la diferencia central con las ondas de la lección
const DIR = [[1, 0], [0.6, 0.8], [-0.71, 0.71]], K = [1.7, 2.9, 4.3], A = [0.14, 0.07, 0.035], W = [1.4, 2.0, 2.7];
function ondas(x, z, t) { let h = 0, hx = 0, hz = 0; for (let i = 0; i < 3; i++) { const f = K[i] * (DIR[i][0] * x + DIR[i][1] * z) - W[i] * t; h += A[i] * Math.sin(f); hx += A[i] * K[i] * Math.cos(f) * DIR[i][0]; hz += A[i] * K[i] * Math.cos(f) * DIR[i][1]; } return [h, hx, hz]; }
function ang(a, b) { const na = Math.hypot(...a), nb = Math.hypot(...b); return Math.acos(Math.min(1, (a[0]*b[0]+a[1]*b[1]+a[2]*b[2]) / na / nb)) * 180 / Math.PI; }
let semilla = 1; const rnd = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
for (const e of [0.3, 0.1, 0.01, 0.001]) {
  let max = 0;
  for (let k = 0; k < 2000; k++) {
    const x = rnd() * 10, z = rnd() * 10, t = 10;
    const [, hx, hz] = ondas(x, z, t);
    const dx = (ondas(x + e, z, t)[0] - ondas(x - e, z, t)[0]) / (2 * e), dz = (ondas(x, z + e, t)[0] - ondas(x, z - e, t)[0]) / (2 * e);
    max = Math.max(max, ang([-hx, 1, -hz], [-dx, 1, -dz]));
  }
  console.log("ε", e, "error máx de truncamiento", max.toFixed(3) + "°");
}
// tamaños de memoria
for (const N of [16, 64, 128, 254, 255, 320, 512, 1024]) {
  const v = (N + 1) ** 2, ind = 6 * N * N, b = v - 1 <= 65534 ? 2 : 4;
  console.log(N, v, 2 * N * N, ind, b === 2 ? "U16" : "U32", ((v * 8 + ind * b) / 1e6).toFixed(3) + " MB", "(u16 forzado: " + ((v * 8 + ind * 2) / 1e6).toFixed(3) + ")");
}
console.log("bytes 24 en N=320 uv+idx32:", 321*321*8 + 6*320*320*4);
