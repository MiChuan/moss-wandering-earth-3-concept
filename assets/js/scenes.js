/* =========================================================================
   MOSS // THE WANDERING EARTH III — CONCEPT REEL 120s
   scenes.js — 12 段分镜的程序化几何构建器
   -------------------------------------------------------------------------
   每个 REG[i] 是一个工厂函数，返回：
     group    THREE.Group          场景根节点（由 main.js 挂到 scene 上）
     update   (tl, dt) => void     tl 为「创作时间轴」秒数，恒定映射到 0–10，
                                   与实际段落时长无关；dt 为真实帧间隔
     labels   [{p, k, v, t0, t1, cls}] 3D 锚点 → DOM 投影标签
     tel      tl => [[键, 值, 样式]]   左侧遥测表
     fog      可选 THREE.Fog
     onEnter / onExit                  可选进出场钩子

   约定：所有几何体、贴图、文字、粒子都在运行时用代码生成，
         不读取任何外部模型（.glb/.obj）或图片资源。
   ========================================================================= */

/* =========================================================================
   SCENES 01-04  boot / engine blueprint / engine solid / global network
   ========================================================================= */
const REG = [];   // scene builders, index = shot index

/* ---------- shared helpers ---------- */
function cylBetween(parent, a, b, r1, r2, mat, seg = 12) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(r1, r2, len, seg, 1, false);
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(a).addScaledVector(dir, .5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  parent.add(m);
  return m;
}
function addEdges(parent, mesh, color = COL.g, opacity = .5, threshold = 30) {
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, threshold), lineMat(color, opacity));
  e.position.copy(mesh.position); e.quaternion.copy(mesh.quaternion); e.scale.copy(mesh.scale);
  parent.add(e);
  return e;
}

/* =======================================================================
   SHOT 01 — MOSS WAKE / PROBABILITY LOAD
   ======================================================================= */
REG[0] = function () {
  const g = new THREE.Group();
  const rings = [];
  for (let i = 0; i < 5; i++) {
    const r = 9 + i * 2.2;
    const geo = new THREE.TorusGeometry(r, .035, 6, 180);
    const m = new THREE.LineSegments(new THREE.WireframeGeometry(geo), lineMat(i % 2 ? COL.o : COL.g, .5 - i * .06));
    m.rotation.x = Math.PI / 2 + rand(.5, -.5);
    m.rotation.z = rand(TAU);
    rings.push({ m, sp: rand(.14, .03) * (i % 2 ? -1 : 1), r });
    g.add(m);
  }
  // segmented iris
  const iris = new THREE.Group();
  for (let i = 0; i < 36; i++) {
    const a = i / 36 * TAU;
    const geo = new THREE.PlaneGeometry(.10, rand(1.6, 3.2));
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: i % 9 === 0 ? COL.o : COL.g, transparent: true, opacity: .55,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
    }));
    m.position.set(Math.cos(a) * 7.4, Math.sin(a) * 7.4, 0);
    m.rotation.z = a - Math.PI / 2;
    iris.add(m);
  }
  g.add(iris);
  const core = glowSprite(0x7dffd0, 16, .8); g.add(core);
  const dustP = dust(700, 34, 0x7dffd0, .07); g.add(dustP);

  // vertical scan bar
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(60, .07), new THREE.MeshBasicMaterial({
    color: 0x9dffe0, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  scan.position.z = 1; g.add(scan);

  return {
    group: g,
    update(tl) {
      const p = tl / 10;
      rings.forEach((o, i) => {
        o.m.rotation.z += o.sp * .012;
        o.m.rotation.x += o.sp * .004;
        const s = lerp(.35, 1, easeOut(clamp((tl - i * .5) / 2.4, 0, 1)));
        o.m.scale.setScalar(s);
        o.m.material.opacity = (.12 + .5 * s) * (1 - .5 * smooth(inv(7, 10, tl)));
      });
      iris.rotation.z = tl * .12;
      iris.children.forEach((m, i) => {
        const on = smooth(inv(1.2 + i * .02, 2.6 + i * .02, tl));
        m.scale.y = lerp(.2, 1, on);
        m.material.opacity = .5 * on;
      });
      core.scale.setScalar(lerp(4, 16, easeOut(inv(0, 6, tl))) * (1 + Math.sin(tl * 2.4) * .04));
      core.material.opacity = .55 + .25 * Math.sin(tl * 1.7);
      scan.position.y = lerp(26, -26, (tl % 4.5) / 4.5);
      scan.material.opacity = .35 * (1 - Math.abs(tl % 4.5 - 2.25) / 2.4);
      dustP.rotation.y = tl * .03;
      CAM.set(
        new THREE.Vector3(0, 0, lerp(46, 30, easeOut(p))),
        new THREE.Vector3(0, 0, 0)
      );
    },
    labels: [
      { p: new THREE.Vector3(0, 8.6, 0), k: 'SYSTEM / 550W', v: 'MOSS 主控在线', t0: 2.2, t1: 9.4 },
      { p: new THREE.Vector3(-8.8, 4.2, 0), k: 'PROBABILITY ENGINE', v: '文明延续概率 99.97%', t0: 4.4, t1: 9.4, cls: 'o' },
      { p: new THREE.Vector3(7.4, -5.4, 0), k: 'ARCHIVE LINK', v: '流浪地球计划 · 全档案调取', t0: 6.2, t1: 9.4, cls: 'b' }
    ],
    tel: tl => [
      ['系统唤醒', tl > .8 ? 'COMPLETE' : 'LOADING…', tl > .8 ? '' : 'warn'],
      ['文明延续概率', (Math.min(99.97, tl * 14 + 3).toFixed(2)) + '%', tl > 7 ? '' : 'warn'],
      ['算力占用', (34 + Math.sin(tl * 1.3) * 13).toFixed(1) + '%', ''],
      ['档案索引', '0x' + (0x7F2A + Math.floor(tl * 91)).toString(16).toUpperCase(), ''],
      ['时间基准', 'T-2077.02.14', '']
    ]
  };
};

/* =======================================================================
   SHOT 02-03 — 杭州-01 行星发动机 (blueprint → solid)
   ======================================================================= */
let ENGINE = null;
function buildEngine() {
  if (ENGINE) return ENGINE;
  const group = new THREE.Group();
  const solid = new THREE.Group(); group.add(solid);
  const edgeLines = [];
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.25);
  const mk = (c, o) => solidMat(c, Object.assign({ clippingPlanes: [clip], clipShadows: true }, o));
  const A = mk(0x101c22, { metalness: .55, roughness: .45, emissive: 0x06181c, emissiveIntensity: 1.0, envMapIntensity: .6 });
  const B = mk(0x0a1418, { metalness: .6, roughness: .5, emissive: 0x04120f, emissiveIntensity: 1.0, envMapIntensity: .5 });
  const C = mk(0x080f13, { metalness: .4, roughness: .7 });
  const GLOW = new THREE.MeshBasicMaterial({
    color: 0x7dffd0, transparent: true, opacity: .85, blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide, depthWrite: false, clippingPlanes: [clip]
  });
  const parts = [];
  function add(geo, mat, pos, rot, eclr = COL.g, eop = .62) {
    const m = new THREE.Mesh(geo, mat);
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    solid.add(m);
    const e = addEdges(group, m, eclr, eop);
    edgeLines.push(e);
    parts.push(m);
    return m;
  }

  /* base ring / foundation */
  const ring0 = add(new THREE.TorusGeometry(13.2, .32, 8, 96), C, [0, .3, 0], [Math.PI / 2, 0, 0], COL.g, .6);
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * TAU;
    add(new THREE.BoxGeometry(.55, .16, 2.6), C, [Math.cos(a) * 12.1, .18, Math.sin(a) * 12.1], [0, -a, 0], COL.gd, .35);
  }
  /* 鼓座 DRUM BASE */
  add(new THREE.CylinderGeometry(10.6, 12.2, 4.2, 64, 1, false), A, [0, 2.3, 0], null, COL.g, .55);
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * TAU;
    add(new THREE.BoxGeometry(1.15, 4.6, 2.0), B, [Math.cos(a) * 11.05, 2.35, Math.sin(a) * 11.05], [0, -a, 0], COL.g, .45);
  }
  add(new THREE.TorusGeometry(10.9, .18, 6, 72), B, [0, 4.45, 0], [Math.PI / 2, 0, 0], COL.g, .4);

  /* 液压撑杆 HYDRAULIC STRUTS */
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU + .2;
    const foot = new THREE.Vector3(Math.cos(a) * 11.4, 1.6, Math.sin(a) * 11.4);
    const head = new THREE.Vector3(Math.cos(a) * 5.9, 9.4, Math.sin(a) * 5.9);
    const sleeve = cylBetween(solid, foot, head, .42, .3, B, 10);
    const e1 = addEdges(group, sleeve, COL.g, .5); edgeLines.push(e1);
    const mid = foot.clone().lerp(head, .55);
    const rod = cylBetween(solid, mid, head.clone().add(new THREE.Vector3(0, .6, 0)), .18, .18, A, 8);
    const e2 = addEdges(group, rod, COL.o, .8); edgeLines.push(e2);
    add(new THREE.BoxGeometry(1.5, 1.5, 1.5), C, [foot.x, foot.y, foot.z], [0, -a, 0], COL.g, .5);
    parts.push(sleeve, rod);
  }

  /* 主体 BODY */
  add(new THREE.CylinderGeometry(4.6, 9.8, 12.6, 64, 1, false), A, [0, 10.4, 0], null, COL.g, .5);
  for (let i = 0; i < 4; i++) {
    const y = 5.4 + i * 3.0;
    const r = lerp(9.5, 5.4, (y - 4.4) / 12.6) + .35;
    add(new THREE.TorusGeometry(r, .16, 6, 72), B, [0, y, 0], [Math.PI / 2, 0, 0], COL.g, .4);
  }
  /* 竖向加强肋 */
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU + .12;
    const geo = new THREE.BoxGeometry(.32, 12.2, .5);
    const m = new THREE.Mesh(geo, C);
    m.position.set(Math.cos(a) * 7.4, 10.2, Math.sin(a) * 7.4);
    m.rotation.y = -a; m.rotation.z = .06 * Math.cos(a);
    solid.add(m);
    const e = addEdges(group, m, COL.gd, .28); edgeLines.push(e);
    parts.push(m);
  }
  /* 检修平台 */
  [12.6].forEach((y, i) => {
    const r = lerp(9.5, 5.4, (y - 4.4) / 12.6) + 1.9;
    add(new THREE.TorusGeometry(r, .10, 5, 64), B, [0, y, 0], [Math.PI / 2, 0, 0], COL.b, .3);
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * TAU;
      add(new THREE.BoxGeometry(.09, .9, .09), C, [Math.cos(a) * r, y + .45, Math.sin(a) * r], null, COL.b, .22);
    }
  });

  /* 喷口冠 NOZZLE CROWN : 外扩喷铃 + 花瓣环 */
  add(new THREE.CylinderGeometry(6.9, 4.5, 4.4, 64, 1, true), B, [0, 18.2, 0], null, COL.o, .5);
  add(new THREE.TorusGeometry(6.92, .26, 8, 96), A, [0, 20.4, 0], [Math.PI / 2, 0, 0], COL.o, .85);
  add(new THREE.TorusGeometry(4.62, .14, 6, 72), B, [0, 16.2, 0], [Math.PI / 2, 0, 0], COL.g, .4);
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * TAU;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(.46, 3.6, 1.35), A);
    blade.position.set(Math.cos(a) * 7.30, 20.15, Math.sin(a) * 7.30);
    blade.rotation.order = 'YXZ';
    blade.rotation.y = -a; blade.rotation.x = .38;
    solid.add(blade);
    edgeLines.push(addEdges(group, blade, COL.o, .75));
    parts.push(blade);
  }
  /* 环向加强桁架 */
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * TAU;
    const tie = new THREE.Mesh(new THREE.BoxGeometry(.16, .16, 3.1), B);
    tie.position.set(Math.cos(a) * 5.9, 20.4, Math.sin(a) * 5.9);
    tie.rotation.y = -a; solid.add(tie);
    const e = addEdges(group, tie, COL.gd, .22); edgeLines.push(e); parts.push(tie);
  }
  /* 内部熔核 */
  const coreMesh = new THREE.Mesh(new THREE.CylinderGeometry(4.1, 3.4, 1.2, 48, 1, true), GLOW);
  coreMesh.position.y = 19.0; solid.add(coreMesh);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(4.0, 64), GLOW);
  disc.rotation.x = -Math.PI / 2; disc.position.y = 19.4; solid.add(disc);
  const glow = glowSprite(0x9dffe0, 16, .30); glow.position.y = 19.8; group.add(glow);

  /* blueprint base grid + dimension lines */
  const grid = gridFloor(70, 35, COL.b, .16); grid.position.y = 0; group.add(grid);
  const dims = new THREE.Group(); group.add(dims);
  dims.add(measureLine(new THREE.Vector3(-15, 0, 0), new THREE.Vector3(-15, 4.3, 0), COL.g, .55));
  dims.add(measureLine(new THREE.Vector3(-15, 4.3, 0), new THREE.Vector3(-15, 21, 0), COL.o, .45));
  dims.add(measureLine(new THREE.Vector3(-12.4, 0, 0), new THREE.Vector3(12.4, 0, 0), COL.b, .5));
  // callout leaders
  const lead = (a, b) => {
    const g2 = new THREE.BufferGeometry().setFromPoints([a, b]);
    dims.add(new THREE.Line(g2, lineMat(COL.g, .45)));
  };
  lead(new THREE.Vector3(-10.4, 2.3, 8.2), new THREE.Vector3(-17.4, 2.9, 7.4));
  lead(new THREE.Vector3(8.0, 8.6, 6.6), new THREE.Vector3(16.2, 10.2, 5.2));
  lead(new THREE.Vector3(4.6, 20.2, 3.2), new THREE.Vector3(11.6, 23.6, 1.4));

  /* 工业条形灯带 */
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU + .4;
    const strip = new THREE.Mesh(new THREE.BoxGeometry(.12, 10.5, .12), new THREE.MeshBasicMaterial({
      color: i % 2 ? 0xff8a3c : 0x6fffd0, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    strip.position.set(Math.cos(a) * 8.1, 10.4, Math.sin(a) * 8.1);
    strip.rotation.y = -a; strip.rotation.z = .10 * Math.cos(a);
    group.add(strip); edgeLines.push(strip);
    strip.material.clippingPlanes = [clip];
  }
  const crownGlow = new THREE.Mesh(new THREE.TorusGeometry(6.1, .07, 6, 80), new THREE.MeshBasicMaterial({
    color: 0xffb070, transparent: true, opacity: .0, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  crownGlow.rotation.x = Math.PI / 2; crownGlow.position.y = 20.35; group.add(crownGlow);

  const scanRing = new THREE.Mesh(new THREE.TorusGeometry(9.6, .12, 6, 96), new THREE.MeshBasicMaterial({
    color: 0x9dffe0, transparent: true, opacity: .0, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  scanRing.rotation.x = Math.PI / 2; group.add(scanRing);

  group.visible = false;
  scene.add(group);

  ENGINE = { group, solid, parts, edgeLines, clip, scanRing, glow, A, B, C, GLOW, dims, grid, coreMesh, disc, crownGlow };
  return ENGINE;
}

REG[1] = function () {
  const E = buildEngine();
  E.group.visible = true;
  E.solid.visible = false;
  E.grid.visible = true; E.dims.visible = true;
  E.clip.constant = -1;
  E.edgeLines.forEach(e => { e.material.opacity = e.material.color.equals(new THREE.Color(COL.o)) ? .8 : .5; });
  return {
    group: E.group,
    fog: new THREE.FogExp2(0x020a0e, 0.0065),
    update(tl) {
      E.solid.visible = false;
      E.scanRing.material.opacity = 0; E.crownGlow.material.opacity = 0;
      E.group.rotation.y = -.2 + Math.sin(tl * .12) * .05;
      const p = tl / 10;
      CAM.set(
        new THREE.Vector3(lerp(36, 27, easeIn(tl / 10)), lerp(8.5, 12.5, easeIn(tl / 10)), lerp(39, 30, easeIn(tl / 10))),
        new THREE.Vector3(-1.6, 11.4, 0)
      );
      // blueprint scan sweep highlight
      E.edgeLines.forEach((e, i) => {
        const base = e.material.color.equals(new THREE.Color(COL.o)) ? .8 : .5;
        e.material.opacity = base * (.75 + .25 * Math.sin(tl * 2.2 + i * .2));
      });
    },
    labels: [
      { p: new THREE.Vector3(-17.6, 2.9, 7.4), k: 'FIG.01 / DRUM BASE', v: '鼓座 · 承载 12 万吨', t0: 1.6, t1: 9.6 },
      { p: new THREE.Vector3(16.4, 10.2, 5.2), k: 'FIG.02 / HYDRAULIC ×8', v: '液压撑杆 · 姿态调平', t0: 3.6, t1: 9.6, cls: 'o' },
      { p: new THREE.Vector3(11.8, 23.8, 1.4), k: 'FIG.03 / NOZZLE CROWN', v: '喷口冠 · 等离子约束', t0: 5.8, t1: 9.6, cls: 'b' },
      { p: new THREE.Vector3(-15.2, 12, 0), k: 'H 21.4 m', v: '整机高度', t0: 2.4, t1: 9.6, cls: 'b' }
    ],
    tel: tl => [
      ['结构解析', '杭州-01 / 行星发动机', ''],
      ['蓝图精度', (98.2 + Math.sin(tl) * .4).toFixed(2) + '%', ''],
      ['构件解析', Math.floor(lerp(0, 18420, inv(0, 8, tl))).toLocaleString('en-US'), ''],
      ['推力基线', '150 万亿吨', ''],
      ['坐标', 'N30.27 / E120.15', '']
    ]
  };
};
function _dummy() { }

REG[2] = function () {
  const E = buildEngine();
  E.group.visible = true; E.solid.visible = true;
  E.grid.visible = true; E.dims.visible = true;
  E.clip.constant = .25;
  const plume = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 6.4, 10, 32, 1, true), new THREE.MeshBasicMaterial({
    color: 0x7dffd0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
  }));
  plume.position.y = 25.5; E.group.add(plume);
  return {
    group: E.group,
    fog: new THREE.FogExp2(0x020a0e, 0.0065),
    update(tl) {
      const rv = easeIO(inv(.4, 6.2, tl));
      plume.material.opacity = .07 * inv(5.2, 8.4, tl);
      plume.scale.set(1 + .06 * Math.sin(tl * 3), 1 + .1 * Math.sin(tl * 1.7), 1 + .06 * Math.cos(tl * 3));
      plume.position.y = 25.5 + Math.sin(tl * 1.2) * .4;
      E.clip.constant = lerp(.25, 23, rv);
      E.scanRing.position.y = E.clip.constant;
      E.scanRing.material.opacity = rv < .99 ? .85 : .85 * (1 - inv(6.2, 7.4, tl));
      E.scanRing.scale.setScalar(lerp(1.02, .92, (E.clip.constant / 23)));
      E.glow.material.opacity = .12 + .22 * inv(3.4, 6.4, tl) + Math.sin(tl * 3) * .03;
      E.crownGlow.material.opacity = .55 * inv(4.4, 6.2, tl) * (0.8 + 0.2 * Math.sin(tl * 2));
      E.disc.material.opacity = .3 + .5 * inv(4, 6.4, tl);
      E.group.rotation.y = -.2 + tl * .045;
      const camR = lerp(58, 52, easeIO(inv(0, 6, tl)));
      CAM.set(
        new THREE.Vector3(Math.sin(.62 + tl * .022) * camR, lerp(9, 14, easeIO(inv(0, 8, tl))), Math.cos(.62 + tl * .022) * camR),
        new THREE.Vector3(-1.4, lerp(10.2, 11.6, inv(0, 6, tl)), 0)
      );
      // edge lines fade out as solid rises
      const k = 1 - .10 * rv;
      E.edgeLines.forEach(e => {
        e.material.opacity = (e.material.color.equals(new THREE.Color(COL.o)) ? .8 : .5) * k;
      });
    },
    labels: [
      { p: new THREE.Vector3(-17.6, 2.9, 7.4), k: 'FIG.01 / DRUM BASE', v: '鼓座 · 已成型', t0: 0, t1: 6.4 },
      { p: new THREE.Vector3(16.4, 10.2, 5.2), k: 'FIG.02 / HYDRAULIC ×8', v: '液压撑杆 · 压力 38 MPa', t0: 0, t1: 7.2, cls: 'o' },
      { p: new THREE.Vector3(11.8, 23.8, 1.4), k: 'FIG.03 / NOZZLE CROWN', v: '喷口冠 · 16 片约束叶', t0: .8, t1: 9.6, cls: 'b' },
      { p: new THREE.Vector3(0, 24.8, 0), k: 'MATERIALIZATION 100%', v: '实体化完成', t0: 6.6, t1: 9.6 }
    ],
    tel: tl => {
      const rv = easeIO(inv(.4, 6.2, tl));
      return [
      ['建模进度', Math.min(100, inv(.4, 6.2, tl) * 100).toFixed(1) + '%', inv(.4, 6.2, tl) < 1 ? 'warn' : ''],
      ['构件实体化', String(Math.floor(inv(.4, 6.2, tl) * 18420)).replace(/\B(?=(\d{3})+(?!\d))/g, ','), ''],
      ['材料应力', (240 + Math.sin(tl * .8) * 18).toFixed(0) + ' MPa', ''],
      ['喷口温度', (lerp(20, 3800, rv)).toFixed(0) + ' K', rv > .7 ? 'warn' : ''],
      ['状态', rv > .98 ? 'READY / 待点火' : 'ASSEMBLING…', rv > .98 ? '' : 'warn']
      ];
    }
  };
};

/* =======================================================================
   SHOT 04 — GLOBAL ENGINE NETWORK
   ======================================================================= */
REG[3] = function () {
  const g = new THREE.Group();
  const R = 10;
  const globe = new THREE.Group(); g.add(globe);

  // surface wire
  const wire = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 26), new THREE.MeshBasicMaterial({
    color: COL.b, wireframe: true, transparent: true, opacity: .045, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  globe.add(wire);
  const shellMat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vE;
      void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0);
      vE = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vE;
      void main(){ float d = dot(normalize(vN), normalize(vec3(-0.55,0.42,0.72)));
        float day = smoothstep(-0.55, 0.75, d);
        vec3 col = mix(vec3(0.002,0.007,0.010), vec3(0.010,0.048,0.058), day);
        float fr = pow(1.0 - abs(dot(normalize(vN), vE)), 2.2);
        col += vec3(0.06,0.42,0.34) * fr * 0.55;
        gl_FragColor = vec4(col, 1.0); }`
  });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(R * .992, 64, 42), shellMat);
  globe.add(shell);
  // atmosphere rim
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.045, 64, 42), new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vN; varying vec3 vE;
      void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0);
      vE = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vE;
      void main(){ float fr = pow(1.0 - abs(dot(normalize(vN), vE)), 3.0);
        gl_FragColor = vec4(vec3(0.12,0.72,0.60) * fr * 0.9, fr * 0.15); }`
  }));
  globe.add(atmo);
  // engine pins
  const pinG = new THREE.BufferGeometry();
  const pinN = 420, pinArr = new Float32Array(pinN * 6);
  for (let i = 0; i < pinN; i++) {
    const y = rand(1, -1), rr = Math.sqrt(1 - y * y), th = rand(TAU);
    const p0 = new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr).multiplyScalar(R * 1.005);
    const p1 = p0.clone().multiplyScalar(1.035);
    pinArr.set([p0.x, p0.y, p0.z, p1.x, p1.y, p1.z], i * 6);
  }
  pinG.setAttribute('position', new THREE.BufferAttribute(pinArr, 3));
  const pins = new THREE.LineSegments(pinG, lineMat(0x7dffd0, .18));
  globe.add(pins);
  // latitude rings
  for (let i = -3; i <= 3; i++) {
    const lat = i / 4 * Math.PI / 2;
    const r = Math.cos(lat) * R * 1.001;
    const ring = dashRing(r, i === 0 ? COL.o : COL.b, i === 0 ? .5 : .18, 100);
    ring.position.y = Math.sin(lat) * R; ring.rotation.x = 0; globe.add(ring);
  }

  // engine sites : fibonacci sphere
  function sites(n, radius) {
    const pos = new Float32Array(n * 3);
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const rr = Math.sqrt(1 - y * y);
      const th = ga * i;
      pos[i * 3] = Math.cos(th) * rr * radius;
      pos[i * 3 + 1] = y * radius;
      pos[i * 3 + 2] = Math.sin(th) * rr * radius;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }
  const gEngine = new THREE.Points(sites(10000, R * 1.005), new THREE.PointsMaterial({
    color: 0x64ffc4, size: .045, transparent: true, opacity: .50, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  }));
  globe.add(gEngine);
  // steering engines near equator (|y| < 0.18R)
  const steerPos = [];
  const all = sites(2000, R * 1.012).attributes.position.array;
  for (let i = 0; i < 2000; i++) {
    const y = all[i * 3 + 1];
    if (Math.abs(y) < R * 0.20) steerPos.push(all[i * 3], y, all[i * 3 + 2]);
  }
  const steerGeo = new THREE.BufferGeometry();
  steerGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(steerPos), 3));
  const gSteer = new THREE.Points(steerGeo, new THREE.PointsMaterial({
    color: 0xff8a3c, size: .22, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  globe.add(gSteer);

  // arcs
  const arcs = [];
  for (let i = 0; i < 26; i++) {
    const a1 = rand(TAU), a2 = a1 + rand(2.5, 1.1), ph1 = Math.acos(rand(1, -1)), ph2 = Math.acos(rand(1, -1));
    const p1 = new THREE.Vector3(Math.sin(ph1) * Math.cos(a1), Math.cos(ph1), Math.sin(ph1) * Math.sin(a1)).multiplyScalar(R * 1.01);
    const p2 = new THREE.Vector3(Math.sin(ph2) * Math.cos(a2), Math.cos(ph2), Math.sin(ph2) * Math.sin(a2)).multiplyScalar(R * 1.01);
    const mid = p1.clone().add(p2).multiplyScalar(.5).normalize().multiplyScalar(R * (1.18 + Math.random() * .25));
    const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
    const pts = curve.getPoints(48);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, lineMat(i % 4 === 0 ? COL.o : COL.b, .38));
    geo.setDrawRange(0, 49);
    globe.add(line);
    const dot = glowSprite(0x9dffe0, .9, .9);
    globe.add(dot);
    arcs.push({ pts, line, dot, geo, sp: rand(.22, .1) });
  }

  // equator belt glow
  const belt = new THREE.Mesh(new THREE.TorusGeometry(R * 1.015, .06, 6, 128), new THREE.MeshBasicMaterial({
    color: 0xff8a3c, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  belt.rotation.x = Math.PI / 2; globe.add(belt);

  globe.rotation.z = .41; globe.rotation.y = -1.1;
  g.add(dust(400, 26, 0x88ffdd, .06));

  return {
    group: g,
    update(tl) {
      globe.rotation.y = -1.1 + tl * .075;
      const rev = easeOut(inv(0, 5.5, tl));
      gEngine.geometry.setDrawRange(0, Math.floor(10000 * rev));
      gSteer.geometry.setDrawRange(0, Math.floor((steerPos.length / 3) * rev));
      belt.material.opacity = .3 + .3 * Math.sin(tl * 1.4);
      arcs.forEach((a, i) => {
        const prog = clamp(inv(1 + i * .12, 5 + i * .12, tl), 0, 1);
        a.geo.setDrawRange(0, Math.max(2, Math.floor(prog * 49)));
        const idx = Math.min(48, Math.floor(((tl * a.sp * 4) % 1) * 48));
        a.dot.position.copy(a.pts[idx]);
        a.dot.material.opacity = .55 + .35 * Math.sin(tl * 3 + i);
        a.line.material.opacity = .1 + .32 * prog;
      });
      const p = tl / 10;
      CAM.set(
        new THREE.Vector3(Math.sin(-.5 + p * .18) * 39, 7 - p * 2, Math.cos(-.5 + p * .18) * 39),
        new THREE.Vector3(0, 0, 0)
      );
    },
    labels: [
      { p: new THREE.Vector3(0, 10.4, 0), k: 'PLANETARY ENGINE NETWORK', v: '行星发动机 · 10,000 台', t0: 1.2, t1: 9.6 },
      { p: new THREE.Vector3(9.6, .6, 3.4), k: 'STEERING ARRAY', v: '转向发动机 · 2,000 台', t0: 3.4, t1: 9.6, cls: 'o' },
      { p: new THREE.Vector3(-8.4, -4.2, 5.2), k: 'OUTPUT', v: '总推力 150 万亿吨', t0: 5.2, t1: 9.6, cls: 'b' }
    ],
    tel: tl => [
      ['并网发动机', Math.floor(10000 * easeOut(inv(0, 5.5, tl))).toLocaleString('en-US') + ' / 10,000', ''],
      ['转向阵列', Math.floor(2000 * easeOut(inv(0, 5.5, tl))).toLocaleString('en-US') + ' / 2,000', 'warn'],
      ['行星推力', (128.4 + Math.sin(tl) * 2.1).toFixed(1) + ' 万亿吨', ''],
      ['同步误差', (0.002 + Math.random() * .004).toFixed(4) + ' ″', ''],
      ['网络状态', 'LOCKED', ''],
      ['自转制动', tl > 4 ? 'PHASE-1 ACTIVE' : 'STANDBY', tl > 4 ? 'warn' : '']
    ]
  };
};

/* =========================================================================
   SCENES 05-08  destination / ice convoy / vent tower / orbital anchor
   ========================================================================= */

/* =======================================================================
   SHOT 05 — 目的地 半人马座α · 4.2 光年
   ======================================================================= */
REG[4] = function () {
  const g = new THREE.Group();
  // starfield
  const starGeo = new THREE.BufferGeometry();
  const N = 3600, sp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = rand(420, 120), th = rand(TAU), ph = Math.acos(rand(1, -1));
    sp[i * 3] = r * Math.sin(ph) * Math.cos(th);
    sp[i * 3 + 1] = r * Math.cos(ph);
    sp[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xbfe8ff, size: 1.1, transparent: true, opacity: .7, sizeAttenuation: true, depthWrite: false
  }));
  g.add(stars);

  // three suns
  const target = new THREE.Group(); target.position.set(0, 2, -95); g.add(target);
  const aCen = glowSprite(0xfff0c8, 26, 1); target.add(aCen);
  const bCen = glowSprite(0xffb070, 16, .9); bCen.position.set(15, 8, 4); target.add(bCen);
  const prox = glowSprite(0xff7a5a, 7, .9); prox.position.set(-13, -7, 6); target.add(prox);
  const halo = dashRing(9, COL.b, .55, 120); halo.rotation.x = 0; halo.position.copy(target.position); g.add(halo);
  const halo2 = dashRing(13, COL.o, .35, 120); halo2.position.copy(target.position); g.add(halo2);

  // earth marker
  const earth = new THREE.Group(); earth.position.set(-6, -4, 34); g.add(earth);
  const eDot = new THREE.Mesh(new THREE.SphereGeometry(.7, 16, 12), new THREE.MeshBasicMaterial({ color: 0x5fc8ff }));
  earth.add(eDot);
  earth.add(glowSprite(0x59c6ff, 6, .55));
  const eRing = dashRing(3.2, COL.b, .6, 64); eRing.rotation.x = 1.2; earth.add(eRing);

  // trajectory
  const curve = new THREE.CatmullRomCurve3([
    earth.position.clone(),
    new THREE.Vector3(-2, .5, 6),
    new THREE.Vector3(2, 2.4, -30),
    new THREE.Vector3(-1.4, 2.2, -62),
    target.position.clone()
  ]);
  const tPts = curve.getPoints(220);
  const tGeo = new THREE.BufferGeometry().setFromPoints(tPts);
  const traj = new THREE.Line(tGeo, lineMat(COL.g, .35));
  g.add(traj);
  const trajGlow = new THREE.Line(tGeo, lineMat(COL.g, .12));
  trajGlow.scale.multiplyScalar(1.001); g.add(trajGlow);
  const ship = glowSprite(0x9dffe0, 2.6, 1); g.add(ship);

  // distance ruler
  const ruler = new THREE.Group(); g.add(ruler);
  const y = -16;
  const z0 = 34, z1 = -95, perLy = (z0 - z1) / 4.2;
  ruler.add(measureLine(new THREE.Vector3(0, y, z0), new THREE.Vector3(0, y, z1), COL.b, .55));
  for (let i = 0; i <= 4; i++) {
    const z = z0 - perLy * i;
    const lens = i === 4 ? 2.4 : 1.3;
    ruler.add(measureLine(new THREE.Vector3(-lens, y, z), new THREE.Vector3(lens, y, z), COL.b, i === 4 ? .9 : .5));
  }
  ruler.add(measureLine(new THREE.Vector3(0, y, z0 - perLy * 4.2), new THREE.Vector3(0, y, z1), COL.o, .9));

  const reticle = new THREE.Mesh(new THREE.RingGeometry(7.4, 7.55, 96), new THREE.MeshBasicMaterial({
    color: 0x9dffe0, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
  }));
  reticle.position.copy(target.position); g.add(reticle);

  return {
    group: g,
    update(tl) {
      stars.rotation.y = tl * .004;
      const p = easeIO(tl / 10);
      target.children[0].material.opacity = .85 + Math.sin(tl * 1.6) * .1;
      halo.rotation.z = tl * .1; halo2.rotation.z = -tl * .07;
      halo.scale.setScalar(1 + Math.sin(tl * .9) * .02);
      reticle.rotation.z = tl * .25;
      reticle.scale.setScalar(1 + Math.sin(tl * .7) * .03);
      // ship travels
      const sp2 = clamp((tl - .6) / 8.4, 0, 1);
      const pp = curve.getPointAt(Math.min(.995, sp2 * .96));
      ship.position.copy(pp);
      ship.material.opacity = .5 + .5 * Math.sin(tl * 6);
      tGeo.setDrawRange(0, Math.max(2, Math.floor(sp2 * 221)));
      tGeo.needsUpdate = false;
      eRing.rotation.z = tl * .4;
      CAM.set(
        new THREE.Vector3(lerp(16, 9, p), lerp(9, 5, p), lerp(52, 40, p)),
        new THREE.Vector3(lerp(-2, 0, p), lerp(0, 2, p), lerp(-40, -52, p))
      );
    },
    labels: [
      { p: new THREE.Vector3(-16, 9.5, -95), k: 'TARGET SYSTEM', v: '半人马座 α · 三合星', t0: 1.4, t1: 9.6 },
      { p: new THREE.Vector3(13.5, -9.2, -88), k: 'α CEN A / B / PROXIMA', v: '4.2 光年 · 唯一已知宜居带', t0: 3.2, t1: 9.6, cls: 'o' },
      { p: new THREE.Vector3(-6, -4, 34), k: 'ORIGIN', v: '太阳系 · 地球', t0: 1.8, t1: 9.6, cls: 'b' },
      { p: new THREE.Vector3(0, -19.4, -10), k: 'RANGE 4.20 LY', v: '航程 4.2 光年 · 2500 年', t0: 5.4, t1: 9.6 },
      { p: new THREE.Vector3(2.6, -17.2, 5.4), k: '1.0 LY', v: '', t0: 4.0, t1: 9.6, cls: 'b' },
      { p: new THREE.Vector3(2.6, -17.2, -23.6), k: '2.0 LY', v: '', t0: 4.4, t1: 9.6, cls: 'b' },
      { p: new THREE.Vector3(2.6, -17.2, -52.6), k: '3.0 LY', v: '', t0: 4.8, t1: 9.6, cls: 'b' }
    ],
    tel: tl => [
      ['目标星系', '半人马座 α', ''],
      ['航程', '4.20 光年', 'warn'],
      ['预计航行', '2,500 年 / 100 代', ''],
      ['地球自转', (1.0 - inv(3, 9, tl) * .993).toFixed(3) + ' × 24h', 'warn'],
      ['推进模式', '行星发动机 · 常驻推力', ''],
      ['导航解算', (99.4 + Math.sin(tl * .7) * .4).toFixed(2) + '%', '']
    ]
  };
};

/* =======================================================================
   SHOT 06 — 地表 -84℃ 无人重载车队
   ======================================================================= */
function buildTruck(w = 1) {
  const t = new THREE.Group();
  const bodyM = new THREE.MeshStandardMaterial({ color: 0x39464d, metalness: .82, roughness: .5 });
  const darkM = new THREE.MeshStandardMaterial({ color: 0x151c21, metalness: .7, roughness: .7 });
  const cab = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.4, 5.2), bodyM); cab.position.set(0, 3.1, -7.6); t.add(cab);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.9, 2.4), darkM); cabin.position.set(0, 4.3, -8.6); t.add(cabin);
  const trailer = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3.0, 13.5), bodyM); trailer.position.set(0, 3.0, 1.6); t.add(trailer);
  // container ribs
  for (let i = 0; i < 7; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(4.9, 3.2, .18), darkM);
    rib.position.set(0, 3.0, -4.2 + i * 1.95); t.add(rib);
  }
  // wheels
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) {
    const wm = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, .8, 18), darkM);
    wm.rotation.z = Math.PI / 2;
    wm.position.set(s * 2.3, 1.15, -7.4 + i * 3.6);
    t.add(wm);
  }
  // light bars
  const light = new THREE.Mesh(new THREE.BoxGeometry(3.6, .22, .3), new THREE.MeshBasicMaterial({ color: 0xfff2cf, transparent: true, opacity: .95 }));
  light.position.set(0, 2.3, -10.2); t.add(light);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(3.9, .16, .2), new THREE.MeshBasicMaterial({ color: 0xff3a2a }));
  tail.position.set(0, 2.0, 8.4); t.add(tail);
  // beacon
  const bc = glowSprite(0x66ffd0, 1.3, .9); bc.position.set(0, 5.6, -8.6); t.add(bc); t.userData.beacon = bc;
  // headlight ground pool + glow
  const pc = document.createElement('canvas'); pc.width = 256; pc.height = 256;
  const pg2 = pc.getContext('2d');
  const rg = pg2.createRadialGradient(128, 128, 4, 128, 128, 128);
  rg.addColorStop(0, 'rgba(255,250,232,.85)');
  rg.addColorStop(.35, 'rgba(210,240,255,.30)');
  rg.addColorStop(1, 'rgba(120,200,255,0)');
  pg2.fillStyle = rg; pg2.fillRect(0, 0, 256, 256);
  const poolTex = new THREE.CanvasTexture(pc);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(11, 34), new THREE.MeshBasicMaterial({
    map: poolTex, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, .06, -22); t.add(pool);
  for (const sx of [-1, 1]) {
    const hl = glowSprite(0xfff4d8, 1.5, .85); hl.position.set(sx * 1.2, 2.35, -10.4); t.add(hl);
  }
  const marker = new THREE.Mesh(new THREE.BoxGeometry(.08, .08, 11), new THREE.MeshBasicMaterial({
    color: 0xff8a3c, transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  marker.position.set(2.36, 2.0, 1.6); t.add(marker);
  t.scale.setScalar(w);
  return t;
}

REG[5] = function () {
  const g = new THREE.Group();
  // ice ground
  const groundM = new THREE.MeshStandardMaterial({ color: 0x0d1a21, metalness: .05, roughness: .82 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 420, 1, 1), groundM);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.2; g.add(ground);
  const grid = gridFloor(260, 52, 0x2a6a80, .13); grid.position.y = 0; g.add(grid);
  // ice ridges
  const ridgeG = new THREE.Group(); g.add(ridgeG);
  for (let i = 0; i < 90; i++) {
    const h = rand(6, 1.2);
    const geo = new THREE.ConeGeometry(rand(5, 1.4), h, randi(4, 7), 1);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: 0x101c24, metalness: .35, roughness: .35, flatShading: true
    }));
    const a = rand(TAU), d = rand(150, 16);
    m.position.set(Math.cos(a) * d, h / 2 - .2, Math.sin(a) * d - 20);
    m.rotation.y = rand(TAU);
    m.rotation.z = rand(.12, -.12);
    ridgeG.add(m);
    const e = addEdges(ridgeG, m, 0x3fd0ff, .18, 40);
  }
  // convoy
  const convoy = new THREE.Group(); g.add(convoy);
  const trucks = [];
  for (let i = 0; i < 6; i++) {
    const t = buildTruck(i === 0 ? 1 : .96);
    t.position.set(i === 0 ? 0 : (i % 2 ? 5.2 : -5.4), 0, -6 - i * 22);
    convoy.add(t); trucks.push(t);
  }
  // snow
  const snowGeo = new THREE.BufferGeometry();
  const SN = 2600, snp = new Float32Array(SN * 3), spd = [];
  for (let i = 0; i < SN; i++) {
    snp[i * 3] = rand(80, -80); snp[i * 3 + 1] = rand(30, 0); snp[i * 3 + 2] = rand(60, -60);
    spd.push(rand(7, 2));
  }
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snp, 3));
  const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({
    color: 0xd8f4ff, size: .16, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  g.add(snow);
  // horizon haze

  return {
    group: g,
    fog: new THREE.FogExp2(0x020a0f, 0.0085),
    update(tl, dt) {
      convoy.position.z -= dt * 4.2;
      trucks.forEach((t, i) => {
        t.position.y = Math.sin(tl * 2.4 + i) * .09;
        t.userData.beacon.material.opacity = .35 + .65 * (Math.sin(tl * 5 + i * 1.7) > .6 ? 1 : .1);
      });
      const arr = snowGeo.attributes.position.array;
      for (let i = 0; i < SN; i++) {
        arr[i * 3 + 1] -= spd[i] * dt * 1.6;
        arr[i * 3] -= dt * 4.2;
        if (arr[i * 3 + 1] < 0) { arr[i * 3 + 1] = 30; arr[i * 3] = rand(80, -80); }
        if (arr[i * 3] < -80) arr[i * 3] = 80;
      }
      snowGeo.attributes.position.needsUpdate = true;
      const p = easeIO(tl / 10);
      CAM.set(
        new THREE.Vector3(lerp(28, 22, p), lerp(7.4, 5.0, p), lerp(26, 16, p)),
        new THREE.Vector3(lerp(0, -2, p), 3.0, lerp(-18, -26, p))
      );
    },
    labels: [
      { p: new THREE.Vector3(6, 6.4, -12), k: 'CONVOY C-07 / UNMANNED', v: '无人重载车队 · 6 编组', t0: 1.2, t1: 9.6 },
      { p: new THREE.Vector3(-9, 3.4, 14), k: 'SURFACE TEMP', v: '−84 ℃ · 风速 32 m/s', t0: 2.6, t1: 9.6, cls: 'o' },
      { p: new THREE.Vector3(12, 1.2, 26), k: 'PAYLOAD 1,240 t', v: '单编组载荷', t0: 4.8, t1: 9.6, cls: 'b' }
    ],
    tel: tl => [
      ['地表温度', '−84.2 ℃', 'crit'],
      ['风速', (31 + Math.sin(tl) * 3).toFixed(1) + ' m/s', 'warn'],
      ['车队编组', '06 / 06 · 无人', ''],
      ['单组载荷', '1,240 t', ''],
      ['导航', '冰原磁暴 · 视觉惯性', 'warn'],
      ['反应堆余量', (78 - tl * .6).toFixed(1) + '%', '']
    ]
  };
};

/* =======================================================================
   SHOT 07 — 地下城通风塔 / 冷热交换
   ======================================================================= */
REG[6] = function () {
  const g = new THREE.Group();
  // ground ring
  const ground = new THREE.Mesh(new THREE.RingGeometry(18, 140, 64, 1), new THREE.MeshStandardMaterial({
    color: 0x0a1418, metalness: .05, roughness: .85, side: THREE.DoubleSide
  }));
  ground.rotation.x = -Math.PI / 2; g.add(ground);
  const grid = gridFloor(200, 40, 0x2a6a80, .1); grid.position.y = .05; g.add(grid);

  // underground shell (inverted cone) — cutaway
  const under = new THREE.Mesh(new THREE.CylinderGeometry(18, 26, 40, 48, 6, true), new THREE.MeshBasicMaterial({
    color: 0x2c7f8f, wireframe: true, transparent: true, opacity: .14, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  under.position.y = -20.5; g.add(under);
  // city lights below
  const cityGeo = new THREE.BufferGeometry();
  const CN = 1800, cp = new Float32Array(CN * 3);
  for (let i = 0; i < CN; i++) {
    const a = rand(TAU), r = Math.sqrt(Math.random()) * 22;
    cp[i * 3] = Math.cos(a) * r; cp[i * 3 + 1] = rand(-3, -38); cp[i * 3 + 2] = Math.sin(a) * r;
  }
  cityGeo.setAttribute('position', new THREE.BufferAttribute(cp, 3));
  const city = new THREE.Points(cityGeo, new THREE.PointsMaterial({
    color: 0xffb066, size: .95, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  g.add(city);
  const cityGlow = glowSprite(0xff9a5a, 60, .30); cityGlow.position.y = -26; g.add(cityGlow);

  // tower
  const towerM = new THREE.MeshStandardMaterial({ color: 0x4a5d67, metalness: .85, roughness: .42 });
  const darkM = new THREE.MeshStandardMaterial({ color: 0x141d22, metalness: .7, roughness: .65 });
  const tower = new THREE.Group(); g.add(tower);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.4, 46, 40, 1, true), towerM);
  shaft.position.y = 23; tower.add(shaft);
  addEdges(tower, shaft, COL.g, .35);
  for (let i = 0; i < 9; i++) {
    const y = 4 + i * 5;
    const r = lerp(4.4, 3.4, y / 46) + .5;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, .16, 6, 64), darkM);
    ring.rotation.x = Math.PI / 2; ring.position.y = y; tower.add(ring);
    addEdges(tower, ring, COL.b, .35);
  }
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(.22, 44, 1.5), darkM);
    fin.position.set(Math.cos(a) * 4.0, 23, Math.sin(a) * 4.0);
    fin.rotation.y = -a; tower.add(fin);
  }
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 4.2, 2.2, 32), towerM);
  cap.position.y = 46.6; tower.add(cap); addEdges(tower, cap, COL.o, .5);
  const capGlow = new THREE.Mesh(new THREE.CircleGeometry(4.6, 40), new THREE.MeshBasicMaterial({
    color: 0xffa35c, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  capGlow.rotation.x = -Math.PI / 2; capGlow.position.y = 47.8; tower.add(capGlow);

  // heat / cold particle columns
  function column(color, count, radius, rise, size) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3), ph = [];
    for (let i = 0; i < count; i++) {
      const a = rand(TAU), r = radius + rand(1.6, -.8);
      pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = rand(48, 0); pos[i * 3 + 2] = Math.sin(a) * r;
      ph.push({ a, r, y: pos[i * 3 + 1], v: rand(rise * 1.4, rise * .6) });
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      color, size, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    return { pts, geo, ph, count };
  }
  const hot = column(0xff9a4a, 620, 4.6, 7, .50);
  const cold = column(0x59d8ff, 700, 11.8, -6.0, .42);
  g.add(hot.pts); g.add(cold.pts);

  // heat exchange rings
  const exch = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(9 + i * 2.2, .07, 6, 96), new THREE.MeshBasicMaterial({
      color: i === 0 ? 0xff8b3a : 0x49d4ff, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 6 + i * 6; g.add(ring); exch.push(ring);
  }

  return {
    group: g,
    fog: new THREE.FogExp2(0x02080b, 0.0055),
    update(tl, dt) {
      hot.ph.forEach((p, i) => {
        p.y += p.v * dt * 2.2;
        if (p.y > 52) { p.y = 0; p.a = rand(TAU); }
        const a = p.a + tl * .12;
        hot.geo.attributes.position.array[i * 3] = Math.cos(a) * p.r;
        hot.geo.attributes.position.array[i * 3 + 1] = p.y;
        hot.geo.attributes.position.array[i * 3 + 2] = Math.sin(a) * p.r;
      });
      hot.geo.attributes.position.needsUpdate = true;
      cold.ph.forEach((p, i) => {
        p.y += p.v * dt * 2.2;
        if (p.y < 0) { p.y = 52; p.a = rand(TAU); }
        const a = p.a - tl * .09;
        cold.geo.attributes.position.array[i * 3] = Math.cos(a) * p.r;
        cold.geo.attributes.position.array[i * 3 + 1] = p.y;
        cold.geo.attributes.position.array[i * 3 + 2] = Math.sin(a) * p.r;
      });
      cold.geo.attributes.position.needsUpdate = true;
      exch.forEach((r, i) => { r.rotation.z = tl * .2 * (i % 2 ? -1 : 1); });
      capGlow.material.opacity = .35 + .25 * Math.sin(tl * 2);
      city.material.opacity = .55 + .25 * Math.sin(tl * 1.4);
      const p = easeIO(tl / 10);
      CAM.set(
        new THREE.Vector3(Math.sin(.15 + p * .35) * lerp(88, 76, p), lerp(15, 22, p), Math.cos(.15 + p * .35) * lerp(88, 76, p)),
        new THREE.Vector3(0, lerp(20, 25, p), 0)
      );
    },
    labels: [
      { p: new THREE.Vector3(0, 50.4, 0), k: 'VENT TOWER / 01', v: '地下城通风塔', t0: 1.0, t1: 9.6 },
      { p: new THREE.Vector3(11.5, 7.2, 6), k: 'HEAT EXCHANGE', v: '冷热交换 · ΔT 96 ℃', t0: 2.8, t1: 9.6, cls: 'o' },
      { p: new THREE.Vector3(-14, -14, 8), k: 'SUBLEVEL −5,000 m', v: '地下城 · 常住 3,200 万人', t0: 4.6, t1: 9.6, cls: 'b' }
    ],
    tel: tl => [
      ['送风温度', (26 + Math.sin(tl * .8) * 1.2).toFixed(1) + ' ℃', ''],
      ['回风温度', '−58.4 ℃', 'warn'],
      ['热交换效率', (92.4 + Math.sin(tl) * .5).toFixed(1) + '%', ''],
      ['地下城深度', '−5,000 m', ''],
      ['常住人口', '32,000,000', ''],
      ['循环风量', '1.8 × 10⁹ m³/h', '']
    ]
  };
};

/* =======================================================================
   SHOT 08 — 利伯维尔赤道锚点 / 同步轨道对接
   ======================================================================= */
REG[7] = function () {
  const g = new THREE.Group();

  /* starfield (orbital altitude) */
  const stG = new THREE.BufferGeometry();
  const SN2 = 2200, sta = new Float32Array(SN2 * 3);
  for (let i = 0; i < SN2; i++) {
    const r = rand(900, 400), th = rand(TAU), ph = Math.acos(rand(1, -1));
    sta[i * 3] = r * Math.sin(ph) * Math.cos(th);
    sta[i * 3 + 1] = r * Math.cos(ph) + 150;
    sta[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  stG.setAttribute('position', new THREE.BufferAttribute(sta, 3));
  g.add(new THREE.Points(stG, new THREE.PointsMaterial({
    color: 0xbfe8ff, size: 1.4, transparent: true, opacity: .55, sizeAttenuation: true, depthWrite: false
  })));

  /* ground + equator ring */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({
    color: 0x060f13, metalness: .2, roughness: .85
  }));
  ground.rotation.x = -Math.PI / 2; g.add(ground);
  const grid = gridFloor(300, 60, 0x2a6a80, .10); grid.position.y = .02; g.add(grid);
  const eq = new THREE.Mesh(new THREE.RingGeometry(58, 58.5, 128), new THREE.MeshBasicMaterial({
    color: 0xff8a3c, transparent: true, opacity: .45, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
  }));
  eq.rotation.x = -Math.PI / 2; eq.position.y = .1; g.add(eq);
  const eq2 = new THREE.Mesh(new THREE.RingGeometry(62, 62.2, 128), new THREE.MeshBasicMaterial({
    color: 0x3fd0ff, transparent: true, opacity: .2, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
  }));
  eq2.rotation.x = -Math.PI / 2; eq2.position.y = .1; g.add(eq2);

  /* anchor base */
  const baseM = new THREE.MeshStandardMaterial({ color: 0x9aacb5, metalness: .9, roughness: .32 });
  const darkM = new THREE.MeshStandardMaterial({ color: 0x2a373e, metalness: .8, roughness: .5 });
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(17, 19.5, 1.4, 64), darkM);
  pad.position.y = .7; g.add(pad); addEdges(g, pad, COL.g, .4);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(13.4, .55, 8, 96), baseM);
  ring.rotation.x = Math.PI / 2; ring.position.y = 1.7; g.add(ring); addEdges(g, ring, COL.g, .55);
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * TAU;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 13.4), baseM);
    beam.position.set(Math.cos(a) * 6.9, 1.7, Math.sin(a) * 6.9);
    beam.rotation.y = -a; g.add(beam); addEdges(g, beam, COL.gd, .22);
  }
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + .4;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 9.5, 2.4), baseM);
    arm.position.set(Math.cos(a) * 8.6, 5.4, Math.sin(a) * 8.6);
    arm.rotation.y = -a; arm.rotation.z = .2 * Math.cos(a);
    g.add(arm); addEdges(g, arm, COL.b, .35);
    const lamp = glowSprite(0x88ffdd, 2.6, .5);
    lamp.position.set(Math.cos(a) * 9.4, 10.2, Math.sin(a) * 9.4); g.add(lamp);
  }
  // ground light pool
  const pool = glowSprite(0x66ffd0, 46, .16); pool.position.y = 2.5; pool.scale.z = 1; g.add(pool);

  /* cable bundle */
  const cableMat = new THREE.MeshBasicMaterial({ color: 0x74ffcf, transparent: true, opacity: .45, blending: THREE.AdditiveBlending });
  const cab2 = new THREE.MeshBasicMaterial({ color: 0x2fb9ff, transparent: true, opacity: .22, blending: THREE.AdditiveBlending });
  const CABLE_TOP = 252;
  [[0, 0], [1.15, 0], [-1.15, 0], [0, 1.15], [0, -1.15]].forEach((o, i) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(i ? .035 : .10, i ? .035 : .10, CABLE_TOP, 5, 1, true), i ? cab2 : cableMat);
    c.position.set(o[0], CABLE_TOP / 2 + 1, o[1]); g.add(c);
  });
  for (let i = 1; i < 13; i++) {
    const rr = new THREE.Mesh(new THREE.TorusGeometry(1.9, .05, 5, 28), cab2);
    rr.rotation.x = Math.PI / 2; rr.position.y = i * 19; g.add(rr);
  }

  /* synchronous station */
  const station = new THREE.Group(); station.position.y = CABLE_TOP; g.add(station);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 8, 24), baseM);
  station.add(hub); addEdges(station, hub, COL.g, .55);
  const torus = new THREE.Mesh(new THREE.TorusGeometry(9.4, 1.15, 12, 72), baseM);
  torus.rotation.x = Math.PI / 2; station.add(torus); addEdges(station, torus, COL.g, .6);
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + .6;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(7.6, .55, .55), darkM);
    spoke.position.set(Math.cos(a) * 5.1, 0, Math.sin(a) * 5.1);
    spoke.rotation.y = -a; station.add(spoke);
  }
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(10, .14, 3.8), new THREE.MeshStandardMaterial({
      color: 0x0d2c44, metalness: .9, roughness: .22, emissive: 0x0b3550, emissiveIntensity: 1.2
    }));
    panel.position.set(Math.cos(a) * 14.5, 0, Math.sin(a) * 14.5);
    panel.rotation.y = -a; panel.rotation.z = .22;
    station.add(panel); addEdges(station, panel, COL.b, .45);
  }
  const beacons = [];
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU;
    const b = glowSprite(i % 2 ? 0xffa055 : 0x66ffd0, 1.8, .9);
    b.position.set(Math.cos(a) * 9.4, .9, Math.sin(a) * 9.4); station.add(b); beacons.push(b);
  }
  const dockR = new THREE.Mesh(new THREE.TorusGeometry(3.6, .18, 8, 48), new THREE.MeshBasicMaterial({
    color: 0x9dffe0, transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  dockR.rotation.x = Math.PI / 2; dockR.position.y = -4.8; station.add(dockR);
  const dockBeam = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 12, 24, 1, true), new THREE.MeshBasicMaterial({
    color: 0x7dffd0, transparent: true, opacity: .1, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
  }));
  dockBeam.position.y = -10; station.add(dockBeam);

  /* climber */
  const climber = new THREE.Group(); g.add(climber);
  const cb = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 5.6, 20), baseM);
  climber.add(cb); addEdges(climber, cb, COL.g, .65);
  const cCap = new THREE.Mesh(new THREE.ConeGeometry(2.5, 2.2, 20), darkM); cCap.position.y = 3.6; climber.add(cCap);
  const cRing = new THREE.Mesh(new THREE.TorusGeometry(2.9, .10, 6, 40), new THREE.MeshBasicMaterial({
    color: 0xffa055, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  cRing.rotation.x = Math.PI / 2; cRing.position.y = -1.4; climber.add(cRing);
  const cGlow = glowSprite(0x88ffdd, 8, .5); climber.add(cGlow);
  const trailGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -3, 0), new THREE.Vector3(0, -34, 0)]);
  climber.add(new THREE.Line(trailGeo, lineMat(COL.g, .35)));

  return {
    group: g,
    fog: new THREE.FogExp2(0x02080b, 0.0016),
    update(tl, dt) {
      const rise = easeIO(inv(.3, 9.2, tl));
      const cy = lerp(4, 243, rise);
      climber.position.y = cy;
      cGlow.material.opacity = .3 + .25 * Math.sin(tl * 5);
      cRing.rotation.z = tl * .8;
      station.rotation.y = tl * .05;
      beacons.forEach((b, i) => b.material.opacity = .35 + .65 * (Math.sin(tl * 4 + i) > .3 ? 1 : .08));
      dockR.material.opacity = .3 + .4 * Math.abs(Math.sin(tl * 2));
      dockBeam.material.opacity = .05 + .07 * Math.abs(Math.sin(tl * 1.6));
      const r = lerp(34, 45, rise);
      const a = .55 + rise * .30;
      const camY = lerp(13, 196, rise);
      CAM.set(
        new THREE.Vector3(Math.sin(a) * r, camY, Math.cos(a) * r),
        new THREE.Vector3(0, Math.min(252, camY + lerp(1, 50, rise) + rise * 12), 0)
      );
    },
    labels: [
      { p: new THREE.Vector3(0, 4.0, 17), k: 'EQUATORIAL ANCHOR', v: '利伯维尔锚点 · 0°17′N', t0: .6, t1: 4.6 },
      { p: new THREE.Vector3(6, 150, 0), k: 'CARBON NANOTUBE CABLE', v: '天梯缆绳 · 96,000 km', t0: 3.0, t1: 8.2, cls: 'b' },
      { p: new THREE.Vector3(0, CABLE_TOP + 12, 0), k: 'GEOSTATIONARY DOCK', v: '同步轨道站 · 35,786 km', t0: 7.2, t1: 9.8, cls: 'o' }
    ],
    tel: tl => [
      ['锚点坐标', '0°17′N / 9°27′E', ''],
      ['缆绳张力', (62 + tl * 1.2).toFixed(1) + ' GN', ''],
      ['爬升高度', (lerp(0.3, 35.7, easeIO(inv(.3, 9.2, tl)))).toFixed(2) + ' ×10³ km', 'warn'],
      ['对接窗口', tl > 8 ? 'OPEN / 12 s' : 'T−' + Math.max(0, 10 - tl).toFixed(0) + ' s', tl > 8 ? '' : 'warn'],
      ['轨道速度', '3.07 km/s', ''],
      ['状态', tl > 8.6 ? 'HARD DOCK' : 'APPROACH', tl > 8.6 ? '' : 'warn']
    ]
  };
};
function docRingSpin(r, tl) { r.rotation.z = tl * .8; }

/* =========================================================================
   SCENES 09-12  exoskeleton test / jupiter slingshot / solar anomaly / outro
   ========================================================================= */

/* =======================================================================
   SHOT 09 — 外骨骼无人对抗测试 · 冲击载荷峰值
   ======================================================================= */
function buildExo() {
  const g = new THREE.Group();
  const M = new THREE.MeshStandardMaterial({ color: 0x93a5ad, metalness: .92, roughness: .32 });
  const D = new THREE.MeshStandardMaterial({ color: 0x3a4a52, metalness: .8, roughness: .55 });
  const GL = new THREE.MeshBasicMaterial({ color: 0xff8a3c, transparent: true, opacity: .9, blending: THREE.AdditiveBlending });

  function seg(parent, x, y, z, len, r, mat, axis = 'y') {
    const grp = new THREE.Group(); grp.position.set(x, y, z); parent.add(grp);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r * .85, len, 12), mat);
    mesh.position.y = -len / 2; grp.add(mesh);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 30), lineMat(COL.g, .35));
    e.position.copy(mesh.position); grp.add(e);
    return grp;
  }

  const pelvis = new THREE.Group(); pelvis.position.y = 2.35; g.add(pelvis);
  const hipBox = new THREE.Mesh(new THREE.BoxGeometry(1.5, .7, 1.0), M); pelvis.add(hipBox);
  addEdges(pelvis, hipBox, COL.g, .4);

  const torso = new THREE.Group(); pelvis.add(torso);
  const chest = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.9, 1.05), M);
  chest.position.y = 1.15; torso.add(chest); addEdges(torso, chest, COL.g, .45);
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, .25), D);
  chestPlate.position.set(0, 1.2, .58); torso.add(chestPlate);
  const spine = new THREE.Mesh(new THREE.BoxGeometry(.3, 2.6, .3), D);
  spine.position.set(0, .3, -.5); torso.add(spine);
  // coolant / actuator lines
  for (const s of [-1, 1]) {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 1.7, 6), GL);
    tube.position.set(s * .55, 1.25, .5); torso.add(tube);
  }
  // neck + sensor head (无人平台)
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.20, .26, .46, 10), D);
  neck.position.y = 2.22; torso.add(neck);
  const head = new THREE.Mesh(new THREE.BoxGeometry(.82, .86, .8), M);
  head.position.y = 2.86; torso.add(head); addEdges(torso, head, COL.g, .4);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(.66, .14, .06), GL);
  visor.position.set(0, 2.92, .42); torso.add(visor);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .5, 5), D);
  ant.position.set(.28, 3.5, 0); torso.add(ant);
  // power pack
  const pack = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, .62), D);
  pack.position.set(0, 1.15, -.72); torso.add(pack); addEdges(torso, pack, COL.o, .35);
  for (const sx of [-.45, .45]) {
    const cell = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 1.2, 8), GL);
    cell.position.set(sx, 1.1, -.86); torso.add(cell);
  }
  // shoulder pauldrons
  const shoulders = [];
  for (const s of [-1, 1]) {
    const pa = new THREE.Mesh(new THREE.SphereGeometry(.56, 16, 12), D);
    pa.position.set(s * 1.16, 1.95, 0); pa.scale.set(1, .9, 1); torso.add(pa);
    addEdges(torso, pa, COL.o, .35);
    const arm = seg(torso, s * 1.3, 1.8, 0, 1.7, .34, M);
    const elbow = new THREE.Group(); elbow.position.y = -1.75; arm.add(elbow);
    const fore = seg(elbow, 0, 0, 0, 1.6, .29, M);
    fore.add(seg(elbow, 0, 0, 0, 1.0, .12, GL)); // piston glow
    const hand = new THREE.Mesh(new THREE.BoxGeometry(.55, .5, .42), D);
    hand.position.y = -1.72; fore.add(hand);
    // hydraulic piston on upper arm
    const pis = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 1.3, 6), D);
    pis.position.set(s * .38, -.85, .2); arm.add(pis);
    shoulders.push({ s, arm, elbow, fore });
  }
  // legs
  const legs = [];
  for (const s of [-1, 1]) {
    const leg = seg(pelvis, s * .55, -.2, 0, 1.55, .38, M);
    const knee = new THREE.Group(); knee.position.y = -1.6; leg.add(knee);
    const shin = seg(knee, 0, 0, 0, 1.5, .32, M);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(.72, .28, 1.35), D);
    foot.position.set(0, -1.62, .18); shin.add(foot);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 1.2, 6), GL);
    pad.position.set(s * .3, -.7, -.28); leg.add(pad);
    legs.push({ s, leg, knee, shin, foot });
  }
  return { group: g, torso, pelvis, shoulders, legs };
}

REG[8] = function () {
  const g = new THREE.Group();
  const exo = buildExo(); g.add(exo.group);

  // test pad
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.8, .4, 48), new THREE.MeshStandardMaterial({
    color: 0x101a1f, metalness: .5, roughness: .55
  }));
  pad.position.y = -.2; g.add(pad);
  const padRing = new THREE.Mesh(new THREE.TorusGeometry(7.5, .07, 6, 96), new THREE.MeshBasicMaterial({
    color: 0x3fd0ff, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  padRing.rotation.x = Math.PI / 2; padRing.position.y = .05; g.add(padRing);
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * TAU;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(.08, .02, .5), new THREE.MeshBasicMaterial({ color: 0xff8a3c }));
    tick.position.set(Math.cos(a) * 7.1, .06, Math.sin(a) * 7.1); tick.rotation.y = -a; g.add(tick);
  }
  const grid = gridFloor(90, 36, 0x2a6a80, .1); grid.position.y = .02; g.add(grid);

  // sensor pylons
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * TAU + .5;
    const py = new THREE.Group();
    py.position.set(Math.cos(a) * 9.5, 0, Math.sin(a) * 9.5);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(.12, .18, 7, 8), new THREE.MeshStandardMaterial({ color: 0x6b7d86, metalness: .8, roughness: .5 }));
    mast.position.y = 3.5; py.add(mast);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.7, .5, .9), new THREE.MeshStandardMaterial({ color: 0x2c3a41, metalness: .7, roughness: .5 }));
    head.position.y = 7.1; py.add(head);
    const lens = glowSprite(0x66ffd0, 1.6, .8); lens.position.set(0, 7.1, .55); py.add(lens);
    g.add(py);
  }

  // shock rings
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(1, .05, 5, 80), new THREE.MeshBasicMaterial({
      color: i === 1 ? 0xff8a3c : 0x9dffe0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    r.rotation.x = Math.PI / 2; r.position.y = .08; g.add(r); rings.push(r);
  }

  // graph panel
  const panel = new THREE.Group();
  panel.position.set(3.5, -1.15, -10);
  panel.scale.setScalar(.30);
  if (!camera.parent) scene.add(camera);
  camera.add(panel);
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(15, 7), new THREE.MeshBasicMaterial({
    color: 0x02120e, transparent: true, opacity: .7, side: THREE.DoubleSide
  }));
  panel.add(frame);
  const frameEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(15, 7)), lineMat(COL.g, .5));
  panel.add(frameEdge);
  const axisH = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6.6, -2.8, .01), new THREE.Vector3(6.6, -2.8, .01)]), lineMat(COL.g, .4));
  panel.add(axisH);
  const axisV = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6.6, -2.8, .01), new THREE.Vector3(-6.6, 3, .01)]), lineMat(COL.g, .4));
  panel.add(axisV);
  const thr = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6.6, 1.55, .01), new THREE.Vector3(6.6, 1.55, .01)]), lineMat(COL.r, .8));
  panel.add(thr);
  const CN = 140, curvePos = new Float32Array(CN * 3);
  for (let i = 0; i < CN; i++) {
    const x = -6.6 + (i / (CN - 1)) * 13.2;
    let y = -2.4 + Math.sin(i * .35) * .18 + Math.sin(i * .11) * .3;
    const d = Math.abs(i - 84);
    if (i > 60) y += Math.exp(-d * d / 90) * 5.0;
    curvePos[i * 3] = x; curvePos[i * 3 + 1] = Math.min(2.9, y); curvePos[i * 3 + 2] = .02;
  }
  const curveGeo = new THREE.BufferGeometry();
  curveGeo.setAttribute('position', new THREE.BufferAttribute(curvePos, 3));
  const curve = new THREE.Line(curveGeo, lineMat(COL.o, .95));
  curveGeo.setDrawRange(0, 2); panel.add(curve);
  const peakDot = glowSprite(0xffa55c, 1.6, 1); panel.add(peakDot);

  const burst = new THREE.Points(new THREE.BufferGeometry().setAttribute('position',
    new THREE.BufferAttribute((() => {
      const a = new Float32Array(160 * 3);
      for (let i = 0; i < 160; i++) { a[i * 3] = rand(.4, -.4); a[i * 3 + 1] = rand(.2, 0); a[i * 3 + 2] = rand(.4, -.4); }
      return a;
    })(), 3)), new THREE.PointsMaterial({
      color: 0xffc08a, size: .12, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false
    }));
  burst.position.set(0, 1.4, 0); g.add(burst);

  return {
    group: g,
    update(tl, dt) {
      const crouch = smooth(inv(1.2, 3.0, tl)) * (1 - smooth(inv(5.6, 7.4, tl)));
      const punch = smooth(inv(3.4, 4.35, tl)) * (1 - smooth(inv(6.2, 7.8, tl)));
      const impact = inv(4.35, 4.7, tl);
      // pose
      exo.pelvis.position.y = 2.35 - crouch * .42;
      exo.torso.rotation.x = crouch * .22 + punch * .10;
      exo.torso.rotation.y = -punch * .28;
      exo.shoulders[0].arm.rotation.x = -0.22 - punch * 1.25;
      exo.shoulders[0].arm.rotation.z = .18 + punch * .12;
      exo.shoulders[0].elbow.rotation.x = -0.55 + punch * .10;
      exo.shoulders[1].arm.rotation.x = .2 + crouch * .5 + Math.sin(tl * 1.6) * .05;
      exo.shoulders[1].elbow.rotation.x = -.55 - crouch * .6;
      exo.legs.forEach((L, i) => {
        L.leg.rotation.x = (i ? 1 : -1) * (crouch * .45 - punch * .25);
        L.knee.rotation.x = -crouch * .85 + punch * .22;
        L.leg.position.y = -.2 + crouch * .06;
      });
      // impact rings
      rings.forEach((r, i) => {
        const p = clamp((tl - 4.4 - i * .12) * 1.6, 0, 1);
        r.scale.setScalar(1 + p * 6.5);
        r.material.opacity = tl > 4.4 ? (1 - p) * .75 : 0;
      });
      burst.material.opacity = tl > 4.35 ? Math.max(0, 1 - (tl - 4.35) * .8) * .9 : 0;
      burst.scale.setScalar(1 + (tl - 4.35) * 1.4);
      // graph
      const gr = clamp((tl - 1.2) / 3.4, 0, 1);
      curveGeo.setDrawRange(0, Math.max(2, Math.floor(gr * CN)));
      const idx = Math.min(CN - 1, Math.floor(gr * (CN - 1)));
      peakDot.position.set(curvePos[idx * 3], curvePos[idx * 3 + 1], .03);
      peakDot.material.opacity = gr > .55 ? .9 : 0;
      // camera
      const p = easeIO(tl / 10);
      CAM.set(
        new THREE.Vector3(lerp(11.5, 8.4, p), lerp(4.2, 3.4, p), lerp(10.5, 8.6, p)),
        new THREE.Vector3(lerp(0, .4, p), lerp(2.6, 2.4, p), 0)
      );
    },
    labels: [
      { p: new THREE.Vector3(0, 5.5, 0), k: 'EXO-FRAME / UNMANNED', v: '外骨骼 · 无人对抗测试', t0: .8, t1: 9.6 },
      { p: new THREE.Vector3(2.4, 2.4, 1.6), k: 'IMPACT LOAD', v: '峰值 18.6 kN', t0: 4.5, t1: 9.6, cls: 'r' },
      { p: new THREE.Vector3(2.05, 4.3, 0), k: 'LOAD CURVE', v: '阈值 12.0 kN · 超限 55%', t0: 3.0, t1: 9.6, cls: 'o' }
    ],
    tel: tl => [
      ['测试编号', 'EXO-AT-019', ''],
      ['液压压力', (tl > 4.3 && tl < 5.4 ? 41 + Math.random() * 3 : 24 + Math.sin(tl) * 1.4).toFixed(1) + ' MPa', tl > 4.3 && tl < 5.4 ? 'crit' : ''],
      ['冲击载荷', (tl > 4.3 ? (18.6 * Math.exp(-(tl - 4.4) * .55)).toFixed(1) : (1.2 + Math.sin(tl * 2) * .2).toFixed(1)) + ' kN', tl > 4.4 && tl < 6.6 ? 'crit' : ''],
      ['关节扭矩', (312 + Math.sin(tl * 1.7) * 22).toFixed(0) + ' N·m', 'warn'],
      ['操作员', 'NONE / 无人', ''],
      ['结论', tl > 5.4 ? 'STRUCTURE OK' : 'RUNNING…', '']
    ]
  };
};

/* =======================================================================
   SHOT 10 — 木星引力弹弓 / 洛希极限
   ======================================================================= */
function jupiterTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#8a6a4a'); grd.addColorStop(.18, '#c9a97e');
  grd.addColorStop(.34, '#8d6f52'); grd.addColorStop(.52, '#d8bb92');
  grd.addColorStop(.68, '#96744f'); grd.addColorStop(.84, '#c2a079');
  grd.addColorStop(1, '#6d553d');
  g.fillStyle = grd; g.fillRect(0, 0, 1024, 512);
  // turbulent bands
  for (let i = 0; i < 460; i++) {
    const y = Math.random() * 512, h = rand(16, 3);
    const a = rand(.14, .02);
    g.fillStyle = Math.random() > .5 ? `rgba(255,235,205,${a})` : `rgba(60,38,24,${a})`;
    g.beginPath();
    g.ellipse(rand(1024), y, rand(300, 60), h, 0, 0, TAU); g.fill();
  }
  // great red spot
  const rg = g.createRadialGradient(700, 320, 4, 700, 320, 90);
  rg.addColorStop(0, 'rgba(214,96,52,.95)');
  rg.addColorStop(.5, 'rgba(178,74,42,.75)');
  rg.addColorStop(1, 'rgba(140,70,50,0)');
  g.fillStyle = rg;
  g.beginPath(); g.ellipse(700, 320, 96, 52, 0, 0, TAU); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

REG[9] = function () {
  const g = new THREE.Group();
  const R = 15;
  const tex = jupiterTexture();
  const planet = new THREE.Mesh(new THREE.SphereGeometry(R, 72, 54), new THREE.MeshBasicMaterial({
    map: tex, color: 0xb98a5e
  }));
  g.add(planet);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.03, 48, 32), new THREE.MeshBasicMaterial({
    color: 0xffc08a, transparent: true, opacity: .10, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false
  }));
  g.add(atmo);
  // terminator shading via a big soft light? keep standard light

  // Roche limit
  const rocheR = R * 1.62;
  const roche = new THREE.Mesh(new THREE.RingGeometry(rocheR, rocheR + .35, 160), new THREE.MeshBasicMaterial({
    color: 0xff3348, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
  }));
  roche.rotation.x = -Math.PI / 2 + .18; g.add(roche);
  const roche2 = new THREE.Mesh(new THREE.RingGeometry(rocheR + .9, rocheR + .95, 160), new THREE.MeshBasicMaterial({
    color: 0xff3348, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
  }));
  roche2.rotation.copy(roche.rotation); g.add(roche2);
  const rocheDots = new THREE.Group(); g.add(rocheDots);
  for (let i = 0; i < 40; i++) {
    const a = i / 40 * TAU;
    const d = new THREE.Mesh(new THREE.BoxGeometry(.28, .28, .28), new THREE.MeshBasicMaterial({ color: 0xff5566 }));
    d.position.set(Math.cos(a) * rocheR, Math.sin(a) * rocheR * .18, Math.sin(a) * rocheR * .98);
    rocheDots.add(d);
  }

  // trajectory
  const pts = [
    new THREE.Vector3(-78, -16, 40),
    new THREE.Vector3(-44, -8, 26),
    new THREE.Vector3(-20, 0, 14),
    new THREE.Vector3(4, 5, 2),
    new THREE.Vector3(24, 2, -8),
    new THREE.Vector3(30, -8, -22),
    new THREE.Vector3(10, -20, -46),
    new THREE.Vector3(-30, -30, -66)
  ];
  const curve = new THREE.CatmullRomCurve3(pts);
  const cpts = curve.getPoints(320);
  const cgeo = new THREE.BufferGeometry().setFromPoints(cpts);
  const cline = new THREE.Line(cgeo, lineMat(COL.g, .55)); g.add(cline);
  const cglow = new THREE.Line(cgeo, lineMat(COL.g, .18)); cglow.scale.multiplyScalar(1.004); g.add(cglow);
  cgeo.setDrawRange(0, 2);
  const probe = new THREE.Group(); g.add(probe);
  const pMesh = new THREE.Mesh(new THREE.ConeGeometry(.6, 2.2, 10), new THREE.MeshStandardMaterial({ color: 0xbfd8e2, metalness: .9, roughness: .3 }));
  pMesh.rotation.x = Math.PI / 2; probe.add(pMesh);
  probe.add(glowSprite(0x9dffe0, 4, .7));

  // hazard ticks around roche
  const wide = new THREE.Group(); g.add(wide);
  wide.add(measureLine(new THREE.Vector3(rocheR, 0, 0), new THREE.Vector3(rocheR + 7, 0, 0), COL.r, .6));

  return {
    group: g,
    update(tl) {
      planet.rotation.y = tl * .045;
      tex.offset.x = tl * .004;
      roche.material.opacity = .35 + .35 * Math.abs(Math.sin(tl * 1.4));
      rocheDots.children.forEach((d, i) => {
        const a = i / 40 * TAU + tl * .1;
        d.position.set(Math.cos(a) * rocheR, Math.sin(a) * rocheR * .18, Math.sin(a) * rocheR * .98);
        d.material.opacity = .4 + .5 * Math.sin(tl * 3 + i);
      });
      const prog = clamp((tl - .4) / 8.6, 0, 1);
      cgeo.setDrawRange(0, Math.max(2, Math.floor(prog * 321)));
      const ip = Math.min(.998, prog * .98);
      const pp = curve.getPointAt(ip);
      probe.position.copy(pp);
      probe.lookAt(curve.getPointAt(Math.min(.999, ip + .01)));
      probe.children[1].material.opacity = .5 + .4 * Math.sin(tl * 5);
      const p = easeIO(tl / 10);
      CAM.set(
        new THREE.Vector3(lerp(-24, -12, p), lerp(24, 16, p), lerp(74, 62, p)),
        new THREE.Vector3(0, lerp(0, 1, p), 0)
      );
    },
    labels: [
      { p: new THREE.Vector3(0, 17.6, 0), k: 'JUPITER / GRAVITY ASSIST', v: '木星引力弹弓', t0: 1.2, t1: 9.6 },
      { p: new THREE.Vector3(rocheR + 8.4, 0, 0), k: 'ROCHE LIMIT', v: '洛希极限 · 不可逾越', t0: 3.0, t1: 9.6, cls: 'r' },
      { p: new THREE.Vector3(-24, 2, 16), k: 'TRANSFER WINDOW', v: '窗口 2027.03 · 误差 ±0.4 s', t0: 5.0, t1: 9.6, cls: 'o' }
    ],
    tel: tl => [
      ['引力弹弓', '木星 / JUPITER', ''],
      ['最近距离', (lerp(320000, 268000, inv(0, 9, tl))).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' km', 'warn'],
      ['洛希极限', '2.44 R☉', 'crit'],
      ['速度增量', '+' + (12.4 + Math.sin(tl) * .3).toFixed(2) + ' km/s', ''],
      ['轨道偏心率', (0.041 + inv(0, 9, tl) * .63).toFixed(3), 'warn'],
      ['警告', tl > 3.2 ? 'TIDAL STRESS / 潮汐应力' : 'NOMINAL', tl > 3.2 ? 'crit' : '']
    ]
  };
};

/* =======================================================================
   SHOT 11 — 太阳核心异常
   ======================================================================= */
function sunTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#ff7a12'; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 1400; i++) {
    const r = rand(46, 4), x = rand(1024), y = rand(512);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const hot = Math.random() > .45;
    gr.addColorStop(0, hot ? 'rgba(255,246,200,.55)' : 'rgba(180,42,0,.35)');
    gr.addColorStop(1, 'rgba(255,120,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
REG[10] = function () {
  const g = new THREE.Group();
  const R = 22;
  const tex = sunTexture();
  const sun = new THREE.Mesh(new THREE.SphereGeometry(R, 72, 56, .5, TAU - 1.15), new THREE.MeshBasicMaterial({
    map: tex, color: 0xff5a12, side: THREE.DoubleSide
  }));
  g.add(sun);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(R * 1.08, 56, 38, .5, TAU - 1.15), new THREE.MeshBasicMaterial({
    color: 0xff5a10, transparent: true, opacity: .28, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false
  }));
  const sunWire = new THREE.Mesh(new THREE.SphereGeometry(R * 1.005, 24, 16), new THREE.MeshBasicMaterial({
    color: 0xffb070, wireframe: true, transparent: true, opacity: .10, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  g.add(sunWire);
  g.add(shell);
  const corona = glowSprite(0xff7a20, 120, .35); g.add(corona);

  /* 剖面盘 : 把太阳切开，露出核心 */
  const dc = document.createElement('canvas'); dc.width = dc.height = 512;
  const dg = dc.getContext('2d');
  const dgrad = dg.createRadialGradient(256, 256, 6, 256, 256, 256);
  dgrad.addColorStop(0, '#ffd98a'); dgrad.addColorStop(.07, '#ff9c2a');
  dgrad.addColorStop(.20, '#e0530c'); dgrad.addColorStop(.46, '#932405');
  dgrad.addColorStop(.74, '#4a1102'); dgrad.addColorStop(1, '#160400');
  dg.fillStyle = dgrad; dg.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 220; i++) {
    const a = rand(TAU), r = Math.pow(Math.random(), .6) * 250;
    dg.strokeStyle = `rgba(255,${180 + Math.random() * 60 | 0},90,${rand(.22, .05)})`;
    dg.lineWidth = rand(2.4, .5);
    dg.beginPath(); dg.arc(256, 256, r, a, a + rand(.9, .15)); dg.stroke();
  }
  const cutTex = new THREE.CanvasTexture(dc); cutTex.encoding = THREE.sRGBEncoding;
  const cut = new THREE.Mesh(new THREE.CircleGeometry(R * .995, 96), new THREE.MeshBasicMaterial({
    map: cutTex, transparent: true, opacity: .95, side: THREE.DoubleSide
  }));
  cut.position.z = -.2; g.add(cut);
  const cutRing = new THREE.Mesh(new THREE.RingGeometry(R * .97, R * 1.01, 96), new THREE.MeshBasicMaterial({
    color: 0xffc070, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
  }));
  cutRing.position.z = .1; g.add(cutRing);

  // prominence arcs
  const proms = [];
  for (let i = 0; i < 7; i++) {
    const a = rand(TAU), b = a + rand(1.4, .5);
    const p1 = new THREE.Vector3(Math.cos(a), rand(.5, -.4), Math.sin(a)).normalize().multiplyScalar(R);
    const p2 = new THREE.Vector3(Math.cos(b), rand(.5, -.4), Math.sin(b)).normalize().multiplyScalar(R);
    const mid = p1.clone().add(p2).multiplyScalar(.5).normalize().multiplyScalar(R * rand(1.5, 1.16));
    const cv = new THREE.QuadraticBezierCurve3(p1, mid, p2);
    const geo = new THREE.BufferGeometry().setFromPoints(cv.getPoints(60));
    const ln = new THREE.Line(geo, lineMat(i % 2 ? COL.o : 0xffd08a, .55));
    g.add(ln); proms.push(ln);
  }

  // scan / cutaway plane
  const scanPlane = new THREE.Mesh(new THREE.RingGeometry(R * .1, R * 1.02, 96, 1), new THREE.MeshBasicMaterial({
    color: 0x8affd6, transparent: true, opacity: .12, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
  }));
  scanPlane.rotation.x = -Math.PI / 2; g.add(scanPlane);
  const scanRing = new THREE.Mesh(new THREE.TorusGeometry(R * .99, .12, 6, 128), new THREE.MeshBasicMaterial({
    color: 0x9dffe0, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  scanRing.rotation.x = Math.PI / 2; g.add(scanRing);

  // anomaly core
  const core = new THREE.Mesh(new THREE.SphereGeometry(5.4, 32, 24), new THREE.MeshBasicMaterial({
    color: 0xb8060c, transparent: true, opacity: .95
  }));
  core.position.z = 6; g.add(core);
  const coreGlow = glowSprite(0xff2a10, 22, .55); coreGlow.position.z = 6; g.add(coreGlow);
  const coreWire = new THREE.Mesh(new THREE.SphereGeometry(7.8, 20, 14), new THREE.MeshBasicMaterial({
    color: 0xff5566, wireframe: true, transparent: true, opacity: .35, blending: THREE.AdditiveBlending
  }));
  coreWire.position.z = 6; g.add(coreWire);

  // data tick rings
  const rings = [];
  for (let i = 0; i < 4; i++) {
    const rr = new THREE.Mesh(new THREE.TorusGeometry(6 + i * 2.4, .04, 5, 96), new THREE.MeshBasicMaterial({
      color: i % 2 ? 0xff3348 : 0x3fd0ff, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    rings.push(rr); g.add(rr);
  }

  return {
    group: g,
    update(tl) {
      sun.rotation.y = Math.PI / 2 + .55 + tl * .022; sunWire.rotation.y = sun.rotation.y;
      cut.rotation.z = .1 * Math.sin(tl * .3);
      tex.offset.x = tl * .012; tex.offset.y = Math.sin(tl * .2) * .02;
      corona.scale.setScalar(88 + Math.sin(tl * 1.2) * 5);
      corona.material.opacity = .35 + .08 * Math.sin(tl * 1.7);
      proms.forEach((p, i) => p.material.opacity = .2 + .4 * Math.abs(Math.sin(tl * .8 + i)));
      const pulse = 1 + Math.sin(tl * 2.2) * .06;
      core.scale.setScalar(pulse);
      coreGlow.scale.setScalar(26 * pulse);
      coreWire.rotation.y = tl * .5; coreWire.rotation.x = tl * .2;
      rings.forEach((r, i) => { r.rotation.z = tl * .3 * (i % 2 ? -1 : 1); r.rotation.x = 1.2 + i * .1; });
      scanRing.rotation.z = tl * .2;
      scanPlane.material.opacity = .08 + .05 * Math.sin(tl);
      const p = easeIO(tl / 10);
      CAM.set(
        new THREE.Vector3(Math.sin(.4 + p * .3) * lerp(108, 94, p), lerp(14, 10, p), Math.cos(.4 + p * .3) * lerp(108, 94, p)),
        new THREE.Vector3(0, 0, 0)
      );
    },
    labels: [
      { p: new THREE.Vector3(0, R + 5.5, 0), k: 'SOL / CORE MONITOR', v: '太阳 · 核心异常', t0: 1.0, t1: 9.6 },
      { p: new THREE.Vector3(6.4, 4.4, 0), k: 'ANOMALY Δ', v: '核心对流层失稳', t0: 3.2, t1: 9.6, cls: 'r' },
      { p: new THREE.Vector3(-16, -6, 8), k: 'NEUTRINO FLUX', v: '中微子通量 −38.4%', t0: 5.2, t1: 9.6, cls: 'o' }
    ],
    tel: tl => [
      ['核心温度', '1.57 × 10⁷ K', ''],
      ['异常区半径', (0.04 + inv(0, 9, tl) * .17).toFixed(3) + ' R☉', 'warn'],
      ['中微子通量', (-38.4 + Math.sin(tl) * 1.2).toFixed(1) + '%', 'crit'],
      ['日冕活动', 'CLASS X / 持续', 'crit'],
      ['预估寿命', tl > 5 ? '3.7 年' : 'CALC…', tl > 5 ? 'crit' : 'warn'],
      ['结论', tl > 6 ? '太阳氦闪 · 不可逆' : 'MONITORING', 'crit']
    ]
  };
};

/* =======================================================================
   SHOT 12 — MOSS 提问 / 片尾
   ======================================================================= */
REG[11] = function () {
  const g = new THREE.Group();
  // MOSS eye
  const eye = new THREE.Group(); g.add(eye);
  const iris = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 24), new THREE.MeshBasicMaterial({
    color: 0x02110c, transparent: true, opacity: .9
  }));
  eye.add(iris);
  const irisWire = new THREE.Mesh(new THREE.SphereGeometry(6.02, 24, 16), new THREE.MeshBasicMaterial({
    color: 0x3dffb5, wireframe: true, transparent: true, opacity: .18, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  eye.add(irisWire);
  const lens = new THREE.Mesh(new THREE.SphereGeometry(2.4, 24, 18), new THREE.MeshBasicMaterial({
    color: 0x9dffe0, transparent: true, opacity: .85
  }));
  eye.add(lens);
  eye.add(glowSprite(0x9dffe0, 26, .55));
  // rotating aperture blades
  const blades = new THREE.Group(); eye.add(blades);
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * TAU;
    const b = new THREE.Mesh(new THREE.BoxGeometry(.08, 2.1, .05), new THREE.MeshBasicMaterial({
      color: i % 6 === 0 ? 0xff7a1e : 0x3dffb5, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    b.position.set(Math.cos(a) * 6.1, Math.sin(a) * 6.1, 0); b.rotation.z = a - Math.PI / 2;
    blades.add(b);
  }
  const halo = dashRing(9.6, COL.g, .5, 140); halo.position.z = -.4; eye.add(halo);
  const halo2 = dashRing(12.4, COL.o, .3, 140); halo2.position.z = -.6; eye.add(halo2);
  eye.position.set(0, 13.2, 0); eye.scale.setScalar(.50);

  // end title (DOM, created on demand)
  let card = null;

  return {
    group: g,
    update(tl) {
      eye.rotation.z = tl * .04;
      blades.rotation.z = -tl * .12;
      halo.rotation.z = tl * .18;
      halo2.rotation.z = -tl * .1;
      lens.scale.setScalar(1 + Math.sin(tl * 1.3) * .04);
      const p = tl / 10;
      CAM.set(new THREE.Vector3(0, 6.6, lerp(38, 31, easeOut(p))), new THREE.Vector3(0, 6.6, 0));
      if (card) {
        const a = smooth(inv(2.6, 4.2, tl));
        card.style.opacity = a;
        card.style.transform = `translate(-50%,-50%) scale(${1 + (1 - a) * .04})`;
        const sh = smooth(inv(6.6, 7.6, tl));
        card.querySelector('.ec-sub').style.opacity = sh;
      }
    },
    onEnter() {
      if (card) return;
      card = document.createElement('div');
      card.id = 'endcard';
      card.style.cssText = `position:absolute;left:50%;top:calc(50% + 96px);transform:translate(-50%,-50%);
        z-index:19;text-align:center;opacity:0;transition:opacity .5s linear;pointer-events:none`;
      card.innerHTML = `
        <div style="font-family:var(--cjk);font-size:12px;letter-spacing:.62em;color:rgba(61,255,181,.75);margin-bottom:20px">THE WANDERING EARTH III</div>
        <div style="font-family:var(--cjk);font-size:clamp(30px,5.2vw,62px);letter-spacing:.26em;color:#f4fffb;
          text-shadow:0 0 60px rgba(61,255,181,.35);font-weight:300;line-height:1.2">流浪地球 3</div>
        <div style="margin-top:22px;width:64px;height:1px;background:linear-gradient(90deg,transparent,rgba(61,255,181,.8),transparent);margin-left:auto;margin-right:auto"></div>
        <div class="ec-sub" style="font-family:var(--cjk);font-size:10.5px;letter-spacing:.42em;color:rgba(223,242,238,.42);margin-top:20px;opacity:0;transition:opacity 1.2s">
          概念设计 · 非官方推演 · AIGC 概念分享</div>`;
      document.getElementById('app').appendChild(card);
    },
    onExit() {
      if (card) { card.remove(); card = null; }
    },
    labels: [],
    tel: tl => [
      ['档案', 'SRC-3 / CONCEPT', ''],
      ['状态', 'MOSS · 独立运算', ''],
      ['结论', '文明延续概率 99.97%', ''],
      ['备注', '本片非官方物料', ''],
      ['—', '—', '']
    ]
  };
};
