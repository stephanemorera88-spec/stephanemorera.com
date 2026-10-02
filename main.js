/* Stephane Morera, personal site.
   1. Backdrop: a WebGL studio wall with a slow moving light and live grain.
   2. Load: name rises, portrait appears.
   3. Receipts: ledger dots fill and tallies count when scrolled into view. */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Backdrop ---------- */
  var canvas = document.getElementById("backdrop");
  var gl = canvas && !reduced ? canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" }) : null;

  if (gl) {
    var vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    var fs = [
      "precision mediump float;",
      "uniform vec2 r;uniform float t;uniform vec2 m;",
      "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
      "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
      " return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
      "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}",
      "void main(){",
      " vec2 uv=gl_FragCoord.xy/r; vec2 q=uv; q.x*=r.x/r.y;",
      " float s=t*.035;",
      " float c=fbm(q*1.6+vec2(s*.7,-s*.4)+fbm(q*2.2-vec2(s*.5,s*.3))*.6);",
      " vec2 light=vec2(.72+.16*sin(t*.11)+(m.x-.5)*.18, .62+.12*cos(t*.09)+(m.y-.5)*.14);",
      " light.x*=r.x/r.y;",
      " float d=distance(q,light);",
      " float glow=smoothstep(1.35,0.,d);",
      " vec3 deep=vec3(.094,.086,.082);",
      " vec3 wall=vec3(.165,.153,.145);",
      " vec3 warm=vec3(.255,.235,.215);",
      " vec3 col=mix(deep,wall,c*1.1);",
      " col=mix(col,warm,glow*(.55+.45*c));",
      " float vig=smoothstep(1.5,.35,length((uv-.5)*vec2(1.15,1.)));",
      " col*=mix(.72,1.,vig);",
      " float g=(h(gl_FragCoord.xy+fract(t)*97.)-.5)*.035;",
      " col+=g;",
      " gl_FragColor=vec4(col,1.);",
      "}"
    ].join("\n");

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    }
    var v = compile(gl.VERTEX_SHADER, vs), f = compile(gl.FRAGMENT_SHADER, fs);
    if (v && f) {
      var prog = gl.createProgram();
      gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog); gl.useProgram(prog);
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      var uR = gl.getUniformLocation(prog, "r"), uT = gl.getUniformLocation(prog, "t"), uM = gl.getUniformLocation(prog, "m");

      var mouse = [0.5, 0.5], target = [0.5, 0.5];
      window.addEventListener("pointermove", function (e) {
        target[0] = e.clientX / window.innerWidth;
        target[1] = 1 - e.clientY / window.innerHeight;
      }, { passive: true });

      function resize() {
        var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        var w = Math.floor(window.innerWidth * dpr * 0.5), hgt = Math.floor(window.innerHeight * dpr * 0.5);
        if (canvas.width !== w || canvas.height !== hgt) { canvas.width = w; canvas.height = hgt; gl.viewport(0, 0, w, hgt); }
      }
      window.addEventListener("resize", resize, { passive: true });
      resize();

      var start = performance.now(), running = true;
      document.addEventListener("visibilitychange", function () { running = !document.hidden; if (running) requestAnimationFrame(frame); });
      function frame(now) {
        if (!running) return;
        mouse[0] += (target[0] - mouse[0]) * 0.03;
        mouse[1] += (target[1] - mouse[1]) * 0.03;
        gl.uniform2f(uR, canvas.width, canvas.height);
        gl.uniform1f(uT, (now - start) / 1000);
        gl.uniform2f(uM, mouse[0], mouse[1]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
  }

  /* ---------- 2. Load ---------- */
  function ready() { document.documentElement.classList.add("loaded"); }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(ready);
    setTimeout(ready, 1200);
  } else { ready(); }

  /* ---------- 3. Receipts ---------- */
  var rows = document.querySelectorAll(".row[data-named]");
  Array.prototype.forEach.call(rows, function (row) {
    var total = parseInt(row.getAttribute("data-total") || "10", 10);
    var box = row.querySelector(".dots");
    for (var i = 0; i < total; i++) box.appendChild(document.createElement("i"));
  });

  function fillRow(row) {
    var named = parseInt(row.getAttribute("data-named"), 10);
    var dots = row.querySelectorAll(".dots i");
    Array.prototype.forEach.call(dots, function (d, i) {
      var delay = reduced ? 0 : 60 * i;
      setTimeout(function () { d.classList.add(i < named ? "on" : "off"); }, delay);
    });
  }

  /* The count-up is painted over the number (data-n + CSS ::after). The number in the HTML
     never changes, so readers without JS and renderers that stop mid-animation read the real value. */
  function countUp(el) {
    var end = parseInt(el.getAttribute("data-count"), 10);
    if (reduced || end === 0) { el.removeAttribute("data-n"); return; }
    var t0 = performance.now(), dur = 1100, done = false;
    /* Timers still run where animation frames stall (headless renderers); end on the real number. */
    setTimeout(function () { done = true; el.removeAttribute("data-n"); }, dur + 150);
    (function tick(now) {
      if (done) return;
      var k = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.setAttribute("data-n", String(Math.round(end * e)));
      if (k < 1) requestAnimationFrame(tick); else el.removeAttribute("data-n");
    })(t0);
  }

  if ("IntersectionObserver" in window) {
    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting || seen.has(en.target)) return;
        seen.add(en.target);
        if (en.target.classList.contains("ledger-group")) {
          var rs = en.target.querySelectorAll(".row[data-named]");
          Array.prototype.forEach.call(rs, function (r, i) { setTimeout(function () { fillRow(r); }, reduced ? 0 : i * 140); });
        } else {
          Array.prototype.forEach.call(en.target.querySelectorAll("[data-count]"), countUp);
        }
        io.unobserve(en.target);
      });
    }, { threshold: 0.25 });
    Array.prototype.forEach.call(document.querySelectorAll(".ledger-group, .tally"), function (el) { io.observe(el); });
    /* Show 0 just before each tally scrolls into view, so the count-up starts clean. */
    if (!reduced) {
      var pre = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          if (!seen.has(en.target)) {
            Array.prototype.forEach.call(en.target.querySelectorAll("[data-count]"), function (el) { el.setAttribute("data-n", "0"); });
          }
          pre.unobserve(en.target);
        });
      }, { rootMargin: "0px 0px 300px 0px" });
      Array.prototype.forEach.call(document.querySelectorAll(".tally"), function (el) { pre.observe(el); });
    }
  } else {
    Array.prototype.forEach.call(rows, fillRow);
    Array.prototype.forEach.call(document.querySelectorAll("[data-count]"), countUp);
  }
})();
