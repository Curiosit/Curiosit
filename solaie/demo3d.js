/* Solaie landing page — 3D view of the sample model (three.js). Data from window.SolaieDemo. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const S = window.SolaieDemo;
const host = document.getElementById("v3d");
const nlab = document.getElementById("nlab");

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.prepend(renderer.domElement);
renderer.domElement.setAttribute("aria-label", "Model 3D: analizowany budynek, sąsiednie budynki i droga słońca");
renderer.domElement.setAttribute("role", "img");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 800);
camera.position.set(66, 58, 70);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(16, 5, 4);
controls.enableDamping = false;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 30; controls.maxDistance = 220;
controls.enableZoom = false;              /* page scroll stays page scroll */

/* local (u, v, h) → three (x=u, y=h, z=v) */
const V = (u, v, h) => new THREE.Vector3(u, h, v);

scene.add(new THREE.HemisphereLight(0xeef3fa, 0xc9c2b4, 1.5));
const sunLight = new THREE.DirectionalLight(0xfff1d6, 2.4);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
const sc = sunLight.shadow.camera; sc.left = -70; sc.right = 70; sc.top = 70; sc.bottom = -70; sc.near = 1; sc.far = 400;
sunLight.shadow.bias = -0.0004; sunLight.shadow.normalBias = 0.02;
const centre = V(20, 6, 0);
sunLight.target.position.copy(centre);
scene.add(sunLight, sunLight.target);

const ground = new THREE.Mesh(new THREE.CircleGeometry(110, 64), new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.position.set(20, 0, 6); ground.receiveShadow = true;
scene.add(ground);

/* street */
const street = new THREE.Mesh(new THREE.PlaneGeometry(130, 9), new THREE.MeshStandardMaterial({ color: 0xd6d2ca, roughness: 1 }));
street.rotation.x = -Math.PI / 2; street.position.set(20, 0.01, 9); street.receiveShadow = true;
scene.add(street);

for (const B of S.BOXES) {
  const g = new THREE.BoxGeometry(B.u[1] - B.u[0], B.h[1] - B.h[0], B.v[1] - B.v[0]);
  const m = new THREE.Mesh(g, B.own ? new THREE.MeshStandardMaterial({ color: 0xf6f3ec, roughness: 0.9 }) : new THREE.MeshStandardMaterial({ color: 0xc4cad3, roughness: 0.9, transparent: true, opacity: 0.42, depthWrite: false }));
  m.position.set((B.u[0] + B.u[1]) / 2, (B.h[0] + B.h[1]) / 2, (B.v[0] + B.v[1]) / 2);
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: 0x8a8f99, transparent: true, opacity: 0.55 }));
  edges.position.copy(m.position); scene.add(edges);
}

/* windows */
const VC = { pass: 0x1e9f63, flip: 0xd9900f, fail: 0xd23a2f };
const winGeo = new THREE.PlaneGeometry(S.dims.WW, S.dims.WH);
const winMeshes = S.windows.map((w, n) => {
  const m = new THREE.Mesh(winGeo, new THREE.MeshStandardMaterial({ color: VC[w.verdict], roughness: 0.4, emissive: VC[w.verdict], emissiveIntensity: 0.25 }));
  m.position.copy(V(w.u, 0.04, w.h)); m.receiveShadow = true; m.userData.n = n;
  scene.add(m); return m;
});
const selFrame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(S.dims.WW + 0.6, S.dims.WH + 0.6)), new THREE.LineBasicMaterial({ color: 0x111111 }));
scene.add(selFrame);

/* sun, sun path, ray */
const R = 95;
const sunBall = new THREE.Mesh(new THREE.SphereGeometry(2.6, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf2b544 }));
scene.add(sunBall);
let pathLine = null;
const rayGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
const rayLit = new THREE.LineBasicMaterial({ color: 0xe0a32b });
const rayOff = new THREE.LineDashedMaterial({ color: 0xb3261e, dashSize: 0.8, gapSize: 0.6 });
const ray = new THREE.Line(rayGeo, rayLit); scene.add(ray);

const dir3 = (d) => V(d[0], d[1], d[2]).normalize();
function dirOf(season, i) { return S.SEASONS[season].dir[i]; }

function rebuildPath() {
  if (pathLine) scene.remove(pathLine);
  const pts = [];
  const Sx = S.SEASONS[S.state.season];
  for (let i = 0; i < S.STEPS; i += 5) { if (Sx.sun[i].alt > 0) pts.push(centre.clone().add(dir3(Sx.dir[i]).multiplyScalar(R))); }
  pathLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0xe0a32b, dashSize: 2, gapSize: 1.6 }));
  pathLine.computeLineDistances(); scene.add(pathLine);
}

let lastSeason = -1;
function update() {
  const st = S.state, d = dirOf(st.season, st.minute), dv = dir3(d);
  if (st.season !== lastSeason) { rebuildPath(); lastSeason = st.season; }
  sunBall.position.copy(centre.clone().add(dv.clone().multiplyScalar(R)));
  sunBall.visible = S.SEASONS[st.season].sun[st.minute].alt > 0;
  sunLight.position.copy(centre.clone().add(dv.clone().multiplyScalar(160)));
  sunLight.intensity = sunBall.visible ? 2.4 : 0;
  const w = S.windows[st.sel];
  selFrame.position.copy(V(w.u, 0.06, w.h));
  const key = S.SEASONS[st.season].key;
  winMeshes.forEach((m, n) => { m.material.emissiveIntensity = S.windows[n].res[key].centre[st.minute] ? 0.75 : 0.18; });
  const p = [w.u, 0.02, w.h];
  const front = S.SEASONS[st.season].front[st.minute];
  ray.visible = !!front;
  if (front) {
    const t = S.hit(p, d), lit = t === Infinity;
    const len = lit ? R : t;
    rayGeo.setFromPoints([V(p[0], p[1], p[2]), V(p[0] + d[0] * len, p[1] + d[1] * len, p[2] + d[2] * len)]);
    ray.material = lit ? rayLit : rayOff; ray.computeLineDistances();
  }
  render();
}

/* north label: project a point north of the site */
const northWorld = (() => { const nu = S.U[1], nv = S.N[1]; return V(20 + nu * 48, 0.1, 6 + nv * 48); })();
const nArrow = new THREE.ArrowHelper(new THREE.Vector3(S.U[1], 0, S.N[1]).normalize(), V(20 + S.U[1] * 36, 0.2, 6 + S.N[1] * 36), 10, 0x13171c, 3, 2);
scene.add(nArrow);

function render() {
  renderer.render(scene, camera);
  const p = northWorld.clone().project(camera);
  const r = renderer.domElement.getBoundingClientRect();
  nlab.style.transform = `translate(${(p.x * 0.5 + 0.5) * r.width}px, ${(-p.y * 0.5 + 0.5) * r.height}px)`;
}
function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = w < 560 ? 46 : 34;
  camera.updateProjectionMatrix(); render();
}
new ResizeObserver(resize).observe(host);
controls.addEventListener("change", render);

/* pick a window */
const rc = new THREE.Raycaster(), ptr = new THREE.Vector2();
let down = null;
renderer.domElement.addEventListener("pointerdown", (e) => { down = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
  const r = renderer.domElement.getBoundingClientRect();
  ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  rc.setFromCamera(ptr, camera);
  const hitW = rc.intersectObjects(winMeshes)[0];
  if (hitW) S.set({ sel: hitW.object.userData.n });
});

S.on(update);
host.classList.add("ready");
resize(); update();
