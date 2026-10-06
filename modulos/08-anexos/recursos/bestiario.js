/* =====================================================================
   bestiario.js — pinta el anexo A.1 a partir de window.CURSO_BESTIARIO
   (assets/js/datos-bestiario.js, que genera herramientas/indexar.mjs con
   todas las cajas .callout.bestiario del curso).

   Se carga DESPUÉS de los scripts del curso y de datos-bestiario.js, y se
   ejecuta en el acto, antes de que curso.js monte la página (curso.js espera
   a DOMContentLoaded). Así curso.js trata las tarjetas como el resto del
   contenido: fórmulas KaTeX, índice de la página y salto al #ancla de la URL.

   - Los href/src del html de cada caso vienen relativos a la RAÍZ del curso:
     se les antepone ../../ (salvo http:, mailto:, data:, / y #).
   - Un enlace a otro caso del bestiario (…/leccion.html#mN-id) se convierte
     en un enlace dentro de esta página (#mN-id): así se navega sin salir.
   - Filtro de texto (todas las palabras, sin tildes ni mayúsculas), filtro
     por módulo, modo «solo títulos» y recuento.
   - Los enlaces del diagnóstico rápido (#mN-id) se comprueban: si un caso
     deja de existir, se marca el enlace y se avisa en la consola.
   ===================================================================== */
(function () {
  "use strict";
  const RAIZ = "../../";
  const cont = document.getElementById("ax-casos");
  if (!cont) return;
  const datos = Array.isArray(window.CURSO_BESTIARIO) ? window.CURSO_BESTIARIO : [];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const sinEtiquetas = (h) => String(h).replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

  if (!datos.length) {
    cont.innerHTML = '<p class="ax-aviso">No se han podido cargar los casos: falta <code>assets/js/datos-bestiario.js</code> (se genera con <code>node herramientas/indexar.mjs</code>).</p>';
    console.error("Bestiario: window.CURSO_BESTIARIO no existe o está vacío");
    return;
  }

  const porId = new Map(datos.map((c) => [c.id, c]));
  function aRaiz(h) {
    return h.replace(/\b(href|src)="([^"]*)"/g, (m, a, v) => {
      if (/^(https?:|mailto:|data:|\/|#)/i.test(v)) return m;
      if (a === "href") {
        const i = v.indexOf("#");
        if (i >= 0 && porId.has(v.slice(i + 1))) return 'href="#' + v.slice(i + 1) + '"';
      }
      return a + '="' + RAIZ + v + '"';
    });
  }

  /* ---------- Pintar: un grupo por módulo, en el orden de los datos ---------- */
  const grupos = new Map();
  for (const c of datos) {
    const k = String(c.modulo.num);
    if (!grupos.has(k)) grupos.set(k, { modulo: c.modulo, casos: [] });
    grupos.get(k).casos.push(c);
  }
  let html = "";
  const textos = new Map();
  for (const [k, g] of grupos) {
    html += '<section class="ax-grupo" data-mod="' + esc(k) + '"><h3>Módulo ' + esc(k) + " · " + esc(g.modulo.titulo) + ' <span class="ax-n">(' + g.casos.length + ")</span></h3>";
    for (const c of g.casos) {
      const url = RAIZ + c.leccion.archivo + "#" + c.id;
      html += '<article class="ax-caso" id="' + esc(c.id) + '" data-mod="' + esc(k) + '">' +
        '<header class="ax-caso-cab">' +
        '<h4 class="ax-caso-tit"><a class="ax-caso-ancla" href="#' + esc(c.id) + '" title="Enlace a este caso">' + esc(c.titulo) + "</a></h4>" +
        '<a class="ax-caso-lec" href="' + esc(url) + '">' + esc(c.leccion.num + " · " + c.leccion.titulo) + " →</a>" +
        "</header>" +
        '<div class="ax-caso-cuerpo">' + aRaiz(c.html) + "</div></article>";
      textos.set(c.id, norm([c.titulo, c.id, c.leccion.num, c.leccion.titulo, "modulo " + k, c.modulo.titulo, sinEtiquetas(c.html)].join(" ")));
    }
    html += "</section>";
  }
  cont.innerHTML = html;

  document.querySelectorAll("[data-ax-total]").forEach((s) => (s.textContent = datos.length));

  /* ---------- Filtros ---------- */
  const casos = [...cont.querySelectorAll(".ax-caso")].map((el) => ({ el, mod: el.dataset.mod, texto: textos.get(el.id) || "" }));
  const secciones = [...cont.querySelectorAll(".ax-grupo")];
  const input = document.getElementById("ax-q");
  const cuenta = document.querySelector(".ax-buscador .ax-cuenta");
  const cajaMods = document.querySelector(".ax-buscador .ax-mods");
  const compacto = document.getElementById("ax-compacto");
  let modActivo = "";

  if (cajaMods) {
    const boton = (valor, texto, n, titulo) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ax-chip";
      b.dataset.mod = valor;
      b.setAttribute("aria-pressed", valor === "" ? "true" : "false");
      if (titulo) b.title = titulo;
      b.innerHTML = esc(texto) + ' <span class="ax-n">' + n + "</span>";
      b.addEventListener("click", () => { modActivo = modActivo === valor ? "" : valor; aplicar(); });
      cajaMods.append(b);
    };
    boton("", "Todos", datos.length, "Todos los módulos");
    for (const [k, g] of grupos) boton(k, "M" + k, g.casos.length, "Módulo " + k + " · " + g.modulo.titulo);
  }

  /* Cada palabra tiene que aparecer al principio de una palabra del caso: «nan» encuentra «NaN»
     pero no «mantenían»; «operation» encuentra «INVALID_OPERATION». */
  const escRe = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function aplicar() {
    const palabras = input ? norm(input.value.trim()).split(/\s+/).filter(Boolean) : [];
    const res = palabras.map((w) => new RegExp("(^|[^a-z0-9])" + escRe(w)));
    let visibles = 0;
    for (const c of casos) {
      const ok = (!modActivo || c.mod === modActivo) && res.every((re) => re.test(c.texto));
      c.el.classList.toggle("ax-oculto", !ok);
      if (ok) visibles++;
    }
    for (const s of secciones) s.classList.toggle("ax-oculto", !s.querySelector(".ax-caso:not(.ax-oculto)"));
    if (cajaMods) cajaMods.querySelectorAll(".ax-chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mod === modActivo)));
    if (cuenta) cuenta.textContent = visibles === casos.length ? casos.length + " casos" : visibles + " de " + casos.length + " casos";
    let vacio = cont.querySelector(".ax-vacio");
    if (!visibles && !vacio) { vacio = document.createElement("p"); vacio.className = "ax-vacio"; cont.prepend(vacio); }
    if (vacio) { vacio.textContent = visibles ? "" : "Ningún caso contiene todas esas palabras. Prueba con menos, o con el mensaje de error sin comillas."; vacio.hidden = !!visibles; }
  }
  function limpiar() { if (input) input.value = ""; modActivo = ""; aplicar(); }

  if (input) {
    input.addEventListener("input", aplicar);
    input.addEventListener("keydown", (e) => { if (e.key === "Escape") limpiar(); });
  }
  if (compacto) compacto.addEventListener("change", () => cont.classList.toggle("ax-compacto", compacto.checked));
  aplicar();

  /* ---------- Saltar a un caso oculto por el filtro: se quita el filtro ---------- */
  const esCasoOculto = (id) => { const el = document.getElementById(id); return el && el.classList.contains("ax-caso") && el.classList.contains("ax-oculto"); };
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = decodeURIComponent(a.getAttribute("href").slice(1));
    if (esCasoOculto(id)) limpiar();
  });
  window.addEventListener("hashchange", () => { const id = decodeURIComponent(location.hash.slice(1)); if (esCasoOculto(id)) { limpiar(); document.getElementById(id).scrollIntoView(); } });

  /* ---------- Diagnóstico rápido: lección de cada caso y enlaces rotos ---------- */
  document.querySelectorAll(".ax-sintomas a[href^='#m']").forEach((a) => {
    const id = decodeURIComponent(a.getAttribute("href").slice(1));
    const c = porId.get(id);
    if (!c) {
      a.classList.add("ax-roto");
      a.title = "Este caso ya no existe en el bestiario";
      console.error("Bestiario: el diagnóstico rápido enlaza a un caso que no existe: #" + id);
      return;
    }
    a.title = c.titulo + " (" + c.leccion.num + ")";
    const n = document.createElement("span");
    n.className = "ax-num";
    n.textContent = c.leccion.num;
    a.after(" ", n);
  });
})();
