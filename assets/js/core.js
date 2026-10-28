/* =========================================================================
   MOSS // THE WANDERING EARTH III — CONCEPT REEL 120s
   core.js — 基础设施：数学工具 / 渲染器 / 程序化材质 / 后期管线
             / 投影标签 / HUD 绑定 / 程序化音频与 MOSS 语音
   -------------------------------------------------------------------------
   依赖：three.min.js（全局 THREE）、index.html 中的 DOM 节点。
   暴露：COL / FX / Labels / HUD / AUDIO / CAM（CAM 定义在 main.js）
   ========================================================================= */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, v) => clamp((v - a) / (b - a), 0, 1);
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeIn = t => Math.pow(clamp(t, 0, 1), 3);
const easeIO = t => { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOutExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t, 0, 1));
const rand = (a = 1, b = 0) => b + Math.random() * (a - b);
const randi = (a, b) => Math.floor(rand(a, b));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

const COL = {
  g: 0x3dffb5, gd: 0x0e6b4f, o: 0xff7a1e, b: 0x3fd0ff, r: 0xff3348,
  w: 0xdff2ee, steel: 0x8c9ba3, dark: 0x0a1216
};

/* ---------------- renderer ---------------- */
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance', stencil: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
renderer.localClippingEnabled = true;
renderer.outputEncoding = THREE.sRGBEncoding;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 8000);
camera.position.set(0, 6, 30);

/* procedural env map (studio strips) so metal reads as metal */
(function envMap(){
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0,0,0,512);
  grd.addColorStop(0,'#0a1b22'); grd.addColorStop(.42,'#16333d');
  grd.addColorStop(.52,'#2a4f5c'); grd.addColorStop(.62,'#0d2029'); grd.addColorStop(1,'#03080b');
  g.fillStyle = grd; g.fillRect(0,0,1024,512);
  // soft light boxes
  const box = (x,y,w,h,col,blur)=>{
    const rg = g.createRadialGradient(x,y,0,x,y,Math.max(w,h));
    rg.addColorStop(0, col); rg.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle = rg; g.save(); g.translate(x,y); g.scale(1,h/w); g.beginPath(); g.arc(0,0,w,0,TAU); g.fill(); g.restore();
  };
  box(210, 120, 200, 60, 'rgba(150,225,255,.55)');
  box(700, 150, 150, 30, 'rgba(255,150,80,.35)');
  box(500, 300, 260, 40, 'rgba(90,255,205,.22)');
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.encoding = THREE.sRGBEncoding;
  scene.environment = tex;
})();

/* lights (global, subtle) */
scene.add(new THREE.AmbientLight(0x14343c, 1.1));
const hemi = new THREE.HemisphereLight(0x2b5f78, 0x02060a, 0.35); scene.add(hemi);
const key = new THREE.DirectionalLight(0xa9ddff, 0.85); key.position.set(-14, 18, 12); scene.add(key);
const rim = new THREE.DirectionalLight(0xff5a10, 0.55); rim.position.set(-4, 3, -22); scene.add(rim);
const fill = new THREE.DirectionalLight(0x2fa8ff, 0.25); fill.position.set(14, 5, -4); scene.add(fill);
const warm = new THREE.DirectionalLight(0xffcf9a, 0.55); warm.position.set(16, 9, 18); scene.add(warm);

/* ---------------- material helpers ---------------- */
function lineMat(color, opacity = 1, additive = true) {
  return new THREE.LineBasicMaterial({
    color, transparent: true, opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false
  });
}
function solidMat(color = COL.steel, o = {}) {
  return new THREE.MeshStandardMaterial(Object.assign({
    color, metalness: .82, roughness: .42, emissive: 0x061014, emissiveIntensity: 1
  }, o));
}
function edgesOf(geo, color, opacity = .9, threshold = 24) {
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, threshold), lineMat(color, opacity));
  return e;
}
function wireOf(geo, color, opacity = .5) {
  return new THREE.LineSegments(new THREE.WireframeGeometry(geo), lineMat(color, opacity));
}
function glowSprite(color, size, opacity = 1) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  const cc = new THREE.Color(color);
  const rgb = `${(cc.r * 255) | 0},${(cc.g * 255) | 0},${(cc.b * 255) | 0}`;
  grd.addColorStop(0, `rgba(255,255,255,${opacity})`);
  grd.addColorStop(.18, `rgba(${rgb},${opacity * .9})`);
  grd.addColorStop(.45, `rgba(${rgb},${opacity * .22})`);
  grd.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
  s.scale.set(size, size, 1);
  return s;
}
/* text texture (code-drawn labels inside 3D) */
function textPlane(text, color = '#8affd6', size = 64, w = 512, h = 128) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.clearRect(0, 0, w, h);
  g.fillStyle = color; g.font = `${size}px "SF Mono",monospace`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = color; g.shadowBlur = 18;
  g.fillText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(1, h / w), m);
}
/* measurement bracket between two points */
function measureLine(a, b, color = COL.g, opacity = .7, ticks = true) {
  const g = new THREE.Group();
  const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
  g.add(new THREE.Line(geo, lineMat(color, opacity)));
  if (ticks) {
    const dir = new THREE.Vector3().subVectors(b, a).normalize();
    const up = Math.abs(dir.y) > .9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const cross = new THREE.Vector3().crossVectors(dir, up).normalize().multiplyScalar(.35);
    [a, b].forEach(p => {
      const gg = new THREE.BufferGeometry().setFromPoints([p.clone().sub(cross), p.clone().add(cross)]);
      g.add(new THREE.Line(gg, lineMat(color, opacity)));
    });
  }
  return g;
}
/* dashed animated circle */
function dashRing(r, color = COL.g, opacity = .6, seg = 96) {
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const a = i / seg * TAU;
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(geo, lineMat(color, opacity));
}
function gridFloor(size = 200, div = 40, color = COL.b, opacity = .12) {
  const g = new THREE.GridHelper(size, div, color, color);
  g.material.transparent = true; g.material.opacity = opacity;
  g.material.blending = THREE.AdditiveBlending; g.material.depthWrite = false;
  return g;
}
function dust(count = 600, r = 40, color = 0x6fffd0, size = .09) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const rr = Math.pow(Math.random(), .6) * r;
    const th = Math.random() * TAU, ph = Math.acos(rand(1, -1));
    pos[i * 3] = rr * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = rr * Math.cos(ph) * .7;
    pos[i * 3 + 2] = rr * Math.sin(ph) * Math.sin(th);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
  return new THREE.Points(geo, mat);
}

/* ---------------- post processing ---------------- */
const FX = (() => {
  let rtS, rtA, rtB, rtC, rtD;
  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const qcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const qscene = new THREE.Scene();
  const qmesh = new THREE.Mesh(quadGeo, null); qscene.add(qmesh);

  const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy,0.0,1.0); }`;

  const bright = new THREE.ShaderMaterial({
    uniforms: { tD: { value: null }, uT: { value: 0.80 } },
    vertexShader: VS,
    fragmentShader: `varying vec2 vUv; uniform sampler2D tD; uniform float uT;
      void main(){ vec3 c = texture2D(tD,vUv).rgb; float l = max(max(c.r,c.g),c.b);
        float w = smoothstep(uT, uT+0.30, l); gl_FragColor = vec4(c*w,1.0); }`
  });
  const blur = new THREE.ShaderMaterial({
    uniforms: { tD: { value: null }, uDir: { value: new THREE.Vector2() } },
    vertexShader: VS,
    fragmentShader: `varying vec2 vUv; uniform sampler2D tD; uniform vec2 uDir;
      void main(){
        vec3 s = texture2D(tD,vUv).rgb*0.227027;
        s += texture2D(tD,vUv+uDir*1.3846).rgb*0.316216;
        s += texture2D(tD,vUv-uDir*1.3846).rgb*0.316216;
        s += texture2D(tD,vUv+uDir*3.2308).rgb*0.070270;
        s += texture2D(tD,vUv-uDir*3.2308).rgb*0.070270;
        gl_FragColor = vec4(s,1.0); }`
  });
  const comp = new THREE.ShaderMaterial({
    uniforms: {
      tS: { value: null }, tB: { value: null }, tB2: { value: null },
      uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) },
      uBloom: { value: .85 }, uExp: { value: 1.0 }, uGlitch: { value: 0 }, uFade: { value: 1 }
    },
    vertexShader: VS,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D tS, tB, tB2; uniform float uTime, uBloom, uExp, uGlitch, uFade;
      uniform vec2 uRes;
      vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
      void main(){
        vec2 uv = vUv;
        vec2 d = uv - 0.5;
        float r2 = dot(d,d);
        // barrel-ish chromatic aberration, stronger at edges
        float ca = 0.0016 + r2*0.006;
        vec3 c;
        c.r = texture2D(tS, uv + d*ca).r;
        c.g = texture2D(tS, uv).g;
        c.b = texture2D(tS, uv - d*ca).b;
        // glitch : horizontal slice offset
        if(uGlitch > 0.001){
          float band = step(0.55, fract(uv.y*26.0 + uTime*7.0));
          float off = (fract(sin(uv.y*91.7 + uTime*23.0)*43758.5)-0.5) * 0.05 * uGlitch * band;
          vec3 gs = vec3(texture2D(tS, clamp(uv+vec2(off,0.0), 0.0, 1.0)).g);
          c = mix(c, gs, clamp(uGlitch,0.0,1.0) * band * 0.9);
        }
        vec3 bloom = texture2D(tB, uv).rgb*0.75 + texture2D(tB2, uv).rgb*0.6;
        c += bloom * uBloom * 0.85;
        c *= uExp;
        c = aces(c);
        // cool industrial grade : teal shadows, warm highlights
        vec3 sh = vec3(0.94,0.99,1.02), hi = vec3(1.04,1.00,0.95);
        c *= mix(sh, hi, smoothstep(0.10,0.90,max(max(c.r,c.g),c.b)));
        // grain
        float g = fract(sin(dot(uv*uRes + uTime*13.7, vec2(12.9898,78.233)))*43758.5453);
        c += (g-0.5)*0.045;
        // scanlines
        c *= 1.0 - 0.055*sin(uv.y*uRes.y*3.14159);
        // vignette
        c *= smoothstep(0.95, 0.28, length(d)*1.22);
        // edge darkening + faint green frame glow
        c += vec3(0.02,0.12,0.09) * smoothstep(0.55,0.0,r2) * 0.25;
        gl_FragColor = vec4(max(c,0.0)*uFade, 1.0);
      }`
  });

  function size(w, h) {
    const dpr = renderer.getPixelRatio();
    const W = Math.max(2, Math.floor(w * dpr)), H = Math.max(2, Math.floor(h * dpr));
    const hw = Math.max(2, Math.floor(W / 2)), hh = Math.max(2, Math.floor(H / 2));
    const qw = Math.max(2, Math.floor(W / 4)), qh = Math.max(2, Math.floor(H / 4));
    if (!rtS) {
      const o = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, stencilBuffer: false };
      rtS = new THREE.WebGLRenderTarget(W, H, o);
      rtA = new THREE.WebGLRenderTarget(hw, hh, o);
      rtB = new THREE.WebGLRenderTarget(hw, hh, o);
      rtC = new THREE.WebGLRenderTarget(qw, qh, o);
      rtD = new THREE.WebGLRenderTarget(qw, qh, o);
    } else {
      rtS.setSize(W, H); rtA.setSize(hw, hh); rtB.setSize(hw, hh); rtC.setSize(qw, qh); rtD.setSize(qw, qh);
    }
    comp.uniforms.uRes.value.set(W, H);
  }
  function pass(mat, target) {
    qmesh.material = mat;
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(qscene, qcam);
  }
  function render(time, opt = {}) {
    renderer.setRenderTarget(rtS); renderer.clear(); renderer.render(scene, camera);
    bright.uniforms.tD.value = rtS.texture; pass(bright, rtA);
    blur.uniforms.tD.value = rtA.texture; blur.uniforms.uDir.value.set(1.1 / rtA.width, 0); pass(blur, rtB);
    blur.uniforms.tD.value = rtB.texture; blur.uniforms.uDir.value.set(0, 1.1 / rtA.height); pass(blur, rtA);
    // wide pass (separate targets: never read & write the same target)
    bright.uniforms.tD.value = rtA.texture; pass(bright, rtC);
    blur.uniforms.tD.value = rtC.texture; blur.uniforms.uDir.value.set(2.4 / rtC.width, 0); pass(blur, rtD);
    blur.uniforms.tD.value = rtD.texture; blur.uniforms.uDir.value.set(0, 2.4 / rtC.height); pass(blur, rtC);
    comp.uniforms.tS.value = rtS.texture;
    comp.uniforms.tB.value = rtA.texture;
    comp.uniforms.tB2.value = rtC.texture;
    comp.uniforms.uTime.value = time;
    comp.uniforms.uGlitch.value = opt.glitch || 0;
    comp.uniforms.uBloom.value = opt.bloom === undefined ? 1 : opt.bloom;
    comp.uniforms.uFade.value = opt.fade === undefined ? 1 : opt.fade;
    pass(comp, null);
  }
  return { size, render, comp };
})();

/* ---------------- labels ---------------- */
class Labels {
  constructor(el) { this.el = el; this.items = []; }
  reset() { this.el.innerHTML = ''; this.items.length = 0; }
  add(o) {
    const d = document.createElement('div');
    d.className = 'lab ' + (o.cls || '');
    d.innerHTML = `<span class="lab-k">${o.k || ''}</span><span class="lab-v">${o.v || ''}</span><span class="lab-bar"></span>`;
    this.el.appendChild(d);
    this.items.push(Object.assign({ el: d, k: '', v: '', t0: 0, t1: 99, _op: -1 }, o, { el: d }));
  }
  update(tl) {
    const w = window.innerWidth, h = window.innerHeight;
    const v = new THREE.Vector3();
    for (const it of this.items) {
      const p = typeof it.p === 'function' ? it.p(tl) : it.p;
      if (!p) { it.el.style.opacity = 0; continue; }
      v.copy(p).project(camera);
      const on = v.z < 1 && v.z > -1;
      const a = smooth(inv(it.t0, it.t0 + .7, tl)) * (1 - smooth(inv(it.t1 - .6, it.t1, tl)));
      const op = on ? a : 0;
      const x = (v.x * .5 + .5) * w, y = (-v.y * .5 + .5) * h;
      it.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(6px,-50%)`;
      if (Math.abs(op - it._op) > .02) { it.el.style.opacity = op.toFixed(3); it._op = op; }
    }
  }
}

/* ---------------- HUD ---------------- */
const HUD = {
  el: document.getElementById('hud'),
  title: document.getElementById('sceneTitle'),
  stK: document.getElementById('stKicker'),
  stT: document.getElementById('stTitle'),
  stD: document.getElementById('stDesc'),
  sub: document.getElementById('subtitle'),
  subT: document.getElementById('subText'),
  tel: document.getElementById('telemetry'),
  shotNo: document.getElementById('shotNo'),
  shotCode: document.getElementById('shotCode'),
  bar: document.getElementById('bar'),
  clk: document.getElementById('clkNow'),
  chapter: document.getElementById('chapter'),
  show(v) { this.el.classList.toggle('on', v); },
  setShot(i, shot) {
    this.shotNo.textContent = String(i + 1).padStart(2, '0');
    this.shotCode.textContent = shot.code;
  },
  setTitle(kicker, title, desc) {
    this.title.classList.remove('on');
    setTimeout(() => {
      this.stK.textContent = kicker; this.stT.textContent = title; this.stD.textContent = desc;
      this.title.classList.add('on');
    }, 220);
  },
  setTelemetry(rows) {
    this.tel.innerHTML = rows.map((r, i) =>
      `<div class="trow" style="animation-delay:${i * 70}ms"><span class="tk">${r[0]}</span><span class="tv ${r[2] || ''}">${r[1]}</span></div>`
    ).join('');
  },
  say(text, cls = '') {
    if (!text) { this.sub.classList.remove('on'); return; }
    this.subT.textContent = text;
    this.sub.classList.add('on');
  },
  flash(text) {
    const c = this.chapter;
    c.textContent = text;
    c.style.transition = 'none'; c.style.opacity = 1; c.style.letterSpacing = '.3em';
    requestAnimationFrame(() => {
      c.style.transition = 'opacity 1.4s ease, letter-spacing 2.2s ease';
      c.style.opacity = 0; c.style.letterSpacing = '1.1em';
    });
  }
};

/* ---------------- AUDIO : procedural industrial score + MOSS voice ---------------- */
const AUDIO = {
  ctx: null, master: null, music: null, sfx: null, started: false, muted: false,
  duckVal: 1, beat: 1.25, nextBeat: 0, nextBar: 0, bar: 0, timer: null,
  padGain: null, padOsc: [], voices: [], zhVoice: null, speechOK: false,
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    const ctx = this.ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 22; comp.ratio.value = 6;
    comp.attack.value = .005; comp.release.value = .3;
    this.master = ctx.createGain(); this.master.gain.value = 0.0001;
    // gentle space: feedback delay network
    const dl = ctx.createDelay(1.2); dl.delayTime.value = .42;
    const fb = ctx.createGain(); fb.gain.value = .34;
    const dlf = ctx.createBiquadFilter(); dlf.type = 'lowpass'; dlf.frequency.value = 1800;
    const wet = ctx.createGain(); wet.gain.value = .22;
    this.master.connect(comp);
    this.master.connect(dl); dl.connect(dlf); dlf.connect(fb); fb.connect(dl); dlf.connect(wet); wet.connect(comp);
    comp.connect(ctx.destination);

    this.music = ctx.createGain(); this.music.gain.value = .55; this.music.connect(this.master);
    this.sfx = ctx.createGain(); this.sfx.gain.value = .5; this.sfx.connect(this.master);

    /* --- drone bed --- */
    const dg = ctx.createGain(); dg.gain.value = .38; dg.connect(this.music);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 340; lp.Q.value = 3.2;
    lp.connect(dg);
    [27.5, 55, 55.4, 82.4, 110].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = i % 2 ? 'sawtooth' : 'sine';
      o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = i === 0 ? .55 : .18 / (i * .6 + 1);
      o.connect(g); g.connect(lp); o.start();
    });
    const lfo = ctx.createOscillator(); lfo.frequency.value = .055;
    const lg = ctx.createGain(); lg.gain.value = 120;
    lfo.connect(lg); lg.connect(lp.frequency); lfo.start();

    /* --- pad : 4 detuned saws, chord changes --- */
    this.padGain = ctx.createGain(); this.padGain.gain.value = .055;
    const plp = ctx.createBiquadFilter(); plp.type = 'lowpass'; plp.frequency.value = 620; plp.Q.value = 1.2;
    this.padGain.connect(plp); plp.connect(this.music);
    for (let i = 0; i < 4; i++) {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.value = 110 * Math.pow(2, i / 4);
      o.detune.value = [-7, 5, -3, 9][i];
      const g = ctx.createGain(); g.gain.value = .5;
      o.connect(g); g.connect(this.padGain); o.start();
      this.padOsc.push(o);
    }
    this.setChord([110, 130.8, 164.8, 220]);

    this.nextBeat = ctx.currentTime + .25;
    this.nextBar = this.nextBeat;
    this.timer = setInterval(() => this.schedule(), 110);
    this.setupSpeech();
  },
  setChord(freqs) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 1.4;
    this.padOsc.forEach((o, i) => {
      if (freqs[i]) o.frequency.setTargetAtTime(freqs[i], t, .9);
    });
  },
  schedule() {
    const ctx = this.ctx; if (!ctx) return;
    while (this.nextBeat < ctx.currentTime + .35) {
      this.pulse(this.nextBeat, this.bar % 4 === 0);
      this.bar++;
      this.nextBeat += this.beat;
    }
  },
  pulse(t, accent) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sine';
    const g = ctx.createGain();
    o.frequency.setValueAtTime(accent ? 62 : 74, t);
    o.frequency.exponentialRampToValueAtTime(34, t + .42);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(accent ? .85 : .42, t + .012);
    g.gain.exponentialRampToValueAtTime(.0001, t + (accent ? 1.05 : .62));
    o.connect(g); g.connect(this.music);
    o.start(t); o.stop(t + 1.15);
    if (accent) this.metal(t, 1);
    if (this.bar % 8 === 3) this.metal(t + .02, .55);
  },
  metal(t, amp = 1) {
    const ctx = this.ctx;
    const len = .9;
    const buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const x = i / d.length;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - x, 9) * (0.6 + .4 * Math.sin(i * .03));
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 190 + Math.random() * 260; bp.Q.value = 2.4;
    const g = ctx.createGain(); g.gain.value = .5 * amp;
    src.connect(bp); bp.connect(g); g.connect(this.music);
    src.start(t);
    // metallic FM ping
    const c = ctx.createOscillator(); c.type = 'sine'; c.frequency.value = 720 + Math.random() * 400;
    const m = ctx.createOscillator(); m.type = 'sine'; m.frequency.value = 1.7 * 720;
    const mg = ctx.createGain(); mg.gain.value = 220;
    m.connect(mg); mg.connect(c.frequency);
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(.001, t);
    cg.gain.linearRampToValueAtTime(.10 * amp, t + .008);
    cg.gain.exponentialRampToValueAtTime(.0001, t + 1.1);
    c.connect(cg); cg.connect(this.music);
    c.start(t); m.start(t); c.stop(t + 1.2); m.stop(t + 1.2);
  },
  riser(dur = 1.8, amp = .32) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const len = dur;
    const buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(180, t);
    bp.frequency.exponentialRampToValueAtTime(5200, t + len);
    const g = ctx.createGain();
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(amp, t + len * .92);
    g.gain.exponentialRampToValueAtTime(.0001, t + len);
    src.connect(bp); bp.connect(g); g.connect(this.sfx);
    src.start(t);
    // sub swell
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(30, t); o.frequency.exponentialRampToValueAtTime(70, t + len);
    const og = ctx.createGain();
    og.gain.setValueAtTime(.0001, t); og.gain.exponentialRampToValueAtTime(.35, t + len * .9);
    og.gain.exponentialRampToValueAtTime(.0001, t + len + .1);
    o.connect(og); og.connect(this.sfx); o.start(t); o.stop(t + len + .2);
  },
  beep(freq = 1400, amp = .12, dur = .05) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + .004);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + dur + .02);
  },
  alarm() {
    if (!this.ctx) return;
    [0, .22, .44].forEach((d, i) => setTimeout(() => this.beep(i === 2 ? 900 : 1250, .1, .12), d * 1000));
  },
  glitch() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * .28, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const step = Math.floor(i / 260);
      d[i] = (Math.random() * 2 - 1) * (step % 2 ? .8 : .18) * (1 - i / d.length);
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = .25;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 900;
    src.connect(f); f.connect(g); g.connect(this.sfx); src.start(t);
  },
  /* MOSS voice */
  setupSpeech() {
    if (!('speechSynthesis' in window)) return;
    const load = () => {
      const vs = speechSynthesis.getVoices() || [];
      this.zhVoice = vs.find(v => /zh[-_]CN/i.test(v.lang) && /(Yun|Xiao|Kangkang|Huihui|Yaoyao|Ting)/i.test(v.name))
        || vs.find(v => /zh[-_]CN/i.test(v.lang)) || vs.find(v => /^zh/i.test(v.lang)) || null;
      this.speechOK = !!this.zhVoice;
    };
    load();
    speechSynthesis.onvoiceschanged = load;
    setTimeout(load, 800);
  },
  speak(text) {
    if (!this.ctx) return;
    this.duck(true);
    if (!('speechSynthesis' in window)) { setTimeout(() => this.duck(false), 1600); return; }
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.pitch = 0.15; u.rate = 0.88; u.volume = 1;
      if (this.zhVoice) u.voice = this.zhVoice;
      u.onend = () => this.duck(false);
      u.onerror = () => this.duck(false);
      speechSynthesis.speak(u);
      // safety release
      setTimeout(() => this.duck(false), 1200 + text.length * 260);
      if (!this.speechOK) this.transmission();
    } catch (e) { this.duck(false); }
  },
  /* synthetic comms burst used when no TTS voice exists */
  transmission() {
    if (!this.ctx) return;
    const ctx = this.ctx, t0 = ctx.currentTime;
    for (let i = 0; i < 7; i++) {
      const t = t0 + i * .07 + Math.random() * .02;
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(160 + Math.random() * 90, t);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .01);
      g.gain.exponentialRampToValueAtTime(.0001, t + .06);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 4;
      o.connect(bp); bp.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + .08);
    }
  },
  duck(on) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.music.gain.setTargetAtTime(on ? .22 : .55, t, .25);
  },
  setMuted(m) {
    this.muted = m;
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(m ? 0.0001 : .85, this.ctx.currentTime, .2);
  },
  start() {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.master.gain.setTargetAtTime(this.muted ? .0001 : .85, this.ctx.currentTime, 1.6);
    this.started = true;
  }
};
