// Sesión 5, opus-a: GFLOPS de un hilo de JS (4.1) con 4, 8 y 1 cadenas independientes. Uso: node s5-opus-a-flops.mjs (sin Chrome, ~2 s).
const N = 400;
function c4(px){ let t=0; for(let p=0;p<px;p++){ let a=p*1e-4,b=a+.5,c=a+.25,d=a+.125; for(let i=0;i<N;i++){a=a*.999+.001;b=b*.999+.001;c=c*.999+.001;d=d*.999+.001;} t+=a+b+c+d;} return t; }
function c8(px){ let t=0; for(let p=0;p<px;p+=2){ let a=p*1e-4,b=a+.5,c=a+.25,d=a+.125,e=a+.1,f=a+.2,g=a+.3,h=a+.4; for(let i=0;i<N;i++){a=a*.999+.001;b=b*.999+.001;c=c*.999+.001;d=d*.999+.001;e=e*.999+.001;f=f*.999+.001;g=g*.999+.001;h=h*.999+.001;} t+=a+b+c+d+e+f+g+h;} return t; }
function c1(px){ let t=0; for(let p=0;p<px*4;p++){ let a=p*1e-4; for(let i=0;i<N;i++){a=a*.999+.001;} t+=a;} return t; }
for (const [n,f] of [["4 cadenas",c4],["8 cadenas",c8],["1 cadena",c1]]) {
  f(131072);
  for (let r=0;r<3;r++){ const t0=performance.now(); f(65536); const ms=performance.now()-t0; const flop=65536*N*8; console.log(n, ms.toFixed(1),"ms", (flop/ms/1e6).toFixed(2),"GFLOPS"); }
}
