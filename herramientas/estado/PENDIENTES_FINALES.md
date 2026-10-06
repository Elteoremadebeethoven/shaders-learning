# Pendientes para la pasada final del lead

## De informe m6a (sobre 6.6, escrita por m6b)
- 6.6 (~línea 420): «fract siempre en [0,1)» → en float32 puede dar 1.0 exacto (fract(-1e-9)); explicado en 6.5.
- 6.6 (~línea 702): dividir por la altura para no estirar se enseña en 6.2, no en 6.3.
- 6.6 (~línea 646): fwidth se enseña en 6.3; 6.2 solo adelanta dFdx y los quads.

## Generales
- Regenerar índices: node herramientas/indexar.mjs (tras todas las revisiones).
- Enlaces rotos entre módulos (verificar todo el curso).
- Revisar coherencia entre módulos (notación, contradicciones).
- A.1 bestiario y A.4 glosario (SendMessage al agente de anexos cuando todo esté escrito).
- Comentario de m4: rutas impresas "guardado: modulos/04-gpu/img/..." vs lo que imprimen los scripts (cosmético).

## De informe m6b
- iMouse (modo shadertoy de playground-glsl.js): implementar semántica real de Shadertoy (xy solo al arrastrar, |zw| = posición del clic, z>0 mientras pulsado, w>0 solo en el frame del clic, empieza en (0,0), píxeles enteros) Y actualizar el texto de 6.10 que documenta la diferencia (y el ejercicio 6.10.4).
- Añadir iChannelResolution (vec3[4]) e iDate (vec4) al modo shadertoy (y mencionarlo en 6.10).
- Verificar que 6.6 ya no dice «fract siempre en [0,1)» ni atribuye mal 6.2/6.3 (grep inicial: parece corregido).
