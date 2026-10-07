// s4-m7a: pruebas en Node (sin Chrome) de M7.Calidad (regla común de intervalos largos)
// y del ejercicio 7.1.5 (código de partida y solución, sacados del HTML de la lección).
// Uso: node herramientas/estado/lab/s4-m7a-calidad.cjs
const fs = require('fs');
const path = require('path');
const RAIZ = path.resolve(__dirname, '../../..');
global.window = globalThis; globalThis.Curso = {};
eval(fs.readFileSync(path.join(RAIZ, 'modulos/07-integracion/recursos/m7kit.js'), 'utf8'));
const M7 = window.M7;
let fallos = 0;
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };

// 1) filtrar: la regla
{
  const c = new M7.Calidad();
  const r = [16.7, 0, 300, 400, 16.7, 300, 300, 300, 1000, 0, 500, 16.7].map((iv) => c.filtrar(iv));
  console.log('filtrar →', JSON.stringify(r));
  ok(JSON.stringify(r) === JSON.stringify([16.7, 0, 0, 0, 16.7, 0, 0, 250, 250, 0, 250, 16.7]),
     'suelto/2 seguidos no cuentan; del 3.º en adelante 250; 0 ni cuenta ni corta la racha; ≤250 la corta');
}
// 2) Un equipo a 3 fps (333 ms por frame a escala 1, coste ∝ escala²) baja la resolución
{
  const c = new M7.Calidad({ min: 0.25 });
  let t = 0, n = 0;
  while (t < 20000) { const iv = Math.max(16.667, 333 * c.escala * c.escala); c.medir(iv); t += iv; n++; }
  console.log(`3 fps: tras 20 s, escala ${c.escala.toFixed(3)}, cambios ${c.cambios}`);
  ok(c.escala < 0.5, 'a 3 fps la calidad adaptativa ya no se queda ciega (baja la escala)');
}
// 3) Tirones sueltos (uno de 2 s cada 5 s) en un equipo a 60 fps: no bajan nada
{
  const c = new M7.Calidad();
  let t = 0, k = 0;
  while (t < 30000) { const iv = (++k % 300 === 0) ? 2000 : 16.667; c.medir(iv); t += iv; }
  ok(c.escala === 1 && c.cambios === 0, 'tirones sueltos de 2 s: escala 1, 0 cambios');
}
// 4) Ejercicio 7.1.5: partida y solución, tal como están en la lección
{
  const html = fs.readFileSync(path.join(RAIZ, 'modulos/07-integracion/01-arquitectura.html'), 'utf8');
  const i = html.indexOf('Ejercicio 7.1.5 — Calidad que no oscila');
  const tramo = html.slice(i);
  const partida = tramo.match(/<script type="text\/x-js">([\s\S]*?)<\/script>/)[1];
  const solucion = tramo.match(/<script type="text\/x-js" data-solucion>([\s\S]*?)<\/script>/)[1];
  for (const [nombre, src] of [['partida', partida], ['solución', solucion]]) {
    const salida = [];
    const consola = { log: (s) => salida.push(String(s)) };
    new Function('M7', 'console', src)(M7, consola);
    console.log('--- ' + nombre); salida.forEach((s) => console.log('   ' + s));
    if (nombre === 'solución') ok(salida.filter((s) => s.startsWith('✓')).length === 2, 'la solución de 7.1.5 pasa sus dos pruebas');
    else ok(salida[0].includes('16 cambios') && salida[0].includes('213 frames'), 'M7.Calidad sigue dando 16 cambios y 213 frames lentos (texto de la lección)');
  }
}
console.log(fallos ? `${fallos} FALLO(S)` : 'todo bien');
process.exitCode = fallos ? 1 : 0;
