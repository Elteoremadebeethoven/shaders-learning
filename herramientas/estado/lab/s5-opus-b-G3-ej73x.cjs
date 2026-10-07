const fs=require('fs');
global.window={}; global.Curso={}; global.document={hidden:false};
eval(fs.readFileSync('/Users/alex/Projects/shaders/modulos/07-integracion/recursos/m7kit.js','utf8'));
global.M7=window.M7;
const html=fs.readFileSync('/Users/alex/Projects/shaders/modulos/07-integracion/03-transiciones-shader.html','utf8');
for (const ej of ['Ejercicio 7.3.3 —','Ejercicio 7.3.4 —']) {
  const sub=html.slice(html.indexOf(ej));
  const re=/<script type="text\/x-js"( data-solucion)?>([\s\S]*?)<\/script>/g; let m,n=0;
  while((m=re.exec(sub)) && n<2){ n++; console.log('---',ej, m[1]?'solucion':'partida'); try{ (new Function('M7','console',m[2]))(M7,console);}catch(e){console.log('EXC',e.message)} }
}
