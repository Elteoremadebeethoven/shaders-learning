/* =====================================================================
   anexos.js — ayudas de los anexos
   Filtro en vivo para las tablas de referencia:
     <div class="ax-filtro">
       <label for="f1">Filtrar</label><input id="f1" type="search">
       <span class="ax-cuenta"></span>
     </div>
   Filtra todas las filas de las tablas table.ax-ref de la página (todas las
   palabras escritas deben aparecer en la fila; sin tildes ni mayúsculas).
   Las tablas que se quedan sin filas se ocultan enteras. Con el campo vacío
   se ve todo, así que Ctrl+F sigue funcionando sobre la página completa.
   ===================================================================== */
(function () {
  "use strict";
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  function montarFiltro(caja) {
    const input = caja.querySelector("input");
    const cuenta = caja.querySelector(".ax-cuenta");
    if (!input) return;
    const tablas = [...document.querySelectorAll("main table.ax-ref")];
    const filas = [];
    tablas.forEach((t) => [...t.tBodies].forEach((b) => [...b.rows].forEach((r) => {
      if (!r.classList.contains("ax-sep")) filas.push({ r, t, texto: norm(r.textContent) });
    })));
    const seps = tablas.flatMap((t) => [...t.querySelectorAll("tr.ax-sep")]);

    function aplicar() {
      const palabras = norm(input.value.trim()).split(/\s+/).filter(Boolean);
      let visibles = 0;
      const tablasConFilas = new Set();
      for (const f of filas) {
        const ok = !palabras.length || palabras.every((w) => f.texto.includes(w));
        f.r.classList.toggle("ax-oculto", !ok);
        if (ok) { visibles++; tablasConFilas.add(f.t); }
      }
      seps.forEach((s) => s.classList.toggle("ax-oculto", palabras.length > 0));
      tablas.forEach((t) => t.classList.toggle("ax-oculto", palabras.length > 0 && !tablasConFilas.has(t)));
      if (cuenta) cuenta.textContent = palabras.length ? visibles + " de " + filas.length + " filas" : filas.length + " filas";
    }
    input.addEventListener("input", aplicar);
    input.addEventListener("keydown", (e) => { if (e.key === "Escape") { input.value = ""; aplicar(); } });
    aplicar();
  }

  /* Cortes suaves: el código en línea usa overflow-wrap: break-word (curso.css), así que una
     palabra no se parte y fija el ancho mínimo de su columna. En las tablas de A.3 hay
     identificadores tan largos (getActiveUniformBlockParameter, INVALID_FRAMEBUFFER_OPERATION)
     que desbordarían la tabla: se les insertan <wbr> en sus junturas naturales (entre minúscula
     y mayúscula, y tras «_ . ( [ |»), solo en «palabras» de LARGA o más caracteres. Los <wbr>
     no cambian el texto: el filtro, Ctrl+F y copiar siguen igual. (Medido: sin ellos, 12 de las
     tablas de A.3 necesitan scroll horizontal a 1440 px; con ellos, ninguna.) */
  const LARGA = 20;
  const JUNTURA = /[_.([|]/;
  function partirPalabra(p, frag) {
    let desde = 0;
    for (let i = 1; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1];
      if ((/[a-z0-9]/.test(a) && /[A-Z]/.test(b)) || JUNTURA.test(a)) {
        frag.append(p.slice(desde, i + 1), document.createElement("wbr"));
        desde = i + 1;
      }
    }
    frag.append(p.slice(desde));
  }
  function cortesSuaves() {
    document.querySelectorAll("main table code").forEach((code) => {
      if (code.textContent.length < LARGA) return;
      const w = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
      const nodos = [];
      let n;
      while ((n = w.nextNode())) nodos.push(n);
      for (const t of nodos) {
        const trozos = t.data.split(/(\s+)/);
        if (!trozos.some((p) => p.length >= LARGA && /\S/.test(p))) continue;
        const frag = document.createDocumentFragment();
        for (const p of trozos) {
          if (p.length >= LARGA && /\S/.test(p)) partirPalabra(p, frag);
          else frag.append(p);
        }
        t.replaceWith(frag);
      }
    });
  }

  function iniciar() {
    cortesSuaves();
    document.querySelectorAll(".ax-filtro").forEach(montarFiltro);
  }
  if (window.Curso && Curso.alListo) Curso.alListo(iniciar);
  else document.addEventListener("DOMContentLoaded", iniciar);
})();
