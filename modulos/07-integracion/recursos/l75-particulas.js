/* =====================================================================
   l75-particulas.js — las piezas de la lección 7.5 (partículas en la GPU),
   empaquetadas para no repetirlas en cada ejemplo. Igual que GLKit y m7kit:
   nada de magia; cada pieza se construye a mano en la lección.

     L75.RUIDO           GLSL: hash PCG, ruido de gradiente periódico (6.6),
                         potencial psi(p, t, medio) y su rotacional        (7.5)
     L75.PASO            GLSL: uniforms de la simulación y avanzar(p, v):
                         flujo + ratón con softening + integración + bordes (7.5)
     L75.pcg, L75.ruidoGradiente, L75.psi, L75.rotacional
                         los gemelos en JavaScript (mismo hash, bit a bit)  (7.5)
     L75.azar(semilla)   generador determinista mulberry32
     L75.estadoInicial(n, aspecto, semilla)
                         Float32Array con (x, y, vx, vy) por partícula
     L75.MedidorGPU      milisegundos de GPU con EXT_disjoint_timer_query_webgl2
     L75.crearMotor(gl, metodo)
                         las tres arquitecturas de la lección con la misma
                         física: 'cpu' (7.5.1), 'texturas' (7.5.2), 'tf' (7.5.3)

   En los playgrounds JS se inyecta con  data-incluir="glkit,m7kit,l75"
   (la página de la lección debe cargar este archivo).
   ===================================================================== */
(function () {
  "use strict";
  function factory() {
    /* ---------------------------------------------------------------
       GLSL del campo de flujo. Se interpola en los shaders con ${L75.RUIDO}
       (la «directiva include» de los pobres de 7.1). Necesita highp int.
       --------------------------------------------------------------- */
    const RUIDO = `
// ---- L75.RUIDO: hash PCG (6.6), ruido de gradiente periódico y curl noise (7.5) ----
uint pcg(uint v) {
  uint s = v * 747796405u + 2891336453u;
  uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}
// Dirección aleatoria de longitud 1; la rejilla de gradientes se repite cada «periodo» celdas
vec2 gradiente(vec2 esquina, vec2 periodo) {
  uvec2 q = uvec2(ivec2(mod(esquina, periodo)));
  float a = 6.2831853 * float(pcg(q.x + pcg(q.y)) >> 8u) * (1.0 / 16777216.0);
  return vec2(cos(a), sin(a));
}
float ruidoGradiente(vec2 p, vec2 periodo) {
  vec2 i = floor(p), f = fract(p);
  float a = dot(gradiente(i, periodo),                   f);
  float b = dot(gradiente(i + vec2(1.0, 0.0), periodo), f - vec2(1.0, 0.0));
  float c = dot(gradiente(i + vec2(0.0, 1.0), periodo), f - vec2(0.0, 1.0));
  float d = dot(gradiente(i + vec2(1.0, 1.0), periodo), f - vec2(1.0, 1.0));
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
// Potencial en el MUNDO (x en ±medio.x, y en ±medio.y). En el mundo cabe un número entero de
// celdas de ruido, así que el campo casa en la costura por la que las partículas dan la vuelta.
const float CELDAS = 2.0;                              // celdas de ruido en la altura del mundo
float psi(vec2 p, float t, vec2 medio) {
  vec2 periodo = vec2(max(1.0, floor(CELDAS * medio.x / medio.y + 0.5)), CELDAS);
  vec2 q = (p + medio) / (2.0 * medio) * periodo;      // del mundo a celdas: de 0 a periodo
  return ruidoGradiente(q + vec2(0.0, 0.11 * t), periodo)
       + 0.5 * ruidoGradiente(2.0 * q + vec2(0.17 * t, 31.7), 2.0 * periodo);
}
// Rotacional de psi, en unidades del mundo: (dpsi/dy, -dpsi/dx) con diferencias centrales
vec2 rotacional(vec2 p, float t, vec2 medio) {
  const float e = 0.01;
  float arriba = psi(p + vec2(0.0, e), t, medio), abajo = psi(p - vec2(0.0, e), t, medio);
  float dcha = psi(p + vec2(e, 0.0), t, medio), izda = psi(p - vec2(e, 0.0), t, medio);
  return vec2(arriba - abajo, izda - dcha) / (2.0 * e);
}
`;

    /* ---------------------------------------------------------------
       GLSL del paso de simulación, común a las texturas y al transform
       feedback. El mundo mide 2·aspecto × 2 (x en ±aspecto, y en ±1).
       --------------------------------------------------------------- */
    const PASO = `
// ---- L75.PASO: un paso de simulación (7.5) ----
uniform float u_dt;          // s de animación de este frame (0 en pausa)
uniform float u_time;        // s del reloj de la app: hace evolucionar el campo
uniform float u_aspecto;     // ancho / alto del lienzo
uniform vec3 u_raton;        // xy: puntero en unidades del mundo · z: intensidad (0 = nada)
const float FLUJO = 0.09;       // escala de la velocidad del campo
const float ARRASTRE = 2.0;     // 1/s: lo deprisa que la partícula adopta la velocidad del campo
void avanzar(inout vec2 p, inout vec2 v) {
  vec2 medio = vec2(u_aspecto, 1.0);                     // el mundo mide 2·aspecto × 2
  vec2 flujo = FLUJO * rotacional(p, u_time, medio);
  v = flujo + (v - flujo) * exp(-ARRASTRE * u_dt);       // suavizado exacto hacia el flujo (2.4)
  vec2 d = u_raton.xy - p;
  float d2 = dot(d, d) + 0.02;                           // softening de 2.8: epsilon = 0,14
  v += u_raton.z * d / (d2 * sqrt(d2)) * u_dt;           // atracción 1/d², acotada
  p += v * u_dt;                                         // Euler semi-implícito (2.5)
  p = mod(p + medio, 2.0 * medio) - medio;               // el mundo da la vuelta
}
`;

    /* ---------------------------------------------------------------
       Gemelos en JavaScript (para la simulación en la CPU, 7.5.1).
       El hash es entero: Math.imul y >>> 0 dan los mismos 32 bits que la GPU.
       --------------------------------------------------------------- */
    function pcg(v) {
      const s = (Math.imul(v, 747796405) + 2891336453) >>> 0;
      const w = Math.imul(((s >>> ((s >>> 28) + 4)) ^ s) >>> 0, 277803737) >>> 0;
      return ((w >>> 22) ^ w) >>> 0;
    }
    const DOS_PI = 6.2831853;
    function modp(a, n) { return a - n * Math.floor(a / n); }           // el mod de GLSL
    function ruidoGradiente(x, y, px, py) {
      const fx0 = Math.floor(x), fy0 = Math.floor(y), fx = x - fx0, fy = y - fy0;
      const x0 = modp(fx0, px) | 0, x1 = modp(fx0 + 1, px) | 0, y0 = modp(fy0, py) | 0, y1 = modp(fy0 + 1, py) | 0;
      let h, a;
      h = pcg((x0 + pcg(y0)) >>> 0); a = DOS_PI * (h >>> 8) / 16777216;
      const na = Math.cos(a) * fx + Math.sin(a) * fy;
      h = pcg((x1 + pcg(y0)) >>> 0); a = DOS_PI * (h >>> 8) / 16777216;
      const nb = Math.cos(a) * (fx - 1) + Math.sin(a) * fy;
      h = pcg((x0 + pcg(y1)) >>> 0); a = DOS_PI * (h >>> 8) / 16777216;
      const nc = Math.cos(a) * fx + Math.sin(a) * (fy - 1);
      h = pcg((x1 + pcg(y1)) >>> 0); a = DOS_PI * (h >>> 8) / 16777216;
      const nd = Math.cos(a) * (fx - 1) + Math.sin(a) * (fy - 1);
      const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10), uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
      const ab = na + (nb - na) * ux, cd = nc + (nd - nc) * ux;
      return ab + (cd - ab) * uy;
    }
    const CELDAS = 2;
    /* El potencial en el mundo de medio ancho mx y medio alto my (my = 1 en la lección). */
    function psi(x, y, t, mx, my) {
      const px = Math.max(1, Math.floor(CELDAS * mx / my + 0.5)), py = CELDAS;
      const qx = (x + mx) / (2 * mx) * px, qy = (y + my) / (2 * my) * py;
      return ruidoGradiente(qx, qy + 0.11 * t, px, py) + 0.5 * ruidoGradiente(2 * qx + 0.17 * t, 2 * qy + 31.7, 2 * px, 2 * py);
    }
    /* Escribe en out[0], out[1] el rotacional de psi en (x, y), en unidades del mundo. */
    function rotacional(x, y, t, mx, my, out) {
      const e = 0.01;
      const arriba = psi(x, y + e, t, mx, my), abajo = psi(x, y - e, t, mx, my);
      const dcha = psi(x + e, y, t, mx, my), izda = psi(x - e, y, t, mx, my);
      out[0] = (arriba - abajo) / (2 * e);
      out[1] = (izda - dcha) / (2 * e);
      return out;
    }

    /* mulberry32: el mismo generador que usa texturas.js. Determinista:
       misma semilla, mismas partículas (útil tras perder el contexto). */
    function azar(semilla) {
      let a = semilla >>> 0;
      return function () {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    /* (x, y, vx, vy) por partícula: posiciones uniformes en el mundo, velocidad 0. */
    function estadoInicial(n, aspecto, semilla) {
      const r = azar(semilla === undefined ? 7 : semilla);
      const d = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        d[i * 4] = (r() * 2 - 1) * aspecto;
        d[i * 4 + 1] = r() * 2 - 1;
      }
      return d;
    }

    /* ---------------------------------------------------------------
       Tiempo de GPU (5.10). Una consulta por frame alrededor de todo el
       trabajo; el resultado llega unos frames después. Media de 30.
       --------------------------------------------------------------- */
    class MedidorGPU {
      constructor(gl) {
        this.gl = gl;
        this.ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");
        this.pendientes = [];
        this.muestras = [];
        this.activa = null;
      }
      empezar() {
        if (!this.ext || this.activa || this.pendientes.length > 8) return;
        this.activa = this.gl.createQuery();
        this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, this.activa);
      }
      terminar() {
        const gl = this.gl;
        if (this.activa) { gl.endQuery(this.ext.TIME_ELAPSED_EXT); this.pendientes.push(this.activa); this.activa = null; }
        while (this.pendientes.length && gl.getQueryParameter(this.pendientes[0], gl.QUERY_RESULT_AVAILABLE)) {
          const q = this.pendientes.shift();
          const ns = gl.getQueryParameter(q, gl.QUERY_RESULT);
          if (!gl.getParameter(this.ext.GPU_DISJOINT_EXT)) { this.muestras.push(ns / 1e6); if (this.muestras.length > 30) this.muestras.shift(); }
          gl.deleteQuery(q);
        }
      }
      reiniciar() { this.muestras.length = 0; }
      get ms() { if (!this.muestras.length) return NaN; let s = 0; for (const m of this.muestras) s += m; return s / this.muestras.length; }
    }

    /* ---------------------------------------------------------------
       Los tres motores de la lección, con la MISMA física (L75.PASO) y el
       mismo dibujo (puntos con mezcla aditiva), para compararlos.
         motor.iniciar(n, aspecto)   crea los recursos para n partículas
         motor.paso(u)               u = { dt, t, aspecto, raton: [x, y, fuerza] }
         motor.dibujar(u)            u = { aspecto, tamPunto (px del búfer), brillo }
         motor.liberar()
       --------------------------------------------------------------- */
    const CABECERA = "#version 300 es\nprecision highp float;\nprecision highp int;\n";
    const FS_PUNTO = CABECERA + `
in vec3 v_color;
out vec4 fragColor;
void main() { fragColor = vec4(v_color, 1.0); }`;
    const COLOR_GLSL = `
vec3 colorPorRapidez(vec2 v) {
  float k = clamp(length(v) * 4.0, 0.0, 1.0);
  return mix(vec3(0.25, 0.45, 1.0), vec3(1.0, 0.45, 0.75), k);
}`;
    function crearMotor(gl, metodo) {
      const GLKit = (typeof window !== "undefined" && window.GLKit) || null;
      if (!GLKit) throw new Error("L75.crearMotor necesita GLKit (data-incluir=\"glkit,…\")");
      const m = { metodo, n: 0, msCPU: 0 };
      let recursos = null;
      const uni = (p) => GLKit.uniforms(gl, p);

      if (metodo === "cpu") {
        const VS = CABECERA + `
layout(location = 0) in vec2 a_pos;
layout(location = 1) in vec2 a_vel;
uniform float u_aspecto, u_tamPunto, u_brillo;
out vec3 v_color;
${COLOR_GLSL}
void main() {
  gl_Position = vec4(a_pos.x / u_aspecto, a_pos.y, 0.0, 1.0);
  gl_PointSize = u_tamPunto;
  v_color = colorPorRapidez(a_vel) * u_brillo;
}`;
        const rot = [0, 0];
        m.iniciar = function (n, aspecto) {
          m.n = n;
          const datos = estadoInicial(n, aspecto);
          const p = GLKit.crearPrograma(gl, VS, FS_PUNTO);
          const vao = gl.createVertexArray();
          gl.bindVertexArray(vao);
          const buf = GLKit.crearBuffer(gl, datos, gl.DYNAMIC_DRAW);
          gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
          gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
          gl.bindVertexArray(null);
          gl.bindBuffer(gl.ARRAY_BUFFER, null);
          recursos = { p, u: uni(p), vao, buf, datos };
        };
        m.paso = function (u) {
          const t0 = performance.now();
          const d = recursos.datos, n = m.n, dt = u.dt, A = u.aspecto;
          const decae = Math.exp(-2.0 * dt), rx = u.raton[0], ry = u.raton[1], rf = u.raton[2];
          for (let i = 0; i < n; i++) {
            const k = i * 4;
            let x = d[k], y = d[k + 1], vx = d[k + 2], vy = d[k + 3];
            rotacional(x, y, u.t, A, 1, rot);
            const fx = 0.09 * rot[0], fy = 0.09 * rot[1];
            vx = fx + (vx - fx) * decae; vy = fy + (vy - fy) * decae;
            if (rf !== 0) {
              const dx = rx - x, dy = ry - y, d2 = dx * dx + dy * dy + 0.02, f = rf / (d2 * Math.sqrt(d2)) * dt;
              vx += dx * f; vy += dy * f;
            }
            x += vx * dt; y += vy * dt;
            x = x + A - 2 * A * Math.floor((x + A) / (2 * A)) - A;     // mod de GLSL, no el % de JS
            y = y + 1 - 2 * Math.floor((y + 1) / 2) - 1;
            d[k] = x; d[k + 1] = y; d[k + 2] = vx; d[k + 3] = vy;
          }
          gl.bindBuffer(gl.ARRAY_BUFFER, recursos.buf);
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, d, 0, n * 4);
          gl.bindBuffer(gl.ARRAY_BUFFER, null);
          m.msCPU = performance.now() - t0;
        };
        m.dibujar = function (u) {
          const r = recursos;
          gl.useProgram(r.p);
          GLKit.ponerUniform(gl, r.u.u_aspecto, u.aspecto);
          GLKit.ponerUniform(gl, r.u.u_tamPunto, u.tamPunto);
          GLKit.ponerUniform(gl, r.u.u_brillo, u.brillo);
          gl.bindVertexArray(r.vao);
          gl.drawArrays(gl.POINTS, 0, m.n);
          gl.bindVertexArray(null);
        };
        m.liberar = function () {
          if (!recursos) return;
          gl.deleteProgram(recursos.p); gl.deleteVertexArray(recursos.vao); gl.deleteBuffer(recursos.buf);
          recursos = null;
        };
      } else if (metodo === "texturas") {
        const VS_SIM = CABECERA + `
void main() {
  vec2 P[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  gl_Position = vec4(P[gl_VertexID], 0.0, 1.0);
}`;
        const FS_SIM = CABECERA + RUIDO + PASO + `
uniform highp sampler2D u_estado;
out vec4 fragColor;
void main() {
  vec4 s = texelFetch(u_estado, ivec2(gl_FragCoord.xy), 0);
  vec2 p = s.xy, v = s.zw;
  avanzar(p, v);
  fragColor = vec4(p, v);
}`;
        const VS_DIB = CABECERA + `
uniform highp sampler2D u_estado;
uniform float u_aspecto, u_tamPunto, u_brillo;
out vec3 v_color;
${COLOR_GLSL}
void main() {
  int ancho = textureSize(u_estado, 0).x;
  vec4 s = texelFetch(u_estado, ivec2(gl_VertexID % ancho, gl_VertexID / ancho), 0);
  gl_Position = vec4(s.x / u_aspecto, s.y, 0.0, 1.0);
  gl_PointSize = u_tamPunto;
  v_color = colorPorRapidez(s.zw) * u_brillo;
}`;
        m.iniciar = function (n, aspecto) {
          if (!gl.getExtension("EXT_color_buffer_float")) throw new Error("sin EXT_color_buffer_float: no se puede renderizar en RGBA32F");
          const lado = Math.round(Math.sqrt(n));
          if (lado * lado !== n) throw new Error("texturas: n debe ser un cuadrado perfecto");
          m.n = n;
          const opc = { filtro: gl.NEAREST, formatoInterno: gl.RGBA32F, formato: gl.RGBA, tipo: gl.FLOAT };
          const A = GLKit.crearFBO(gl, lado, lado, opc), B = GLKit.crearFBO(gl, lado, lado, opc);
          gl.bindTexture(gl.TEXTURE_2D, A.textura);
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, lado, lado, gl.RGBA, gl.FLOAT, estadoInicial(n, aspecto));
          gl.bindTexture(gl.TEXTURE_2D, null);
          const ps = GLKit.crearPrograma(gl, VS_SIM, FS_SIM), pd = GLKit.crearPrograma(gl, VS_DIB, FS_PUNTO);
          recursos = { lado, A, B, ps, us: uni(ps), pd, ud: uni(pd), vao: gl.createVertexArray() };
        };
        m.paso = function (u) {
          const r = recursos;
          gl.bindFramebuffer(gl.FRAMEBUFFER, r.B.fbo);
          gl.viewport(0, 0, r.lado, r.lado);
          gl.useProgram(r.ps);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, r.A.textura);
          GLKit.ponerUniform(gl, r.us.u_estado, 0);
          GLKit.ponerUniform(gl, r.us.u_dt, u.dt);
          GLKit.ponerUniform(gl, r.us.u_time, u.t);
          GLKit.ponerUniform(gl, r.us.u_aspecto, u.aspecto);
          GLKit.ponerUniform(gl, r.us.u_raton, u.raton);
          gl.bindVertexArray(r.vao);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          const tmp = r.A; r.A = r.B; r.B = tmp;                 // el ping-pong
          m.msCPU = 0;
        };
        m.dibujar = function (u) {
          const r = recursos;
          gl.useProgram(r.pd);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, r.A.textura);
          GLKit.ponerUniform(gl, r.ud.u_estado, 0);
          GLKit.ponerUniform(gl, r.ud.u_aspecto, u.aspecto);
          GLKit.ponerUniform(gl, r.ud.u_tamPunto, u.tamPunto);
          GLKit.ponerUniform(gl, r.ud.u_brillo, u.brillo);
          gl.bindVertexArray(r.vao);
          gl.drawArrays(gl.POINTS, 0, m.n);
          gl.bindVertexArray(null);
        };
        m.liberar = function () {
          if (!recursos) return;
          GLKit.borrarFBO(gl, recursos.A); GLKit.borrarFBO(gl, recursos.B);
          gl.deleteProgram(recursos.ps); gl.deleteProgram(recursos.pd); gl.deleteVertexArray(recursos.vao);
          recursos = null;
        };
      } else if (metodo === "tf") {
        const VS_SIM = CABECERA + RUIDO + PASO + `
layout(location = 0) in vec2 a_pos;
layout(location = 1) in vec2 a_vel;
out vec2 v_pos;
out vec2 v_vel;
void main() {
  vec2 p = a_pos, v = a_vel;
  avanzar(p, v);
  v_pos = p;
  v_vel = v;
}`;
        const FS_NADA = CABECERA + "out vec4 fragColor;\nvoid main() { fragColor = vec4(0.0); }";
        const VS_DIB = CABECERA + `
layout(location = 0) in vec2 a_pos;
layout(location = 1) in vec2 a_vel;
uniform float u_aspecto, u_tamPunto, u_brillo;
out vec3 v_color;
${COLOR_GLSL}
void main() {
  gl_Position = vec4(a_pos.x / u_aspecto, a_pos.y, 0.0, 1.0);
  gl_PointSize = u_tamPunto;
  v_color = colorPorRapidez(a_vel) * u_brillo;
}`;
        m.iniciar = function (n, aspecto) {
          m.n = n;
          const datos = estadoInicial(n, aspecto);
          const ps = GLKit.crearPrograma(gl, VS_SIM, FS_NADA, { varyingsTF: ["v_pos", "v_vel"], modoTF: gl.INTERLEAVED_ATTRIBS });
          const pd = GLKit.crearPrograma(gl, VS_DIB, FS_PUNTO);
          const bufs = [], vaos = [];
          for (let i = 0; i < 2; i++) {
            const b = GLKit.crearBuffer(gl, i === 0 ? datos : datos.byteLength, gl.DYNAMIC_COPY);
            const v = gl.createVertexArray();
            gl.bindVertexArray(v);
            gl.bindBuffer(gl.ARRAY_BUFFER, b);
            gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
            gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
            gl.bindVertexArray(null);
            bufs.push(b); vaos.push(v);
          }
          gl.bindBuffer(gl.ARRAY_BUFFER, null);      // ¡un buffer de salida no puede quedar en ARRAY_BUFFER!
          recursos = { ps, us: uni(ps), pd, ud: uni(pd), bufs, vaos, tf: gl.createTransformFeedback(), actual: 0 };
        };
        m.paso = function (u) {
          const r = recursos, sig = 1 - r.actual;
          gl.useProgram(r.ps);
          GLKit.ponerUniform(gl, r.us.u_dt, u.dt);
          GLKit.ponerUniform(gl, r.us.u_time, u.t);
          GLKit.ponerUniform(gl, r.us.u_aspecto, u.aspecto);
          GLKit.ponerUniform(gl, r.us.u_raton, u.raton);
          gl.bindVertexArray(r.vaos[r.actual]);                        // leer del actual…
          gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, r.tf);
          gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, r.bufs[sig]);   // …escribir en el otro
          gl.enable(gl.RASTERIZER_DISCARD);
          gl.beginTransformFeedback(gl.POINTS);
          gl.drawArrays(gl.POINTS, 0, m.n);
          gl.endTransformFeedback();
          gl.disable(gl.RASTERIZER_DISCARD);
          gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
          gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
          gl.bindVertexArray(null);
          r.actual = sig;                                              // el ping-pong
          m.msCPU = 0;
        };
        m.dibujar = function (u) {
          const r = recursos;
          gl.useProgram(r.pd);
          GLKit.ponerUniform(gl, r.ud.u_aspecto, u.aspecto);
          GLKit.ponerUniform(gl, r.ud.u_tamPunto, u.tamPunto);
          GLKit.ponerUniform(gl, r.ud.u_brillo, u.brillo);
          gl.bindVertexArray(r.vaos[r.actual]);
          gl.drawArrays(gl.POINTS, 0, m.n);
          gl.bindVertexArray(null);
        };
        m.liberar = function () {
          if (!recursos) return;
          gl.deleteProgram(recursos.ps); gl.deleteProgram(recursos.pd);
          recursos.bufs.forEach((b) => gl.deleteBuffer(b)); recursos.vaos.forEach((v) => gl.deleteVertexArray(v));
          gl.deleteTransformFeedback(recursos.tf);
          recursos = null;
        };
      } else {
        throw new Error("método desconocido: " + metodo);
      }
      return m;
    }

    return { RUIDO, PASO, pcg, ruidoGradiente, psi, rotacional, azar, estadoInicial, MedidorGPU, crearMotor };
  }
  window.L75 = factory();
  window.Curso = window.Curso || {};
  (Curso.libsIframe = Curso.libsIframe || {}).l75 = "window.L75 = (" + factory.toString() + ")();";
})();
