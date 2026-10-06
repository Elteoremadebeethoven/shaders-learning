global.window = globalThis; globalThis.Curso = {};
const fs = require('fs');
const src = fs.readFileSync('/home/user/shaders-learning/modulos/07-integracion/recursos/m7kit.js','utf8');
eval(src);
const M7 = window.M7;
class CalidadEstable extends M7.Calidad {
  constructor(opciones) { super(opciones); this.techo = Infinity; this.bloqueo = 0; this.desdeSubida = Infinity; }
  medir(intervaloMs) {
    if (!(intervaloMs > 0) || intervaloMs > 250) return false;
    this.bloqueo = Math.max(0, this.bloqueo - intervaloMs);
    if (this.bloqueo === 0) this.techo = Infinity;
    this.desdeSubida += intervaloMs;
    this.mediaMs += 0.1 * (intervaloMs - this.mediaMs);
    if (this.enfriar > 0) { this.enfriar -= intervaloMs; return false; }
    const antes = this.escala;
    if (this.mediaMs > this.objetivoMs * 1.25) {
      if (this.desdeSubida < 1500) { this.techo = this.escala; this.bloqueo = 10000; }
      this.escala = Math.max(this.min, this.escala * this.paso); this.holgura = 0;
    } else if (this.mediaMs < this.objetivoMs * 1.1) {
      this.holgura += intervaloMs;
      const nueva = Math.min(this.max, this.escala / this.paso);
      if (this.holgura > this.paciencia && nueva < this.techo - 1e-9) { this.escala = nueva; this.holgura = 0; this.desdeSubida = 0; }
    } else { this.holgura = 0; }
    if (this.escala === antes) return false;
    this.enfriar = 500; this.mediaMs = this.objetivoMs; this.cambios++; return true;
  }
}
function simular(Clase) {
  const c = new Clase({ min: 0.25 });
  let t = 0, cambiosTramo = 0, lentos = 0;
  const cambios = [];
  while (t < 60000) {
    const coste = t < 30000 ? 45 : 12;
    const iv = Math.max(1, Math.ceil(coste * c.escala * c.escala / 16.667 - 1e-9)) * 16.667;
    if (c.medir(iv)) { cambios.push((t / 1000).toFixed(1) + ' s → ' + c.escala.toFixed(2)); if (t > 8000 && t < 30000) cambiosTramo++; }
    if (iv > 17) lentos++;
    t += iv;
  }
  return { cambiosTramo, lentos, final: c.escala, cambios };
}
const base = simular(M7.Calidad), tuya = simular(CalidadEstable);
console.log('base', base.cambiosTramo, base.lentos, base.final, base.cambios.join(' · '));
console.log('tuya', tuya.cambiosTramo, tuya.lentos, tuya.final, tuya.cambios.join(' · '));
// otras comprobaciones
console.log((0.25).toFixed(1), (2).toFixed(1), (0.05).toFixed(1));
const f=M7.flotante; console.log(f(2), f(0.25), f(1e-7), f(-3), f(1e21), f(123456789012345680000));
console.log(M7.conDefines('#version 300 es\nprecision highp float;\nvoid main(){}', {A:1, B:true, C:'2.0'}));
console.log(Math.fround(Date.now()/1000), Date.now()/1000);
