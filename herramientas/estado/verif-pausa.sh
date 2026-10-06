#!/bin/bash
# Verificación por tandas (cada tanda = una sesión de Chrome < 8 min, de una en una)
cd /Users/alex/Projects/shaders/herramientas
M=../modulos
for tanda in \
  "$M/06-glsl/01-lenguaje.html $M/06-glsl/02-pensar-en-paralelo.html $M/06-glsl/03-formas-sdf.html $M/06-glsl/04-color.html" \
  "$M/06-glsl/05-patrones.html $M/06-glsl/06-ruido.html $M/06-glsl/07-animacion-shaders.html" \
  "$M/06-glsl/08-texturas-efectos.html $M/06-glsl/09-raymarching.html $M/06-glsl/10-codigo-ajeno.html" \
  "$M/07-integracion/01-arquitectura.html $M/07-integracion/02-interaccion.html $M/07-integracion/03-transiciones-shader.html" \
  "$M/07-integracion/06-proyecto-final.html $M/07-integracion/07-siguientes-pasos.html $M/07-integracion/proyecto-final/index.html" \
  "$M/08-anexos/02-chuleta-glsl.html $M/08-anexos/03-chuleta-webgl.html $M/08-anexos/05-recursos.html"; do
  node verificar.mjs $tanda --soluciones 2>&1 | grep -v "^\[turno"
done
echo FIN
