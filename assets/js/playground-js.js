/* =====================================================================
   playground-js.js — mini "CodePen": HTML + CSS + JS en un iframe aislado
   ---------------------------------------------------------------------
   Marcado:
     <div class="js-playground" data-titulo="Mi demo" data-altura="340">
       <script type="text/x-html">  <canvas id="c"></canvas>  </script>
       <script type="text/x-css">   canvas { width:100%; height:100% }  </script>
       <script type="text/x-js">
         const c = document.getElementById('c');
         console.log(c.width);
       </script>
       <!-- opcional: solución de un ejercicio (cualquiera de las tres) -->
       <script type="text/x-js" data-solucion> … </script>
     </div>

   Atributos opcionales del contenedor:
     data-titulo, data-altura="340", data-apilado (código encima del resultado)
     data-incluir="glkit,texturas"  inyecta librerías del curso en el iframe
     data-autorun      re-ejecuta al editar (útil para CSS; peligroso con bucles: en Chrome el iframe
                       va en otro proceso y solo se congela ese editor, pero en otros navegadores
                       podría congelarse la página entera)
     data-fondo="oscuro"  fondo oscuro en el iframe
     data-consola="no" oculta la consola; data-sin-editor oculta el código
     data-sin-resultado  oculta el lienzo (ejercicios que solo imprimen en la consola)
     data-consola-altura="220"  altura de la consola en px (130 por defecto)
     data-pestaña="css" pestaña abierta al inicio
     data-error-esperado  el código de partida lanza un error a propósito
                          (="webgpu": solo puede fallar si hay adaptador WebGPU; sin él, el verificador no lo exige)
   Dentro de un <script> escribe <\/script> en lugar de </script>.
   El código se ejecuta con Ctrl/Cmd+Enter o con el botón ▶ Ejecutar.
   ===================================================================== */
(function () {
  "use strict";
  const Curso = window.Curso, U = Curso.util;
  const porFuente = new Map(); // contentWindow -> vista

  window.addEventListener("message", (e) => {
    const v = porFuente.get(e.source);
    if (!v || !e.data || e.data.__pg !== true) return;
    v.recibir(e.data);
  });

  /* Script que se inyecta al principio del iframe: redirige console.* y errores. */
  const PUENTE = function () {
    var enviar = function (tipo, args) {
      var partes = [], ini = 0;
      /* Especificadores de formato de console.log: %s %d %i %f %o %O %c (los estilos %c se descartan) */
      if (typeof args[0] === "string" && /%[sdifoOc%]/.test(args[0])) {
        var k = 1;
        var txt = args[0].replace(/%([sdifoOc%])/g, function (m, t) {
          if (t === "%") return "%";
          if (k >= args.length) return m;
          var v = args[k++];
          if (t === "c") return "";
          if (t === "d" || t === "i") return String(parseInt(v, 10));
          if (t === "f") return String(parseFloat(v));
          if (t === "s") return typeof v === "string" ? v : formatear(v, 1);
          return formatear(v, 1);
        });
        partes.push(txt); ini = k;
      }
      for (var i = ini; i < args.length; i++) partes.push(formatear(args[i], 0));
      try { parent.postMessage({ __pg: true, tipo: tipo, texto: partes.join(" ") }, "*"); } catch (e) {}
    };
    function formatear(v, prof) {
      if (typeof v === "string") return prof ? JSON.stringify(v) : v;
      if (typeof v === "number") return Object.is(v, -0) ? "-0" : String(v);
      if (typeof v === "bigint") return v + "n";
      if (v === undefined) return "undefined";
      if (v === null) return "null";
      if (typeof v === "function") return "ƒ " + (v.name || "anónima") + "()";
      if (typeof v === "symbol") return v.toString();
      if (typeof v !== "object") return String(v);
      if (v instanceof Error) return v.name + ": " + v.message;
      if (prof > 2) return "…";
      if (ArrayBuffer.isView(v) && !(v instanceof DataView)) {
        var n = v.constructor.name, arr = Array.prototype.slice.call(v, 0, 64).map(function (x) { return formatear(x, prof + 1); });
        return n + "(" + v.length + ") [" + arr.join(", ") + (v.length > 64 ? ", …" : "") + "]";
      }
      if (v instanceof ArrayBuffer) return "ArrayBuffer { byteLength: " + v.byteLength + " }";
      if (v instanceof DataView) return "DataView { byteLength: " + v.byteLength + " }";
      if (typeof Element !== "undefined" && v instanceof Element) return "<" + v.tagName.toLowerCase() + (v.id ? "#" + v.id : "") + (v.className && typeof v.className === "string" ? "." + v.className.trim().split(/\s+/).join(".") : "") + ">";
      if (Array.isArray(v)) return "[" + v.slice(0, 100).map(function (x) { return formatear(x, prof + 1); }).join(", ") + (v.length > 100 ? ", …" : "") + "]";
      if (v instanceof Map) return "Map(" + v.size + ")";
      if (v instanceof Set) return "Set(" + v.size + ")";
      try {
        var claves = Object.keys(v), nombre = v.constructor && v.constructor.name && v.constructor.name !== "Object" ? v.constructor.name + " " : "";
        if (!claves.length && nombre) {
          if (typeof WebGLRenderingContext !== "undefined" && (v instanceof WebGLRenderingContext || v instanceof WebGL2RenderingContext)) return nombre + "{…}";
          return nombre + "{}";
        }
        return nombre + "{ " + claves.slice(0, 30).map(function (k) { return k + ": " + formatear(v[k], prof + 1); }).join(", ") + (claves.length > 30 ? ", …" : "") + " }";
      } catch (e) { return String(v); }
    }
    ["log", "info", "warn", "error", "debug"].forEach(function (m) {
      var orig = console[m];
      console[m] = function () { enviar(m === "debug" ? "log" : m, arguments); return orig.apply(console, arguments); };
    });
    var origTable = console.table;
    /* console.table como tabla de texto */
    console.table = function (d) {
      try {
        if (d && typeof d === "object") {
          var filas = Array.isArray(d) || ArrayBuffer.isView(d) ? Array.prototype.map.call(d, function (v, i) { return [String(i), v]; }) : Object.keys(d).map(function (k) { return [k, d[k]]; });
          var cols = [];
          filas.forEach(function (f) { if (f[1] && typeof f[1] === "object") Object.keys(f[1]).forEach(function (c) { if (cols.indexOf(c) < 0) cols.push(c); }); });
          var cab = ["(índice)"].concat(cols.length ? cols : ["valor"]);
          var datos = filas.map(function (f) { return [f[0]].concat(cols.length ? cols.map(function (c) { return f[1] && typeof f[1] === "object" && c in f[1] ? formatear(f[1][c], 1) : ""; }) : [formatear(f[1], 1)]); });
          var anchos = cab.map(function (c, j) { return Math.max(c.length, Math.max.apply(null, datos.map(function (r) { return r[j].length; }).concat([0]))); });
          var linea = function (r) { return "│ " + r.map(function (c, j) { return c + " ".repeat(anchos[j] - c.length); }).join(" │ ") + " │"; };
          var sep = function (a, b, c) { return a + anchos.map(function (w) { return "─".repeat(w + 2); }).join(b) + c; };
          var out = [sep("┌", "┬", "┐"), linea(cab), sep("├", "┼", "┤")].concat(datos.map(linea)).concat([sep("└", "┴", "┘")]).join("\n");
          try { parent.postMessage({ __pg: true, tipo: "log", texto: out }, "*"); } catch (e) {}
        } else enviar("log", [d]);
      } catch (e) { enviar("log", [d]); }
      return origTable && origTable.apply(console, arguments);
    };
    console.clear = function () { try { parent.postMessage({ __pg: true, tipo: "clear" }, "*"); } catch (e) {} };
    /* group/time/count/assert/trace/dir: versiones de texto para la consola del playground */
    var sangria = 0, relojes = {}, cuentas = {};
    var conSangria = function (tipo, args) {
      var a = Array.prototype.slice.call(args);
      if (sangria) { if (typeof a[0] === "string") a[0] = "  ".repeat(sangria) + a[0]; else a.unshift("  ".repeat(sangria).slice(1)); }
      enviar(tipo, a);
    };
    ["log", "info", "warn", "error"].forEach(function (m) {
      var previo = console[m];
      console[m] = function () { if (!sangria) return previo.apply(console, arguments); conSangria(m, arguments); };
    });
    var og = console.group, oge = console.groupEnd;
    console.group = console.groupCollapsed = function () { conSangria("info", arguments.length ? ["▾ " + Array.prototype.join.call(arguments, " ")] : ["▾ grupo"]); sangria++; };
    console.groupEnd = function () { if (sangria) sangria--; };
    console.time = function (n) { relojes[n || "default"] = performance.now(); };
    console.timeLog = function (n) { n = n || "default"; if (n in relojes) conSangria("log", [n + ": " + (performance.now() - relojes[n]).toFixed(3) + " ms"]); };
    console.timeEnd = function (n) { n = n || "default"; if (n in relojes) { conSangria("log", [n + ": " + (performance.now() - relojes[n]).toFixed(3) + " ms"]); delete relojes[n]; } else conSangria("warn", ["El reloj '" + n + "' no existe"]); };
    console.count = function (n) { n = n || "default"; cuentas[n] = (cuentas[n] || 0) + 1; conSangria("log", [n + ": " + cuentas[n]]); };
    console.countReset = function (n) { cuentas[n || "default"] = 0; };
    console.assert = function (cond) { if (!cond) { var r = Array.prototype.slice.call(arguments, 1); conSangria("error", ["Assertion failed" + (r.length ? ":" : "")].concat(r)); } };
    console.trace = function () { var pila = (new Error().stack || "").split("\n").slice(2).map(function (l) { return "    " + l.trim(); }).join("\n"); conSangria("log", ["console.trace " + Array.prototype.join.call(arguments, " ") + "\n" + pila]); };
    console.dir = function (v) { conSangria("log", [v]); };
    window.addEventListener("error", function (e) {
      var linea = e.filename && e.filename.indexOf("tu-codigo.js") >= 0 ? e.lineno : null;
      try { parent.postMessage({ __pg: true, tipo: "excepcion", texto: (e.error && e.error.name ? e.error.name + ": " : "") + (e.message || "").replace(/^Uncaught /, "").replace(/^\w*Error: /, ""), linea: linea }, "*"); } catch (x) {}
    });
    window.addEventListener("unhandledrejection", function (e) {
      try { parent.postMessage({ __pg: true, tipo: "excepcion", texto: "Promesa rechazada: " + (e.reason && e.reason.message || e.reason) }, "*"); } catch (x) {}
    });
  };

  const visObs = "IntersectionObserver" in window ? new IntersectionObserver((ents) => {
    ents.forEach((e) => { const v = e.target._vistaJS; if (v) v.visibilidad(e.isIntersecting); });
  }, { rootMargin: "300px 0px" }) : null;
  /* Si un iframe queda muy lejos de la pantalla, se destruye para liberar su
     contexto WebGL y su CPU; al volver se re-ejecuta. */
  const lejosObs = "IntersectionObserver" in window ? new IntersectionObserver((ents) => {
    ents.forEach((e) => { const v = e.target._vistaJS; if (v && !e.isIntersecting) v.dormir(); });
  }, { rootMargin: "1400px 0px" }) : null;

  let contador = 0;
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

  function iniciar(el) {
    const id = "js-" + ++contador;
    const leer = (tipo, sol) => {
      const s = el.querySelector('script[type="text/x-' + tipo + '"]' + (sol ? "[data-solucion]" : ":not([data-solucion])"));
      return s ? U.textoDeScript(s) : null;
    };
    const orig = { html: leer("html"), css: leer("css"), js: leer("js") };
    const sol = { html: leer("html", true), css: leer("css", true), js: leer("js", true) };
    const haySol = sol.html != null || sol.css != null || sol.js != null;
    const pestañas = ["html", "css", "js"].filter((k) => orig[k] != null || sol[k] != null);
    if (!pestañas.includes("js")) pestañas.push("js");
    ["html", "css", "js"].forEach((k) => { if (orig[k] == null) orig[k] = ""; });
    const altura = +(el.dataset.altura || 340);
    const autorun = el.hasAttribute("data-autorun");
    const incluir = (el.dataset.incluir || "").split(",").map((s) => s.trim()).filter(Boolean);
    const conConsola = el.dataset.consola !== "no";
    const sinEditor = el.hasAttribute("data-sin-editor");
    const claveGuardado = "pgjs:" + location.pathname + ":" + id + ":" + hash(orig.html + orig.css + orig.js);
    const qa = (Curso.qa.playgrounds[id] = { tipo: "js", titulo: el.dataset.titulo || "", ok: null, error: null, errorEsperado: el.hasAttribute("data-error-esperado"), errorEsperadoSi: el.getAttribute("data-error-esperado") || "", ejecutado: false });

    const guardado = U.storage.get(claveGuardado, null);
    const codigo = guardado ? Object.assign({}, orig, guardado) : Object.assign({}, orig);
    let mostrandoSol = false, copiaUsuario = null;

    // --- DOM ---
    el.classList.add("playground");
    if (el.hasAttribute("data-apilado")) el.classList.add("apilado");
    el.innerHTML = "";
    const titulo = U.crear("div", { class: "pg-titulo", html: '<span class="tipo">' + (pestañas.length > 1 ? pestañas.map((p) => p.toUpperCase()).join("+") : "JS") + "</span><span>" + U.escapar(el.dataset.titulo || "Código en vivo") + '</span><span class="espacio"></span>' });
    const cuerpo = U.crear("div", { class: "pg-cuerpo" });
    const cajaEditor = U.crear("div", { class: "pg-editor" });
    const tabs = U.crear("div", { class: "pg-tabs" });
    const editoresBox = U.crear("div", { style: "flex:1;display:flex;flex-direction:column;min-height:0" });
    cajaEditor.append(tabs, editoresBox);
    const salida = U.crear("div", { class: "pg-salida" });
    const lienzo = U.crear("div", { class: "pg-lienzo" + (el.dataset.fondo === "oscuro" ? " fondo-oscuro" : "") });
    lienzo.style.height = altura + "px";
    const consola = U.crear("div", { class: "pg-consola" });
    if (el.dataset.consolaAltura) consola.style.height = (+el.dataset.consolaAltura) + "px";
    const barra = U.crear("div", { class: "pg-barra" });
    salida.append(lienzo);
    cuerpo.append(cajaEditor, salida);
    el.append(titulo, cuerpo);
    if (conConsola) el.append(consola);
    el.append(barra);
    if (sinEditor) { cajaEditor.style.display = "none"; cuerpo.style.gridTemplateColumns = "minmax(0,1fr)"; }
    /* data-sin-resultado: ejercicios que solo usan la consola. El iframe sigue existiendo
       (oculto) para ejecutar el código. */
    if (el.hasAttribute("data-sin-resultado")) { salida.style.display = "none"; cuerpo.style.gridTemplateColumns = "minmax(0,1fr)"; el.classList.add("apilado"); }

    const btnRun = U.crear("button", { class: "pg-btn primario", type: "button", title: "Ejecutar (Ctrl/Cmd + Enter)", text: "▶ Ejecutar" });
    const btnStop = U.crear("button", { class: "pg-btn", type: "button", title: "Detener (destruye el iframe)", text: "■ Detener" });
    const btnLimpiar = U.crear("button", { class: "pg-btn", type: "button", text: "Limpiar consola" });
    const estado = U.crear("span", { class: "estado" });
    barra.append(btnRun, btnStop);
    if (conConsola) barra.append(btnLimpiar);
    barra.append(estado, U.crear("span", { class: "espacio" }), U.crear("span", { class: "fps", text: "Ctrl/⌘+Enter para ejecutar" }));
    const btnRestaurar = U.crear("button", { class: "pg-btn", type: "button", text: "Restaurar" });
    const btnSol = haySol ? U.crear("button", { class: "pg-btn solucion", type: "button", text: "Ver solución" }) : null;
    const btnCodigo = sinEditor ? U.crear("button", { class: "pg-btn", type: "button", text: "</> Ver código" }) : null;
    if (btnCodigo) titulo.appendChild(btnCodigo);
    titulo.appendChild(btnRestaurar);
    if (btnSol) titulo.appendChild(btnSol);

    // --- editores (uno por pestaña, creados al mostrarse) ---
    const editores = {};
    const cajas = {};
    const modos = { html: "htmlmixed", css: "css", js: "javascript" };
    const atajos = { "Cmd-Enter": () => ejecutar(), "Ctrl-Enter": () => ejecutar(), "Cmd-S": () => ejecutar(), "Ctrl-S": () => ejecutar() };
    const alEditar = U.debounce(() => {
      if (mostrandoSol) return;
      pestañas.forEach((k) => { if (editores[k]) codigo[k] = editores[k].getValue(); });
      const dif = {}; let hay = false;
      pestañas.forEach((k) => { if (codigo[k] !== orig[k]) { dif[k] = codigo[k]; hay = true; } });
      if (hay) U.storage.set(claveGuardado, dif); else { try { localStorage.removeItem(claveGuardado); } catch (e) {} }
      if (autorun) ejecutar();
    }, autorun ? 500 : 400);
    let activa = el.dataset.pestaña && pestañas.includes(el.dataset.pestaña) ? el.dataset.pestaña : "js";
    pestañas.forEach((k) => {
      const b = U.crear("button", { type: "button", text: k === "js" ? "JS" : k.toUpperCase() });
      b.addEventListener("click", () => mostrarPestaña(k));
      tabs.appendChild(b);
      cajas[k] = U.crear("div", { style: "flex:1;display:none;flex-direction:column;min-height:0" });
      editoresBox.appendChild(cajas[k]);
    });
    function mostrarPestaña(k) {
      activa = k;
      [...tabs.children].forEach((b, i) => b.classList.toggle("activa", pestañas[i] === k));
      pestañas.forEach((p) => (cajas[p].style.display = p === k ? "flex" : "none"));
      if (!editores[k]) {
        editores[k] = Curso.crearEditor(cajas[k], codigo[k], modos[k], alEditar, atajos);
      }
      ajustarEditor();
      setTimeout(() => editores[k].refresh(), 0);
    }
    function ajustarEditor() {
      const e = editores[activa];
      if (!e) return;
      /* Altura fija (data-altura): el editor NO crece con el código (tiene scroll propio);
         si creciera, estiraría también la columna del resultado. */
      const h = el.classList.contains("apilado") ? Math.min(420, Math.max(160, (codigo[activa].split("\n").length + 1) * 21.5)) : Math.max(160, altura - (tabs.offsetHeight || 0));
      e.setSize(null, h);
    }
    if (pestañas.length === 1) tabs.style.display = "none";

    // --- ejecución ---
    let iframe = null, dormido = true, visible = false;
    const vista = {
      recibir(d) {
        if (d.tipo === "clear") { consola.innerHTML = ""; return; }
        if (d.tipo === "excepcion") {
          const txt = "✗ " + d.texto + (d.linea ? "  (línea " + d.linea + " de JS)" : "");
          log("error", txt);
          estado.className = "estado estado-err"; estado.textContent = "✗ error";
          if (d.linea && editores.js) { editores.js.marcarLineas([d.linea]); }
          if (qa.ok !== false) { qa.ok = false; qa.error = d.texto; }
          return;
        }
        log(d.tipo, d.texto);
        if (d.tipo === "error" && qa.ok === null) { qa.ok = false; qa.error = d.texto; }
      },
      visibilidad(v) { visible = v; if (v && dormido && !parado) ejecutar(); },
      dormir() {
        if (!iframe) return;
        porFuente.delete(iframe.contentWindow);
        iframe.remove(); iframe = null; dormido = true;
        estado.className = "estado"; estado.textContent = "en pausa (fuera de pantalla)";
      },
    };
    let parado = false;
    lienzo._vistaJS = vista;
    let nLog = 0;
    function log(tipo, texto) {
      if (!conConsola) return;
      if (nLog++ > 500) { if (nLog === 502) consola.appendChild(U.crear("div", { class: "log-linea log-warn", text: "… (demasiados mensajes, se omiten los siguientes)" })); return; }
      const d = U.crear("div", { class: "log-linea log-" + tipo, text: texto });
      consola.appendChild(d);
      // Un error largo (p. ej. log de compilación + código numerado) se muestra desde su PRIMERA
      // línea, que es la que dice qué pasó; el resto de mensajes, desde el final.
      if (tipo === "error" && d.offsetHeight > consola.clientHeight) consola.scrollTop = d.offsetTop - consola.offsetTop;
      else consola.scrollTop = consola.scrollHeight;
    }
    function construirDocumento() {
      const libs = incluir.map((n) => {
        const src = Curso.libsIframe && Curso.libsIframe[n];
        if (!src) { log("warn", 'Librería desconocida en data-incluir: "' + n + '"'); return ""; }
        return "<script>" + src.replace(/<\/script>/gi, "<\\/script>") + "<\/script>";
      }).join("\n");
      const oscuro = el.dataset.fondo === "oscuro";
      const base = ":root{color-scheme:" + (oscuro ? "dark" : "light") + "}html,body{margin:0;height:100%;}body{font:15px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:" + (oscuro ? "#e4e7ee;background:#0e1014" : "#1b1f2a;background:#fff") + ";}";
      const js = codigo.js;
      /* El código del usuario se inserta como un <script> DINÁMICO con sourceURL:
         así los números de línea de los errores son relativos a su propio código. */
      const lanzador = "<script>(function(){var s=document.createElement('script');s.textContent=" +
        JSON.stringify(js + "\n//# sourceURL=tu-codigo.js").replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--") +
        ";document.body.appendChild(s);})();<\/script>";
      return "<!doctype html><html><head><meta charset='utf-8'><style>" + base + "</style>" +
        "<script>(" + PUENTE.toString() + ")();<\/script>" + libs +
        "<style>" + codigo.css + "</style></head><body>" + codigo.html + lanzador + "</body></html>";
    }
    function ejecutar() {
      parado = false;
      pestañas.forEach((k) => { if (editores[k]) codigo[k] = editores[k].getValue(); });
      if (editores.js) editores.js.marcarLineas([]);
      if (iframe) { porFuente.delete(iframe.contentWindow); iframe.remove(); }
      consola.innerHTML = ""; nLog = 0;
      iframe = document.createElement("iframe");
      iframe.setAttribute("sandbox", "allow-scripts allow-pointer-lock");
      iframe.setAttribute("title", el.dataset.titulo || "Resultado");
      lienzo.appendChild(iframe);
      porFuente.set(iframe.contentWindow, vista);
      estado.className = "estado estado-ok"; estado.textContent = "● ejecutando";
      qa.ejecutado = true;
      const actual = iframe;
      iframe.srcdoc = construirDocumento();
      iframe.addEventListener("load", () => {
        if (actual.contentWindow) porFuente.set(actual.contentWindow, vista);
        setTimeout(() => { if (qa.ok === null) qa.ok = true; }, 400);
      });
      dormido = false;
    }
    btnRun.addEventListener("click", ejecutar);
    btnStop.addEventListener("click", () => { parado = true; vista.dormir(); estado.textContent = "detenido"; });
    btnLimpiar.addEventListener("click", () => { consola.innerHTML = ""; nLog = 0; });
    btnRestaurar.addEventListener("click", () => {
      mostrandoSol = false; if (btnSol) btnSol.textContent = "Ver solución";
      Object.assign(codigo, orig);
      try { localStorage.removeItem(claveGuardado); } catch (e) {}
      pestañas.forEach((k) => editores[k] && editores[k].setValue(orig[k]));
      ejecutar();
    });
    if (btnSol) btnSol.addEventListener("click", () => {
      if (!mostrandoSol) {
        pestañas.forEach((k) => { if (editores[k]) codigo[k] = editores[k].getValue(); });
        copiaUsuario = Object.assign({}, codigo);
        mostrandoSol = true;
        pestañas.forEach((k) => { const v = sol[k] != null ? sol[k] : codigo[k]; codigo[k] = v; if (editores[k]) editores[k].setValue(v); });
        btnSol.textContent = "Volver a mi código";
      } else {
        mostrandoSol = false;
        Object.assign(codigo, copiaUsuario);
        pestañas.forEach((k) => editores[k] && editores[k].setValue(codigo[k]));
        btnSol.textContent = "Ver solución";
      }
      ejecutar();
    });
    if (btnCodigo) btnCodigo.addEventListener("click", () => {
      const oculto = cajaEditor.style.display === "none";
      cajaEditor.style.display = oculto ? "" : "none";
      cuerpo.style.gridTemplateColumns = oculto ? "" : "minmax(0,1fr)";
      btnCodigo.textContent = oculto ? "Ocultar código" : "</> Ver código";
      if (oculto) mostrarPestaña(activa);
    });

    if (!sinEditor) mostrarPestaña(activa);
    // Se observa el contenedor (no el lienzo: con data-sin-resultado está oculto y nunca "se vería").
    el._vistaJS = vista;
    if (visObs) { visObs.observe(el); lejosObs.observe(el); } else ejecutar();
    el._playground = { ejecutar, editores, codigo };
  }

  Curso.registrar(".js-playground", iniciar);
})();
