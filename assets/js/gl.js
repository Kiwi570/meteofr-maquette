/* Petite base WebGL commune aux effets v2 : un triangle plein cadre, un shader de fragment, des uniformes.
   Renvoie null sans WebGL (ou avec ?sanswebgl) : chaque effet garde alors sa version sans WebGL. */
export function glPlein(canvas, frag, { echelle = 0.5 } = {}) {
  if (!canvas || /[?&]sanswebgl\b/.test(location.search)) return null;
  let gl = null;
  try { gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, depth: false, powerPreference: 'low-power' }); } catch { gl = null; }
  if (!gl) return null;
  const shader = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('[gl]', gl.getShaderInfoLog(s)); return null; }
    return s;
  };
  const v = shader(gl.VERTEX_SHADER, 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }');
  const f = shader(gl.FRAGMENT_SHADER, frag);
  if (!v || !f) return null;
  const prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const cache = {};
  const U = (n) => (n in cache ? cache[n] : (cache[n] = gl.getUniformLocation(prog, n)));
  const o = {
    gl,
    echelle,
    mesurer() {
      const r = canvas.getBoundingClientRect();
      const e = o.echelle * Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(2, Math.round(r.width * e)); canvas.height = Math.max(2, Math.round(r.height * e));
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    set(n, ...x) {
      const l = U(n); if (!l) return;
      if (x.length === 1) gl.uniform1f(l, x[0]); else if (x.length === 2) gl.uniform2f(l, x[0], x[1]);
      else if (x.length === 3) gl.uniform3f(l, x[0], x[1], x[2]); else gl.uniform4f(l, x[0], x[1], x[2], x[3]);
    },
    texture(n, img, unite = 0) {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unite); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((p) => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const l = U(n); if (l) gl.uniform1i(l, unite);
      return t;
    },
    dessiner() { o.set('r', canvas.width, canvas.height); gl.drawArrays(gl.TRIANGLES, 0, 3); },
  };
  o.mesurer();
  new ResizeObserver(() => o.mesurer()).observe(canvas);
  return o;
}

/* Image décodée prête pour une texture (même origine). */
export function imageDe(img) {
  return new Promise((ok) => {
    if (!img) return ok(null);
    const fin = () => ok(img.naturalWidth ? img : null);
    if (img.complete) fin(); else { img.addEventListener('load', fin, { once: true }); img.addEventListener('error', () => ok(null), { once: true }); }
  });
}
