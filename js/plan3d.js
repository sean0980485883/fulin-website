// 富林組合屋 3D 示意（由 2D 平面圖自動產生）
import * as THREE from './three.module.min.js';
import { OrbitControls } from './OrbitControls.js';

const K = 0.01;            // 公分 → 公尺
const FH = 280;            // 每層外高（公分）
let R = null;

function woodTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  for (let x = 0; x < 256; x += 16) {
    const l = 40 + Math.random() * 10;
    g.fillStyle = `hsl(${22 + Math.random() * 6},${48 + Math.random() * 8}%,${l}%)`;
    g.fillRect(x, 0, 16, 256);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, 0, 1.5, 256);
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(60,30,10,.12)'; g.fillRect(x + 3 + Math.random() * 10, Math.random() * 256, 1, 30 + Math.random() * 60); }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function panelTexture(base) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, 128, 128);
  g.fillStyle = 'rgba(0,0,0,.10)'; for (let x = 0; x < 128; x += 32) g.fillRect(x, 0, 2, 128);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function show(wrap, S, ctx) {
  hide();
  const { COLORS, roofCalc, box } = ctx;
  const W = wrap.clientWidth || window.innerWidth, H = wrap.clientHeight || window.innerHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  wrap.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d6e6ec');
  scene.fog = new THREE.Fog('#d6e6ec', 60, 160);
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 500);

  scene.add(new THREE.HemisphereLight('#ffffff', '#6f8a5a', 0.9));
  const sun = new THREE.DirectionalLight('#ffffff', 1.6);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);

  const C = COLORS[S.color || 0];
  const frameColor = C[1] === '#1d2224' ? '#23292b' : '#eef0ec';
  const wood = woodTexture();
  const boardMat = C[2] === 'wood'
    ? new THREE.MeshStandardMaterial({ map: wood, roughness: .8 })
    : new THREE.MeshStandardMaterial({ map: panelTexture(C[2] === 'white' ? '#f2f2ee' : '#3e4446'), roughness: .7 });
  const frameMat = new THREE.MeshStandardMaterial({ color: frameColor, roughness: .5, metalness: .2 });
  const capMat = new THREE.MeshStandardMaterial({ color: '#2f3537', roughness: .7 });
  const floorMat = new THREE.MeshStandardMaterial({ color: '#b9ab98', roughness: .9 });
  const glassMat = new THREE.MeshStandardMaterial({ color: '#8fc9ea', roughness: .1, metalness: .3, transparent: true, opacity: .75 });
  const white = new THREE.MeshStandardMaterial({ color: '#f5f5f2', roughness: .6 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2b3032', roughness: .5 });
  const group = new THREE.Group(); scene.add(group);

  // 放一個方塊：x,z 為中心（公分），y0 為底（公分），w/d 為 x/z 方向尺寸
  function blk(w, h, d, x, y0, z, mat, cast = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w * K, h * K, d * K), mat);
    m.position.set(x * K, (y0 + h / 2) * K, z * K); m.castShadow = cast; m.receiveShadow = true; group.add(m); return m;
  }
  const items = S.items;
  const fy = f => ((f || 1) - 1) * FH;

  // 組合屋
  items.filter(i => i.k === 'mod').forEach(m => {
    const b = box(m), y0 = fy(m.floor), w = b.x1 - b.x0, d = b.y1 - b.y0, cx = (b.x0 + b.x1) / 2, cz = (b.y0 + b.y1) / 2;
    blk(w, 10, d, cx, y0, cz, floorMat);
    const P = 16;
    [[b.x0 + P / 2, b.y0 + P / 2], [b.x1 - P / 2, b.y0 + P / 2], [b.x0 + P / 2, b.y1 - P / 2], [b.x1 - P / 2, b.y1 - P / 2]].forEach(p => blk(P, FH, P, p[0], y0, p[1], frameMat));
    [[y0, 18], [y0 + FH - 18, 18]].forEach(([yy, hh]) => {
      blk(w, hh, P, cx, yy, b.y0 + P / 2, frameMat); blk(w, hh, P, cx, yy, b.y1 - P / 2, frameMat);
      blk(P, hh, d, b.x0 + P / 2, yy, cz, frameMat); blk(P, hh, d, b.x1 - P / 2, yy, cz, frameMat);
    });
    const wh = FH - 36, t = 6;
    const tex = (mesh, len) => { if (mesh.material.map) { mesh.material = mesh.material.clone(); mesh.material.map = mesh.material.map.clone(); mesh.material.map.repeat.set(len / 120, 1); mesh.material.map.needsUpdate = true; } };
    tex(blk(w - 2 * P, wh, t, cx, y0 + 18, b.y0 + P / 2, boardMat), w);
    tex(blk(w - 2 * P, wh, t, cx, y0 + 18, b.y1 - P / 2, boardMat), w);
    tex(blk(t, wh, d - 2 * P, b.x0 + P / 2, y0 + 18, cz, boardMat), d);
    tex(blk(t, wh, d - 2 * P, b.x1 - P / 2, y0 + 18, cz, boardMat), d);
    blk(w, 6, d, cx, y0 + FH, cz, capMat);
  });

  // 門窗
  items.filter(i => i.k === 'win' || i.k === 'door').forEach(o => {
    const y0 = fy(o.floor), along = o.rot % 180 === 0, L = o.w, T = 14;
    let yb, hh, mat;
    if (o.k === 'win') { yb = 100; hh = o.id === 'wsmall' ? 50 : 110; if (o.id === 'wsmall') yb = 160; mat = glassMat; }
    else { yb = 18; hh = 212; mat = o.slide || o.id === 'd3in1' ? glassMat : ((o.color || '').indexOf('白') >= 0 ? white : dark); }
    const fw = along ? L + 8 : T, fd = along ? T : L + 8;
    blk(fw, hh + 8, fd, o.cx, y0 + yb - 4, o.cy, frameMat, false);
    blk(along ? L : T + 2, hh, along ? T + 2 : L, o.cx, y0 + yb, o.cy, mat, false);
  });

  // 隔間牆
  items.filter(i => i.k === 'wall').forEach(o => { const b = box(o); blk(b.x1 - b.x0, FH - 36, b.y1 - b.y0, (b.x0 + b.x1) / 2, fy(o.floor) + 10, (b.y0 + b.y1) / 2, white); });
  // 衛浴
  items.filter(i => i.k === 'bath').forEach(o => { const b = box(o); blk(b.x1 - b.x0, 215, b.y1 - b.y0, (b.x0 + b.x1) / 2, fy(o.floor) + 10, (b.y0 + b.y1) / 2, new THREE.MeshStandardMaterial({ color: '#dcecf1', roughness: .4 })); });
  // 家具
  const FU = { bed: [45, '#d9cfc2'], ward: [200, '#c4ab8c'], table: [75, '#a87b52'], sofa: [80, '#7d8a90'] };
  items.filter(i => i.k === 'furn').forEach(o => { const b = box(o), f = FU[o.f] || [60, '#ccc']; blk(b.x1 - b.x0, f[0], b.y1 - b.y0, (b.x0 + b.x1) / 2, fy(o.floor) + 10, (b.y0 + b.y1) / 2, new THREE.MeshStandardMaterial({ color: f[1], roughness: .8 })); });
  // 露台
  items.filter(i => i.k === 'deck').forEach(o => {
    const b = box(o), w = b.x1 - b.x0, d = b.y1 - b.y0, cx = (b.x0 + b.x1) / 2, cz = (b.y0 + b.y1) / 2, y0 = fy(o.floor);
    const dm = new THREE.MeshStandardMaterial({ map: wood.clone(), roughness: .9 }); dm.map.repeat.set(1, w / 100); dm.map.rotation = Math.PI / 2; dm.map.needsUpdate = true;
    blk(w, 14, d, cx, y0, cz, dm);
    if (o.id === 'fdeck') { [[b.x0 + 6, b.y0 + 6], [b.x1 - 6, b.y0 + 6], [b.x0 + 6, b.y1 - 6], [b.x1 - 6, b.y1 - 6]].forEach(p => blk(10, 260, 10, p[0], y0, p[1], frameMat)); blk(w, 8, d, cx, y0 + 260, cz, capMat); }
  });
  // 樓梯
  items.filter(i => i.k === 'stair').forEach(o => {
    const b = box(o), y0 = fy(o.floor), n = 14, along = o.rot % 180 === 0;
    const len = along ? b.y1 - b.y0 : b.x1 - b.x0, wid = along ? b.x1 - b.x0 : b.y1 - b.y0, dir = (o.rot === 0 || o.rot === 90) ? -1 : 1;
    for (let s = 0; s < n; s++) {
      const pos = (along ? (dir < 0 ? b.y1 : b.y0) : (dir < 0 ? b.x1 : b.x0)) + dir * (s + .5) * len / n;
      if (along) blk(wid, 6, len / n, (b.x0 + b.x1) / 2, y0 + (s + 1) * FH / n - 6, pos, dark);
      else blk(len / n, 6, wid, pos, y0 + (s + 1) * FH / n - 6, (b.y0 + b.y1) / 2, dark);
    }
  });
  // 燈具（天花板發光）
  items.filter(i => i.k === 'elec' && /lamp|led|track|wclamp/.test(i.id)).forEach(o => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .04, 20), new THREE.MeshStandardMaterial({ color: '#fff7d6', emissive: '#ffe9a6', emissiveIntensity: .9 }));
    m.position.set(o.cx * K, (fy(o.floor) + FH - 22) * K, o.cy * K); group.add(m);
  });
  // 屋頂
  const maxF = Math.max(1, ...items.filter(i => i.k === 'mod').map(i => i.floor || 1));
  if (S.roof) {
    const r = roofCalc();
    if (r) {
      const type = S.roof.i, top = maxF * FH + 6, w = r.x1 - r.x0, d = r.y1 - r.y0, cx = (r.x0 + r.x1) / 2, cz = (r.y0 + r.y1) / 2;
      const along = w >= d, span = along ? d : w, len = along ? w : d;
      const rm = new THREE.MeshStandardMaterial({ color: type === 2 ? '#3a4b58' : '#5d676b', roughness: .6, metalness: .3, side: THREE.DoubleSide });
      const plate = (sp, ang, off) => {
        const g = new THREE.Mesh(new THREE.BoxGeometry((along ? len : sp) * K, 6 * K, (along ? sp : len) * K), rm);
        g.castShadow = true; g.receiveShadow = true;
        const rise = Math.sin(Math.abs(ang)) * sp / 2;
        g.position.set((cx + (along ? 0 : off)) * K, (top + rise + 20) * K, (cz + (along ? off : 0)) * K);
        if (along) g.rotation.x = ang; else g.rotation.z = -ang;
        group.add(g);
      };
      if (type === 1 || type === 2) { const a = 0.32, half = span / 2 / Math.cos(a); plate(half, -a, -span / 4); plate(half, a, span / 4); }
      else if (type === 0 || type === 4) { const a = 0.1; plate(span / Math.cos(a), a, 0); }
      else plate(span, 0.02, 0);
    }
  }

  // 地面
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: '#9db985', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(400, 400, '#8aa673', '#8aa673'); grid.position.y = .002; grid.material.opacity = .25; grid.material.transparent = true; scene.add(grid);

  // 相機定位
  const bb = new THREE.Box3().setFromObject(group), ctr = bb.getCenter(new THREE.Vector3()), size = bb.getSize(new THREE.Vector3());
  const dist = Math.max(size.x, size.z, size.y * 1.6) * 1.05 + 3;
  camera.position.set(ctr.x + dist * .75, ctr.y + dist * .6, ctr.z + dist * .95);
  sun.position.set(ctr.x + 20, 40, ctr.z + 15); sun.target.position.copy(ctr); scene.add(sun.target);
  const sc = sun.shadow.camera, ext = Math.max(size.x, size.z) * .9 + 6; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 120; sc.updateProjectionMatrix();
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(ctr); controls.enableDamping = true; controls.maxPolarAngle = Math.PI / 2 - .03; controls.minDistance = 2; controls.maxDistance = 120;
  controls.update();

  const ro = new ResizeObserver(() => { const w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); });
  ro.observe(wrap);
  let raf = 0; const loop = () => { raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); }; loop();
  R = { renderer, controls, ro, stop: () => cancelAnimationFrame(raf), scene };
}

export function snapshot() { return R ? R.renderer.domElement.toDataURL('image/png') : null; }

export function hide() {
  if (!R) return;
  R.stop(); R.ro.disconnect(); R.controls.dispose();
  R.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } });
  R.renderer.dispose(); R.renderer.domElement.remove(); R = null;
}
