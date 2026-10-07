/* =====================================================================
   motor.js — el esqueleto del hero interactivo (proyecto final, 7.6)
   ---------------------------------------------------------------------
   Todo lo que hay aquí ya lo escribiste en el curso. Este archivo lo
   reúne SIN dependencias para que la carpeta proyecto-final/ funcione
   sola (doble clic, file://, sin internet) y la puedas copiar entera
   como plantilla. Es un script clásico: nada de import/export, porque
   los módulos ES no cargan desde file:// (1.7). Expone un único global,
   window.Motor, con estas piezas:

     crearPrograma, uniforms, ponerUniform   lo mínimo de GLKit        (5.2, 5.4)
     Reloj                                   tiempo propio con pausa   (7.1)
     suavizar, Muelle                        suavizado y muelle        (2.4, 2.5)
     Puntero                                 del evento al frame       (7.2)
     Calidad                                 resolución adaptativa     (7.1)
     crearBucle                              el bucle de la PÁGINA     (7.6)
     crearCapaGL                             la capa WebGL, OPCIONAL   (7.6)

   La diferencia con M7.crearApp de la lección 7.1: allí el bucle era
   del canvas, y si WebGL fallaba se paraba todo. En un hero el DOM
   también se anima con el reloj, así que el bucle es de la página y la
   capa WebGL es un invitado que puede faltar (sin WebGL2, shader que no
   compila, contexto perdido) sin llevarse el resto por delante.
   ===================================================================== */
(function (raiz) {
  "use strict";

  function fabrica() {
    /* -----------------------------------------------------------------
       1. GL mínimo (lo de GLKit que usa el hero).
       ----------------------------------------------------------------- */

    /* Compila un shader. Si falla, lanza un Error con el log del driver y
       el código numerado: es lo que verás en la consola si rompes algo. */
    function compilar(gl, tipo, fuente) {
      const sh = gl.createShader(tipo);
      gl.shaderSource(sh, fuente);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(sh) || "(log vacío)";
        gl.deleteShader(sh);
        const numerado = fuente.split("\n").map((l, i) => String(i + 1).padStart(3) + " | " + l).join("\n");
        throw new Error("no compila el " + (tipo === gl.VERTEX_SHADER ? "vertex" : "fragment") + " shader:\n" + log + "\n" + numerado);
      }
      return sh;
    }

    /* Compila los dos shaders, los enlaza y los suelta (el programa ya
       contiene el código). Pregunta LINK_STATUS, así que espera a que el
       driver termine: se llama una vez, al iniciar (7.1, compilación). */
    function crearPrograma(gl, fuenteVS, fuenteFS) {
      const vs = compilar(gl, gl.VERTEX_SHADER, fuenteVS);
      const fs = compilar(gl, gl.FRAGMENT_SHADER, fuenteFS);
      const p = gl.createProgram();
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      gl.detachShader(p, vs); gl.detachShader(p, fs);
      gl.deleteShader(vs); gl.deleteShader(fs);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(p);
        gl.deleteProgram(p);
        throw new Error("no enlaza el programa:\n" + log);
      }
      return p;
    }

    /* { nombre: { loc, tipo, tamaño } } de todos los uniforms ACTIVOS.
       Los arrays aparecen como "u_col[0]": les quitamos el "[0]". Un
       uniform que el compilador eliminó por no usarse no aparece: no es
       un error (ponerUniform lo ignora). */
    function uniforms(gl, programa) {
      const n = gl.getProgramParameter(programa, gl.ACTIVE_UNIFORMS), res = {};
      for (let i = 0; i < n; i++) {
        const info = gl.getActiveUniform(programa, i);
        res[info.name.replace(/\[0\]$/, "")] = { loc: gl.getUniformLocation(programa, info.name), tipo: info.type, tamaño: info.size };
      }
      return res;
    }

    /* Asigna un uniform según su tipo real. OJO: actúa sobre el programa
       EN USO (gl.useProgram): los uniforms son estado del programa (5.4). */
    function ponerUniform(gl, u, v) {
      if (!u) return;
      const esNumero = typeof v === "number" || typeof v === "boolean";
      switch (u.tipo) {
        case gl.FLOAT: esNumero ? gl.uniform1f(u.loc, v) : gl.uniform1fv(u.loc, v); break;
        case gl.FLOAT_VEC2: gl.uniform2fv(u.loc, v); break;
        case gl.FLOAT_VEC3: gl.uniform3fv(u.loc, v); break;   // también vec3 x[N]: 3·N floats
        case gl.FLOAT_VEC4: gl.uniform4fv(u.loc, v); break;
        case gl.INT: case gl.BOOL: case gl.SAMPLER_2D: esNumero ? gl.uniform1i(u.loc, +v) : gl.uniform1iv(u.loc, v); break;
        default: console.warn("[Motor] tipo de uniform no previsto: 0x" + u.tipo.toString(16));
      }
    }

    /* -----------------------------------------------------------------
       2. Reloj (7.1): el tiempo de la animación NO es el de la página.
          t = suma de dt·escala sin contar pausas; el dt real se limita.
       ----------------------------------------------------------------- */
    class Reloj {
      constructor(opciones) {
        const o = opciones || {};
        this.dtMax = o.dtMax || 0.1;  // s: tope del dt real (pestaña que vuelve, frame larguísimo)
        this.t = 0;                   // s de animación acumulados: lo que va a u_time y al DOM
        this.dt = 0;                  // s de animación del último frame (0 en pausa)
        this.dtReal = 0;              // s reales del último frame, limitados: para lo que responde al usuario
        this.intervaloMs = 0;         // ms reales entre frames SIN limitar: para medir el rendimiento
        this.escala = 1;              // 1 normal · 0,25 cámara lenta · 0 congelado (movimiento reducido)
        this.pausado = false;         // pausa del TIEMPO (el bucle sigue: el puntero responde)
        this.previo = null;           // ms del frame anterior; null = no hay frame anterior
      }
      avanzar(ms) {
        this.intervaloMs = this.previo === null ? 0 : ms - this.previo;
        this.previo = ms;
        this.dtReal = Math.min(Math.max(this.intervaloMs / 1000, 0), this.dtMax);
        this.dt = this.pausado ? 0 : this.dtReal * this.escala;
        this.t += this.dt;
        return this.dt;
      }
      /* Tras un tiempo sin frames (bucle parado o dormido): el próximo dt será 0. */
      reiniciarReferencia() { this.previo = null; }
    }

    /* -----------------------------------------------------------------
       3. Suavizado y muelle (2.4, 2.5).
       ----------------------------------------------------------------- */

    /* Suavizado exponencial exacto: recorre la fracción 1 − 2^(−dt/semivida)
       de lo que falta. Igual a 60 Hz que a 120 Hz. */
    function suavizar(actual, objetivo, semivida, dt) {
      return objetivo + (actual - objetivo) * Math.pow(2, -dt / semivida);
    }

    /* Muelle amortiguado, Euler semi-implícito con subpasos de 1/240 s.
       Cambiar el objetivo a mitad de camino no reinicia nada: la velocidad
       se conserva, por eso una transición interrumpida no da saltos. */
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
      /* Lo deja quieto en un valor, sin animación. */
      fijar(valor) { this.x = this.objetivo = valor; this.v = 0; }
    }

    /* -----------------------------------------------------------------
       4. Puntero (7.2): el evento guarda clientX/Y; la conversión a la caja
          se hace en el frame, con el rectángulo de ESE frame (sobrevive al
          scroll con el ratón quieto y a los cambios de tamaño del búfer).
            x, y     px CSS desde la esquina superior izquierda de la caja
            sx, sy   lo mismo, suavizado (semivida en s)
            vx, vy   velocidad suavizada (px CSS/s)
            aGL(c)   px del búfer del canvas c, origen ABAJO (como gl_FragCoord)
       ----------------------------------------------------------------- */
    class Puntero {
      constructor(elemento, opciones) {
        const o = opciones || {};
        this.el = elemento;
        this.semivida = o.semivida || 0.06;
        this.cx = 0; this.cy = 0;           // clientX/Y del último evento
        this.x = 0; this.y = 0; this.sx = 0; this.sy = 0; this.vx = 0; this.vy = 0;
        this.ancho = 1; this.alto = 1;      // caja del elemento en el último frame (px CSS)
        this.dentro = false; this.visto = false; this.fresco = true; this.tipo = "mouse";
        const anotar = (e) => { this.cx = e.clientX; this.cy = e.clientY; this.tipo = e.pointerType; this.visto = true; this.dentro = true; };
        elemento.addEventListener("pointermove", anotar);
        elemento.addEventListener("pointerdown", anotar);
        /* Con el dedo, soltar también es «salir» (no hay hover), y un scroll
           táctil cancela el puntero: en ambos casos el efecto debe apagarse. */
        elemento.addEventListener("pointercancel", () => { this.dentro = false; this.fresco = true; });
        elemento.addEventListener("pointerleave", () => { this.dentro = false; this.fresco = true; });
      }
      /* Una vez por frame, al principio (el layout está limpio). */
      actualizar(dt) {
        const r = this.el.getBoundingClientRect();
        this.ancho = r.width || 1; this.alto = r.height || 1;
        this.x = this.cx - r.left; this.y = this.cy - r.top;
        // Sin eventos todavía, x e y no significan nada (salen de clientX/Y = 0) y cambian con el
        // scroll: la suavizada las copia para que enReposo() diga «quieto» y el bucle pueda dormir (7.2).
        if (!this.visto) { this.sx = this.x; this.sy = this.y; return; }
        // Primera vez, o al VOLVER a entrar (fresco + un evento nuevo): sin «barrido» desde donde salió.
        // Sin el && dentro, la marca se gastaría en el primer frame tras el pointerleave (7.2).
        if (this.fresco && this.dentro) {
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
      /* ¿Sigue moviéndose el valor suavizado? (para dormir el bucle) */
      enReposo() { return Math.abs(this.sx - this.x) < 0.05 && Math.abs(this.sy - this.y) < 0.05; }
      /* px CSS de la caja → px del búfer de `canvas`, con la y hacia arriba.
         Supone que el canvas ocupa exactamente la caja del elemento. */
      aGL(canvas) {
        return [this.sx * canvas.width / this.ancho, (this.alto - this.sy) * canvas.height / this.alto];
      }
    }

    /* -----------------------------------------------------------------
       5. Calidad adaptativa (7.1): mide el intervalo REAL entre frames (el
          JavaScript no ve la GPU) y ajusta un factor de resolución: baja
          deprisa si vamos tarde y sube despacio si sobra.
       ----------------------------------------------------------------- */
    class Calidad {
      constructor(opciones) {
        const o = opciones || {};
        this.min = o.min !== undefined ? o.min : 0.5;
        this.max = o.max !== undefined ? o.max : 1;
        this.objetivoMs = o.objetivoMs || 1000 / 60;  // presupuesto por frame
        this.paso = o.paso || 0.85;                   // factor de cada bajada (su inverso al subir)
        this.paciencia = o.paciencia || 2000;         // ms holgados antes de subir
        this.descartarMs = o.descartarMs || 250;      // intervalo «largo»: suelto no cuenta (tirón, pestaña que vuelve)
        this.largos = 0;                              // intervalos largos seguidos (ver filtrar)
        this.escala = this.max;
        this.mediaMs = this.objetivoMs;
        this.enfriar = o.calentamiento !== undefined ? o.calentamiento : 1000;
        this.holgura = 0;
        this.cambios = 0;
      }
      /* El intervalo que cuenta para la media, o 0 si no cuenta (la misma
         regla que M7.Calidad de 7.1):
         · 0 (primer frame tras dormir o pausar): no dice nada del rendimiento.
         · Hasta descartarMs: cuenta tal cual, y la racha de largos vuelve a 0.
         · Más largo: el 1.º y el 2.º seguidos son un tirón suelto (no cuentan);
           del 3.º en adelante el equipo va así de lento de verdad (por debajo
           de 1000/descartarMs fps, 4 fps): cuentan, recortados a descartarMs. */
      filtrar(intervaloMs) {
        if (!(intervaloMs > 0)) return 0;
        if (intervaloMs <= this.descartarMs) { this.largos = 0; return intervaloMs; }
        this.largos++;
        return this.largos >= 3 ? this.descartarMs : 0;
      }
      medir(intervaloMs) {
        const iv = this.filtrar(intervaloMs);
        if (!iv) return false;
        this.mediaMs += 0.1 * (iv - this.mediaMs);
        if (this.enfriar > 0) { this.enfriar -= iv; return false; }
        const antes = this.escala;
        if (this.mediaMs > this.objetivoMs * 1.25) {
          this.escala = Math.max(this.min, this.escala * this.paso);
          this.holgura = 0;
        } else if (this.mediaMs < this.objetivoMs * 1.1) {
          this.holgura += iv;
          if (this.holgura > this.paciencia) { this.escala = Math.min(this.max, this.escala / this.paso); this.holgura = 0; }
        } else {
          this.holgura = 0;
        }
        if (this.escala === antes) return false;
        this.enfriar = 500;
        this.mediaMs = this.objetivoMs;
        this.cambios++;
        return true;
      }
    }

    /* -----------------------------------------------------------------
       6. crearBucle: UN requestAnimationFrame para toda la página (7.1).
          o = { observar: elemento cuya visibilidad decide si hay frames,
                actualizar(dt, bucle): solo estado, sin DOM ni GL,
                dibujar(bucle): escribe el DOM y dibuja la capa GL,
                bajoDemanda: si es true, el bucle se duerme al final de un
                  frame en el que nadie llamó a bucle.pedirFrame() }
       ----------------------------------------------------------------- */
    function crearBucle(opciones) {
      const o = opciones || {};
      const reloj = new Reloj({ dtMax: o.dtMax });
      const bucle = {
        reloj: reloj,
        activo: false,        // ¿se piden frames? (visible, pestaña visible, no pausado)
        dormido: false,       // bajo demanda: activo pero sin nada que hacer
        frame: 0, fps: 0, msFrame: 1000 / 60,
        pedirFrame: pedirFrame, pausar: pausar, reanudar: reanudar, destruir: destruir,
      };
      // Un booleano por motivo de pausa; nadie arranca ni para el bucle directamente (7.1).
      let visible = true, pestañaVisible = !document.hidden, porUsuario = true, detenido = false;
      let raf = 0, pendiente = true;
      let largos = 0;                     // intervalos de más de 250 ms seguidos (para bucle.fps)

      const io = o.observar && "IntersectionObserver" in window
        ? new IntersectionObserver((ents) => { visible = ents[ents.length - 1].isIntersecting; revisar(); })
        : null;
      if (io) io.observe(o.observar);
      const alVisibilidad = () => { pestañaVisible = !document.hidden; revisar(); };
      document.addEventListener("visibilitychange", alVisibilidad);

      /* La única decisión: ¿debe correr el bucle? Pedir «arrancar» dos veces
         no crea dos rAF (la primera línea lo impide). */
      function revisar() {
        const debe = visible && pestañaVisible && porUsuario && !detenido;
        if (debe === bucle.activo) return;
        bucle.activo = debe;
        if (debe) { reloj.reiniciarReferencia(); pendiente = true; bucle.dormido = false; programar(); }
        else if (raf) { cancelAnimationFrame(raf); raf = 0; }
      }
      function programar() { if (!raf && bucle.activo) raf = requestAnimationFrame(frame); }
      /* Pide al menos un frame más. Se llama desde eventos (un clic, el
         scroll, un cambio de tamaño) y desde actualizar() mientras algo se
         mueve. Tras dormir, el primer dt vale 0 (sin salto de tiempo). */
      function pedirFrame() {
        pendiente = true;
        if (bucle.dormido) { bucle.dormido = false; reloj.reiniciarReferencia(); }
        programar();
      }
      function pausar() { porUsuario = false; revisar(); }
      function reanudar() { porUsuario = true; revisar(); }
      function destruir() {
        detenido = true; revisar();
        if (io) io.disconnect();
        document.removeEventListener("visibilitychange", alVisibilidad);
      }

      function frame(ms) {
        raf = 0;
        if (!bucle.activo) return;
        pendiente = false;
        reloj.avanzar(ms);
        const iv = reloj.intervaloMs;
        if (iv > 250) largos++;             // la regla de Calidad.filtrar: un largo suelto no cuenta,
        else if (iv > 0) largos = 0;        // tres seguidos sí (aquí sin recortar: son los fps reales)
        if (iv > 0 && (iv <= 250 || largos >= 3)) { bucle.msFrame += 0.1 * (iv - bucle.msFrame); bucle.fps = 1000 / bucle.msFrame; }
        try {
          if (o.actualizar) o.actualizar(reloj.dt, bucle);
          if (o.dibujar) o.dibujar(bucle);
        } catch (err) {
          // Un error en el estado o en el DOM no tiene alternativa: se informa UNA vez y se para.
          console.error(err);
          detenido = true; revisar();
          return;
        }
        bucle.frame++;
        if (!o.bajoDemanda || pendiente) programar();
        else bucle.dormido = true;
      }

      revisar();
      return bucle;
    }

    /* -----------------------------------------------------------------
       7. crearCapaGL: el canvas WebGL como capa OPCIONAL de la página.
          No tiene bucle propio: el bucle de la página llama a capa.dibujar()
          y la capa no hace nada si no está viva (sin WebGL2, fallo o
          contexto perdido).
          o = { contexto: atributos de getContext (5.1),
                dprMax, pixelesMax, escala (fija, p. ej. 0.75), calidad,
                iniciar(gl, capa), redimensionar(gl, capa), dibujar(gl, estado, capa),
                fallar(motivo, capa), alPerder(capa), alRecuperar(capa),
                alPrimerFrame(capa), pedirFrame() }
       ----------------------------------------------------------------- */
    function crearCapaGL(canvas, opciones) {
      const o = opciones || {};
      const calidad = o.calidad ? new Calidad(o.calidad === true ? {} : o.calidad) : null;
      const capa = {
        canvas: canvas, gl: null, gpu: null,
        viva: false,          // hay contexto, iniciar() terminó y no se ha perdido
        fallada: false, motivo: "",
        ancho: 0, alto: 0,    // búfer REAL (drawingBufferWidth/Height)
        anchoCSS: 0, altoCSS: 0,
        escala: o.escala || 1, calidad: calidad, dibujados: 0,
        dibujar: dibujar, destruir: destruir,
      };
      const pedir = () => { if (o.pedirFrame) o.pedirFrame(); };

      // 1) Contexto. El motivo de un fallo llega en webglcontextcreationerror, DURANTE getContext (5.1).
      let motivoCreacion = "";
      const alErrorCreacion = (e) => { motivoCreacion = e.statusMessage || ""; };
      canvas.addEventListener("webglcontextcreationerror", alErrorCreacion);
      const gl = canvas.getContext("webgl2", o.contexto || {});
      canvas.removeEventListener("webglcontextcreationerror", alErrorCreacion);
      if (!gl) { fallar("sin WebGL2" + (motivoCreacion ? " (" + motivoCreacion + ")" : "")); return capa; }
      capa.gl = gl;

      // 2) Tamaño: el observador solo ANOTA; se aplica al dibujar (5.1, 7.1).
      const dpr0 = window.devicePixelRatio || 1, r0 = canvas.getBoundingClientRect();
      capa.anchoCSS = r0.width; capa.altoCSS = r0.height;
      let dispAncho = Math.round(r0.width * dpr0), dispAlto = Math.round(r0.height * dpr0);
      const ro = new ResizeObserver((entradas) => {
        const e = entradas[entradas.length - 1], caja = e.contentBoxSize[0];
        capa.anchoCSS = caja.inlineSize; capa.altoCSS = caja.blockSize;
        if (e.devicePixelContentBoxSize) {
          dispAncho = e.devicePixelContentBoxSize[0].inlineSize;
          dispAlto = e.devicePixelContentBoxSize[0].blockSize;
        } else {
          dispAncho = Math.round(caja.inlineSize * (window.devicePixelRatio || 1));
          dispAlto = Math.round(caja.blockSize * (window.devicePixelRatio || 1));
        }
        pedir();                               // un tamaño nuevo necesita un dibujo nuevo
      });
      try { ro.observe(canvas, { box: "device-pixel-content-box" }); } catch (err) { ro.observe(canvas); }

      function tamañoObjetivo() {
        const dpr = window.devicePixelRatio || 1;
        let dw = dispAncho, dh = dispAlto;
        // Los píxeles de dispositivo del observador y devicePixelRatio deberían contar lo mismo. Con la
        // emulación de DPR de las herramientas de depuración no lo hacen (el observador sigue dando px
        // CSS): si discrepan, caja CSS × DPR. Mezclarlos daba un búfer 1/DPR más pequeño (lección 7.6).
        if (capa.anchoCSS > 0 && Math.abs(dw / capa.anchoCSS - dpr) > 0.05 * dpr) {
          dw = Math.round(capa.anchoCSS * dpr); dh = Math.round(capa.altoCSS * dpr);
        }
        let f = Math.min(1, (o.dprMax || 2) / dpr) * capa.escala;   // límite de DPR y escala fija
        if (calidad) f *= calidad.escala;                             // calidad adaptativa
        let w = dw * f, h = dh * f;
        const max = o.pixelesMax || Infinity;                         // tope de píxeles totales
        if (w * h > max) { const k = Math.sqrt(max / (w * h)); w *= k; h *= k; }
        return [Math.max(1, Math.round(w)), Math.max(1, Math.round(h))];
      }
      function aplicarTamaño() {
        const t = tamañoObjetivo();
        if (canvas.width !== t[0] || canvas.height !== t[1]) { canvas.width = t[0]; canvas.height = t[1]; }
        const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
        if (W !== capa.ancho || H !== capa.alto) {
          capa.ancho = W; capa.alto = H;
          if (o.redimensionar) o.redimensionar(gl, capa);
        }
      }

      // 3) Pérdida de contexto: preventDefault para que lo devuelvan; al volver, iniciar() otra vez.
      const alPerder = (e) => {
        e.preventDefault();
        capa.viva = false;
        if (o.alPerder) o.alPerder(capa);
      };
      const alRecuperar = () => {
        if (capa.fallada) return;
        capa.ancho = capa.alto = 0;            // fuerza redimensionar() en el próximo dibujo
        iniciarGL();
        if (capa.viva && o.alRecuperar) o.alRecuperar(capa);
        pedir();
      };
      canvas.addEventListener("webglcontextlost", alPerder);
      canvas.addEventListener("webglcontextrestored", alRecuperar);

      // 4) Iniciar: todo lo de la GPU sale de aquí (y se puede repetir).
      function iniciarGL() {
        try {
          if (o.iniciar) o.iniciar(gl, capa);
          capa.viva = true;
        } catch (err) {
          fallar("error al iniciar: " + err.message, err);
        }
      }
      /* La llama el bucle de la página. Devuelve true si ha dibujado. */
      function dibujar(estado, intervaloMs) {
        if (!capa.viva || gl.isContextLost()) return false;
        if (calidad) calidad.medir(intervaloMs);
        aplicarTamaño();
        gl.viewport(0, 0, capa.ancho, capa.alto);
        try {
          if (o.dibujar) o.dibujar(gl, estado, capa);
        } catch (err) {
          fallar("error al dibujar: " + err.message, err);
          return false;
        }
        if (capa.dibujados++ === 0 && o.alPrimerFrame) o.alPrimerFrame(capa);
        return true;
      }
      function fallar(m, err) {
        capa.viva = false; capa.fallada = true; capa.motivo = m;
        if (err) console.error(err); else console.warn("[capa GL] " + m);
        if (o.fallar) o.fallar(m, capa);
        destruir();
      }
      /* Suelta observadores y listeners y libera la GPU YA (5.10). */
      function destruir() {
        capa.viva = false;
        if (!gl) return;
        ro.disconnect();
        canvas.removeEventListener("webglcontextlost", alPerder);
        canvas.removeEventListener("webglcontextrestored", alRecuperar);
        const ext = gl.getExtension("WEBGL_lose_context");   // null si ya estaba perdido
        if (ext) ext.loseContext();
      }

      iniciarGL();
      return capa;
    }

    return { crearPrograma, uniforms, ponerUniform, Reloj, suavizar, Muelle, Puntero, Calidad, crearBucle, crearCapaGL };
  }

  raiz.Motor = fabrica();

  /* Solo para el curso: la lección 7.6 carga este mismo archivo y lo inyecta
     en sus playgrounds (data-incluir="motor"). Fuera del curso no existe
     window.Curso y esta línea no hace nada. */
  if (raiz.Curso && raiz.Curso.libsIframe) raiz.Curso.libsIframe.motor = "window.Motor = (" + fabrica.toString() + ")();";
})(window);
