global.window = global; global.document = {}; global.Curso = {};
const fs = require('fs');
const src = fs.readFileSync('/home/user/shaders-learning/modulos/07-integracion/recursos/m7kit.js','utf8');
eval(src);
const M7 = window.M7;
function sim(par, dt=1/60, T=20, objetivo=1, x0=0) {
  const m = new M7.Muelle(par); m.fijar(x0); m.objetivo = objetivo;
  let pico = x0, tReposo = null, tExacto=null; const reg = {};
  for (let i=1;i<=T/dt;i++){ m.actualizar(dt); const t=i*dt;
    if (objetivo>x0 ? m.x>pico : m.x<pico) pico=m.x;
    if (tReposo===null && m.enReposo()) tReposo=t;
    if (tExacto===null && m.x===objetivo && m.v===0) tExacto=t;
    if (Math.abs(t-4)<dt/2) reg[4]=m.x; if (Math.abs(t-10)<dt/2) reg[10]=m.x; if (Math.abs(t-60)<dt/2) reg[60]=m.x;
  }
  return {pico, tReposo, tExacto, reg, fin:m.x, v:m.v};
}
const p1 = M7.parametrosMuelle(0.1,0.6); console.log('p(0.1,0.6)', p1, sim(p1));
const p2 = M7.parametrosMuelle(0.25,0.9); console.log('p(0.25,0.9)->1', sim(p2,1/60,20,1,0)); console.log('p(0.25,0.9)->0', sim(p2,1/60,120,0,1));
console.log('default', sim({},1/60,100000/60,1,0));
// zeta default
console.log('zeta default', 26/(2*Math.sqrt(170)));
// first step
let m = new M7.Muelle(); m.objetivo=1; m.actualizar(0.1); console.log('primer paso 0.1', m.x);
m = new M7.Muelle(); m.objetivo=1; m.actualizar(1/60); console.log('primer paso 1/60', m.x);
m = new M7.Muelle(p2); m.objetivo=1; m.actualizar(0.1); console.log('lupa primer paso 0.1', m.x);
// suavizar
let s=0; for(let i=0;i<100000;i++) s=M7.suavizar(s,1,0.06,1/60); console.log('suavizar', s, Math.pow(2,-(1/60)/0.06));
let a=0; for(let i=0;i<60;i++) a+=1/60; console.log('sum60',a);
let b=0; for(let i=0;i<30;i++) b+=(1/60)/0.5; console.log('sum30',b);
console.log('expo', 1-Math.pow(2,-10));
// tween dt check cubicInOut derivative
