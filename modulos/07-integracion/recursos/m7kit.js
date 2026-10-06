/* =====================================================================
   m7kit.js — la arquitectura de la lección 7.1, empaquetada.
   Es el hermano pequeño de GLKit (módulo 5) y sigue su regla: nada de
   magia. Cada pieza se construye a mano en una lección; aquí solo está
   recogida para no repetirla en cada ejemplo. Léela entera: es corta.

     M7.Reloj        reloj consciente de pausas, con escala de tiempo   (7.1)
     M7.Calidad      calidad adaptativa: escala de resolución según el
                     tiempo entre frames                                (7.1)
     M7.crearApp     esqueleto iniciar / redimensionar / actualizar /
                     dibujar con tamaño robusto, pausas, pérdida de
                     contexto, bucle bajo demanda y alternativa         (7.1)
     M7.conDefines   inyecta #define tras #version y restaura la
                     numeración de líneas con #line                     (7.1)
     M7.flotante     número de JS → literal float de GLSL (2 → "2.0")   (7.1)
     M7.suavizar     suavizado exponencial independiente de los fps     (2.4)
     M7.Muelle       muelle amortiguado con subpasos                    (2.5)
     M7.easings      funciones de easing                                (2.4)
     M7.Puntero      puntero → px CSS, normalizado y px del búfer (GL)  (7.2)

   En los playgrounds JS se inyecta con  data-incluir="glkit,m7kit"
   (la página de la lección debe cargar este archivo).
   ===================================================================== */
(function () {
  "use strict";
  function factory() {
    /* ---------------------------------------------------------------
       Reloj (7.1): el tiempo de la animación NO es el de la página.
       t = suma de dt × escala, sin contar pausas; dt real limitado.
       --------------------------------------------------------------- */
    class Reloj {
      constructor(opciones) {
        const o = opciones || {};
        this.dtMax = o.dtMax || 0.1; // s: tope del dt real (pestaña oculta, frame larguísimo: 2.3)
        this.t = 0;                  // s de animación acumulados
        this.dt = 0;                 // s de animación del último frame (0 si está pausado)
        this.dtReal = 0;             // s reales del último frame, ya limitados
        this.intervaloMs = 0;        // ms reales entre este frame y el anterior, SIN limitar (para medir)
        this.escala = 1;             // 1 normal · 0.25 cámara lenta · 0 congelado
        this.pausado = false;
        this.previo = null;          // ms del frame anterior; null = «no hay frame anterior»
      }
      avanzar(ms) {
        this.intervaloMs = this.previo === null ? 0 : ms - this.previo;
        this.previo = ms;
        this.dtReal = Math.min(Math.max(this.intervaloMs / 1000, 0), this.dtMax);
        this.dt = this.pausado ? 0 : this.dtReal * this.escala;
        this.t += this.dt;
        return this.dt;
      }
      /* Tras una pausa del bucle: el próximo frame tendrá dt = 0 (sin salto). */
      reiniciarReferencia() { this.previo = null; }
      /* Tiempo envuelto en JavaScript (64 bits) antes de viajar como float32 (5.4). */
      envuelto(periodo) { return this.t % periodo; }
    }

    /* ---------------------------------------------------------------
       Calidad adaptativa (7.1). Mide el intervalo REAL entre frames
       (el tiempo de JavaScript no ve la GPU) y ajusta un factor de
       resolución: baja deprisa si vamos tarde, sube despacio si sobra.
       --------------------------------------------------------------- */
    class Calidad {
      constructor(opciones) {
        const o = opciones || {};
        this.min = o.min !== undefined ? o.min : 0.5;   // escala mínima de resolución
        this.max = o.max !== undefined ? o.max : 1;     // escala máxima
        this.objetivoMs = o.objetivoMs || 1000 / 60;    // presupuesto por frame
        this.paso = o.paso || 0.85;                     // factor de cada bajada (y su inverso al subir)
        this.paciencia = o.paciencia || 2000;           // ms con margen antes de subir
        this.descartarMs = o.descartarMs || 250;        // intervalos más largos no cuentan (tirón suelto, vuelta de una suspensión)
        this.escala = this.max;
        this.mediaMs = this.objetivoMs;                 // media móvil exponencial (2.3)
        this.enfriar = o.calentamiento !== undefined ? o.calentamiento : 1000; // ms sin decidir: al arrancar y tras cada cambio
        this.holgura = 0;                               // ms seguidos por debajo del presupuesto
        this.cambios = 0;
      }
      /* Devuelve true si la escala ha cambiado. */
      medir(intervaloMs) {
        if (!(intervaloMs > 0) || intervaloMs > this.descartarMs) return false;  // pausa (0) o tirón suelto: no es rendimiento
        this.mediaMs += 0.1 * (intervaloMs - this.mediaMs);
        if (this.enfriar > 0) { this.enfriar -= intervaloMs; return false; }
        const antes = this.escala;
        if (this.mediaMs > this.objetivoMs * 1.25) {                // vamos tarde: bajar ya
          this.escala = Math.max(this.min, this.escala * this.paso);
          this.holgura = 0;
        } else if (this.mediaMs < this.objetivoMs * 1.1) {          // hay margen: subir sin prisa
          this.holgura += intervaloMs;
          if (this.holgura > this.paciencia) {
            this.escala = Math.min(this.max, this.escala / this.paso);
            this.holgura = 0;
          }
        } else {
          this.holgura = 0;
        }
        if (this.escala === antes) return false;
        this.enfriar = 500;                  // el cambio de tamaño necesita unos frames para notarse
        this.mediaMs = this.objetivoMs;      // la media vuelve a empezar desde el presupuesto
        this.cambios++;
        return true;
      }
    }

    /* ---------------------------------------------------------------
       crearApp (7.1): el esqueleto completo.
       o = { contexto, estado, dprMax, pixelesMax, calidad, bajoDemanda, dtMax,
             iniciar(gl, app), redimensionar(gl, app),
             actualizar(estado, dt, app), dibujar(gl, estado, app),
             fallar(motivo, app), alPerder(app) }
       --------------------------------------------------------------- */
    function crearApp(canvas, opciones) {
      const o = opciones || {};
      const reloj = new Reloj({ dtMax: o.dtMax });
      const calidad = o.calidad ? new Calidad(o.calidad === true ? {} : o.calidad) : null;
      const app = {
        canvas: canvas, gl: null, reloj: reloj, calidad: calidad, estado: o.estado || {},
        ancho: 0, alto: 0,          // tamaño REAL del búfer (drawingBufferWidth/Height)
        anchoCSS: 0, altoCSS: 0,    // tamaño de la caja del canvas en px CSS
        frame: 0, fps: 0, msFrame: 1000 / 60,
        activo: false, motivoFallo: null,
        pedirFrame: pedirFrame, pausar: pausar, reanudar: reanudar, destruir: destruir,
      };

      // 1) Contexto. Si no hay WebGL2, la app «falla» con elegancia: nada de pantalla negra.
      let motivo = "";
      const alErrorCreacion = function (e) { motivo = e.statusMessage || ""; };
      canvas.addEventListener("webglcontextcreationerror", alErrorCreacion);
      const gl = canvas.getContext("webgl2", o.contexto || {});
      canvas.removeEventListener("webglcontextcreationerror", alErrorCreacion);
      let visible = true, pestañaVisible = !document.hidden, porUsuario = true;
      let perdido = false, fallado = false, destruido = false;
      let raf = 0, pendiente = true, dormido = false;
      if (!gl) { fallar("sin WebGL2" + (motivo ? " (" + motivo + ")" : "")); return app; }
      app.gl = gl;

      // 2) Tamaño: el observador solo ANOTA; se aplica al empezar el frame (5.1).
      let dispAncho = 0, dispAlto = 0;   // px de dispositivo de la caja del canvas
      const r0 = canvas.getBoundingClientRect();
      app.anchoCSS = r0.width; app.altoCSS = r0.height;
      dispAncho = Math.round(r0.width * (window.devicePixelRatio || 1));
      dispAlto = Math.round(r0.height * (window.devicePixelRatio || 1));
      const ro = new ResizeObserver(function (entradas) {
        const e = entradas[entradas.length - 1];
        const caja = e.contentBoxSize[0];
        app.anchoCSS = caja.inlineSize; app.altoCSS = caja.blockSize;
        if (e.devicePixelContentBoxSize) {
          dispAncho = e.devicePixelContentBoxSize[0].inlineSize;
          dispAlto = e.devicePixelContentBoxSize[0].blockSize;
        } else {
          dispAncho = Math.round(caja.inlineSize * (window.devicePixelRatio || 1));
          dispAlto = Math.round(caja.blockSize * (window.devicePixelRatio || 1));
        }
        pedirFrame();   // en modo bajo demanda, un tamaño nuevo necesita un dibujo nuevo
      });
      try { ro.observe(canvas, { box: "device-pixel-content-box" }); } catch (err) { ro.observe(canvas); }

      function tamañoObjetivo() {
        const dpr = window.devicePixelRatio || 1;
        let f = Math.min(1, (o.dprMax || 2) / dpr);          // límite de DPR
        if (calidad) f *= calidad.escala;                     // calidad adaptativa
        let w = dispAncho * f, h = dispAlto * f;
        const max = o.pixelesMax || Infinity;                 // límite de píxeles totales
        if (w * h > max) { const k = Math.sqrt(max / (w * h)); w *= k; h *= k; }
        return [Math.max(1, Math.round(w)), Math.max(1, Math.round(h))];
      }
      function aplicarTamaño() {
        const t = tamañoObjetivo();
        if (canvas.width !== t[0] || canvas.height !== t[1]) { canvas.width = t[0]; canvas.height = t[1]; }
        const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
        if (W !== app.ancho || H !== app.alto) {
          app.ancho = W; app.alto = H;
          if (o.redimensionar) o.redimensionar(gl, app);   // FBOs y demás recursos que dependen del tamaño
        }
      }

      // 3) Pausas: fuera de la vista, pestaña oculta, pausa del usuario, contexto perdido.
      const io = new IntersectionObserver(function (ents) { visible = ents[ents.length - 1].isIntersecting; revisar(); });
      io.observe(canvas);
      const alVisibilidad = function () { pestañaVisible = !document.hidden; revisar(); };
      document.addEventListener("visibilitychange", alVisibilidad);

      function revisar() {
        const debe = visible && pestañaVisible && porUsuario && !perdido && !fallado && !destruido;
        if (debe === app.activo) return;
        app.activo = debe;
        if (debe) { reloj.reiniciarReferencia(); pendiente = true; dormido = false; programar(); }
        else if (raf) { cancelAnimationFrame(raf); raf = 0; }
      }
      function programar() { if (!raf && app.activo) raf = requestAnimationFrame(frame); }
      /* Bajo demanda: pide (al menos) un frame más. En modo continuo no hace falta. */
      function pedirFrame() {
        pendiente = true;
        if (dormido) { dormido = false; reloj.reiniciarReferencia(); }   // tras dormir, sin salto de tiempo
        programar();
      }
      function pausar() { porUsuario = false; revisar(); }
      function reanudar() { porUsuario = true; revisar(); }

      // 4) Pérdida de contexto (5.1): todo lo de la GPU se recrea con iniciar().
      canvas.addEventListener("webglcontextlost", function (e) {
        if (destruido) return;
        e.preventDefault();                  // sin esto, el navegador no lo devolverá nunca
        perdido = true; revisar();
        if (o.alPerder) o.alPerder(app);
      });
      canvas.addEventListener("webglcontextrestored", function () {
        if (destruido) return;
        perdido = false;
        app.ancho = app.alto = 0;            // fuerza redimensionar() en el próximo frame
        iniciarGL();
        revisar(); pedirFrame();
      });

      function iniciarGL() {
        try { if (o.iniciar) o.iniciar(gl, app); }
        catch (err) { fallar("error al iniciar: " + err.message, err); }
      }
      function fallar(m, err) {
        fallado = true; app.motivoFallo = m;
        if (app.activo) revisar();
        if (err) console.error(err); else console.warn("[M7] " + m);
        if (o.fallar) o.fallar(m, app);
      }
      function destruir() {
        destruido = true; revisar();
        if (!gl) return;                     // sin WebGL2 no se llegó a crear nada más (y ro/io aún no existen)
        ro.disconnect(); io.disconnect();
        document.removeEventListener("visibilitychange", alVisibilidad);
        const ext = gl.getExtension("WEBGL_lose_context");
        if (ext) ext.loseContext();          // libera la memoria de la GPU ya, sin esperar al recolector
      }

      // 5) El bucle: un único rAF para todo.
      function frame(ms) {
        raf = 0;
        if (!app.activo || gl.isContextLost()) return;
        pendiente = false;
        reloj.avanzar(ms);
        const iv = reloj.intervaloMs;
        if (iv > 0 && iv < 250) { app.msFrame += 0.1 * (iv - app.msFrame); app.fps = 1000 / app.msFrame; }
        if (calidad) calidad.medir(iv);
        aplicarTamaño();
        gl.viewport(0, 0, app.ancho, app.alto);
        try {
          if (o.actualizar) o.actualizar(app.estado, reloj.dt, app);
          if (o.dibujar) o.dibujar(gl, app.estado, app);
        } catch (err) { fallar("error en el bucle: " + err.message, err); return; }
        app.frame++;
        if (!o.bajoDemanda || pendiente) programar();
        else dormido = true;
      }

      iniciarGL();
      revisar();
      return app;
    }

    /* ---------------------------------------------------------------
       Shaders con configuración (7.1).
       --------------------------------------------------------------- */
    /* Inserta «#define NOMBRE valor» DESPUÉS de la línea #version (que debe ser la
       primera) y añade «#line 2» para que los errores sigan señalando tus líneas.
       Los valores se escriben tal cual: 5 → "5" (int en GLSL). Para un float usa
       M7.flotante(5) → "5.0". true/false → 1/0 (para #if). */
    function conDefines(fuente, defines) {
      const fin = fuente.indexOf("\n");
      // [ \t]* y no \s*: una plantilla que empieza con un salto de línea ya no tiene #version en la línea 1 (5.2)
      if (!/^[ \t]*#version/.test(fuente)) throw new Error("conDefines: la primera línea debe ser #version");
      let extra = "";
      for (const k in defines) {
        const v = defines[k];
        extra += "#define " + k + " " + (v === true ? "1" : v === false ? "0" : String(v)) + "\n";
      }
      return fuente.slice(0, fin + 1) + extra + "#line 2\n" + fuente.slice(fin + 1);
    }
    /* 2 → "2.0" · 0.5 → "0.5" · 1e-7 → "1e-7" (todos literales float válidos en GLSL). */
    function flotante(v) {
      const s = String(v);
      return /[.eE]/.test(s) || !isFinite(v) ? s : s + ".0";
    }

    /* ---------------------------------------------------------------
       Del módulo 2: suavizado, muelle y easings.
       --------------------------------------------------------------- */
    /* Suavizado exponencial exacto (2.4): recorre la fracción 1 − 2^(−dt/semivida). */
    function suavizar(actual, objetivo, semivida, dt) {
      return objetivo + (actual - objetivo) * Math.pow(2, -dt / semivida);
    }
    /* Muelle amortiguado con Euler semi-implícito y subpasos de 1/240 s (2.5). */
    class Muelle {
      constructor(opciones) {
        const o = opciones || {};
        this.rigidez = o.rigidez !== undefined ? o.rigidez : 170;
        this.amortiguamiento = o.amortiguamiento !== undefined ? o.amortiguamiento : 26;
        this.masa = o.masa || 1;
        this.x = o.valor || 0;
        this.v = 0;
        this.objetivo = this.x;
      }
      actualizar(dt) {
        if (dt <= 0) return this.x;
        const n = Math.ceil(dt / (1 / 240)), h = dt / n;
        for (let i = 0; i < n; i++) {
          const f = -this.rigidez * (this.x - this.objetivo) - this.amortiguamiento * this.v;
          this.v += (f / this.masa) * h;
          this.x += this.v * h;
        }
        return this.x;
      }
      enReposo(tolerancia) {
        const t = tolerancia || 1e-3;
        return Math.abs(this.x - this.objetivo) < t && Math.abs(this.v) < t;
      }
      /* Deja el muelle quieto en un valor (sin animación). */
      fijar(valor) { this.x = this.objetivo = valor; this.v = 0; }
    }
    /* De «rebote» (fracción que rebasa, p. ej. 0.1) y «asentamiento» (s) a parámetros (2.5). */
    function parametrosMuelle(rebote, asentamiento, masa) {
      const m = masa || 1;
      const L = Math.log(rebote);
      const zeta = -L / Math.sqrt(Math.PI * Math.PI + L * L);
      const w0 = 4 / (zeta * asentamiento);
      return { rigidez: m * w0 * w0, amortiguamiento: 2 * zeta * w0 * m, masa: m };
    }
    const easings = {
      lineal: (p) => p,
      cubicIn: (p) => p * p * p,
      cubicOut: (p) => 1 - Math.pow(1 - p, 3),
      cubicInOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
      quartOut: (p) => 1 - Math.pow(1 - p, 4),
      expoOut: (p) => (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)),
      backOut: (p) => 1 + 2.70158 * Math.pow(p - 1, 3) + 1.70158 * Math.pow(p - 1, 2),
      smoothstep: (p) => p * p * (3 - 2 * p),
    };

    /* ---------------------------------------------------------------
       Puntero (7.2): un puntero sobre un elemento.
       Los eventos solo guardan clientX/clientY (px CSS respecto a la ventana).
       La conversión a la caja del elemento se hace en actualizar(), una vez por
       frame y con el rectángulo de ESE frame: así sigue siendo correcta si la
       página se desplaza bajo un ratón quieto (no llega ningún pointermove) o si
       el búfer cambia de tamaño.
         x, y      px CSS desde la esquina superior izquierda de la caja
         sx, sy    lo mismo, suavizado (semivida en s)
         vx, vy    velocidad suavizada (px CSS/s)
         nx, ny    0..1 con el origen ABAJO a la izquierda (como v_uv)
         aGL(c)    px del búfer de un canvas, origen abajo (como gl_FragCoord)
       --------------------------------------------------------------- */
    class Puntero {
      constructor(elemento, opciones) {
        const o = opciones || {};
        this.el = elemento;
        this.semivida = o.semivida || 0.06;     // s del suavizado (2.4)
        this.cx = 0; this.cy = 0;               // clientX/Y del último evento
        this.x = 0; this.y = 0;                 // px CSS en la caja (calculado en actualizar)
        this.sx = 0; this.sy = 0;               // suavizado
        this.vx = 0; this.vy = 0;               // velocidad suavizada
        this.ancho = 1; this.alto = 1;          // tamaño de la caja en el último frame (px CSS)
        this.dentro = false; this.pulsado = false; this.tipo = "mouse";
        this.visto = false;                     // ¿ha llegado algún evento?
        this.fresco = true;                     // el suavizado debe arrancar en la posición real
        const self = this;
        const anotar = function (e) { self.cx = e.clientX; self.cy = e.clientY; self.tipo = e.pointerType; self.visto = true; };
        elemento.addEventListener("pointermove", function (e) { anotar(e); self.dentro = true; });
        elemento.addEventListener("pointerdown", function (e) { anotar(e); self.dentro = true; self.pulsado = true; });
        elemento.addEventListener("pointerup", function () { self.pulsado = false; });
        elemento.addEventListener("pointercancel", function () { self.pulsado = false; self.dentro = false; });
        elemento.addEventListener("pointerleave", function () { self.dentro = false; self.pulsado = false; self.fresco = true; });
      }
      get nx() { return this.x / this.ancho; }
      get ny() { return 1 - this.y / this.alto; }
      /* Una vez por frame, al principio (el layout está limpio), con el dt del reloj. */
      actualizar(dt) {
        const r = this.el.getBoundingClientRect();
        this.ancho = r.width || 1; this.alto = r.height || 1;
        this.x = this.cx - r.left; this.y = this.cy - r.top;
        if (!this.visto) return;
        if (this.fresco && this.dentro) {      // primera vez (o al volver a entrar): sin «barrido» desde donde salió
          this.sx = this.x; this.sy = this.y; this.vx = this.vy = 0; this.fresco = false;
          return;
        }
        if (dt <= 0) return;
        const ax = this.sx, ay = this.sy;
        this.sx = suavizar(this.sx, this.x, this.semivida, dt);
        this.sy = suavizar(this.sy, this.y, this.semivida, dt);
        this.vx = suavizar(this.vx, (this.sx - ax) / dt, 0.05, dt);
        this.vy = suavizar(this.vy, (this.sy - ay) / dt, 0.05, dt);
      }
      /* px CSS de la caja (por defecto, la posición suavizada) → px del búfer de `canvas`, origen abajo. */
      aGL(canvas, x, y) {
        const px = x === undefined ? this.sx : x, py = y === undefined ? this.sy : y;
        return [px * canvas.width / this.ancho, (this.alto - py) * canvas.height / this.alto];
      }
    }

    return { Reloj, Calidad, crearApp, conDefines, flotante, suavizar, Muelle, parametrosMuelle, easings, Puntero };
  }
  window.M7 = factory();
  window.Curso = window.Curso || {};
  (Curso.libsIframe = Curso.libsIframe || {}).m7kit = "window.M7 = (" + factory.toString() + ")();";
})();
