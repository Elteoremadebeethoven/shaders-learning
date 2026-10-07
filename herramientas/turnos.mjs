// Portero de procesos pesados del curso.
//
// Regla del dueño (MacBook Air sin ventilador): como mucho DOS procesos pesados a la vez (Chrome headless,
// laboratorios de GPU, scripts de Python que dibujan con OpenGL…) y los agentes piden permiso antes de lanzar uno.
// El permiso se pide aquí: cada petición queda anotada en herramientas/.turnos.log (PIDE → CONCEDE → LIBERA) y
// solo se concede cuando hay un turno libre. Los laboratorios de tiempos de GPU piden turno --exclusivo (los dos
// turnos): medir con otro proceso usando la GPU falsea las cifras.
//
// Uso:
//   node herramientas/turnos.mjs --agente NOMBRE --motivo "qué y por qué" -- <comando> [args…]
//   node herramientas/turnos.mjs --exclusivo --agente NOMBRE --motivo "tiempos de 7.5" -- node lab.mjs
//   node herramientas/turnos.mjs --estado          (quién tiene los turnos y quién espera)
// Opciones: --max-min M (tope de duración, 12 min por defecto, 25 como mucho: al pasarlo se corta el comando).
//
// El puppeteer-core de herramientas/node_modules está parcheado (estado/PuppeteerNode.parcheado.js) para pasar por
// este mismo portero en cada launch(); dentro de un comando lanzado con turnos.mjs no vuelve a pedir turno
// (variable CURSO_TURNO_CONCEDIDO), así que un verificar.mjs lanzado con turnos.mjs ocupa un solo turno.
// Turnos = directorios herramientas/.chrome-turno-0, -1 (mkdir atómico, con detección de dueños muertos).
// Orden de llegada: cada petición deja un número en herramientas/.chrome-turno-cola/ (archivo <ms>-<pid>) y solo
// intenta coger turno cuando delante de ella hay menos peticiones vivas que turnos libres (sin esto, quien liberaba
// un turno y pedía otro al instante —tandas en bucle— lo recuperaba antes que los que llevaban minutos esperando).
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
export const N = Math.max(1, +(process.env.CURSO_TURNOS || 2));
const BASE = path.join(DIR, ".chrome-turno");
const RESERVA = BASE + "-reserva";
const COLA = BASE + "-cola";
const LOG = path.join(DIR, ".turnos.log");

function ahora() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
export function anotar(accion, texto = "") {
  const linea = `${ahora()}\t${accion}\t${process.env.CURSO_AGENTE || "?"}\tpid ${process.pid}\t${texto.replace(/\s+/g, " ").slice(0, 300)}\n`;
  try { fs.appendFileSync(LOG, linea); } catch { }
}
function vivo(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; }
}
// Dueño de un turno: {pid, t, motivo} si está ocupado; null si está libre (borra los de dueños muertos).
function dueño(lock) {
  try {
    const [cab, ...resto] = fs.readFileSync(lock + "/pid", "utf8").split("\n");
    const [pid, t] = cab.split(" ").map(Number);
    if (!vivo(pid)) { fs.rmSync(lock, { recursive: true, force: true }); return null; }
    return { pid, t, motivo: resto.join(" ").trim() };
  } catch {
    try {
      const st = fs.statSync(lock);
      // directorio sin archivo pid: alguien lo está creando ahora mismo (o murió a medias hace rato)
      if (Date.now() - st.mtimeMs > 30000) { fs.rmSync(lock, { recursive: true, force: true }); return null; }
      return { pid: 0, t: st.mtimeMs, motivo: "(creándose)" };
    } catch { return null; }
  }
}
function tomar(lock, motivo) {
  try {
    fs.mkdirSync(lock);
    fs.writeFileSync(lock + "/pid", `${process.pid} ${Date.now()}\n${process.env.CURSO_AGENTE || "?"}: ${motivo}`);
    return true;
  } catch { return false; }
}
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// Número en la cola (orden de llegada) y cuántas peticiones vivas tiene delante (borra las de procesos muertos).
function sacarNumero() {
  fs.mkdirSync(COLA, { recursive: true });
  const n = `${String(Date.now()).padStart(15, "0")}-${process.pid}-${Math.random().toString(36).slice(2, 6)}`;
  fs.writeFileSync(path.join(COLA, n), "");
  return n;
}
function tirarNumero(n) { try { fs.rmSync(path.join(COLA, n), { force: true }); } catch { } }
function enCola() {
  let fs_ = [];
  try { fs_ = fs.readdirSync(COLA).sort(); } catch { }
  return fs_.filter((f) => vivo(+f.split("-")[1]) || (tirarNumero(f), false));
}
function delante(n) { return enCola().filter((f) => f < n).length; }
function libres() { let k = 0; for (let i = 0; i < N; i++) if (dueño(`${BASE}-${i}`) === null) k++; return k; }

// Espera turno y devuelve la función que lo libera.
export async function adquirir({ exclusivo = false, motivo = "" } = {}) {
  anotar("PIDE", (exclusivo ? "[exclusivo] " : "") + motivo);
  const t0 = Date.now();
  const tengo = [];
  const numero = sacarNumero();
  process.once("exit", () => tirarNumero(numero));
  let avisado = false;
  for (;;) {
    if (exclusivo) {
      const r = dueño(RESERVA);
      if (!r && delante(numero) === 0) tomar(RESERVA, motivo);
      const mia = dueño(RESERVA);
      if (mia && mia.pid === process.pid) {
        // turnos en orden (0, 1, …): dos exclusivos no pueden bloquearse entre sí
        for (let i = 0; i < N; i++) {
          if (tengo.includes(i)) continue;
          if (tomar(`${BASE}-${i}`, motivo) || (dueño(`${BASE}-${i}`) === null && tomar(`${BASE}-${i}`, motivo))) tengo.push(i);
          else break;
        }
        if (tengo.length === N) { fs.rmSync(RESERVA, { recursive: true, force: true }); break; }
      }
    } else {
      const r = dueño(RESERVA);
      if ((!r || r.pid === process.pid) && delante(numero) < libres()) {
        let ok = false;
        for (let i = 0; i < N && !ok; i++) {
          const lock = `${BASE}-${i}`;
          if (tomar(lock, motivo) || (dueño(lock) === null && tomar(lock, motivo))) { tengo.push(i); ok = true; }
        }
        if (ok) break;
      }
    }
    if (!avisado) {
      console.error(`[turnos] esperando turno (como mucho ${N} procesos pesados a la vez${exclusivo ? "; este pide todos" : ""})…`);
      avisado = true;
    }
    await dormir(1000);
  }
  tirarNumero(numero);
  const espera = ((Date.now() - t0) / 1000).toFixed(0);
  anotar("CONCEDE", `turno ${tengo.join("+")} tras ${espera} s · ${motivo}`);
  let liberado = false;
  const t1 = Date.now();
  const liberar = () => {
    if (liberado) return;
    liberado = true;
    for (const i of tengo) {
      const lock = `${BASE}-${i}`;
      try {
        const c = fs.readFileSync(lock + "/pid", "utf8");
        if (c.startsWith(process.pid + " ")) fs.rmSync(lock, { recursive: true, force: true });
      } catch { }
    }
    anotar("LIBERA", `turno ${tengo.join("+")} tras ${((Date.now() - t1) / 1000).toFixed(0)} s de uso`);
  };
  process.once("exit", liberar);
  return liberar;
}

export function estado() {
  const filas = [];
  for (let i = 0; i < N; i++) {
    const d = dueño(`${BASE}-${i}`);
    filas.push(`turno ${i}: ` + (d ? `OCUPADO por pid ${d.pid} desde hace ${((Date.now() - d.t) / 60000).toFixed(1)} min — ${d.motivo}` : "libre"));
  }
  const r = dueño(RESERVA);
  if (r) filas.push(`reserva exclusiva: pid ${r.pid} — ${r.motivo}`);
  const cola = enCola();
  filas.push(`en cola (por orden de llegada): ${cola.length ? cola.map((f) => "pid " + f.split("-")[1]).join(", ") : "nadie"}`);
  return filas.join("\n");
}

// ---------- uso como programa ----------
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const a = process.argv.slice(2);
  if (a.includes("--estado")) {
    console.log(estado());
    try { console.log("\núltimas anotaciones:\n" + fs.readFileSync(LOG, "utf8").trim().split("\n").slice(-12).join("\n")); } catch { }
    process.exit(0);
  }
  const sep = a.indexOf("--");
  if (sep < 0 || sep === a.length - 1) {
    console.error('uso: node turnos.mjs [--exclusivo] [--max-min M] --agente NOMBRE --motivo "…" -- comando [args…]');
    process.exit(2);
  }
  const op = a.slice(0, sep), cmd = a.slice(sep + 1);
  const valor = (k) => { const i = op.indexOf(k); return i >= 0 ? op[i + 1] : undefined; };
  if (valor("--agente")) process.env.CURSO_AGENTE = valor("--agente");
  const motivo = valor("--motivo") || cmd.join(" ");
  const maxMin = Math.min(25, Math.max(1, +(valor("--max-min") || 12)));
  const liberar = await adquirir({ exclusivo: op.includes("--exclusivo"), motivo });
  const hijo = spawn(cmd[0], cmd.slice(1), {
    stdio: "inherit", detached: true,
    env: { ...process.env, CURSO_TURNO_CONCEDIDO: "1" },
  });
  const matar = (sen) => { try { process.kill(-hijo.pid, sen); } catch { try { hijo.kill(sen); } catch { } } };
  const tope = setTimeout(() => {
    console.error(`[turnos] el comando pasó de ${maxMin} min: se corta para liberar el turno`);
    anotar("CORTA", `más de ${maxMin} min · ${motivo}`);
    matar("SIGTERM");
    setTimeout(() => matar("SIGKILL"), 5000).unref();
  }, maxMin * 60000);
  for (const s of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(s, () => { matar("SIGTERM"); setTimeout(() => { matar("SIGKILL"); liberar(); process.exit(130); }, 3000); });
  hijo.on("error", (e) => { console.error("[turnos] no se pudo lanzar:", e.message); clearTimeout(tope); liberar(); process.exit(127); });
  hijo.on("exit", (code, sig) => { clearTimeout(tope); liberar(); process.exit(code ?? (sig ? 1 : 0)); });
}
