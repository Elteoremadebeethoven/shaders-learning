const fs=require('fs'); const src=fs.readFileSync('/Users/alex/Projects/shaders/modulos/07-integracion/recursos/m7kit.js','utf8');
global.window={devicePixelRatio:1}; global.Curso={}; eval(src); const M7=window.M7;
// 7.3 l.170: parametrosMuelle(0.1,0.6), objetivo 1 desde 0 a 60 Hz
let p=M7.parametrosMuelle(0.1,0.6); console.log('k,c',p.rigidez.toFixed(2),p.amortiguamiento.toFixed(2));
let m=new M7.Muelle(p); m.objetivo=1; let max=0,t=0,tr=null;
for(let i=1;i<=600;i++){m.actualizar(1/60); t=i/60; if(m.x>max)max=m.x; if(tr===null&&m.enReposo()) tr=t;}
console.log('max',max.toFixed(4),'reposo a',tr&&tr.toFixed(2));
// salto al despertar: muelle por defecto, primer paso 0.1 vs 1/60
let a=new M7.Muelle(); a.objetivo=1; a.actualizar(0.1); let b=new M7.Muelle(); b.objetivo=1; b.actualizar(1/60);
console.log('0.1 s ->',a.x.toFixed(3),' 1/60 ->',b.x.toFixed(4));
// 7.6: Muelle k=60 c=15.5 crit: tiempo hasta 99% y v<1e-4
let h=new M7.Muelle({rigidez:60,amortiguamiento:15.5}); h.objetivo=1; let t99=null,tv=null;
for(let i=1;i<=600;i++){h.actualizar(1/60); const tt=i/60; if(t99===null&&h.x>=0.99)t99=tt; if(tv===null&&tt>0.5&&Math.abs(h.v)<1e-4&&Math.abs(h.x-1)<1e-4)tv=tt;}
console.log('7.6 99% a',t99&&t99.toFixed(2),' reposo 1e-4 a',tv&&tv.toFixed(2));
// cubicInOut derivative at 0.5 and cubicOut speeds 7.3
console.log('0.5 deriv cubicInOut ~', ((M7.easings.cubicInOut(0.5001)-M7.easings.cubicInOut(0.4999))/0.0002).toFixed(3));
