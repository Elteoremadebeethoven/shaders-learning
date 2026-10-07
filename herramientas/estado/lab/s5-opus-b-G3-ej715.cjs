const fs=require('fs');
global.window={}; global.Curso={}; global.document={hidden:false};
eval(fs.readFileSync('/Users/alex/Projects/shaders/modulos/07-integracion/recursos/m7kit.js','utf8'));
const M7=window.M7; global.M7=M7;
const html=fs.readFileSync('/Users/alex/Projects/shaders/modulos/07-integracion/01-arquitectura.html','utf8');
const i=html.indexOf('Ejercicio 7.1.5');
const sub=html.slice(i);
const re=/<script type="text\/x-js"( data-solucion)?>([\s\S]*?)<\/script>/g;
let m; let n=0;
while((m=re.exec(sub)) && n<2){ n++; console.log('---', m[1]?'solucion':'partida'); const code=m[2].replace('const base','var base'); (new Function('M7','console',code))(M7,console); }
