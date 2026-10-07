const fs=require('fs');
global.window={}; global.Curso={}; global.document={hidden:false};
eval(fs.readFileSync('/Users/alex/Projects/shaders/modulos/07-integracion/recursos/m7kit.js','utf8'));
const M7=window.M7; const dt=1/60;
// suavizar hacia 1
let v=0; for(let i=0;i<100000;i++) v=M7.suavizar(v,1,0.06,dt); console.log('suavizar 100000 frames:', v, 1-v);
// muelle por defecto hacia 1
let m=new M7.Muelle(); m.objetivo=1; for(let i=0;i<100000;i++) m.actualizar(dt); console.log('muelle defecto:', m.x);
// lupa
const P=M7.parametrosMuelle(0.25,0.9); console.log('lupa', P);
let l=new M7.Muelle(P); l.objetivo=1; let t1=null; for(let i=1;i<=60*60;i++){ l.actualizar(dt); if(l.x===1 && t1===null) t1=i*dt; } console.log('lupa llega a 1 exacto en', t1, 'x=',l.x);
let l0=new M7.Muelle(P); l0.fijar(1); l0.objetivo=0; for(let i=1;i<=600;i++){ l0.actualizar(dt); if(i===240) console.log('lupa hacia 0 a 4 s:', l0.x); } console.log('lupa hacia 0 a 10 s:', l0.x);
let s=0; for(let i=0;i<60;i++) s+=1/60; console.log('60×1/60 =', s);
let s2=0; for(let i=0;i<30;i++) s2+=(1/60)/0.5; console.log('30×(1/60)/0.5 =', s2);
console.log('expoOut sin caso', 1-Math.pow(2,-10));
// muelle 0.1/0.6
const Q=M7.parametrosMuelle(0.1,0.6); console.log(Q);
