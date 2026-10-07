# Sesión 5 — cierre del lead (auditoría de aceptación final)

Máquina: MacBook Air Apple M1 (sin ventilador), macOS 26, Chrome 154.0.8037.98, ANGLE/Metal. Encargo del dueño:
«Revisa que todo funcione y que el proyecto esté terminado al 100 % incluyendo todos los capítulos», con 2 agentes
Opus 5.5 y 1 Sonnet 5.5 xhigh. Hubo una pausa por créditos (2026-10-06, 20:05) y se reanudó a las 22:50.

## (a) Desarrollo
- Antes de la pausa: los agentes `opus-a` y `opus-b` crearon forks (3 y 5) que superaban el límite del dueño; el lead
  los paró, lo prohibió en `sesion5-COMUN.md` y lo guardó en la memoria (`agentes-sin-subagentes.md`).
- Al reanudar (PRIMER PASO del plan): los 36 archivos editados antes de la pausa → `verificar-todo --movil`
  17/17 + 17/17 sin problemas; `hero.js`/`motor.js` pasan `node --check`; QA del proyecto final 67 ✓; enlaces 3788 / 0.
- Relanzados los 3 agentes, sin forks (comprobado con ListAgents y el registro de turnos: solo opus-a, opus-b, sonnet
  y lead), con el encargo original + `scratchpad/s5/relanzamiento-comun.txt`. Los tres terminaron:
  `sesion5-opus-a.md` (index, 0.1, 1.1–4.6, python/), `sesion5-opus-b.md` (6.1–7.7, proyecto-final/, recursos/),
  `sesion5-sonnet.md` (5.1–5.10, A.1–A.5). Cada uno, con su verificación tras la última edición.
- Errores reales que encontraron (detalle en sus informes): 2.2.5 (solución que fallaba con dos clics seguidos),
  1.7 (la consola de los editores SÍ muestra group/time/count/assert/trace/dir), 1.3 (`let status` no da «already
  declared»: ahora `location`), 1.1 (círculo ovalado al empezar), 3.6.4 (prueba que aceptaba matrices mal
  trasladadas), 4.2.2 y 3.7.1 (✓ al final de la línea: el verificador no las contaba), 2.8 (objetos frente a
  Float32Array: empatan; la cifra vieja era de CPU en frío), `motor.js` (`Motor.Puntero`: el remolino volvía «volando»
  al reentrar; el bucle no se dormía con la página desplazada), 6.9 (la cámara quedaba dentro de una esfera 2/3 del
  tiempo), 5.4 (traspuesta y «0,001 ms»), 5.5 (1×1 RGBA32F no es completa sin extensión; float16 10 bits), 5.10 (29 →
  17–18 fps, de la tabla nueva de 5.9), A.2 (`textureLod` enlazaba a 5.5). Cajas nuevas en 4.1 (Maglev/TurboFan) y 1.5
  (pestaña oculta).

## (b) Herramientas (lead)
- `verificar.mjs`: la espera de las pruebas ✓/✗ de cada solución se cortaba tras 1,5 s sin líneas nuevas (7.3.5
  contaba 2 de 4; 7.6.4, 1 de 4). Ahora cuenta en el código de la solución un mínimo de líneas ✓/✗ (cada línea que
  las imprime; si es una función auxiliar, cada llamada) y no se fía del silencio hasta tenerlas; `--espera-sol` por
  defecto 12 000 ms. Comprobado: 7.3.5 4 ✓, 7.6.4 4 ✓, 3.6 5/4/4 ✓. GUIA §7 actualizada.
- `turnos.mjs`: no repartía por orden de llegada (una petición de opus-a esperó 14 min mientras otros encadenaban
  lotes). Ahora hay cola (`herramientas/.chrome-turno-cola/`, un archivo `<ms>-<pid>-…` por petición): solo intenta
  coger turno quien tiene delante menos peticiones vivas que turnos libres, y un exclusivo toma la reserva solo cuando
  es el primero. Probado en una copia aislada con dos tandas en bucle: el que llega esperaba 18 s (todas las tandas),
  ahora 2 s; orden de llegada respetado también con un exclusivo. `--estado` muestra la cola.
- `playground-js.js`: `console.assert(false, "x")` imprimía «Assertion failed:␣␣x» (dos espacios).
- A.4: el «601 términos» visto en la sesión 5 fue transitorio; en el Chrome del dueño (extensión): 604 + 114.

## (c) Verificación final (después de la última edición de cualquier archivo)
- `node herramientas/indexar.mjs` → 802 entradas, 253 casos · `node herramientas/enlaces.mjs` → 63 archivos,
  3794 enlaces internos, 0 rotos.
- `verificar-todo.mjs --movil` (oscuro, con soluciones, verificador nuevo): m5–m8 32/32 (25,4 min) y portada + m0–m4
  30/30 (16,5 min) sin problemas; 62/62 a 390 px sin desbordamiento.
- `verificar-todo.mjs --tema light --sin-soluciones`: m5–m8 32/32 (18,0 min) y portada + m0–m4 30/30 (11,1 min) sin problemas.
- QA del proyecto final (`s4-m7b-76-proyecto.mjs`): 67 ✓ (también tras los cambios de `motor.js`).
- Chrome del dueño (extensión): con la ventana ya visible y turno `--exclusivo` mientras duró: proyecto final (remolino que
  sigue al puntero, cambio a «Brasas», sin errores de consola), 6.9 «Esferas infinitas» (60 fps; con celda 2 y radio
  1,2, las esferas cortadas por planos que describe el texto, ya no un color liso), 1.1 «Un canvas, dos tamaños»
  (círculo redondo y borroso a 24 px), 4.1 caja senior Maglev/TurboFan, A.4 «604 términos / 114 remisiones».
- Al terminar: turnos libres, cola vacía, vigilante, servidor local y Chrome headless parados.

## (d) Decisiones del dueño (no bloquean)
- Longitud: 7.3 (~21 000 palabras) y 7.7 (~16 000) no se partieron ni recortaron.
- Decimales: m3, 6.1–6.5 y las chuletas escriben los decimales de la prosa con punto (como en el código); el resto, con
  coma. Coherente dentro de cada lección; unificarlo serían cientos de cifras.
- 0.1 queda por debajo de los mínimos de GUIA §6 a propósito (lección de presentación).
- 6.9: la cámara nueva de «Esferas infinitas» (en el cruce de dos pasillos) cambia la composición por defecto.
- Cifras no re-medidas en la sesión 5 (son de la sesión 4, con método documentado): 5.8, 5.10, la tabla de 2.8, la
  columna de JS de 7.4 (el texto ya dice «1,1–1,7 veces»).
