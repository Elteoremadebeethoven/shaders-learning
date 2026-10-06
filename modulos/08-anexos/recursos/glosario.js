/* =====================================================================
   glosario.js — filtro en vivo del anexo A.4 (Glosario)

   Las entradas son HTML estático en 04-glosario.html (así las encuentran
   el buscador del curso, que indexa el HTML, y Ctrl+F). Este script solo
   oculta y muestra lo que ya está en el DOM:

     - Filtro: quedan las entradas (div.ax-entrada) cuyo texto contiene
       TODAS las palabras escritas, sin tildes ni mayúsculas. Las letras
       sin entradas visibles se ocultan y se atenúan en el índice.
     - Esc vacía el filtro. ?q=palabras en la URL lo rellena al abrir.
     - Si un enlace lleva a una entrada o a una letra que el filtro tiene
       oculta, el filtro se vacía antes de saltar.

   Se ejecuta con Curso.alListo, después de que curso.js haya pintado las
   fórmulas: el texto que se filtra es el que ve el lector.
   ===================================================================== */
(function () {
  "use strict";
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  function iniciar() {
    const input = document.getElementById("gl-q");
    if (!input) return;
    const cuenta = document.querySelector(".ax-buscador .ax-cuenta");
    const vacio = document.getElementById("gl-vacio");
    const secciones = [...document.querySelectorAll("main .ax-letra")];
    const entradas = [...document.querySelectorAll("main .ax-entrada")].map((el) => ({
      el,
      texto: norm(el.textContent),
      remision: el.classList.contains("ax-remision"),
      seccion: el.closest(".ax-letra"),
    }));
    const letras = new Map([...document.querySelectorAll(".ax-letras a")].map((a) => [a.getAttribute("href").slice(1), a]));
    const total = entradas.filter((e) => !e.remision).length;

    function aplicar() {
      const palabras = norm(input.value.trim()).split(/\s+/).filter(Boolean);
      const conVisibles = new Set();
      let visibles = 0;
      for (const e of entradas) {
        const ok = !palabras.length || palabras.every((w) => e.texto.includes(w));
        e.el.classList.toggle("ax-oculto", !ok);
        if (ok) {
          conVisibles.add(e.seccion);
          if (!e.remision) visibles++;
        }
      }
      for (const s of secciones) {
        const ok = conVisibles.has(s);
        s.classList.toggle("ax-oculto", !ok);
        const h = s.querySelector("h2");
        const a = h && letras.get(h.id);
        if (a) a.classList.toggle("ax-letra-vacia", !ok);
      }
      if (cuenta) cuenta.textContent = palabras.length ? visibles + " de " + total + " términos" : total + " términos";
      if (vacio) vacio.hidden = conVisibles.size > 0;
    }

    input.addEventListener("input", aplicar);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { input.value = ""; aplicar(); }
    });

    // Un enlace a algo que el filtro oculta: vaciar el filtro antes de saltar
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const destino = document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1)));
      if (destino && destino.closest(".ax-oculto")) { input.value = ""; aplicar(); }
    });

    let q = null;
    try { q = new URLSearchParams(location.search).get("q"); } catch (err) { q = null; }
    if (q) input.value = q;
    aplicar();
  }

  if (window.Curso && Curso.alListo) Curso.alListo(iniciar);
  else document.addEventListener("DOMContentLoaded", iniciar);
})();
