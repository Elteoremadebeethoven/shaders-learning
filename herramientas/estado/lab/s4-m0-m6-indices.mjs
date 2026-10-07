// GLSL ES 1.00: ¿qué índices de array admite el compilador de Chrome (M1)? Sesión 4, agente m0-m6.
// Comprueba la propuesta de «anexos» para la tabla 1.00 → 3.00 de 6.10 (l.~402).
// Uso, desde herramientas/: node turnos.mjs --agente m0-m6 --motivo "…" -- node estado/lab/s4-m0-m6-indices.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new", args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
try {
  const page = await nav.newPage();
  await page.setContent("<!doctype html><canvas id=a></canvas><canvas id=b></canvas>");
  const r = await page.evaluate(() => {
    const casos = {
      "FS, array local, índice uniform": ["f", "precision highp float; uniform int n; void main(){ float a[4]; a[0]=1.0; a[1]=0.5; a[2]=0.25; a[3]=0.0; gl_FragColor = vec4(a[n]); }"],
      "FS, array uniform, índice uniform": ["f", "precision highp float; uniform int n; uniform float a[4]; void main(){ gl_FragColor = vec4(a[n]); }"],
      "FS, array uniform, índice del bucle": ["f", "precision highp float; uniform float a[4]; void main(){ float s = 0.0; for (int i = 0; i < 4; i++) s += a[i]; gl_FragColor = vec4(s); }"],
      "FS, vec4, índice uniform": ["f", "precision highp float; uniform int n; uniform vec4 v; void main(){ gl_FragColor = vec4(v[n]); }"],
      "VS, array uniform, índice uniform": ["v", "uniform int n; uniform float a[4]; void main(){ gl_Position = vec4(a[n]); }"],
      "VS, array local, índice uniform": ["v", "uniform int n; void main(){ float a[4]; a[0]=1.0; a[1]=0.5; a[2]=0.25; a[3]=0.0; gl_Position = vec4(a[n]); }"],
      "VS, atributo como índice de array uniform": ["v", "attribute float k; uniform float a[4]; void main(){ gl_Position = vec4(a[int(k)]); }"],
    };
    const out = {};
    for (const [ctxName, id] of [["webgl", "a"], ["webgl2", "b"]]) {
      const gl = document.getElementById(id).getContext(ctxName);
      for (const [k, [t, src]] of Object.entries(casos)) {
        const s = gl.createShader(t === "f" ? gl.FRAGMENT_SHADER : gl.VERTEX_SHADER);
        gl.shaderSource(s, src); gl.compileShader(s);
        const ok = gl.getShaderParameter(s, gl.COMPILE_STATUS);
        out[ctxName + " · " + k] = ok ? "compila" : "ERROR: " + gl.getShaderInfoLog(s).trim().replace(/\s+/g, " ");
      }
    }
    return out;
  });
  for (const [k, v] of Object.entries(r)) console.log(k.padEnd(55), v);
  console.log(await nav.version());
} finally { await nav.close(); }
