import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Red neuronal 3D envolvente para el hero (DESIGN.md §5).
 *
 * - Nodos y conexiones procedurales (sin modelos externos).
 * - Pulsos lime que viajan por las conexiones y "encienden" los nodos.
 * - Cámara: rotación lenta + parallax con el mouse + dolly ligado al scroll
 *   (atraviesa la red al bajar).
 * - Se pausa fuera de pantalla / pestaña oculta. Con prefers-reduced-motion
 *   pinta un solo frame estático.
 *
 * Se carga con React.lazy para que Three.js vaya en un chunk aparte.
 */

const BG = 0x0b211f;
const NODE_COLOR = new THREE.Color(0x7fa39a);
const LIT_COLOR = new THREE.Color(0xc2e476);
const LINE_COLOR = 0x3f6b62;
const PULSE_COLOR = 0xc2e476;

function makeDotTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Punto aleatorio dentro de un elipsoide, con más densidad hacia el exterior. */
function randomInEllipsoid(rx: number, ry: number, rz: number): THREE.Vector3 {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(0.15 + 0.85 * Math.random());
  return new THREE.Vector3(
    rx * r * Math.sin(phi) * Math.cos(theta),
    ry * r * Math.sin(phi) * Math.sin(theta),
    rz * r * Math.cos(phi),
  );
}

export default function HeroNeural({ className = '' }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmall = window.innerWidth < 768;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch {
      return; // Sin WebGL: queda el fondo CSS del hero.
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(BG, 1);
    renderer.domElement.style.display = 'block';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(BG, 0.055);

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 0, 14);

    const world = new THREE.Group();
    scene.add(world);

    // ── Nodos ────────────────────────────────────────────
    const N = isSmall ? 240 : 620;
    const nodes: THREE.Vector3[] = [];
    for (let i = 0; i < N; i++) nodes.push(randomInEllipsoid(16, 9, 11));

    const nodePos = new Float32Array(N * 3);
    const nodeCol = new Float32Array(N * 3);
    const energy = new Float32Array(N); // 0..1, brillo de "encendido"
    nodes.forEach((p, i) => {
      nodePos.set([p.x, p.y, p.z], i * 3);
      nodeCol.set([NODE_COLOR.r, NODE_COLOR.g, NODE_COLOR.b], i * 3);
    });
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
    const colorAttr = new THREE.BufferAttribute(nodeCol, 3);
    nodeGeo.setAttribute('color', colorAttr);
    const dotTex = makeDotTexture();
    const nodeMat = new THREE.PointsMaterial({
      size: isSmall ? 0.16 : 0.13,
      map: dotTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      sizeAttenuation: true,
    });
    world.add(new THREE.Points(nodeGeo, nodeMat));

    // ── Conexiones (k vecinos más cercanos dentro de un radio) ─
    const K = 3;
    const MAX_D2 = 3.4 * 3.4;
    const edges: Array<[number, number]> = [];
    const adj: number[][] = Array.from({ length: N }, () => []);
    const seen = new Set<string>();
    for (let i = 0; i < N; i++) {
      const cand: Array<[number, number]> = [];
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const d2 = nodes[i].distanceToSquared(nodes[j]);
        if (d2 < MAX_D2) cand.push([d2, j]);
      }
      cand.sort((a, b) => a[0] - b[0]);
      for (const [, j] of cand.slice(0, K)) {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const e = edges.length;
        edges.push([i, j]);
        adj[i].push(e);
        adj[j].push(e);
      }
    }
    const linePos = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], e) => {
      linePos.set([nodes[a].x, nodes[a].y, nodes[a].z, nodes[b].x, nodes[b].y, nodes[b].z], e * 6);
    });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: LINE_COLOR,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    });
    world.add(new THREE.LineSegments(lineGeo, lineMat));

    // ── Pulsos ───────────────────────────────────────────
    const P = isSmall ? 26 : 56;
    interface Pulse { edge: number; from: number; to: number; t: number; speed: number }
    const pulses: Pulse[] = [];
    const randomEdge = () => Math.floor(Math.random() * edges.length);
    const spawn = (edge: number, from?: number): Pulse => {
      const [a, b] = edges[edge];
      const start = from ?? (Math.random() < 0.5 ? a : b);
      return { edge, from: start, to: start === a ? b : a, t: Math.random(), speed: 0.35 + Math.random() * 0.5 };
    };
    if (edges.length) for (let i = 0; i < P; i++) pulses.push(spawn(randomEdge()));

    const pulsePos = new Float32Array(P * 3);
    const pulseGeo = new THREE.BufferGeometry();
    const pulseAttr = new THREE.BufferAttribute(pulsePos, 3);
    pulseGeo.setAttribute('position', pulseAttr);
    const pulseMat = new THREE.PointsMaterial({
      size: isSmall ? 0.42 : 0.36,
      map: dotTex,
      color: PULSE_COLOR,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    world.add(new THREE.Points(pulseGeo, pulseMat));

    const tmp = new THREE.Vector3();
    function updatePulses(dt: number) {
      for (let i = 0; i < pulses.length; i++) {
        const p = pulses[i];
        p.t += p.speed * dt;
        if (p.t >= 1) {
          energy[p.to] = 1;
          // Continúa la cadena por otra conexión del nodo destino (efecto sinapsis).
          const options = adj[p.to].filter((e) => e !== p.edge);
          const next = options.length && Math.random() < 0.8
            ? options[Math.floor(Math.random() * options.length)]
            : randomEdge();
          const np = spawn(next, options.includes(next) ? p.to : undefined);
          np.t = 0;
          pulses[i] = np;
          continue;
        }
        tmp.lerpVectors(nodes[p.from], nodes[p.to], p.t);
        pulsePos[i * 3] = tmp.x;
        pulsePos[i * 3 + 1] = tmp.y;
        pulsePos[i * 3 + 2] = tmp.z;
      }
      pulseAttr.needsUpdate = true;

      let dirty = false;
      for (let i = 0; i < N; i++) {
        if (energy[i] <= 0) continue;
        energy[i] = Math.max(0, energy[i] - dt * 2.2);
        const k = energy[i];
        nodeCol[i * 3] = NODE_COLOR.r + (LIT_COLOR.r - NODE_COLOR.r) * k;
        nodeCol[i * 3 + 1] = NODE_COLOR.g + (LIT_COLOR.g - NODE_COLOR.g) * k;
        nodeCol[i * 3 + 2] = NODE_COLOR.b + (LIT_COLOR.b - NODE_COLOR.b) * k;
        dirty = true;
      }
      if (dirty) colorAttr.needsUpdate = true;
    }

    // ── Interacción: mouse + scroll ──────────────────────
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointer = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    const scrollProgress = () => {
      const h = host.getBoundingClientRect().height || window.innerHeight;
      return Math.min(1, Math.max(0, window.scrollY / h));
    };

    // ── Resize ───────────────────────────────────────────
    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      camera.position.x = w > 1024 ? -1.5 : 0; // deja aire a la izquierda para el texto
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    // ── Loop ─────────────────────────────────────────────
    const clock = new THREE.Clock();
    let raf = 0;
    let running = false;
    let inView = true;
    let elapsed = 0;

    const frame = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      updatePulses(dt);

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      world.rotation.y = elapsed * 0.035 + mouse.x * 0.18;
      world.rotation.x = Math.sin(elapsed * 0.12) * 0.05 + mouse.y * 0.1;

      const s = scrollProgress();
      camera.position.z = 14 - s * 11;
      camera.position.y = -s * 1.2;
      camera.lookAt(camera.position.x, camera.position.y, camera.position.z - 10);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || reduceMotion) return;
      running = true;
      clock.getDelta();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView && !document.hidden) start();
      else stop();
    });
    io.observe(host);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (inView) start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    if (reduceMotion) {
      // Un frame estático, con algunos nodos encendidos.
      for (let i = 0; i < N; i += 9) energy[i] = 0.9;
      updatePulses(0);
      camera.lookAt(camera.position.x, 0, 0);
      renderer.render(scene, camera);
    } else {
      start();
    }

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      nodeGeo.dispose();
      lineGeo.dispose();
      pulseGeo.dispose();
      nodeMat.dispose();
      lineMat.dispose();
      pulseMat.dispose();
      dotTex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className={className} aria-hidden />;
}
