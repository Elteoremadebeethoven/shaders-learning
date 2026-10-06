/* =====================================================================
   Módulo 1 · Simulador del event loop (lección 1.5)
   ---------------------------------------------------------------------
   Un modelo didáctico, pero fiel a las reglas del estándar HTML:
   - Un solo hilo: la pila de llamadas ejecuta una cosa cada vez.
   - Cada tarea se ejecuta entera; al vaciarse la pila, se vacían TODAS
     las microtareas (también las que se encolan mientras tanto).
   - Los temporizadores vencidos pasan a la cola de tareas.
   - Un frame ejecuta los callbacks de rAF pedidos ANTES de empezar el
     frame (los que se piden durante el frame esperan al siguiente),
     y después estilo, layout, pintado y composición.
   - El orden entre una tarea lista y un frame que toca «a la vez» no
     está garantizado: el parámetro frameAntes elige una de las dos.
   Los programas se describen con operaciones:
     { t: "log", l, txt }                  console.log
     { t: "timeout", l, ms, cb }           setTimeout(cb, ms)
     { t: "then", l, cb }                  Promise.resolve().then(cb)
     { t: "micro", l, cb }                 queueMicrotask(cb)
     { t: "raf", l, cb }                   requestAnimationFrame(cb)
     { t: "ocupado", l, ms }               un bucle que bloquea ms milisegundos
     { t: "clic", l, oyentes: [cb, cb] }   el.click(): oyentes síncronos
   cb = { nombre, l, ops: [...] }.  Un programa puede tener además
   tareaInicial: { nombre, oyentes: [cb…] } para un clic REAL del usuario.
   ===================================================================== */
(function () {
  "use strict";
  const FRAME = 16.7;

  function simular(prog, frameAntes) {
    const fotos = [];
    const S = { pila: [], micro: [], tareas: [], raf: [], timers: [], consola: [], t: 0, sigFrame: FRAME, frame: 0, fase: "", ultimoLog: -1 };
    const nombres = (xs) => xs.map((c) => c.nombre);
    function foto(linea, texto, extra) {
      fotos.push(Object.assign({
        linea, texto, pila: S.pila.slice(), micro: nombres(S.micro), tareas: nombres(S.tareas), raf: nombres(S.raf),
        timers: S.timers.map((x) => x.cb.nombre + " (vence en t=" + x.vence.toFixed(1) + " ms)"),
        consola: S.consola.slice(), fase: S.fase, t: S.t, frame: S.frame,
      }, extra || {}));
    }
    function ops(lista) {
      for (const op of lista) {
        switch (op.t) {
          case "log":
            S.consola.push(op.txt);
            foto(op.l, "console.log(\"" + op.txt + "\") escribe en la consola. Es código síncrono: ocurre ya.", { nuevoLog: true });
            break;
          case "timeout":
            S.timers.push({ vence: S.t + op.ms, cb: op.cb });
            foto(op.l, "setTimeout registra un temporizador de " + op.ms + " ms y sigue. Cuando venza, su callback irá a la cola de TAREAS; no se ejecuta ahora.");
            break;
          case "then":
            S.micro.push(op.cb);
            foto(op.l, "La promesa ya está resuelta, así que then() encola su callback en MICROTAREAS. Tampoco se ejecuta ahora: la pila no está vacía.");
            break;
          case "micro":
            S.micro.push(op.cb);
            foto(op.l, "queueMicrotask() encola el callback en MICROTAREAS.");
            break;
          case "raf":
            S.raf.push(op.cb);
            foto(op.l, "requestAnimationFrame() apunta el callback para el PRÓXIMO FRAME, justo antes de pintar.");
            break;
          case "ocupado": {
            const antes = S.t;
            S.t += op.ms;
            const perdidos = Math.max(0, Math.floor((S.t - S.sigFrame) / FRAME) + (S.t >= S.sigFrame ? 1 : 0));
            foto(op.l, "Un bucle ocupado bloquea el único hilo " + op.ms + " ms (de t=" + antes.toFixed(1) + " a t=" + S.t.toFixed(1) + "). Mientras, no puede ejecutarse nada más: ni tareas, ni microtareas, ni frames" + (perdidos ? " (tocaban " + perdidos + " frames)" : "") + ".");
            break;
          }
          case "clic":
            foto(op.l, "el.click() despacha el evento AHORA, dentro de este mismo código: los oyentes se ejecutan encima de la pila actual, uno tras otro.");
            for (const cb of op.oyentes) {
              S.pila.push(cb.nombre);
              foto(cb.l, "Se ejecuta " + cb.nombre + " (la pila no queda vacía entre oyentes: debajo sigue el código que llamó a click()).");
              ops(cb.ops);
              S.pila.pop();
            }
            break;
        }
      }
    }
    function vaciarMicro() {
      if (S.pila.length || !S.micro.length) return;
      foto(null, "La pila se ha vaciado: PUNTO DE CONTROL DE MICROTAREAS. Se ejecutan todas, en orden, incluidas las que se encolen mientras tanto.");
      while (S.micro.length) {
        const cb = S.micro.shift();
        const fase = S.fase;
        S.fase = "microtarea";
        S.pila.push(cb.nombre);
        foto(cb.l, "Sale de la cola y se ejecuta la microtarea: " + cb.nombre + ".");
        ops(cb.ops);
        S.pila.pop();
        S.fase = fase;
      }
      foto(null, "Cola de microtareas vacía: el bucle de eventos puede seguir.");
    }
    function tarea(cb) {
      S.fase = "tarea";
      S.pila.push(cb.nombre);
      foto(cb.l, "El bucle de eventos saca UNA tarea de la cola y la ejecuta entera: " + cb.nombre + ".");
      if (cb.oyentes) {
        // Un evento REAL: el navegador llama a cada oyente con la pila vacía debajo
        S.pila.pop();
        for (const o of cb.oyentes) {
          S.pila.push(o.nombre);
          foto(o.l, "El navegador llama a " + o.nombre + ". Debajo no hay más código tuyo: la pila solo tiene este oyente.");
          ops(o.ops);
          S.pila.pop();
          foto(null, o.nombre + " termina y la pila queda vacía…");
          vaciarMicro();
        }
        return;
      }
      ops(cb.ops);
      S.pila.pop();
      foto(null, cb.nombre + " termina; la pila queda vacía.");
      vaciarMicro();
    }
    function hacerFrame() {
      S.frame++;
      S.fase = "frame";
      const pendientes = S.raf.splice(0);
      foto(null, "¡Toca frame! (t=" + S.t.toFixed(1) + " ms). Primero se ejecutan los callbacks de rAF pedidos antes de empezar el frame: " + (pendientes.length ? pendientes.length : "ninguno") + ".", { enFrame: "raf" });
      for (const cb of pendientes) {
        S.pila.push(cb.nombre);
        foto(cb.l, "Se ejecuta " + cb.nombre + " (todos los callbacks de este frame reciben el mismo instante).", { enFrame: "raf" });
        ops(cb.ops);
        S.pila.pop();
        vaciarMicro();
        S.fase = "frame";
      }
      foto(null, "Estilo → layout → pintado → composición: el navegador dibuja el frame " + S.frame + "." + (S.raf.length ? " Los rAF pedidos durante este frame esperan al siguiente." : ""), { enFrame: "pintar" });
      S.sigFrame += FRAME;
      while (S.sigFrame <= S.t) S.sigFrame += FRAME;
      S.fase = "";
    }

    // 1. El script principal es la primera tarea
    if (prog.tareaInicial) {
      S.fase = "tarea";
      foto(null, "Estado inicial: la página ya ha cargado y el usuario va a hacer clic. El clic real es una TAREA en la cola.");
      S.tareas.push(prog.tareaInicial);
      foto(null, "El navegador encola la tarea del clic.");
      tarea(S.tareas.shift());
    } else {
      S.fase = "tarea";
      S.pila.push("script principal");
      foto(null, "El navegador empieza a ejecutar el <script>. Ejecutar un script entero es una TAREA.");
      ops(prog.ops);
      S.pila.pop();
      foto(null, "El script llega al final: la pila de llamadas queda vacía.");
      vaciarMicro();
    }

    // 2. El bucle de eventos
    for (let vuelta = 0; vuelta < 80 && (S.timers.length || S.tareas.length || S.raf.length); vuelta++) {
      // temporizadores vencidos → cola de tareas (en orden de vencimiento)
      S.timers.sort((a, b) => a.vence - b.vence);
      while (S.timers.length && S.timers[0].vence <= S.t) {
        const x = S.timers.shift();
        S.tareas.push(x.cb);
        foto(null, "Vence un temporizador: " + x.cb.nombre + " pasa a la cola de TAREAS.");
      }
      const tocaFrame = S.raf.length && (S.t >= S.sigFrame || (frameAntes && S.tareas.length));
      if (tocaFrame) {
        if (S.t < S.sigFrame) S.t = S.sigFrame;
        hacerFrame();
        continue;
      }
      if (S.tareas.length) { tarea(S.tareas.shift()); continue; }
      // nada listo: avanzar el reloj hasta lo siguiente que ocurra
      const proximos = [];
      if (S.timers.length) proximos.push(S.timers[0].vence);
      if (S.raf.length) proximos.push(S.sigFrame);
      const t = Math.min(...proximos);
      if (t > S.t) {
        const antes = S.t;
        S.t = t;
        S.fase = "";
        foto(null, "No hay nada que ejecutar: el hilo espera (de t=" + antes.toFixed(1) + " a t=" + t.toFixed(1) + " ms).");
      }
    }
    foto(null, "Fin: no queda nada en ninguna cola. La salida de la consola es el orden real de ejecución.", { fin: true });
    return fotos;
  }

  const cb = (nombre, l, ops) => ({ nombre, l, ops });
  const log = (l, txt) => ({ t: "log", l, txt });
  const PROGRAMAS = {
    clasico: {
      titulo: "El clásico: timeout, promesa, microtarea y rAF",
      codigo: [
        'console.log("A");',
        'setTimeout(() => console.log("B"), 0);',
        'Promise.resolve().then(() => console.log("C"));',
        'queueMicrotask(() => console.log("D"));',
        'requestAnimationFrame(() => console.log("E"));',
        'console.log("F");',
      ],
      ops: [log(1, "A"), { t: "timeout", l: 2, ms: 0, cb: cb("callback del timeout", 2, [log(2, "B")]) },
        { t: "then", l: 3, cb: cb("callback del then", 3, [log(3, "C")]) }, { t: "micro", l: 4, cb: cb("callback de queueMicrotask", 4, [log(4, "D")]) },
        { t: "raf", l: 5, cb: cb("callback de rAF", 5, [log(5, "E")]) }, log(6, "F")],
      nota: "B y E pueden salir en cualquier orden: el estándar no fija si llega antes la tarea del timeout o el frame. En Chrome, en 40 pruebas, ganó el timeout 21 veces y el rAF 19. Marca «el frame llega antes» para ver la otra posibilidad.",
    },
    cadena: {
      titulo: "Microtareas que encolan microtareas",
      codigo: [
        'setTimeout(() => console.log("T"), 0);',
        'Promise.resolve().then(() => {',
        '  console.log("P1");',
        '  Promise.resolve().then(() => console.log("P2"));',
        '});',
        'console.log("S");',
      ],
      ops: [{ t: "timeout", l: 1, ms: 0, cb: cb("callback del timeout", 1, [log(1, "T")]) },
        { t: "then", l: 2, cb: cb("then exterior", 2, [log(3, "P1"), { t: "then", l: 4, cb: cb("then interior", 4, [log(4, "P2")]) }]) }, log(6, "S")],
    },
    tareas: {
      titulo: "Una promesa dentro de un timeout",
      codigo: [
        'setTimeout(() => {',
        '  console.log("T1");',
        '  Promise.resolve().then(() => console.log("P"));',
        '}, 0);',
        'setTimeout(() => console.log("T2"), 0);',
      ],
      ops: [{ t: "timeout", l: 1, ms: 0, cb: cb("timeout 1", 1, [log(2, "T1"), { t: "then", l: 3, cb: cb("callback del then", 3, [log(3, "P")]) }]) },
        { t: "timeout", l: 5, ms: 0, cb: cb("timeout 2", 5, [log(5, "T2")]) }],
    },
    rafs: {
      titulo: "rAF dentro de rAF",
      codigo: [
        'requestAnimationFrame(() => {',
        '  console.log("R1");',
        '  requestAnimationFrame(() => console.log("R2"));',
        '  Promise.resolve().then(() => console.log("M"));',
        '});',
      ],
      ops: [{ t: "raf", l: 1, cb: cb("rAF exterior", 1, [log(2, "R1"), { t: "raf", l: 3, cb: cb("rAF interior", 3, [log(3, "R2")]) }, { t: "then", l: 4, cb: cb("callback del then", 4, [log(4, "M")]) }]) }],
    },
    await: {
      titulo: "async / await",
      codigo: [
        'async function f() {',
        '  console.log("1");',
        '  await null;            // el resto de f() sigue como microtarea',
        '  console.log("3");',
        '}',
        'f();',
        'console.log("2");',
      ],
      ops: [{ t: "log", l: 2, txt: "1" }, { t: "then", l: 3, cb: cb("continuación de f() tras el await", 3, [log(4, "3")]) }, log(7, "2")],
    },
    clicReal: {
      titulo: "Dos oyentes: clic REAL del usuario",
      codigo: [
        'boton.addEventListener("click", () => {',
        '  console.log("L1");',
        '  Promise.resolve().then(() => console.log("M1"));',
        '});',
        'boton.addEventListener("click", () => {',
        '  console.log("L2");',
        '  Promise.resolve().then(() => console.log("M2"));',
        '});',
        '// …y el usuario hace clic en el botón',
      ],
      tareaInicial: { nombre: "tarea: clic del usuario", oyentes: [
        cb("oyente 1", 1, [log(2, "L1"), { t: "then", l: 3, cb: cb("microtarea de L1", 3, [log(3, "M1")]) }]),
        cb("oyente 2", 5, [log(6, "L2"), { t: "then", l: 7, cb: cb("microtarea de L2", 7, [log(7, "M2")]) }]),
      ] },
    },
    clicCodigo: {
      titulo: "Los mismos oyentes con boton.click()",
      codigo: [
        'boton.addEventListener("click", () => {',
        '  console.log("L1");',
        '  Promise.resolve().then(() => console.log("M1"));',
        '});',
        'boton.addEventListener("click", () => {',
        '  console.log("L2");',
        '  Promise.resolve().then(() => console.log("M2"));',
        '});',
        'boton.click();          // el clic lo lanza tu código',
      ],
      ops: [{ t: "clic", l: 9, oyentes: [
        cb("oyente 1", 1, [log(2, "L1"), { t: "then", l: 3, cb: cb("microtarea de L1", 3, [log(3, "M1")]) }]),
        cb("oyente 2", 5, [log(6, "L2"), { t: "then", l: 7, cb: cb("microtarea de L2", 7, [log(7, "M2")]) }]),
      ] }],
    },
    ocupado: {
      titulo: "Un bucle ocupado de 100 ms",
      codigo: [
        'setTimeout(() => console.log("timeout"), 0);',
        'requestAnimationFrame(() => console.log("rAF"));',
        'console.log("empiezo");',
        'const fin = performance.now() + 100;',
        'while (performance.now() < fin) {}   // ocupado',
        'console.log("termino");',
      ],
      ops: [{ t: "timeout", l: 1, ms: 0, cb: cb("callback del timeout", 1, [log(1, "timeout")]) }, { t: "raf", l: 2, cb: cb("callback de rAF", 2, [log(2, "rAF")]) },
        log(3, "empiezo"), { t: "ocupado", l: 5, ms: 100 }, log(6, "termino")],
      nota: "Tras el bloqueo, el frame va con retraso. En Chrome, en 20 pruebas con un bloqueo de 100 ms, el rAF salió siempre antes que el timeout; aun así, el estándar tampoco lo garantiza.",
    },
  };

  window.BucleEventos = { simular, PROGRAMAS };
})();
