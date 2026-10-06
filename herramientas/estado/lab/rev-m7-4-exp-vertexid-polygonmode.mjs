import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const nav = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
try {
  const page = await nav.newPage();
  const consola = [];
  page.on("console", (m) => consola.push(m.type() + ": " + m.text()));
  await page.setContent("<!doctype html><html><body style='margin:0'></body></html>");
  const r = await page.evaluate(() => {
    const out = {};
    const c = document.createElement("canvas"); c.width = 460; c.height = 460; document.body.appendChild(c);
    const gl = c.getContext("webgl2", { antialias: false, preserveDrawingBuffer: true });
    function prog(vs, fs) { const p = gl.createProgram(); for (const [t, s] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); gl.attachShader(p, x); } gl.linkProgram(p); return p; }
    const FS0 = "#version 300 es\nprecision highp float;\nout vec4 o;\nvoid main(){o=vec4(1.0);}";
    function contar(w, h) { const px = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px); let n = 0; for (let i = 0; i < px.length; i += 4) if (px[i] > 128) n++; return n; }
    // gl_VertexID con drawElements: puntos en x = id
    const p = prog("#version 300 es\nvoid main(){gl_Position=vec4((float(gl_VertexID)+0.5)/16.0*2.0-1.0,0.0,0.0,1.0);gl_PointSize=1.0;}", FS0);
    gl.useProgram(p);
    gl.viewport(0, 0, 16, 1);
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const eb = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eb); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([5, 9, 2]), gl.STATIC_DRAW);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.POINTS, 3, gl.UNSIGNED_SHORT, 0);
    const px = new Uint8Array(16 * 4); gl.readPixels(0, 0, 16, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    out.vertexIDs = []; for (let i = 0; i < 16; i++) if (px[i * 4] > 128) out.vertexIDs.push(i);
    // polygon mode con una rejilla 8×8 que llena 460×460
    const N = 8, lado = 9; const uv = new Float32Array(lado * lado * 2); for (let j = 0; j < lado; j++) for (let i = 0; i < lado; i++) { uv[2 * (j * lado + i)] = i / N; uv[2 * (j * lado + i) + 1] = j / N; }
    const ind = []; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * lado + i, b = a + lado; ind.push(a, a + 1, b, b, a + 1, b + 1); }
    const p2 = prog("#version 300 es\nlayout(location=0) in vec2 a;\nvoid main(){gl_Position=vec4(a*2.0-1.0,0.0,1.0);}", FS0);
    gl.useProgram(p2);
    const v2 = gl.createVertexArray(); gl.bindVertexArray(v2);
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const e2 = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, e2); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ind), gl.STATIC_DRAW);
    gl.viewport(0, 0, 460, 460);
    gl.clear(gl.COLOR_BUFFER_BIT); gl.drawElements(gl.TRIANGLES, ind.length, gl.UNSIGNED_SHORT, 0); out.relleno = contar(460, 460);
    const ext = gl.getExtension("WEBGL_polygon_mode");
    out.ext = !!ext;
    if (ext) { ext.polygonModeWEBGL(gl.FRONT_AND_BACK, ext.LINE_WEBGL); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawElements(gl.TRIANGLES, ind.length, gl.UNSIGNED_SHORT, 0); out.lineas = contar(460, 460); out.err = gl.getError(); }
    return out;
  });
  console.log(JSON.stringify(r)); console.log(consola.join("\n"));
} finally { await nav.close(); }
