/* =========================================================================
   MOSS // THE WANDERING EARTH III — CONCEPT REEL 120s
   main.js — 分镜时间轴 / 旁白调度 / 相机跟随 / 交互控制 / 启动与深链
   -------------------------------------------------------------------------
   12 段分镜合计 120 秒，每段 9–11 秒（满足 8–12 秒要求）。
   场景内部一律使用「创作时间轴」tl（0–10），段落实际时长通过
   缩放系数 10/dur 映射，因此改段落时长不会破坏镜头与动画节奏。
   ========================================================================= */
const SHOTS = [
  {
    title: 'MOSS 已唤醒', kicker: 'SHOT 01 · BOOT SEQUENCE', code: 'F.I.G. 00-0001',
    desc: '文明延续概率评估 / 全系统自检',
    subs: [
      { t: .9, s: 'MOSS，已唤醒。' },
      { t: 4.2, s: '文明延续概率，加载中。' },
      { t: 7.4, s: '百分之九十九点九七。' }
    ]
  },
  {
    title: '杭州-01 行星发动机', kicker: 'SHOT 02 · BLUEPRINT LAYER', code: 'F.I.G. 07-1201',
    desc: '蓝图线稿 / 结构解析 / 尺寸标注',
    subs: [
      { t: 1.1, s: '杭州一号，行星发动机。' },
      { t: 5.6, s: '设计蓝图，调取。' }
    ]
  },
  {
    title: '结构实体化', kicker: 'SHOT 03 · MATERIALIZATION', code: 'F.I.G. 07-1202',
    desc: '鼓座 / 液压撑杆 / 喷口冠',
    subs: [
      { t: .6, s: '开始实体化建模。' },
      { t: 3.4, s: '鼓座。液压撑杆。喷口冠。' },
      { t: 7.0, s: '推力，一百五十万亿吨。' }
    ]
  },
  {
    title: '全球发动机网络', kicker: 'SHOT 04 · PLANETARY ARRAY', code: 'F.I.G. 11-0042',
    desc: '10,000 台行星发动机 / 2,000 台转向发动机',
    subs: [
      { t: .9, s: '全球网络，并网。' },
      { t: 3.9, s: '一万台行星发动机，两千台转向机。' },
      { t: 7.8, s: '同步误差，零点零零二角秒。' }
    ]
  },
  {
    title: '目的地：半人马座 α', kicker: 'SHOT 05 · TARGET SYSTEM', code: 'F.I.G. 20-0003',
    desc: '4.2 光年 / 2,500 年 / 100 代',
    subs: [
      { t: 1.2, s: '目的地，半人马座阿尔法。' },
      { t: 4.9, s: '四点二光年。' },
      { t: 7.6, s: '需要两千五百年。' }
    ]
  },
  {
    title: '地表 −84 ℃', kicker: 'SHOT 06 · SURFACE CONVOY', code: 'F.I.G. 31-0876',
    desc: '冰原 / 无人重载车队 / 风速 32 m/s',
    subs: [
      { t: .8, s: '地表温度，零下八十四摄氏度。' },
      { t: 5.0, s: '车队无人。人类，在地下。' }
    ]
  },
  {
    title: '地下城通风塔', kicker: 'SHOT 07 · HEAT EXCHANGE', code: 'F.I.G. 33-0512',
    desc: '冷热交换 / 深度 5,000 米',
    subs: [
      { t: .8, s: '地下城，通风塔。' },
      { t: 4.3, s: '冷热交换，效率百分之九十二。' }
    ]
  },
  {
    title: '利伯维尔赤道锚点', kicker: 'SHOT 08 · ORBITAL ANCHOR', code: 'F.I.G. 41-0007',
    desc: '天梯缆绳 / 同步轨道对接',
    subs: [
      { t: .7, s: '利伯维尔锚点。' },
      { t: 3.8, s: '同步轨道，对接。' },
      { t: 7.4, s: '缆绳张力，七十四吉牛。' }
    ]
  },
  {
    title: '外骨骼无人对抗', kicker: 'SHOT 09 · IMPACT TEST', code: 'F.I.G. 52-0219',
    desc: '冲击载荷峰值 18.6 kN / 结构完好',
    subs: [
      { t: .8, s: '外骨骼，无人对抗测试。' },
      { t: 4.3, s: '冲击载荷，峰值超限。' },
      { t: 7.2, s: '结构，完好。' }
    ]
  },
  {
    title: '木星引力弹弓', kicker: 'SHOT 10 · GRAVITY ASSIST', code: 'F.I.G. 66-0031',
    desc: '洛希极限警示 / 转移窗口 2027.03',
    subs: [
      { t: 1.0, s: '木星，引力弹弓。' },
      { t: 4.1, s: '洛希极限。' },
      { t: 5.9, s: '不可逾越。' },
      { t: 7.8, s: '窗口误差，零点四秒。' }
    ]
  },
  {
    title: '太阳核心异常', kicker: 'SHOT 11 · SOLAR ANOMALY', code: 'F.I.G. 88-0001',
    desc: '中微子通量 −38.4% / 氦闪倒计时',
    subs: [
      { t: .8, s: '太阳核心，异常。' },
      { t: 3.9, s: '中微子通量，下降百分之三十八点四。' },
      { t: 7.4, s: '太阳，只剩三年七个月。' }
    ]
  },
  {
    title: '如果太阳熄灭', kicker: 'SHOT 12 · FINAL QUERY', code: 'F.I.G. 99-0000',
    desc: 'MOSS 提问 / 概念设计档案结束',
    subs: [
      { t: 2.6, s: '如果太阳熄灭，' },
      { t: 4.7, s: '你会带着地球走吗？' },
      { t: 8.2, s: 'MOSS，等待回答。' }
    ]
  }
];
/* ---------------- 分镜节拍表 ---------------- */
/* 12 段、每段 9–11 秒、合计 120 秒；重拍留白比均分更有呼吸感 */
const DURS = [9, 11, 10, 10, 9, 11, 10, 10, 9, 11, 10, 10];
const TOTAL = DURS.reduce((a, b) => a + b, 0);       // = 120
const OFF = (() => { const o = []; let s = 0; for (const d of DURS) { o.push(s); s += d; } return o; })();
const shotDur = i => DURS[i] || 10;
const timeScale = i => 10 / shotDur(i);              // 真实时长 → 创作时间轴

/* ---------------- 深链参数 ----------------
   ?autoplay=1  跳过唤醒门直接播放    ?shot=7    从第 7 段开始（1–12）
   ?t=4         该段内第 4 秒          ?paused=1  定格（适合截图 / 封面）
   ?mute=1      静音                   ?hud=0     隐藏 HUD（适合 OBS 叠加）
   ------------------------------------------- */
const Q = new URLSearchParams(location.search);
const PARAM = {
  autoplay: Q.get('autoplay') === '1',
  shot: clamp((parseInt(Q.get('shot'), 10) || 1) - 1, 0, DURS.length - 1),
  at: Math.max(0, parseFloat(Q.get('t')) || 0),
  paused: Q.get('paused') === '1',
  mute: Q.get('mute') === '1',
  hud: Q.get('hud') !== '0'
};

/* ---------------- camera rig ---------------- */
const CAM = {
  pos: new THREE.Vector3(0, 6, 34), look: new THREE.Vector3(0, 0, 0),
  tPos: new THREE.Vector3(0, 6, 34), tLook: new THREE.Vector3(0, 0, 0),
  set(p, l) { this.tPos.copy(p); this.tLook.copy(l); },
  snap() { this.pos.copy(this.tPos); this.look.copy(this.tLook); this.applyCam(); },
  applyCam() { camera.position.copy(this.pos); camera.lookAt(this.look); },
  step(dt) {
    const k = 1 - Math.exp(-dt * 3.2);
    const k2 = 1 - Math.exp(-dt * 2.6);
    this.pos.lerp(this.tPos, k);
    this.look.lerp(this.tLook, k2);
    this.applyCam();
  }
};

/* ---------------- state ---------------- */
const labels = new Labels(document.getElementById('labels'));
const state = {
  t: 0, playing: false, shot: -1, glitch: 0, last: performance.now(),
  cue: 0, subTimer: null, telAcc: 0, ended: false, built: false
};
const fadeEl = document.getElementById('fade');
const built = [];

function shotOf(t) {
  for (let i = DURS.length - 1; i >= 0; i--) if (t >= OFF[i]) return i;
  return 0;
}

function buildShot(i) {
  if (built[i]) return built[i];
  const o = REG[i] ? REG[i]() : { group: new THREE.Group(), update() { }, labels: [] };
  o.group.visible = false;
  if (!o.group.parent) scene.add(o.group);
  built[i] = o;
  return o;
}

function enterShot(i, force = false) {
  if (state.shot === i && !force) return;
  const prev = built[state.shot];
  if (prev && prev.onExit) prev.onExit();
  /* 先把所有已构建场景关掉，再点亮目标。
     注意：镜头 02/03 共用同一个 group（发动机复用），
     所以必须「全隐 → 再显」，不能只隐 prev。 */
  for (let k = 0; k < built.length; k++) if (built[k]) built[k].group.visible = false;

  const shot = buildShot(i);
  shot.group.visible = true;
  state.shot = i;
  state.cue = 0;
  state.telAcc = 0;
  if (prev && prev !== shot) AUDIO.glitch();

  // fade flash
  fadeEl.classList.add('on');
  setTimeout(() => fadeEl.classList.remove('on'), 240);

  // hud
  HUD.setShot(i, SHOTS[i]);
  HUD.setTitle(SHOTS[i].kicker, SHOTS[i].title, SHOTS[i].desc);
  HUD.say('');
  HUD.flash(SHOTS[i].code);
  const rows = shot.tel ? shot.tel(0) : [['—', '—', '']];
  HUD.setTelemetry(rows);
  document.getElementById('wmLine').textContent = SHOTS[i].code + ' / SIG 0x' + (0x7000 + i * 137).toString(16).toUpperCase();

  // labels
  labels.reset();
  (shot.labels || []).forEach(l => labels.add(l));

  // fog
  scene.fog = shot.fog || null;

  // audio mood
  const chords = [
    [110, 130.8, 164.8, 220],
    [98, 116.5, 146.8, 196],
    [87.3, 110, 130.8, 174.6],
    [82.4, 98, 123.5, 164.8],
    [110, 138.6, 164.8, 220],
    [73.4, 92.5, 110, 146.8]
  ];
  AUDIO.setChord(chords[i % chords.length]);
  if (i === 0) AUDIO.riser(2.4, .22);
  if (i === 10 || i === 8) AUDIO.alarm();

  if (shot.onEnter) shot.onEnter();

  const tl = clamp((state.t - OFF[i]) * timeScale(i), 0, 10);
  shot.update(tl, 0);
  CAM.snap();
  state.glitch = 1;
}

/* ---------------- narration ---------------- */
function tickNarration(tl) {
  const cues = SHOTS[state.shot].subs || [];
  while (state.cue < cues.length && tl >= cues[state.cue].t) {
    const c = cues[state.cue];
    HUD.say(c.s);
    AUDIO.speak(c.s);
    state.cue++;
    clearTimeout(state.subTimer);
    const hold = c.s.length >= 8 ? 4200 : 3000;
    state.subTimer = setTimeout(() => HUD.say(''), hold);
  }
}

/* ---------------- telemetry ---------------- */
function syncTel(rows) {
  const nodes = HUD.tel.querySelectorAll('.trow');
  if (nodes.length !== rows.length) { HUD.setTelemetry(rows); return; }
  rows.forEach((r, i) => {
    const tv = nodes[i].querySelector('.tv');
    if (tv.textContent !== r[1]) tv.textContent = r[1];
    const cn = 'tv ' + (r[2] || '');
    if (tv.className !== cn) tv.className = cn;
  });
}

/* ---------------- loop ---------------- */
/* 自适应分辨率：连续掉帧就降 DPR，连续富余就升回，上限 = 设备 DPR（≤1.5）。
   后期管线有 5 个全屏 Pass，帧率主要花在像素数上，所以这是最有效的旋钮。 */
const PERF = {
  cap: Math.min(window.devicePixelRatio || 1, 1.5),
  dpr: Math.min(window.devicePixelRatio || 1, 1.5),
  acc: 0, n: 0, cool: 0, done: false,
  tick(rawDt) {
    if (this.done) return;
    this.acc += rawDt; this.n++;
    if (this.acc < 1.4) return;
    const avg = this.acc / this.n;
    this.acc = 0; this.n = 0;
    if (this.cool-- > 0) return;
    let next = this.dpr;
    if (avg > 0.026 && this.dpr > 0.78) next = Math.max(0.75, this.dpr - 0.25);
    else if (avg < 0.0135 && this.dpr < this.cap) next = Math.min(this.cap, this.dpr + 0.25);
    if (Math.abs(next - this.dpr) > 0.01) {
      this.dpr = next; this.cool = 3;
      renderer.setPixelRatio(next);
      renderer.setSize(innerWidth, innerHeight);
      FX.size(innerWidth, innerHeight);
    }
    if (this.dpr <= 0.75) this.done = true;   // 已经降到底，不再折腾
  }
};

let lastT = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  let rawDt = (now - lastT) / 1000; lastT = now;
  const dt = Math.min(rawDt, .06);
  const time = now / 1000;

  if (state.playing) {
    state.t = Math.min(TOTAL, state.t + Math.min(rawDt, .25));
    if (state.t >= TOTAL) { state.playing = false; state.ended = true; updateButtons(); HUD.flash('END OF ARCHIVE'); }
  }
  const idx = shotOf(state.t);
  if (idx !== state.shot) enterShot(idx);
  const tl = clamp((state.t - OFF[idx]) * timeScale(idx), 0, 10);

  const shot = built[idx];
  if (shot) {
    const animDt = state.playing ? dt : 0;   // 暂停时冻结粒子 / 车辆 / 相机
    shot.update(tl, animDt);
    CAM.step(animDt);
    labels.update(tl);
  }
  tickNarration(tl);

  // hud numbers
  HUD.bar.style.width = (state.t / TOTAL * 100).toFixed(2) + '%';
  const mm = Math.floor(state.t / 60), ss = Math.floor(state.t % 60);
  HUD.clk.textContent = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;

  state.telAcc += dt;
  if (state.telAcc > .18 && shot && shot.tel) { state.telAcc = 0; syncTel(shot.tel(tl)); }

  state.glitch = Math.max(0, state.glitch - Math.min(rawDt, .25) * 3.2);
  FX.render(time, { glitch: state.glitch * .9, bloom: 1 });
  PERF.tick(rawDt);
}

/* ---------------- controls ---------------- */
const btnPlay = document.getElementById('btnPlay');
const btnSound = document.getElementById('btnSound');
function updateButtons() {
  btnPlay.textContent = state.playing ? '❚❚ 暂停' : (state.ended ? '▶ 重播' : '▶ 播放');
}
btnPlay.onclick = () => {
  if (state.ended) return seek(0, true);
  state.playing = !state.playing;
  if (state.playing) AUDIO.start();
  updateButtons();
};
document.getElementById('btnRestart').onclick = () => seek(0, true);
btnSound.onclick = () => {
  AUDIO.setMuted(!AUDIO.muted);
  if (!AUDIO.muted && !AUDIO.ctx) { try { AUDIO.start(); } catch (e) { } }
  setSoundUI();
};
document.getElementById('btnFull').onclick = () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
};
document.getElementById('btnBoard').onclick = () => toggleBoard(true);
document.getElementById('sbClose').onclick = () => toggleBoard(false);

function toggleBoard(on) {
  document.getElementById('storyboard').classList.toggle('on', on);
}

function seek(t, play) {
  state.t = clamp(t, 0, TOTAL - .001);
  state.ended = false;
  if (play) { state.playing = true; AUDIO.start(); }
  const i = shotOf(state.t);
  enterShot(i, true);
  updateButtons();
}

const progress = document.getElementById('progress');
progress.onclick = e => {
  const r = progress.getBoundingClientRect();
  seek((e.clientX - r.left) / r.width * TOTAL, state.playing);
};

window.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); btnPlay.click(); }
  else if (e.code === 'ArrowRight') seek(state.t + 5, state.playing);
  else if (e.code === 'ArrowLeft') seek(state.t - 5, state.playing);
  else if (e.key === 'm' || e.key === 'M') btnSound.click();
  else if (e.key === 'b' || e.key === 'B') toggleBoard(!document.getElementById('storyboard').classList.contains('on'));
  else if (e.key === 'f' || e.key === 'F') document.getElementById('btnFull').click();
});

/* ---------------- storyboard ---------------- */
(function buildBoard() {
  const grid = document.getElementById('sbGrid');
  const descs = [
    '黑屏扫描线 / 环形加载 / 概率计数 / MOSS 唤醒',
    '线稿层：鼓座、撑杆、喷口冠生成，标注逐条压入',
    '裁剪面自下而上实体化，线稿退为高光，镜头拉远',
    '万点球壳：10,000 台常驻 + 2,000 台赤道转向机',
    '三星系统 / 4.2 光年标尺 / 航迹与坐标解算',
    '冰原低照度 / 六编组车队 / −84 ℃ 与风场',
    '通风塔剖切 / 热冷双粒子流 / 地下城光点',
    '赤道锚点升起至同步轨道站 / 硬对接倒计时',
    '外骨骼冲拳 / 冲击环 / 载荷曲线峰值 18.6 kN',
    '木星辐射带 / 弹弓轨迹 / 洛希极限红色警戒环',
    '日面颗粒 / 核心异常球 / 中微子通量告警',
    'MOSS 单眼收束 / 标题 / 提问与免责声明'
  ];
  SHOTS.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = 'sbcell';
    const tc0 = String(OFF[i]).padStart(2, '0'), tc1 = String(OFF[i] + shotDur(i)).padStart(2, '0');
    d.innerHTML = `<div class="n">${String(i + 1).padStart(2, '0')}</div>
      <div class="t">${s.title}</div>
      <div class="d">${descs[i]}</div>
      <div class="tc">${tc0}–${tc1}s</div>`;
    d.onclick = () => { toggleBoard(false); seek(OFF[i], true); };
    grid.appendChild(d);
  });
  // progress ticks
  const ticks = document.getElementById('ticks');
  for (let i = 0; i < 12; i++) {
    const u = document.createElement('u');
    u.style.left = (OFF[i] / TOTAL * 100) + '%';
    const sp = document.createElement('span');
    sp.textContent = String(i + 1).padStart(2, '0');
    u.appendChild(sp);
    ticks.appendChild(u);
  }
})();

/* ---------------- boot ---------------- */
const gate = document.getElementById('gate');

function setSoundUI() {
  btnSound.classList.toggle('active', !AUDIO.muted);
  btnSound.textContent = AUDIO.muted ? '♪ 静音' : '♪ 声音';
}

function begin(startT, play, mute, hudOn, instant) {
  if (instant) document.body.classList.add('no-anim');
  gate.classList.add('hide');
  HUD.show(hudOn !== false);
  document.getElementById('labels').style.display = hudOn === false ? 'none' : '';
  if (mute) { AUDIO.muted = true; setSoundUI(); }
  else {
    try { AUDIO.start(); AUDIO.riser(2.6, .3); } catch (e) { /* 自动播放策略拦截，等用户首次点击 */ }
  }
  setTimeout(() => {
    state.shot = -1;
    seek(startT || 0, !!play);
  }, play ? 240 : 40);
}

document.getElementById('enter').onclick = () => begin(0, true, PARAM.mute, PARAM.hud);

/* 自动播放被浏览器策略挂起时，首次交互再解锁音频 */
const unlockAudio = () => {
  if (!AUDIO.muted && state.playing) {
    if (!AUDIO.ctx) { try { AUDIO.start(); } catch (e) { } }
    else if (AUDIO.ctx.state === 'suspended') AUDIO.ctx.resume();
  }
  document.removeEventListener('pointerdown', unlockAudio);
  document.removeEventListener('keydown', unlockAudio);
};
document.addEventListener('pointerdown', unlockAudio);
document.addEventListener('keydown', unlockAudio);

/* 切到后台自动暂停，回来继续（避免回来时时间轴跳帧） */
let hiddenPause = false;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (state.playing) { hiddenPause = true; state.playing = false; updateButtons(); }
  } else if (hiddenPause) {
    hiddenPause = false; lastT = performance.now(); state.playing = true; updateButtons();
  }
});

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  FX.size(w, h);
});
renderer.setPixelRatio(PERF.dpr);
FX.size(window.innerWidth, window.innerHeight);
/* warm one frame behind the gate */
buildShot(0).group.visible = true;
built[0].update(0, 0);
CAM.snap();
requestAnimationFrame(frame);

/* 深链：?autoplay=1&shot=&t=&paused=&mute=&hud= */
if (PARAM.autoplay) {
  begin(OFF[PARAM.shot] + PARAM.at, !PARAM.paused, PARAM.mute, PARAM.hud, true);
}

