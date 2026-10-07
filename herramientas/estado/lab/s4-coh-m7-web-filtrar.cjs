const fs=require('fs'); global.window={devicePixelRatio:1}; global.Curso={};
eval(fs.readFileSync('/Users/alex/Projects/shaders/modulos/07-integracion/recursos/m7kit.js','utf8')); const M7=window.M7;
// Solución de 7.1.5 leída del HTML, en dos versiones: tal cual (con filtrar) y sin filtrar (intervaloMs a secas)
const html=fs.readFileSync('/Users/alex/Projects/shaders/modulos/07-integracion/01-arquitectura.html','utf8');
const sol=/<script type="text\/x-js" data-solucion>\s*(class CalidadEstable[\s\S]*?\n\})\n/.exec(html)[1];
const conF=eval('('+sol+')');
const sinF=eval('('+sol.replace('const iv = this.filtrar(intervaloMs);','const iv = intervaloMs;').replace('if (!iv) return false;','')+')');
for (const [nombre,C] of [['con filtrar',conF],['sin filtrar',sinF]]) {
  const c=new C({min:0.25,max:1}); c.escala=0.7225; c.enfriar=0;
  let t=0, subida=null, log=[];
  const paso=(iv)=>{ const a=c.escala; const camb=c.medir(iv); t+=iv; if(camb) log.push((t/1000).toFixed(2)+'s '+a.toFixed(3)+'→'+c.escala.toFixed(3)); if(camb&&c.escala>a&&subida===null) subida=t; };
  while(subida===null && t<10000) paso(16.7);           // holgura: sube
  const objetivo=subida+900; while(t<objetivo) paso(16.7); // 0,9 s después de subir…
  paso(300);                                             // …un tirón suelto (compilación)
  while(t<objetivo+3000) paso(16.7);
  console.log(nombre,'| cambios:',log.join(', '),'| techo:',c.techo);
  // efecto de un 0 en la media
  const d=new C({}); d.enfriar=0; d.mediaMs=20; d.medir(0); console.log('   media tras un 0:', d.mediaMs.toFixed(2));
}
