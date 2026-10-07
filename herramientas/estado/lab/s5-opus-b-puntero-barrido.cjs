// ¿Barrido al volver a entrar? Motor.Puntero (proyecto final) frente a M7.Puntero (m7kit), sin navegador.
const fs = require("fs");
function cargar(ruta, nombre) {
  const window = { }; const src = fs.readFileSync(ruta, "utf8");
  new Function("window", "Curso", src)(window, {});
  return window[nombre];
}
function prueba(Clase, etiqueta) {
  const oyentes = {};
  const el = { addEventListener: (t, f) => (oyentes[t] = f), getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) };
  const p = new Clase(el, { semivida: 0.08 });
  const dt = 1 / 60;
  oyentes.pointermove({ clientX: 100, clientY: 100, pointerType: "mouse" });
  for (let i = 0; i < 30; i++) p.actualizar(dt);
  oyentes.pointerleave({});
  for (let i = 0; i < 60; i++) p.actualizar(dt);        // fuera 1 s
  oyentes.pointermove({ clientX: 700, clientY: 500, pointerType: "mouse" }); // vuelve a entrar por la otra esquina
  p.actualizar(dt);
  console.log(etiqueta, "primer frame tras volver a entrar: sx, sy =", p.sx.toFixed(1), p.sy.toFixed(1), "(real 700, 500)");
}
const R = "/Users/alex/Projects/shaders/modulos/07-integracion/";
const window = {};
prueba(cargar(R + "proyecto-final/motor.js", "Motor").Puntero, "Motor.Puntero:");
prueba(cargar(R + "recursos/m7kit.js", "M7").Puntero, "M7.Puntero:   ");
