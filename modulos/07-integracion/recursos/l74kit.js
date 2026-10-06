/* =====================================================================
   l74kit.js — utilidades de la lección 7.4 (mallas que se deforman).
   Igual que m7kit: nada que no se haya escrito a mano en la lección.
   Léelo entero: es corto.

     L74.rejilla(N)            datos de un plano de N × N celdas: uv e índices
                               (Uint16Array o Uint32Array según haga falta)   (7.4 §2)
     L74.crearMalla(gl, N, o)  VAO con a_uv en la location 0 + buffer de índices;
                               con o.sinUV, solo índices (gl_VertexID)         (7.4 §2, §8)
     L74.Orbita                cámara orbital de 5.6 con la regla de 7.1: los eventos
                               solo anotan; actualizar() aplica, una vez por frame
     L74.rayo(vp, nx, ny)      rayo que sale del ojo por el punto (nx, ny) del canvas
                               (0..1, origen abajo a la izquierda)             (7.4 §7)
     L74.cortarPlanoY(r, y)    punto donde un rayo corta el plano horizontal y
     L74.GLSL.RUIDO            hash12, ruidoGradiente y fbm de 6.6
     L74.GLSL.ALAMBRE          baricéntricas de la rejilla a partir de gl_VertexID
                               y alambre() con fwidth                          (7.4 §4)

   En los playgrounds JS:  data-incluir="glkit,m7kit,l74kit"  (glkit ANTES: usa mat4 y vec3)
   ===================================================================== */
(function () {
  "use strict";
  function factory() {
    /* Plano de N × N celdas en el cuadrado uv [0,1]²: (N+1)² vértices, 2N² triángulos, 6N² índices.
       Vértice (i, j) → índice j·(N+1) + i. Celda con esquina a = (i, j) y b = a + (N+1):
       triángulos (a, a+1, b) y (b, a+1, b+1), antihorarios vistos en el plano uv. */
    function rejilla(N) {
      const lado = N + 1, nVertices = lado * lado;
      const uv = new Float32Array(nVertices * 2);
      for (let j = 0; j < lado; j++) {
        for (let i = 0; i < lado; i++) {
          const k = j * lado + i;
          uv[2 * k] = i / N;
          uv[2 * k + 1] = j / N;
        }
      }
      // 65535 (0xFFFF) es el índice de reinicio de primitivas: con Uint16, como mucho el vértice 65534
      const Tipo = nVertices - 1 <= 65534 ? Uint16Array : Uint32Array;
      const indices = new Tipo(6 * N * N);
      let k = 0;
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const a = j * lado + i, b = a + lado;
          indices[k++] = a; indices[k++] = a + 1; indices[k++] = b;
          indices[k++] = b; indices[k++] = a + 1; indices[k++] = b + 1;
        }
      }
      return { N: N, lado: lado, nVertices: nVertices, uv: uv, indices: indices };
    }

    /* Sube la rejilla a la GPU. El VAO guarda el atributo 0 (a_uv) y el buffer de índices.
       o.sinUV: solo el buffer de índices (el vertex shader saca (i, j) de gl_VertexID). */
    function crearMalla(gl, N, o) {
      o = o || {};
      const r = rejilla(N);
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      let vbo = null;
      if (!o.sinUV) {
        vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, r.uv, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      }
      const ebo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);         // con el VAO enlazado: queda dentro de él (5.3)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, r.indices, gl.STATIC_DRAW);
      gl.bindVertexArray(null);
      return {
        vao: vao, N: N, lado: r.lado, nVertices: r.nVertices, nIndices: r.indices.length,
        tipo: r.indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
        nombreTipo: r.indices instanceof Uint32Array ? "Uint32Array" : "Uint16Array",
        dibujar: function () { gl.bindVertexArray(vao); gl.drawElements(gl.TRIANGLES, r.indices.length, this.tipo, 0); },
        liberar: function () { gl.deleteVertexArray(vao); if (vbo) gl.deleteBuffer(vbo); gl.deleteBuffer(ebo); },
      };
    }

    /* Cámara orbital (5.6). Arrastrar gira; el pitch se limita para no llegar al polo
       (mirarA degenera si la mirada es paralela a «arriba»). Los eventos solo acumulan
       el desplazamiento; actualizar() lo aplica una vez por frame (7.1). */
    class Orbita {
      constructor(canvas, o) {
        o = o || {};
        this.yaw = o.yaw !== undefined ? o.yaw : 0.6;          // rad, alrededor del eje y
        this.pitch = o.pitch !== undefined ? o.pitch : 0.5;    // rad, sobre el horizonte
        this.distancia = o.distancia || 6;
        this.centro = o.centro || [0, 0, 0];
        this.fov = o.fov || 0.8;                                // rad, vertical
        this.cerca = o.cerca || 0.05; this.lejos = o.lejos || 100;
        this.sensibilidad = o.sensibilidad || 0.008;            // rad por px CSS
        this.pitchMax = o.pitchMax || 1.45;
        this.dx = 0; this.dy = 0; this.id = null; this.ux = 0; this.uy = 0;
        this.activa = o.activa !== false;                       // false: la cámara no escucha al puntero
        const self = this;
        canvas.addEventListener("pointerdown", function (e) {
          if (!self.activa || self.id !== null) return;
          if (o.condicion && !o.condicion(e)) return;
          self.id = e.pointerId; self.ux = e.clientX; self.uy = e.clientY;
          canvas.setPointerCapture(e.pointerId);
        });
        canvas.addEventListener("pointermove", function (e) {
          if (e.pointerId !== self.id) return;
          self.dx += e.clientX - self.ux; self.dy += e.clientY - self.uy;
          self.ux = e.clientX; self.uy = e.clientY;
        });
        const soltar = function (e) { if (e.pointerId === self.id) self.id = null; };
        canvas.addEventListener("pointerup", soltar);
        canvas.addEventListener("pointercancel", soltar);
      }
      get arrastrando() { return this.id !== null; }
      actualizar() {
        this.yaw -= this.dx * this.sensibilidad;
        this.pitch = Math.max(-this.pitchMax, Math.min(this.pitchMax, this.pitch + this.dy * this.sensibilidad));
        this.dx = this.dy = 0;
      }
      /* Matrices para este frame (aspecto = ancho / alto del búfer). */
      matrices(aspecto) {
        const cp = Math.cos(this.pitch), c = this.centro, r = this.distancia;
        const ojo = [c[0] + r * cp * Math.sin(this.yaw), c[1] + r * Math.sin(this.pitch), c[2] + r * cp * Math.cos(this.yaw)];
        const vista = mat4.mirarA(ojo, c, [0, 1, 0]);
        const proyeccion = mat4.perspectiva(this.fov, aspecto, this.cerca, this.lejos);
        return { ojo: ojo, vista: vista, proyeccion: proyeccion, vp: mat4.multiplicar(proyeccion, vista) };
      }
    }

    /* Del punto (nx, ny) del canvas (0..1, origen abajo) a un rayo del mundo: se deshace
       proyección × vista (3.6) para los puntos de NDC (x, y, −1) (plano cercano) y (x, y, 1) (lejano). */
    function rayo(vp, nx, ny) {
      const inv = mat4.invertir(vp);
      const x = nx * 2 - 1, y = ny * 2 - 1;
      const a = mat4.porVector(inv, [x, y, -1, 1]), b = mat4.porVector(inv, [x, y, 1, 1]);
      const origen = [a[0] / a[3], a[1] / a[3], a[2] / a[3]];
      const lejos = [b[0] / b[3], b[1] / b[3], b[2] / b[3]];
      return { origen: origen, dir: vec3.normalizar(vec3.restar(lejos, origen)) };
    }
    /* origen + t·dir con la y pedida; null si el rayo es paralelo al plano o lo corta por detrás. */
    function cortarPlanoY(r, y) {
      if (Math.abs(r.dir[1]) < 1e-6) return null;
      const t = (y - r.origen[1]) / r.dir[1];
      if (t < 0) return null;
      return [r.origen[0] + t * r.dir[0], y, r.origen[2] + t * r.dir[2]];
    }

    const GLSL = {
      /* El ruido de 6.6: hash de Hoskins (MIT), ruido de gradiente con fade quíntico y fbm
         con rotación y desplazamiento entre octavas (sin la mancha del origen). */
      RUIDO: `
// «Hash without Sine», (c) 2014 David Hoskins, licencia MIT
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 gradiente(vec2 esquina) { float a = 6.2831853 * hash12(esquina); return vec2(cos(a), sin(a)); }
float ruidoGradiente(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = dot(gradiente(i), f);
  float b = dot(gradiente(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(gradiente(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(gradiente(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
const mat2 ROTAR = mat2(0.8, 0.6, -0.6, 0.8);
float fbm(vec2 p) {
  float suma = 0.0, amplitud = 0.5;
  for (int k = 0; k < 5; k++) {
    suma += amplitud * ruidoGradiente(p);
    p = ROTAR * p * 2.0 + vec2(17.3, 5.9);
    amplitud *= 0.5;
  }
  return suma;
}
`,
      /* Alambre baricéntrico para la rejilla de L74 dibujada con drawElements:
         gl_VertexID es el valor del índice → (i, j) → «color» (i + 2j) mod 3.
         Cada triángulo recibe los tres colores, así que sus vértices valen (1,0,0), (0,1,0), (0,0,1). */
      ALAMBRE_VS: `
vec3 baricentrica(int id, int lado) {
  int i = id % lado, j = id / lado;
  int c = (i + 2 * j) % 3;
  return vec3(c == 0, c == 1, c == 2);
}
`,
      /* En el fragment shader: 0 sobre una arista, 1 lejos de ellas. grosor en px del búfer. */
      ALAMBRE_FS: `
float alambre(vec3 b, float grosor) {
  vec3 d = max(fwidth(b), vec3(1e-6));                 // cuánto cambia b por píxel
  vec3 a = smoothstep(d * (grosor - 0.5), d * (grosor + 0.5), b);
  return min(min(a.x, a.y), a.z);
}
`,
    };

    return { rejilla: rejilla, crearMalla: crearMalla, Orbita: Orbita, rayo: rayo, cortarPlanoY: cortarPlanoY, GLSL: GLSL };
  }
  window.L74 = factory();
  window.Curso = window.Curso || {};
  (Curso.libsIframe = Curso.libsIframe || {}).l74kit = "window.L74 = (" + factory.toString() + ")();";
})();
