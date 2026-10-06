/* =====================================================================
   curso.js — núcleo del curso
   - Monta la estructura (barra superior, barra lateral, índice de página)
   - Resalta el código, crea callouts, quizzes, código anotado, fórmulas
   - Gestiona progreso, tema y navegación anterior/siguiente
   - Registra componentes (playgrounds, graficador, widgets) y los inicia
   Todo funciona tanto con file:// como servido por http.
   ===================================================================== */
(function () {
  "use strict";

  const Curso = (window.Curso = window.Curso || {});
  const html = document.documentElement;
  const manifest = window.CURSO_MANIFEST;

  Curso.raiz = html.dataset.root || "./";
  Curso.componentes = Curso.componentes || [];
  Curso.qa = Curso.qa || { errores: [], avisos: [], playgrounds: {} };
  const colaListo = [];
  let listo = false;

  /* ---------------------------------------------------------------
     Utilidades
     --------------------------------------------------------------- */
  const U = (Curso.util = {
    escapar(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    },
    slug(s) {
      return String(s)
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "seccion";
    },
    /* Quita la indentación común y las líneas vacías del principio y el final.
       Permite escribir el código indentado dentro del HTML. */
    desindentar(texto) {
      let lineas = String(texto).replace(/\r\n?/g, "\n").replace(/\t/g, "  ").split("\n");
      while (lineas.length && lineas[0].trim() === "") lineas.shift();
      while (lineas.length && lineas[lineas.length - 1].trim() === "") lineas.pop();
      let min = Infinity;
      for (const l of lineas) if (l.trim()) min = Math.min(min, l.match(/^ */)[0].length);
      if (!isFinite(min)) min = 0;
      return lineas.map((l) => l.slice(min)).join("\n");
    },
    /* Dentro de <script> no se puede escribir "</script>": se escribe <\/script>. */
    textoDeScript(el) {
      return U.desindentar(el.textContent.replace(/<\\\/script>/gi, "</script>"));
    },
    rango(spec) {
      const set = new Set();
      String(spec || "").split(",").forEach((p) => {
        const m = p.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
        if (!m) return;
        const a = +m[1], b = m[2] ? +m[2] : a;
        for (let i = Math.min(a, b); i <= Math.max(a, b); i++) set.add(i);
      });
      return set;
    },
    storage: {
      get(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
      set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    },
    debounce(fn, ms) { let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; },
    crear(tag, attrs, hijos) {
      const el = document.createElement(tag);
      if (attrs) for (const k in attrs) {
        if (k === "class") el.className = attrs[k];
        else if (k === "html") el.innerHTML = attrs[k];
        else if (k === "text") el.textContent = attrs[k];
        else if (k.startsWith("on")) el.addEventListener(k.slice(2), attrs[k]);
        else el.setAttribute(k, attrs[k]);
      }
      if (hijos) (Array.isArray(hijos) ? hijos : [hijos]).forEach((h) => h != null && el.append(h));
      return el;
    },
  });

  /* ---------------------------------------------------------------
     Registro de componentes y cola "al estar listo"
     --------------------------------------------------------------- */
  Curso.registrar = function (selector, init) { Curso.componentes.push({ selector, init }); };
  Curso.alListo = function (fn) { if (listo) setTimeout(fn, 0); else colaListo.push(fn); };
  Curso.informarError = function (origen, mensaje) {
    Curso.qa.errores.push({ origen, mensaje: String(mensaje) });
  };
  window.addEventListener("error", (e) => {
    Curso.informarError("pagina", (e.message || "error") + (e.filename ? " @ " + e.filename.split("/").pop() + ":" + e.lineno : ""));
  });
  window.addEventListener("unhandledrejection", (e) => Curso.informarError("promesa", e.reason && (e.reason.stack || e.reason.message) || e.reason));

  /* ---------------------------------------------------------------
     Tema claro / oscuro
     --------------------------------------------------------------- */
  Curso.tema = function () { return html.dataset.theme === "light" ? "light" : "dark"; };
  function cambiarTema() {
    const nuevo = Curso.tema() === "light" ? "dark" : "light";
    html.dataset.theme = nuevo;
    U.storage.set("curso-tema", nuevo);
    document.dispatchEvent(new CustomEvent("curso:tema", { detail: nuevo }));
  }
  /* Colores actuales del tema, para dibujar en canvas con la misma paleta. */
  Curso.colores = function () {
    const cs = getComputedStyle(html);
    const v = (n) => cs.getPropertyValue(n).trim();
    return {
      fondo: v("--code-bg"), superficie: v("--surface"), texto: v("--text"), texto2: v("--text-2"), tenue: v("--muted"),
      borde: v("--border"), borde2: v("--border-2"), acento: v("--accent"), acento2: v("--accent-2"),
      ok: v("--ok"), aviso: v("--warn"), error: v("--err"), rosa: v("--c-bestiario"), naranja: v("--c-cuidado"),
      azul: v("--c-nota"), verde: v("--c-hack"), violeta: v("--c-senior"), amarillo: v("--c-resumen"),
      rejilla: Curso.tema() === "light" ? "rgba(20,24,40,0.07)" : "rgba(255,255,255,0.06)",
      eje: Curso.tema() === "light" ? "rgba(20,24,40,0.35)" : "rgba(255,255,255,0.32)",
      mono: v("--mono") || "monospace", fuente: v("--font") || "sans-serif",
    };
  };

  /* ---------------------------------------------------------------
     Manifest: lección actual, anterior, siguiente
     --------------------------------------------------------------- */
  const planas = [];
  if (manifest) manifest.modulos.forEach((m) => m.lecciones.forEach((l) => planas.push(Object.assign({ modulo: m }, l))));
  Curso.lecciones = planas;
  function leccionActual() {
    const clave = document.body.dataset.leccion;
    if (clave) {
      const [mid, lid] = clave.split("/");
      const l = planas.find((x) => x.modulo.id === mid && x.id === lid);
      if (l) return l;
    }
    const ruta = decodeURIComponent(location.pathname);
    return planas.find((x) => ruta.endsWith("/" + x.archivo) || ruta.endsWith(x.archivo)) || null;
  }
  const actual = leccionActual();
  Curso.leccion = actual;
  const claveLeccion = (l) => l.modulo.id + "/" + l.id;

  /* ---------------------------------------------------------------
     Progreso
     --------------------------------------------------------------- */
  const progreso = U.storage.get("curso-progreso-v1", {});
  Curso.progreso = {
    hecha: (l) => !!progreso[claveLeccion(l)],
    marcar(l, v) { if (v) progreso[claveLeccion(l)] = Date.now(); else delete progreso[claveLeccion(l)]; U.storage.set("curso-progreso-v1", progreso); pintarProgreso(); },
    total: () => planas.length,
    completadas: () => planas.filter((l) => progreso[claveLeccion(l)]).length,
  };

  /* ---------------------------------------------------------------
     Estructura de la página
     --------------------------------------------------------------- */
  function montarEstructura() {
    const main = document.querySelector("main");
    if (!main || document.querySelector(".app")) return;

    const topbar = U.crear("header", { class: "topbar" });
    topbar.innerHTML =
      '<button class="btn-icono btn-menu" aria-label="Menú">☰</button>' +
      '<a class="marca" href="' + Curso.raiz + 'index.html"><span class="logo"></span><span>' + U.escapar(manifest ? manifest.titulo : "Curso") + "</span></a>" +
      '<span class="espacio"></span>' +
      '<div class="buscador"><input type="search" placeholder="Buscar…  (tecla /)" aria-label="Buscar en el curso"><div class="buscador-resultados"></div></div>' +
      '<button class="btn-icono btn-tema" title="Cambiar tema claro/oscuro" aria-label="Cambiar tema">◐</button>';

    const app = U.crear("div", { class: "app" });
    const sidebar = U.crear("nav", { class: "sidebar", "aria-label": "Índice del curso" });
    const contenido = U.crear("div", { class: "contenido" });
    const toc = U.crear("aside", { class: "toc", "aria-label": "En esta página" });

    main.parentNode.insertBefore(topbar, main);
    main.parentNode.insertBefore(app, main);
    contenido.appendChild(main);
    app.append(sidebar, contenido, toc);

    pintarSidebar(sidebar);
    topbar.querySelector(".btn-tema").addEventListener("click", cambiarTema);
    topbar.querySelector(".btn-menu").addEventListener("click", () => document.body.classList.toggle("menu-abierto"));
    contenido.addEventListener("click", () => document.body.classList.remove("menu-abierto"));
    montarBuscador(topbar.querySelector(".buscador"));
  }

  function pintarSidebar(sidebar) {
    if (!manifest) return;
    let h = '<div class="progreso-global"><span class="txt"></span><div class="barra"><i></i></div></div>';
    manifest.modulos.forEach((m) => {
      const abierto = actual ? actual.modulo.id === m.id : false;
      h += '<div class="nav-modulo' + (abierto ? " abierto" : "") + '" data-modulo="' + m.id + '">';
      h += '<button type="button"><span class="num">' + U.escapar(m.num) + '</span><span>' + U.escapar(m.titulo) + '</span><span class="chev">▶</span></button><ul>';
      m.lecciones.forEach((l) => {
        const cls = actual && actual.id === l.id && actual.modulo.id === m.id ? "actual" : "";
        h += '<li><a class="' + cls + '" data-clave="' + m.id + "/" + l.id + '" href="' + Curso.raiz + l.archivo + '"><span class="n">' + U.escapar(l.num) + "</span><span>" + U.escapar(l.titulo) + '</span><span class="check">✓</span></a></li>';
      });
      h += "</ul></div>";
    });
    sidebar.innerHTML = h;
    sidebar.querySelectorAll(".nav-modulo > button").forEach((b) =>
      b.addEventListener("click", () => b.parentNode.classList.toggle("abierto")));
    pintarProgreso();
    const act = sidebar.querySelector("a.actual");
    if (act) setTimeout(() => act.scrollIntoView({ block: "center" }), 0);
  }

  function pintarProgreso() {
    document.querySelectorAll(".sidebar a[data-clave]").forEach((a) => a.classList.toggle("hecha", !!progreso[a.dataset.clave]));
    const txt = document.querySelector(".progreso-global .txt");
    if (txt) {
      const c = Curso.progreso.completadas(), t = Curso.progreso.total();
      txt.textContent = c + " de " + t + " lecciones completadas";
      document.querySelector(".progreso-global .barra > i").style.width = (100 * c / Math.max(1, t)) + "%";
    }
    document.querySelectorAll(".tarjeta-modulo li[data-clave]").forEach((li) => li.classList.toggle("hecha", !!progreso[li.dataset.clave]));
    const b = document.querySelector(".marcar-hecha button");
    if (b && actual) {
      const hecha = Curso.progreso.hecha(actual);
      b.classList.toggle("hecha", hecha);
      b.textContent = hecha ? "✓ Lección completada" : "Marcar lección como completada";
    }
  }

  function montarNavegacion() {
    const main = document.querySelector("main.leccion");
    if (!main || !actual) return;
    const i = planas.indexOf(actual);
    const ant = planas[i - 1], sig = planas[i + 1];
    const marcar = U.crear("div", { class: "marcar-hecha" }, U.crear("button", { type: "button" }));
    marcar.firstChild.addEventListener("click", () => Curso.progreso.marcar(actual, !Curso.progreso.hecha(actual)));
    const nav = U.crear("nav", { class: "nav-leccion" });
    if (ant) nav.appendChild(U.crear("a", { class: "ant", href: Curso.raiz + ant.archivo, html: "<small>← Anterior</small>" + U.escapar(ant.num + " · " + ant.titulo) }));
    if (sig) nav.appendChild(U.crear("a", { class: "sig", href: Curso.raiz + sig.archivo, html: "<small>Siguiente →</small>" + U.escapar(sig.num + " · " + sig.titulo) }));
    main.append(marcar, nav);
    pintarProgreso();
    document.addEventListener("keydown", (e) => {
      if (e.altKey && !e.metaKey && !e.ctrlKey && /^(ArrowLeft|ArrowRight)$/.test(e.key) && !esEditable(e.target)) {
        const dest = e.key === "ArrowLeft" ? ant : sig;
        if (dest) location.href = Curso.raiz + dest.archivo;
      }
    });
  }
  const esEditable = (el) => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.closest(".CodeMirror"));

  /* Portada: tarjetas de módulos generadas desde el manifest. */
  function montarTarjetas() {
    const cont = document.getElementById("tarjetas-modulos");
    if (!cont || !manifest) return;
    cont.classList.add("modulos");
    cont.innerHTML = manifest.modulos.map((m) =>
      '<article class="tarjeta-modulo"><div class="num">Módulo ' + U.escapar(m.num) + "</div><h3>" + U.escapar(m.titulo) + "</h3><p>" + U.escapar(m.resumen) + "</p><ol>" +
      m.lecciones.map((l) => '<li data-clave="' + m.id + "/" + l.id + '"><a href="' + Curso.raiz + l.archivo + '">' + U.escapar(l.titulo) + "</a></li>").join("") +
      "</ol></article>").join("");
    pintarProgreso();
  }

  /* ---------------------------------------------------------------
     Buscador (usa assets/js/indice-busqueda.js si existe)
     --------------------------------------------------------------- */
  function montarBuscador(caja) {
    const input = caja.querySelector("input"), res = caja.querySelector(".buscador-resultados");
    let sel = -1, items = [];
    const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    /* El índice completo se carga al usar el buscador por primera vez
       (un <script> dinámico funciona también con file://). */
    let cargando = false;
    function cargarIndice() {
      if (window.CURSO_INDICE || cargando) return;
      cargando = true;
      const s = document.createElement("script");
      s.src = Curso.raiz + "assets/js/indice-busqueda.js";
      s.onload = () => { if (input.value.trim()) buscar(); };
      document.head.appendChild(s);
    }
    function fuente() {
      if (window.CURSO_INDICE) return window.CURSO_INDICE;
      return planas.map((l) => ({ t: l.num + " · " + l.titulo, u: l.archivo, s: l.modulo.titulo, x: "" }));
    }
    function buscar() {
      const q = norm(input.value.trim());
      if (!q) { res.classList.remove("abierto"); return; }
      const terminos = q.split(/\s+/);
      items = [];
      for (const d of fuente()) {
        const t = norm(d.t), x = norm(d.x || ""), s = norm(d.s || "");
        let puntos = 0, ok = true;
        for (const w of terminos) {
          if (t.includes(w)) puntos += 10; else if (s.includes(w)) puntos += 4; else if (x.includes(w)) puntos += 1; else { ok = false; break; }
        }
        if (ok) items.push({ d, puntos });
      }
      items.sort((a, b) => b.puntos - a.puntos);
      items = items.slice(0, 14);
      sel = items.length ? 0 : -1;
      res.innerHTML = items.length
        ? items.map((it, i) => '<a href="' + Curso.raiz + it.d.u + '" class="' + (i === sel ? "activo" : "") + '">' + U.escapar(it.d.t) + "<small>" + U.escapar(it.d.s || "") + "</small></a>").join("")
        : '<div class="vacio">Sin resultados para “' + U.escapar(input.value) + "”</div>";
      res.classList.add("abierto");
    }
    input.addEventListener("input", buscar);
    input.addEventListener("focus", () => { cargarIndice(); buscar(); });
    input.addEventListener("keydown", (e) => {
      const as = res.querySelectorAll("a");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!as.length) return;
        sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + as.length) % as.length;
        as.forEach((a, i) => a.classList.toggle("activo", i === sel));
      } else if (e.key === "Enter" && as[sel]) { location.href = as[sel].href; }
      else if (e.key === "Escape") { input.blur(); res.classList.remove("abierto"); }
    });
    document.addEventListener("click", (e) => { if (!caja.contains(e.target)) res.classList.remove("abierto"); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && !esEditable(e.target)) { e.preventDefault(); input.focus(); }
    });
  }

  /* ---------------------------------------------------------------
     Resaltado de sintaxis (CodeMirror runmode)
     --------------------------------------------------------------- */
  function definirGLSL() {
    if (!window.CodeMirror || CodeMirror.mimeModes["x-shader/glsl3"]) return;
    const w = (s) => { const o = {}; s.split(" ").forEach((x) => (o[x] = true)); return o; };
    CodeMirror.defineMIME("x-shader/glsl3", {
      name: "clike",
      keywords: w("const uniform in out inout centroid flat smooth layout break continue do for while switch case default if else discard return struct precision highp mediump lowp invariant attribute varying"),
      types: w("void bool int uint float vec2 vec3 vec4 bvec2 bvec3 bvec4 ivec2 ivec3 ivec4 uvec2 uvec3 uvec4 mat2 mat3 mat4 mat2x2 mat2x3 mat2x4 mat3x2 mat3x3 mat3x4 mat4x2 mat4x3 mat4x4 sampler2D sampler3D samplerCube sampler2DShadow samplerCubeShadow sampler2DArray sampler2DArrayShadow isampler2D isampler3D isamplerCube isampler2DArray usampler2D usampler3D usamplerCube usampler2DArray"),
      blockKeywords: w("for while do if else struct switch"),
      builtin: w("radians degrees sin cos tan asin acos atan sinh cosh tanh asinh acosh atanh pow exp log exp2 log2 sqrt inversesqrt abs sign floor trunc round roundEven ceil fract mod modf min max clamp mix step smoothstep isnan isinf floatBitsToInt floatBitsToUint intBitsToFloat uintBitsToFloat packSnorm2x16 unpackSnorm2x16 packUnorm2x16 unpackUnorm2x16 packHalf2x16 unpackHalf2x16 length distance dot cross normalize faceforward reflect refract matrixCompMult outerProduct transpose determinant inverse lessThan lessThanEqual greaterThan greaterThanEqual equal notEqual any all not textureSize texture textureProj textureLod textureOffset texelFetch texelFetchOffset textureProjOffset textureLodOffset textureProjLod textureProjLodOffset textureGrad textureGradOffset textureProjGrad textureProjGradOffset dFdx dFdy fwidth texture2D texture2DProj texture2DLod textureCube"),
      atoms: w("true false gl_Position gl_PointSize gl_FragCoord gl_FrontFacing gl_FragDepth gl_PointCoord gl_VertexID gl_InstanceID gl_FragColor gl_FragData __VERSION__ GL_ES __LINE__ __FILE__"),
      indentSwitch: false,
      hooks: { "#": (stream) => { stream.skipToEnd(); return "meta"; } },
      modeProps: { fold: ["brace", "include"] },
    });
  }
  const MODOS = {
    glsl: "x-shader/glsl3", frag: "x-shader/glsl3", vert: "x-shader/glsl3",
    js: "javascript", javascript: "javascript", json: { name: "javascript", json: true },
    html: "htmlmixed", xml: "xml", svg: "xml", css: "css",
    py: "python", python: "python",
  };
  Curso.modoCM = (lang) => MODOS[(lang || "").toLowerCase()] || null;

  /* Devuelve un array de líneas HTML resaltadas. */
  Curso.resaltar = function (texto, lang) {
    const modo = Curso.modoCM(lang);
    if (!modo || !window.CodeMirror || !CodeMirror.runMode) return texto.split("\n").map(U.escapar);
    const lineas = [""];
    CodeMirror.runMode(texto, modo, (tok, estilo) => {
      if (tok === "\n") { lineas.push(""); return; }
      const e = U.escapar(tok);
      lineas[lineas.length - 1] += estilo ? '<span class="' + estilo.split(" ").map((s) => "cm-" + s).join(" ") + '">' + e + "</span>" : e;
    });
    return lineas;
  };

  function convertirScriptsDeCodigo(raiz) {
    raiz.querySelectorAll('script[type="text/plain"].codigo').forEach((s) => {
      const pre = document.createElement("pre");
      ["data-titulo", "data-lineas", "data-resaltar"].forEach((a) => s.hasAttribute(a) && pre.setAttribute(a, s.getAttribute(a)));
      const code = document.createElement("code");
      code.className = "language-" + (s.dataset.lang || "text");
      code.textContent = U.textoDeScript(s);
      pre.appendChild(code);
      s.replaceWith(pre);
    });
  }

  function resaltarBloques(raiz) {
    raiz.querySelectorAll("pre > code").forEach((code) => {
      if (code.dataset.hecho) return;
      code.dataset.hecho = "1";
      const pre = code.parentNode;
      const m = (code.className + " " + (pre.className || "")).match(/language-([\w-]+)/);
      const lang = (m && m[1]) || pre.dataset.lang || "";
      const texto = U.desindentar(code.textContent);
      const lineas = Curso.resaltar(texto, lang);
      const conNumeros = pre.hasAttribute("data-lineas");
      const marcadas = U.rango(pre.dataset.resaltar);
      code.innerHTML = lineas.map((l, i) => {
        const n = i + 1;
        const ln = conNumeros ? '<span class="num-linea">' + n + "</span>" : "";
        return marcadas.has(n) ? '<span style="display:inline-block;min-width:100%;background:var(--hl-line);box-shadow:inset 3px 0 0 var(--accent);margin:0 -18px;padding:0 18px">' + ln + l + "</span>" : ln + l;
      }).join("\n");
      pre._texto = texto;
      const b = U.crear("button", { class: "btn-copiar", type: "button", text: "Copiar" });
      b.addEventListener("click", () => {
        const fin = () => { b.textContent = "¡Copiado!"; setTimeout(() => (b.textContent = "Copiar"), 1200); };
        if (navigator.clipboard) navigator.clipboard.writeText(texto).then(fin, fin); else fin();
      });
      pre.appendChild(b);
    });
  }

  /* ---------------------------------------------------------------
     Callouts, ejemplos, ejercicios, quizzes, código anotado
     --------------------------------------------------------------- */
  const CALLOUTS = {
    nota: ["📝", "Nota"], cuidado: ["⚠️", "Cuidado"], senior: ["🎓", "Detalle de senior"], hack: ["🛠️", "Hack"],
    porque: ["🤔", "¿Por qué?"], bestiario: ["🐞", "Comportamiento raro"], resumen: ["📌", "Resumen"],
  };
  function montarCallouts(raiz) {
    raiz.querySelectorAll(".callout").forEach((c) => {
      if (c.querySelector(":scope > .callout-titulo")) return;
      const tipo = Object.keys(CALLOUTS).find((k) => c.classList.contains(k)) || "nota";
      const [ico, nombre] = CALLOUTS[tipo];
      const t = c.dataset.titulo;
      const tit = U.crear("div", { class: "callout-titulo", html: '<span class="ico">' + ico + "</span><span>" + U.escapar(nombre) + (t ? " · " + U.escapar(t) : "") + "</span>" });
      c.prepend(tit);
      if (c.dataset.id && !c.id) c.id = c.dataset.id;
    });
  }
  function montarEjemplos(raiz) {
    raiz.querySelectorAll("section.ejemplo, section.ejercicio, div.ejemplo, div.ejercicio").forEach((s) => {
      if (s.querySelector(":scope > .etiqueta")) return;
      const esEj = s.classList.contains("ejercicio");
      const etq = U.crear("span", { class: "etiqueta", text: esEj ? "Ejercicio" : "Ejemplo resuelto" });
      s.prepend(etq);
      if (esEj && s.dataset.nivel) {
        const h = s.querySelector("h3, h4");
        const n = Math.max(1, Math.min(3, +s.dataset.nivel));
        if (h) h.appendChild(U.crear("span", { class: "nivel", title: "Dificultad " + n + " de 3", text: "★".repeat(n) + "☆".repeat(3 - n) }));
      }
    });
  }
  function montarQuizzes(raiz) {
    raiz.querySelectorAll(".quiz").forEach((q) => {
      if (q.dataset.hecho) return;
      q.dataset.hecho = "1";
      if (!q.querySelector(".quiz-etq")) q.prepend(U.crear("p", { class: "quiz-etq", text: "Comprueba tu comprensión" }));
      q.querySelectorAll("li").forEach((li) => {
        li.classList.add(li.hasAttribute("data-correcta") ? "correcta" : "incorrecta");
        li.addEventListener("click", () => li.classList.add("elegida"));
      });
    });
  }
  function montarAnotados(raiz) {
    raiz.querySelectorAll(".anotado").forEach((a) => {
      if (a.dataset.hecho) return;
      a.dataset.hecho = "1";
      const fuente = a.querySelector('script[type="text/plain"]') || a.querySelector("pre");
      const notas = a.querySelector("ol, ul");
      if (!fuente) return;
      const texto = fuente.tagName === "SCRIPT" ? U.textoDeScript(fuente) : U.desindentar(fuente.textContent);
      const lineas = Curso.resaltar(texto, a.dataset.lang || "");
      const cod = U.crear("div", { class: "anotado-codigo" });
      cod.innerHTML = lineas.map((l, i) => '<span class="linea" data-n="' + (i + 1) + '"><span class="num-linea">' + (i + 1) + "</span>" + (l || " ") + "</span>").join("");
      fuente.remove();
      a.prepend(cod);
      if (!notas) return;
      notas.classList.add("anotado-notas");
      const lineasEls = cod.querySelectorAll(".linea");
      const items = [...notas.children].map((li) => {
        const set = U.rango(li.dataset.l);
        if (li.dataset.l) li.prepend(U.crear("span", { class: "lineas", text: (set.size > 1 ? "L" : "L") + li.dataset.l }));
        return { li, set };
      });
      function activar(set, liActivo) {
        lineasEls.forEach((el) => el.classList.toggle("activa", set.has(+el.dataset.n)));
        items.forEach((it) => it.li.classList.toggle("activa", it.li === liActivo));
      }
      items.forEach((it) => {
        it.li.addEventListener("mouseenter", () => {
          activar(it.set, it.li);
          const primera = cod.querySelector('.linea[data-n="' + Math.min(...it.set) + '"]');
          if (primera) {
            const top = primera.offsetTop - cod.offsetTop;
            if (top < cod.scrollTop || top > cod.scrollTop + cod.clientHeight - 40) cod.scrollTo({ top: top - 20, behavior: "smooth" });
          }
        });
        it.li.addEventListener("click", () => activar(it.set, it.li));
      });
      lineasEls.forEach((el) => el.addEventListener("mouseenter", () => {
        const n = +el.dataset.n;
        const it = items.find((x) => x.set.has(n));
        if (it) activar(it.set, it.li);
      }));
      a.addEventListener("mouseleave", () => activar(new Set(), null));
    });
  }

  /* ---------------------------------------------------------------
     Títulos con ancla + índice de la página
     --------------------------------------------------------------- */
  function montarTOC() {
    const main = document.querySelector("main");
    const toc = document.querySelector(".toc");
    if (!main) return;
    const usados = new Set();
    const hs = [...main.querySelectorAll("h2, h3")].filter((h) => !h.closest(".playground, .quiz, .demo, .callout, details, .tarjeta-modulo, .no-toc"));
    hs.forEach((h) => {
      if (!h.id) {
        let id = U.slug(h.textContent), k = 2;
        while (usados.has(id) || document.getElementById(id)) id = U.slug(h.textContent) + "-" + k++;
        h.id = id;
      }
      usados.add(h.id);
      if (!h.querySelector(".ancla")) h.appendChild(U.crear("a", { class: "ancla", href: "#" + h.id, "aria-hidden": "true", text: "#" }));
    });
    if (!toc) return;
    if (hs.length < 2) { toc.innerHTML = ""; return; }
    toc.innerHTML = "<h4>En esta página</h4>" + hs.map((h) => '<a class="' + h.tagName.toLowerCase() + '" href="#' + h.id + '">' + U.escapar(h.textContent.replace(/#$/, "").trim()) + "</a>").join("");
    const links = new Map([...toc.querySelectorAll("a")].map((a) => [a.getAttribute("href").slice(1), a]));
    const visibles = new Set();
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => (e.isIntersecting ? visibles.add(e.target.id) : visibles.delete(e.target.id)));
      let activo = null;
      for (const h of hs) { if (visibles.has(h.id)) { activo = h.id; break; } }
      if (!activo) {
        for (const h of hs) { if (h.getBoundingClientRect().top < 120) activo = h.id; }
      }
      links.forEach((a, id) => a.classList.toggle("activo", id === activo));
    }, { rootMargin: "-60px 0px -60% 0px" });
    hs.forEach((h) => io.observe(h));
  }

  /* ---------------------------------------------------------------
     Fórmulas (KaTeX)
     --------------------------------------------------------------- */
  function montarFormulas() {
    if (!window.renderMathInElement) return;
    const main = document.querySelector("main");
    if (!main) return;
    try {
      renderMathInElement(main, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false },
          { left: "$", right: "$", display: false },
        ],
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option", "svg", "canvas"],
        ignoredClasses: ["playground", "anotado-codigo", "no-math", "CodeMirror", "graficador", "demo-info"],
        throwOnError: false,
        strict: "ignore",
      });
    } catch (e) { Curso.informarError("katex", e.message); }
  }

  /* ---------------------------------------------------------------
     Arranque
     --------------------------------------------------------------- */
  document.title = document.title || (actual ? actual.num + " · " + actual.titulo : "Curso");
  montarEstructura();

  function iniciar() {
    const main = document.querySelector("main") || document.body;
    definirGLSL();
    montarTarjetas();
    convertirScriptsDeCodigo(main);
    resaltarBloques(main);
    montarCallouts(main);
    montarEjemplos(main);
    montarQuizzes(main);
    montarAnotados(main);
    montarFormulas();
    montarTOC();
    montarNavegacion();
    for (const c of Curso.componentes) {
      document.querySelectorAll(c.selector).forEach((el) => {
        if (el.dataset.iniciado) return;
        el.dataset.iniciado = "1";
        try { c.init(el); } catch (e) {
          console.error(e);
          Curso.informarError("componente " + c.selector, e.stack || e.message);
        }
      });
    }
    listo = true;
    Curso.listo = true;
    colaListo.splice(0).forEach((fn) => { try { fn(); } catch (e) { console.error(e); Curso.informarError("alListo", e.stack || e.message); } });
    document.dispatchEvent(new CustomEvent("curso:listo"));
    if (location.hash) {
      const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el) setTimeout(() => el.scrollIntoView(), 50);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else setTimeout(iniciar, 0);
})();
