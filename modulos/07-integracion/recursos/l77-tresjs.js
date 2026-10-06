/* =====================================================================
   l77-tresjs.js — «Tres.js»: una Three.js de juguete para la lección 7.7.
   Imita la API de Three.js (los mismos nombres: WebGLRenderer, Scene,
   Mesh, BufferGeometry, BufferAttribute, ShaderMaterial…) y, sobre todo,
   su ESTRATEGIA por debajo, comprobada leyendo el código de Three.js r186
   y registrando sus llamadas de WebGL en Chrome:

     · los datos viven en JavaScript (arrays tipados) y se suben a la GPU
       la primera vez que se dibujan, no al crearlos;
     · un programa por TEXTO de shader (dos materiales con el mismo código
       comparten programa), con un prefijo que declara versión, precisión,
       matrices y atributos, como ShaderMaterial;
     · un VAO por pareja (geometría, programa);
     · el estado de GL en caché: useProgram, bindVertexArray, enable… y
       cada uniform solo se envían si cambian;
     · renderer.info cuenta draw calls y recursos; dispose() los borra.

   No es Three.js: no hay luces, sombras, texturas ni cargadores. Son unas
   300 líneas para que veas el esqueleto. Necesita GLKit y mat4 (glkit.js).
   En los playgrounds JS:  data-incluir="glkit,l77tres"
   ===================================================================== */
(function () {
  "use strict";
  function factory() {
    let siguienteId = 1;

    /* ---------------------------------------------------------------
       Lo que vive en JavaScript: atributos y geometrías (la «descripción»
       de la que 7.1 sabe reconstruir la GPU).
       --------------------------------------------------------------- */
    class BufferAttribute {
      constructor(array, itemSize, normalized) {
        this.array = array;              // un array tipado: su clase decide el tipo de GL
        this.itemSize = itemSize;        // componentes por vértice (el size de vertexAttribPointer)
        this.normalized = !!normalized;
        this.count = array.length / itemSize;
        this.usage = 0x88e4;             // STATIC_DRAW, la pista de bufferData (4.4)
        this.version = 0;                // sube con needsUpdate: el renderer compara versiones
      }
      set needsUpdate(v) { if (v) this.version++; }
      setUsage(u) { this.usage = u; return this; }
    }
    class InstancedBufferAttribute extends BufferAttribute {
      constructor(array, itemSize, normalized) { super(array, itemSize, normalized); this.meshPerAttribute = 1; } // el divisor (5.9)
    }

    class BufferGeometry {
      constructor() {
        this.id = siguienteId++;
        this.attributes = {};
        this.index = null;
        this._alLiberar = [];            // quien subió algo a la GPU se apunta aquí para borrarlo
      }
      setAttribute(nombre, atributo) { this.attributes[nombre] = atributo; return this; }
      setIndex(indices) {
        this.index = Array.isArray(indices) ? new BufferAttribute(new Uint16Array(indices), 1) : indices;
        return this;
      }
      dispose() { this._alLiberar.splice(0).forEach((fn) => fn(this)); }
    }

    /* Un rectángulo de w × h en el plano z = 0, con los mismos vértices, UV e índices
       que PlaneGeometry(w, h) de Three.js con un solo segmento. */
    class PlaneGeometry extends BufferGeometry {
      constructor(w, h) {
        super();
        const x = (w === undefined ? 1 : w) / 2, y = (h === undefined ? 1 : h) / 2;
        this.setAttribute("position", new BufferAttribute(new Float32Array([-x, y, 0, x, y, 0, -x, -y, 0, x, -y, 0]), 3));
        this.setAttribute("normal", new BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]), 3));
        this.setAttribute("uv", new BufferAttribute(new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), 2));
        this.setIndex([0, 2, 1, 2, 3, 1]);   // antihorario visto desde +z (5.3)
      }
    }

    /* ---------------------------------------------------------------
       Materiales: el texto de los shaders, sus uniforms y el estado.
       --------------------------------------------------------------- */
    class ShaderMaterial {
      constructor(p) {
        p = p || {};
        this.id = siguienteId++;
        this.uniforms = p.uniforms || {};     // { nombre: { value } }: se guarda la REFERENCIA
        this.defines = p.defines || {};
        this.vertexShader = p.vertexShader || "void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
        this.fragmentShader = p.fragmentShader || "void main() { gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); }";
        this.transparent = !!p.transparent;  // → BLEND con alfa premultiplicado… aquí, el normal
        this.depthTest = p.depthTest !== false;
        this.depthWrite = p.depthWrite !== false;
        this.doubleSided = !!p.doubleSided;  // false → CULL_FACE (Three: side = FrontSide)
        this.version = 0;
        this._alLiberar = [];
      }
      set needsUpdate(v) { if (v) this.version++; }
      dispose() { this._alLiberar.splice(0).forEach((fn) => fn(this)); }
    }
    /* Tu texto tal cual, sin prefijo (en este juguete, tampoco se le añaden los defines). */
    class RawShaderMaterial extends ShaderMaterial {
      constructor(p) { super(p); this.isRawShaderMaterial = true; }
    }

    /* ---------------------------------------------------------------
       Objetos de la escena: una matriz por objeto (3.5, 3.6).
       --------------------------------------------------------------- */
    class Object3D {
      constructor() {
        this.id = siguienteId++;
        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };  // radianes; orden Y · X · Z por simplicidad
        this.scale = { x: 1, y: 1, z: 1 };
        this.visible = true;
        this.matrixWorld = mat4.identidad();
        this.children = [];
      }
      add() { for (const o of arguments) this.children.push(o); return this; }
      remove(o) { const i = this.children.indexOf(o); if (i >= 0) this.children.splice(i, 1); return this; }
      /* matrixWorld = la del padre × la local (traslación · rotación · escala, el orden TRS de 3.5). */
      updateMatrixWorld(padre) {
        const p = this.position, r = this.rotation, s = this.scale;
        const local = mat4.producto(mat4.traslacion(p.x, p.y, p.z), mat4.rotacionY(r.y), mat4.rotacionX(r.x), mat4.rotacionZ(r.z), mat4.escala(s.x, s.y, s.z));
        this.matrixWorld = padre ? mat4.multiplicar(padre.matrixWorld, local) : local;
      }
    }
    class Scene extends Object3D {}
    class Mesh extends Object3D {
      constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; }
    }
    /* Muchas copias de una malla en UN draw call: un atributo mat4 por instancia (5.9). */
    class InstancedMesh extends Mesh {
      constructor(geometry, material, count) {
        super(geometry, material);
        this.isInstancedMesh = true;
        this.count = count;
        this.instanceMatrix = new InstancedBufferAttribute(new Float32Array(count * 16), 16);
        for (let i = 0; i < count; i++) this.setMatrixAt(i, mat4.identidad());
      }
      setMatrixAt(i, m) { this.instanceMatrix.array.set(m, i * 16); }
    }

    class Camera extends Object3D {
      constructor() { super(); this.projectionMatrix = mat4.identidad(); this.matrixWorldInverse = mat4.identidad(); }
      updateMatrixWorld() {}                   // una Camera «pelada» deja las matrices en la identidad
    }
    class PerspectiveCamera extends Camera {
      constructor(fov, aspect, near, far) {
        super();
        this.fov = fov === undefined ? 50 : fov;       // ¡GRADOS, como Three.js! (mat4.perspectiva usa radianes)
        this.aspect = aspect === undefined ? 1 : aspect;
        this.near = near === undefined ? 0.1 : near;
        this.far = far === undefined ? 2000 : far;
        this.objetivo = [0, 0, 0];
        this.updateProjectionMatrix();
      }
      /* Si cambias fov, aspect, near o far, NADIE recalcula la matriz hasta que llamas a esto. */
      updateProjectionMatrix() { this.projectionMatrix = mat4.perspectiva(this.fov * Math.PI / 180, this.aspect, this.near, this.far); }
      lookAt(x, y, z) { this.objetivo = [x, y, z]; }
      updateMatrixWorld() {
        const p = this.position;
        this.matrixWorldInverse = mat4.mirarA([p.x, p.y, p.z], this.objetivo, [0, 1, 0]);   // la vista (3.6)
      }
    }

    /* ---------------------------------------------------------------
       El prefijo de ShaderMaterial (resumido del de Three.js r186): lo que
       Three.js escribe ANTES de tu código. Por eso tu shader no lleva
       #version ni declara position, modelViewMatrix…
       --------------------------------------------------------------- */
    const PREFIJO_VS = [
      "#version 300 es",
      "#define attribute in",
      "#define varying out",
      "#define texture2D texture",
      "precision highp float;",
      "precision highp int;",
      "uniform mat4 modelMatrix;",
      "uniform mat4 modelViewMatrix;",
      "uniform mat4 projectionMatrix;",
      "uniform mat4 viewMatrix;",
      "#ifdef USE_INSTANCING",
      "  attribute mat4 instanceMatrix;",
      "#endif",
      "attribute vec3 position;",
      "attribute vec3 normal;",
      "attribute vec2 uv;",
    ];
    const PREFIJO_FS = [
      "#version 300 es",
      "#define varying in",
      "layout(location = 0) out highp vec4 pc_fragColor;",
      "#define gl_FragColor pc_fragColor",
      "#define texture2D texture",
      "precision highp float;",
      "precision highp int;",
      "uniform mat4 viewMatrix;",
    ];

    /* Lo que va a la GPU se pregunta por el tipo del array tipado, como WebGLAttributes. */
    function tipoGL(gl, array) {
      if (array instanceof Float32Array) return gl.FLOAT;
      if (array instanceof Uint16Array) return gl.UNSIGNED_SHORT;
      if (array instanceof Uint32Array) return gl.UNSIGNED_INT;
      if (array instanceof Uint8Array || array instanceof Uint8ClampedArray) return gl.UNSIGNED_BYTE;
      if (array instanceof Int16Array) return gl.SHORT;
      if (array instanceof Int8Array) return gl.BYTE;
      throw new Error("Tres: tipo de array no admitido: " + array);
    }
    /* Cualquier valor de uniform (número, array, {x, y}, matriz) como lista de números. */
    function comoLista(v) {
      if (typeof v === "number" || typeof v === "boolean") return [+v];
      if (v && v.length !== undefined) return v;
      if (v && v.elements) return v.elements;
      if (v && v.x !== undefined) return v.w !== undefined ? [v.x, v.y, v.z, v.w] : v.z !== undefined ? [v.x, v.y, v.z] : [v.x, v.y];
      return [];
    }
    function numerar(fuente, lineasMal) {
      return fuente.split("\n").map((l, i) => (lineasMal.has(i + 1) ? "> " : "  ") + String(i + 1).padStart(3) + ": " + l)
        .filter((l, i) => [...lineasMal].some((n) => Math.abs(n - (i + 1)) <= 3)).join("\n");
    }

    /* ---------------------------------------------------------------
       El renderer: aquí están todas las llamadas de WebGL.
       --------------------------------------------------------------- */
    class WebGLRenderer {
      constructor(p) {
        p = p || {};
        this.domElement = p.canvas || document.createElement("canvas");
        // Three.js r186 pide SIEMPRE alpha: true y resuelve p.alpha con el alfa del color de borrado.
        const gl = this.domElement.getContext("webgl2", { alpha: true, depth: true, stencil: false, antialias: !!p.antialias, premultipliedAlpha: true, preserveDrawingBuffer: false });
        if (!gl) throw new Error("Tres: no hay WebGL2");
        this.gl = gl;
        this._ratio = 1; this._ancho = this.domElement.width; this._alto = this.domElement.height;
        this._color = [0, 0, 0, p.alpha ? 0 : 1];
        this.info = { render: { frame: 0, calls: 0, triangles: 0 }, memory: { geometries: 0, programs: 0 } };
        this._buffers = new WeakMap();   // atributo → { buffer, version }
        this._programas = new Map();     // clave (texto + defines) → { id, programa, vs, fs, usos, ok, u, cacheU }
        this._vaos = new Map();          // "geometría:programa" → VAO
        this._props = new WeakMap();     // material → { prog, version }
        this._estado = {};               // caché de enable/disable/useProgram/bindVertexArray…
        this._materialActual = -1;
      }
      getContext() { return this.gl; }
      getPixelRatio() { return this._ratio; }
      /* Como Three.js: el ratio no se aplica hasta el siguiente setSize (que se llama aquí mismo). */
      setPixelRatio(r) { this._ratio = r; this.setSize(this._ancho, this._alto, false); }
      setSize(w, h, estilo) {
        this._ancho = w; this._alto = h;
        this.domElement.width = Math.floor(w * this._ratio);     // floor, no round: igual que r186
        this.domElement.height = Math.floor(h * this._ratio);
        if (estilo !== false) { this.domElement.style.width = w + "px"; this.domElement.style.height = h + "px"; }
        this.gl.viewport(0, 0, this.domElement.width, this.domElement.height);
      }
      setClearColor(hex, alfa) {
        this._color = [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255, alfa === undefined ? 1 : alfa];
      }
      /* Un único rAF que te pasa su tiempo (Three.js añade la sesión de WebXR). */
      setAnimationLoop(fn) {
        cancelAnimationFrame(this._raf);
        if (!fn) return;
        const bucle = (t) => { this._raf = requestAnimationFrame(bucle); fn(t); };
        this._raf = requestAnimationFrame(bucle);
      }

      /* --- caché de estado: una llamada de GL solo si el valor cambia (WebGLState) --- */
      _activar(cap, si) {
        if (this._estado[cap] === si) return;
        this._estado[cap] = si;
        si ? this.gl.enable(cap) : this.gl.disable(cap);
      }
      _usarPrograma(p) {
        if (this._estado.programa === p) return false;
        this._estado.programa = p; this.gl.useProgram(p); return true;
      }
      _enlazarVAO(v) {
        if (this._estado.vao === v) return;
        this._estado.vao = v; this.gl.bindVertexArray(v);
      }

      /* --- geometría: subida perezosa y por versiones (WebGLAttributes) --- */
      _subir(atributo, destino, geometria) {
        const gl = this.gl;
        let d = this._buffers.get(atributo);
        if (!d) {
          const buffer = gl.createBuffer();
          gl.bindBuffer(destino, buffer);
          gl.bufferData(destino, atributo.array, atributo.usage);   // copia los bytes a la GPU
          d = { buffer, version: atributo.version, tipo: tipoGL(gl, atributo.array) };
          this._buffers.set(atributo, d);
        } else if (d.version !== atributo.version) {                // needsUpdate = true
          gl.bindBuffer(destino, d.buffer);
          gl.bufferSubData(destino, 0, atributo.array);
          d.version = atributo.version;
        }
        return d;
      }
      _subirGeometria(g, extra) {
        if (!g._subida) {
          g._subida = true;
          this.info.memory.geometries++;
          g._alLiberar.push(() => this._liberarGeometria(g));
        }
        for (const n in g.attributes) this._subir(g.attributes[n], this.gl.ARRAY_BUFFER);
        if (extra) this._subir(extra, this.gl.ARRAY_BUFFER);
        if (g.index) this._subir(g.index, this.gl.ELEMENT_ARRAY_BUFFER);
      }
      _liberarGeometria(g) {
        const gl = this.gl;
        for (const a of Object.values(g.attributes).concat(g.index ? [g.index] : [])) {
          const d = this._buffers.get(a);
          if (d) { gl.deleteBuffer(d.buffer); this._buffers.delete(a); }
        }
        for (const [clave, vao] of this._vaos) {
          if (clave.startsWith(g.id + ":")) { gl.deleteVertexArray(vao); this._vaos.delete(clave); if (this._estado.vao === vao) this._estado.vao = null; }
        }
        g._subida = false;
        this.info.memory.geometries--;
      }

      /* --- programas: uno por texto (WebGLPrograms) --- */
      _programa(material, objeto) {
        const defs = Object.assign({}, material.defines);
        if (objeto.isInstancedMesh) defs.USE_INSTANCING = "";
        const lineasDef = Object.keys(defs).map((k) => "#define " + k + " " + defs[k]);
        const clave = material.vertexShader + "\u0000" + material.fragmentShader + "\u0000" + lineasDef.join(";") + (material.isRawShaderMaterial ? "raw" : "");
        let p = this._programas.get(clave);
        if (p) return p;
        const gl = this.gl;
        const raw = material.isRawShaderMaterial;
        const fuenteVS = raw ? material.vertexShader : PREFIJO_VS.concat(lineasDef).join("\n") + "\n" + material.vertexShader;
        const fuenteFS = raw ? material.fragmentShader : PREFIJO_FS.concat(lineasDef).join("\n") + "\n" + material.fragmentShader;
        const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, fuenteVS); gl.compileShader(vs);
        const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, fuenteFS); gl.compileShader(fs);
        const programa = gl.createProgram();
        gl.attachShader(programa, vs); gl.attachShader(programa, fs);
        gl.bindAttribLocation(programa, 0, "position");   // position siempre en la location 0 (5.3)
        gl.linkProgram(programa);
        // Como Three.js: NO preguntamos LINK_STATUS ahora (obligaría a esperar, 5.2); se mira al primer uso.
        p = { id: siguienteId++, clave, programa, vs, fs, fuenteVS, fuenteFS, usos: 0, ok: null, u: null, atributos: null, cacheU: {} };
        this._programas.set(clave, p);
        this.info.memory.programs++;
        return p;
      }
      _primerUso(p) {
        const gl = this.gl;
        p.ok = gl.getProgramParameter(p.programa, gl.LINK_STATUS);
        if (!p.ok) {
          for (const [sh, fuente, nombre] of [[p.vs, p.fuenteVS, "VERTEX"], [p.fs, p.fuenteFS, "FRAGMENT"]]) {
            const log = (gl.getShaderInfoLog(sh) || "").trim();
            if (!log) continue;
            const mal = new Set([...log.matchAll(/ERROR:\s*\d+:(\d+)/g)].map((m) => +m[1]));
            console.error("Tres.WebGLProgram: Shader Error\n" + nombre + "\n" + log + "\n" + numerar(fuente, mal));
          }
        } else {
          p.u = GLKit.uniforms(gl, p.programa);           // getActiveUniform + getUniformLocation, una vez
          p.atributos = {};
          const n = gl.getProgramParameter(p.programa, gl.ACTIVE_ATTRIBUTES);
          for (let i = 0; i < n; i++) {
            const a = gl.getActiveAttrib(p.programa, i);
            p.atributos[a.name] = { loc: gl.getAttribLocation(p.programa, a.name), columnas: a.type === gl.FLOAT_MAT4 ? 4 : 1 };
          }
        }
        gl.deleteShader(p.vs); gl.deleteShader(p.fs);     // enlazado: los shaders sobran
      }
      _liberarPrograma(p) {
        if (--p.usos > 0) return;
        this.gl.deleteProgram(p.programa);
        this._programas.delete(p.clave);
        this.info.memory.programs--;
        if (this._estado.programa === p.programa) this._estado.programa = null;
      }

      /* --- uniforms: un valor solo viaja si cambió (WebGLUniforms) --- */
      _uniform(p, nombre, valor) {
        const u = p.u[nombre];
        if (!u) return;                                     // no existe o el compilador lo eliminó
        const lista = comoLista(valor);
        const cache = p.cacheU[nombre];
        if (cache && cache.length === lista.length) {
          let igual = true;
          for (let i = 0; i < lista.length; i++) if (cache[i] !== lista[i]) { igual = false; break; }
          if (igual) return;
        }
        p.cacheU[nombre] = Array.from(lista);               // una COPIA: si el usuario muta su array, lo notaremos
        GLKit.ponerUniform(this.gl, u, typeof valor === "number" || typeof valor === "boolean" ? valor : lista);
      }

      /* --- VAO: uno por (geometría, programa), porque las locations son del programa (4.4) --- */
      _vao(objeto, p) {
        const g = objeto.geometry, clave = g.id + ":" + p.id + (objeto.isInstancedMesh ? ":" + objeto.id : "");
        let vao = this._vaos.get(clave);
        if (vao) { this._enlazarVAO(vao); return; }
        const gl = this.gl;
        vao = gl.createVertexArray();
        this._vaos.set(clave, vao);
        this._enlazarVAO(vao);
        const fuentes = Object.assign({}, g.attributes, objeto.isInstancedMesh ? { instanceMatrix: objeto.instanceMatrix } : {});
        for (const nombre in p.atributos) {
          const info = p.atributos[nombre], atr = fuentes[nombre];
          if (!atr) continue;                                // el shader lo pide y la geometría no lo tiene: valor constante
          const d = this._buffers.get(atr);
          gl.bindBuffer(gl.ARRAY_BUFFER, d.buffer);
          for (let c = 0; c < info.columnas; c++) {          // una mat4 son 4 locations seguidas (5.9)
            gl.enableVertexAttribArray(info.loc + c);
            const tam = info.columnas > 1 ? 4 : atr.itemSize, stride = info.columnas > 1 ? 64 : 0;
            gl.vertexAttribPointer(info.loc + c, tam, d.tipo, atr.normalized, stride, c * 16);
            if (atr.meshPerAttribute) gl.vertexAttribDivisor(info.loc + c, atr.meshPerAttribute);
          }
        }
        if (g.index) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._buffers.get(g.index).buffer);  // queda en el VAO
      }

      /* --- el frame --- */
      render(escena, camara) {
        const gl = this.gl;
        const r = this.info.render;
        r.frame++; r.calls = 0; r.triangles = 0;
        this._materialActual = -1;                           // cada frame se vuelven a subir los uniforms del material (si cambiaron)
        escena.updateMatrixWorld();
        camara.updateMatrixWorld();
        // 1. Recorrer la escena y subir lo que falte (antes de borrar, como Three.js)
        const lista = [];
        const recorrer = (o, padre) => {
          if (!o.visible) return;
          if (padre) o.updateMatrixWorld(padre);
          if (o.geometry && o.material) { this._subirGeometria(o.geometry, o.isInstancedMesh ? o.instanceMatrix : null); lista.push(o); }
          o.children.forEach((h) => recorrer(h, o));
        };
        recorrer(escena, null);
        // 2. Borrar (con las máscaras abiertas: si alguien dejó depthMask(false), el clear no borraría la profundidad)
        const c = this._color.join();
        if (this._estado.clearColor !== c) { gl.clearColor(this._color[0], this._color[1], this._color[2], this._color[3]); this._estado.clearColor = c; }
        if (this._estado.depthMask !== true) { gl.depthMask(true); this._estado.depthMask = true; }
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // 3. Opacos primero, transparentes después (5.7)
        lista.sort((a, b) => (a.material.transparent ? 1 : 0) - (b.material.transparent ? 1 : 0));
        for (const o of lista) this._dibujar(o, camara);
      }
      _dibujar(o, camara) {
        const gl = this.gl, m = o.material;
        let props = this._props.get(m);
        if (!props || props.version !== m.version) {          // material nuevo o needsUpdate = true
          if (props) this._liberarPrograma(props.prog);
          const prog = this._programa(m, o);
          prog.usos++;
          props = { prog, version: m.version };
          this._props.set(m, props);
          m._alLiberar.push(() => { this._liberarPrograma(prog); this._props.delete(m); });
        }
        const p = props.prog;
        if (p.ok === null) this._primerUso(p);
        if (!p.ok) return;                                    // no compiló: el objeto no se dibuja (y no se lanza nada)
        const cambioPrograma = this._usarPrograma(p.programa);
        if (cambioPrograma || m.id !== this._materialActual) { // mismo material que el objeto anterior: no se repite
          this._materialActual = m.id;
          for (const nombre in m.uniforms) this._uniform(p, nombre, m.uniforms[nombre].value);
        }
        // Las matrices de cada objeto, siempre (pero con caché: si no cambian, no viajan)
        this._uniform(p, "projectionMatrix", camara.projectionMatrix);
        this._uniform(p, "viewMatrix", camara.matrixWorldInverse);
        this._uniform(p, "modelMatrix", o.matrixWorld);
        this._uniform(p, "modelViewMatrix", mat4.multiplicar(camara.matrixWorldInverse, o.matrixWorld));
        // Estado del material (en WebGPU, todo esto sería parte del pipeline)
        this._activar(gl.DEPTH_TEST, m.depthTest);
        if (this._estado.depthMask !== m.depthWrite) { gl.depthMask(m.depthWrite); this._estado.depthMask = m.depthWrite; }
        this._activar(gl.CULL_FACE, !m.doubleSided);
        this._activar(gl.BLEND, m.transparent);
        if (m.transparent && !this._estado.blendFunc) { gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); this._estado.blendFunc = true; }
        this._vao(o, p);
        const g = o.geometry;
        const n = g.index ? g.index.count : g.attributes.position.count;
        if (o.isInstancedMesh) {
          g.index ? gl.drawElementsInstanced(gl.TRIANGLES, n, this._buffers.get(g.index).tipo, 0, o.count) : gl.drawArraysInstanced(gl.TRIANGLES, 0, n, o.count);
          this.info.render.triangles += o.count * n / 3;
        } else {
          g.index ? gl.drawElements(gl.TRIANGLES, n, this._buffers.get(g.index).tipo, 0) : gl.drawArrays(gl.TRIANGLES, 0, n);
          this.info.render.triangles += n / 3;
        }
        this.info.render.calls++;
      }
    }

    /* ---------------------------------------------------------------
       El espía: envuelve cada método del contexto para contar y anotar
       las llamadas (lo que hicimos con Three.js de verdad en Chrome).
       --------------------------------------------------------------- */
    function espiar(gl) {
      const espia = { grabando: false, llamadas: [], cuenta: {} };
      const proto = Object.getPrototypeOf(gl);
      for (const k of Object.getOwnPropertyNames(proto)) {
        const d = Object.getOwnPropertyDescriptor(proto, k);
        if (!d || typeof d.value !== "function" || k === "constructor") continue;
        const f = d.value;
        gl[k] = function () {                              // propiedad propia: tapa a la del prototipo
          espia.cuenta[k] = (espia.cuenta[k] || 0) + 1;
          if (espia.grabando) espia.llamadas.push(k);
          return f.apply(gl, arguments);
        };
      }
      espia.grabar = function (fn) {
        espia.llamadas = []; espia.grabando = true;
        try { fn(); } finally { espia.grabando = false; }
        return espia.llamadas;
      };
      return espia;
    }

    return {
      BufferAttribute, InstancedBufferAttribute, BufferGeometry, PlaneGeometry,
      ShaderMaterial, RawShaderMaterial, Object3D, Scene, Mesh, InstancedMesh,
      Camera, PerspectiveCamera, WebGLRenderer, espiar,
      StaticDrawUsage: 0x88e4, DynamicDrawUsage: 0x88e8,
    };
  }
  window.Curso = window.Curso || {};
  (Curso.libsIframe = Curso.libsIframe || {}).l77tres = "window.Tres = (" + factory.toString() + ")();";
})();
