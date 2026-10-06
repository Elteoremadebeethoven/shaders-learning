/* =====================================================================
   l77-wgsl.js — resaltado de WGSL para los bloques de código de la 7.7.
   curso.js no trae un modo para WGSL; aquí se define uno con el modo
   «clike» de CodeMirror (el mismo que usa el de GLSL) y se añade la
   etiqueta data-lang="wgsl" a la tabla de lenguajes. Debe cargarse
   después de curso.js (los bloques se convierten en DOMContentLoaded).
   ===================================================================== */
(function () {
  "use strict";
  if (!window.CodeMirror || !window.Curso || !Curso.modoCM) return;
  const w = (s) => { const o = {}; s.split(" ").forEach((x) => { o[x] = true; }); return o; };
  if (!CodeMirror.mimeModes["x-shader/wgsl"]) {
    CodeMirror.defineMIME("x-shader/wgsl", {
      name: "clike",
      keywords: w("fn let var const override struct return if else for while loop break continue continuing switch case default discard alias enable requires diagnostic uniform storage read write read_write function private workgroup"),
      types: w("f32 f16 i32 u32 bool vec2 vec3 vec4 vec2f vec3f vec4f vec2i vec3i vec4i vec2u vec3u vec4u vec2h vec3h vec4h mat2x2 mat3x3 mat4x4 mat2x2f mat3x3f mat4x4f mat3x4f mat4x3f array atomic ptr sampler sampler_comparison texture_1d texture_2d texture_2d_array texture_3d texture_cube texture_depth_2d texture_multisampled_2d texture_storage_2d texture_external"),
      blockKeywords: w("for while loop if else struct switch fn"),
      builtin: w("abs acos all any asin atan atan2 ceil clamp cos cross degrees determinant distance dot dpdx dpdy exp exp2 floor fma fract fwidth inverseSqrt length log log2 max min mix modf normalize pow radians reflect refract round saturate select sign sin smoothstep sqrt step tan transpose trunc textureSample textureSampleLevel textureSampleBias textureSampleGrad textureSampleCompare textureLoad textureStore textureDimensions arrayLength workgroupBarrier storageBarrier bitcast pack4x8unorm unpack4x8unorm"),
      atoms: w("true false"),
      indentSwitch: false,
      hooks: { "@": (stream) => { stream.eatWhile(/[\w]/); return "meta"; } },
      modeProps: { fold: ["brace"] },
    });
  }
  const original = Curso.modoCM;
  Curso.modoCM = (lang) => ((lang || "").toLowerCase() === "wgsl" ? "x-shader/wgsl" : original(lang));
})();
