import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Scene as GameScene } from '../game/scene';
import type { BoardViewModel } from '../viewModel';
import type { CollisionSignal, VanishSignal } from '../game/useGameController';
import { buildCubeTopology } from '../game/cube/cubeTopology';
import type { Vec3 } from '../game/cube/cubeTopology';
import { ARROW_LIFT, buildCubeRenderModel, cubeSizeFromNet } from '../game/cube/cubeRenderModel';
import { idleAngularVelocity } from '../game/cube/idleSpin';
import {
  CubeRailAnimator,
  RECOIL_MS,
  buildDevourRail,
  recoilOffset,
  sampleDevourShape,
  type RailSample3,
} from '../game/cube/cubeRail';
import {
  splitBodyByFace,
  projectDirToFace,
  sharedEdgeSegment,
  faceIndexOfPoint,
  warpToPieceCenters,
  type FaceRun,
} from '../game/cube/cubeFaceCanvas';
import { isFaceVisible, courtesyTarget, approachAngle } from '../game/cube/cubeCourtesy';
import { OrbitTapGesture } from '../input/orbitTapGesture';
import { SpinInertia } from '../input/spinInertia';
import { firstTapTarget } from '../input/tapOcclusion';
import { ARROW_GLYPH, DOT_RADIUS_RATIO } from '../theme';

/**
 * BoardComponent3D — Renderer three.js del MODO CUBO (Fase 4 completa).
 *
 * Convive con el SVG (BoardComponent) sin tocarlo: GameView decide por
 * mapMode. Lee la MISMA fuente que el 2D (BoardViewModel del GameController).
 *
 * Visual (diseño aprobado):
 *  - Las flechas son EL glifo 2D del juego (cuerpo redondeado + punta
 *    triangular, ratios de ARROW_GLYPH) pintado en un lienzo CanvasTexture
 *    por cara. Un glifo que cruza arista se parte exactamente en el borde de
 *    ambos lienzos: pliegue real (Opción A), con pulso de brillo de ~120ms
 *    sobre la arista cruzada.
 *  - Riel 3D: un CubeRailAnimator por flecha interpola entre proyecciones del
 *    dominio a velocidad constante; snap silencioso ante lo inesperado.
 *  - Devorado: al destruirse una flecha (señal vanishing), su forma se estira
 *    hacia el centro del cubo y se funde (fly-off reorientado adentro).
 *  - Cámara de cortesía: SOLO si el devorado ocurre en cara oculta; giro
 *    suave; cancelada si hay drag o inercia viva. Bloqueos = cámara quieta.
 *
 * Interacción: drag orbita desde cualquier punto (umbral 8px/200ms), inercia
 * con damping al soltar, tap con oclusión (solo se juega lo que se ve), idle
 * spin con pausa y rearranque suave.
 */

export interface BoardComponent3DProps {
  scene: GameScene;
  board: BoardViewModel;
  /** Con false, los taps se ignoran (slide en vuelo, pausa, terminal). */
  interactive: boolean;
  onArrowTap: (arrowId: string) => void;
  /** Señal de flecha destruida (del hook): dispara el devorado + cortesía. */
  vanishing?: VanishSignal;
  /** Señal de bloqueo (del hook): dispara el recoil del glifo, como el 2D. */
  collision?: CollisionSignal;
  /** True al ganar: dispara la explosión de victoria (prólogo del overlay). */
  won?: boolean;
}

const ORBIT_SPEED = 0.008; // rad por píxel de drag
const PITCH_LIMIT = 1.25;
const FACE_PX = 96; // resolución del lienzo por CELDA
const OVERLAY_LIFT = 0.1; // lienzo de glifos justo sobre las tapas de los bloques
const TILE_SIDE = 0.7; // lado del bloque (gap 0.3: ranuras anchas al universo)
const TILE_DEPTH = TILE_SIDE; // piezas CÚBICAS: profundidad = frente (arte v3)
const TILE_TOP = 0.04; // tapa casi a ras: las piezas de caras vecinas se
// encuentran en la arista con el MISMO ritmo de ranura que dentro de la cara
// (sin franja del cuerpo interior en el perímetro — arte v4).
const PULSE_MS = 120; // pulso de brillo en la arista al cruzar
const DEVOUR_MS = 550; // duración del devorado
const COURTESY_RATE = 3.2; // velocidad de aproximación de la cámara de cortesía

export const BoardComponent3D: React.FC<BoardComponent3DProps> = ({
  scene,
  board,
  interactive,
  onArrowTap,
  vanishing,
  collision,
  won,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // La topología es función pura de la escena (constante durante la partida).
  const topo = useMemo(
    () => buildCubeTopology(cubeSizeFromNet(scene.cells)),
    [scene],
  );

  // Últimos props para los listeners (se enlazan una sola vez). Se sincronizan
  // en un efecto declarado ANTES que los demás (corre primero tras cada render).
  const interactiveRef = useRef(interactive);
  const onArrowTapRef = useRef(onArrowTap);
  const boardRef = useRef(board);
  useEffect(() => {
    interactiveRef.current = interactive;
    onArrowTapRef.current = onArrowTap;
    boardRef.current = board;
  });

  const worldRef = useRef<{
    syncArrows: () => void;
    startDevour: (signal: VanishSignal) => void;
    startRecoil: (arrowId: string) => void;
    startCelebration: () => void;
  } | null>(null);
  const lastVanishNonce = useRef(-1);
  const lastCollisionNonce = useRef(-1);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }

    const S = topo.size;
    const center = new THREE.Vector3(S / 2, S / 2, S / 2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);

    const scene3 = new THREE.Scene();
    // near=1: con near=0.1 la precisión del z-buffer a distancia orbital no
    // separa el lienzo (+0.07) de los tiles y los glifos parpadean según el
    // ángulo (z-fighting, visible sobre todo en buffers de 16 bits).
    const camera = new THREE.PerspectiveCamera(42, 1, 1, 60);

    scene3.add(new THREE.AmbientLight(0xffffff, 0.55));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
    keyLight.position.set(2.5 * S, 3 * S, 2 * S);
    scene3.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xbfd4ff, 0.55);
    fillLight.position.set(-2 * S, -1.5 * S, -2.5 * S);
    scene3.add(fillLight);

    // ── Bloques estilo Rubik: piezas biseladas independientes con ranura ──
    const model0 = buildCubeRenderModel(topo, boardRef.current);

    // Una ÚNICA geometría extruida con bisel real, instanciada 6·S² veces.
    // Bisel mínimo: bordes nítidos, piezas talladas (dirección de arte 5B).
    const bevel = 0.018;
    const body = TILE_SIDE - bevel * 2;
    const tileShape = new THREE.Shape();
    const r = 0.02; // esquinas casi vivas de la tapa
    const h = body / 2;
    tileShape.moveTo(-h + r, -h);
    tileShape.lineTo(h - r, -h);
    tileShape.quadraticCurveTo(h, -h, h, -h + r);
    tileShape.lineTo(h, h - r);
    tileShape.quadraticCurveTo(h, h, h - r, h);
    tileShape.lineTo(-h + r, h);
    tileShape.quadraticCurveTo(-h, h, -h, h - r);
    tileShape.lineTo(-h, -h + r);
    tileShape.quadraticCurveTo(-h, -h, -h + r, -h);
    const tileGeometry = new THREE.ExtrudeGeometry(tileShape, {
      depth: TILE_DEPTH - bevel * 2,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 1,
      curveSegments: 2,
    });
    // Pieza cúbica hundida en el cuerpo del cubo: la tapa queda casi a ras
    // (+TILE_TOP) y el resto se sumerge hacia el interior (universo).
    tileGeometry.translate(0, 0, TILE_TOP - (TILE_DEPTH - bevel));

    // Piezas con el COLOR DEL TABLERO 2D: la tapa toma el token CSS del
    // lienzo del SVG (--board-bg: blanco en claro, azul noche en oscuro) —
    // leído al montar; los laterales son la misma tinta oscurecida (la sombra
    // de la ranura vive en las caras internas de cada bloque, sin relleno).
    // polygonOffset: los lienzos de glifos ganan el depth-test.
    const boardBg =
      getComputedStyle(document.documentElement).getPropertyValue('--board-bg').trim() ||
      '#f8fafc';
    const capColor = new THREE.Color(boardBg);
    const sideColor = capColor.clone().multiplyScalar(0.3);
    const capMaterial = new THREE.MeshStandardMaterial({
      color: capColor,
      roughness: 0.55,
      metalness: 0.08,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: sideColor,
      roughness: 0.9,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    // Oclusor invisible: se CONSERVA con las piezas cúbicas — una ranura
    // alineada sigue siendo un túnel recto hasta la cara opuesta y un tap no
    // debe colarse a jugar lo oculto (material invisible = no pinta, el rayo pega).
    const occluderGeometry = new THREE.BoxGeometry(S, S, S);
    const occluderMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const occluderMesh = new THREE.Mesh(occluderGeometry, occluderMaterial);
    occluderMesh.position.set(S / 2, S / 2, S / 2);
    scene3.add(occluderMesh);

    // ── El universo interior ✨: estrellas + núcleo con glow ──
    // Tres nubes de Points con twinkle por grupo (opacidad senoidal desfasada)
    // y rotación lenta del conjunto. depthTest activo: solo se ven por las
    // ranuras y por el pozo (las piezas opacas las ocluyen).
    const starsGroup = new THREE.Group();
    starsGroup.position.set(S / 2, S / 2, S / 2);
    scene3.add(starsGroup);

    const STAR_COUNT = 2400; // compensa el gap ancho: interior vivo por las ranuras
    const STAR_TINTS: Array<[number, number, number]> = [
      [0.92, 0.92, 1.0], // blanco frío
      [0.75, 0.6, 1.0], // violeta
      [0.6, 0.78, 1.0], // azul
    ];
    const starClouds: Array<{ points: THREE.Points; material: THREE.PointsMaterial }> = [];
    const starGeometries: THREE.BufferGeometry[] = [];
    for (let g = 0; g < 3; g++) {
      const count = Math.floor(STAR_COUNT / 3);
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        // Distribución esférica interior (fuera del núcleo, dentro de la piel).
        const radiusStar = S * (0.1 + 0.36 * Math.cbrt(Math.random()));
        const theta = Math.random() * Math.PI * 2;
        const cosPhi = Math.random() * 2 - 1;
        const sinPhi = Math.sqrt(1 - cosPhi * cosPhi);
        positions[i * 3] = radiusStar * sinPhi * Math.cos(theta);
        positions[i * 3 + 1] = radiusStar * cosPhi;
        positions[i * 3 + 2] = radiusStar * sinPhi * Math.sin(theta);
        const tint = STAR_TINTS[i % STAR_TINTS.length];
        colors[i * 3] = tint[0];
        colors[i * 3 + 1] = tint[1];
        colors[i * 3 + 2] = tint[2];
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      starGeometries.push(geometry);
      const material = new THREE.PointsMaterial({
        size: 0.07,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
      const points = new THREE.Points(geometry, material);
      starsGroup.add(points);
      starClouds.push({ points, material });
    }

    // Núcleo: esfera clara + halo aditivo (gradiente radial en canvas) — el
    // corazón del universo al que caen las flechas devoradas (el devorado ya
    // apunta al centro del cubo).
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128;
    glowCanvas.height = 128;
    const glowCtx = glowCanvas.getContext('2d')!;
    const gradient = glowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,250,255,0.95)');
    gradient.addColorStop(0.25, 'rgba(200,160,255,0.55)');
    gradient.addColorStop(0.6, 'rgba(120,70,220,0.22)');
    gradient.addColorStop(1, 'rgba(60,20,120,0)');
    glowCtx.fillStyle = gradient;
    glowCtx.fillRect(0, 0, 128, 128);
    const glowTexture = new THREE.CanvasTexture(glowCanvas);
    glowTexture.colorSpace = THREE.SRGBColorSpace;
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const glowSprite = new THREE.Sprite(glowMaterial);
    glowSprite.scale.set(S * 0.42, S * 0.42, 1);
    starsGroup.add(glowSprite);

    const nucleusGeometry = new THREE.SphereGeometry(0.15, 16, 12);
    const nucleusMaterial = new THREE.MeshBasicMaterial({ color: '#efe6ff' });
    const nucleusMesh = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    starsGroup.add(nucleusMesh);

    // ── Explosión de victoria (prólogo visual del WON; jamás lo bloquea) ──
    const flashMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    });
    const flashSprite = new THREE.Sprite(flashMaterial);
    flashSprite.position.set(S / 2, S / 2, S / 2);
    flashSprite.scale.set(0.001, 0.001, 1);
    scene3.add(flashSprite);
    const shockGeometry = new THREE.RingGeometry(0.86, 1, 48);
    const shockMaterial = new THREE.MeshBasicMaterial({
      color: '#cdaaff',
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const shockMesh = new THREE.Mesh(shockGeometry, shockMaterial);
    shockMesh.position.set(S / 2, S / 2, S / 2);
    scene3.add(shockMesh);
    let celebrationStart = 0; // 0 = inactiva
    const CELEBRATION_MS = 1400;
    const startCelebration = (): void => {
      try {
        celebrationStart = performance.now();
      } catch {
        celebrationStart = 0; // snap silencioso: la celebración jamás revienta
      }
    };

    // Base DIESTRA por cara: (u, −v, normal). Con (u, v, normal) el determinante
    // es negativo (u×v = −normal): las caras quedan espejadas y el winding
    // invertido cullea los planos texturizados. Con −v, el +y local del plano
    // apunta hacia v=0 y el flipY por defecto de CanvasTexture alinea el canvas.
    const basisMatrix = (tile: { center: Vec3; u: Vec3; v: Vec3; normal: Vec3 }): THREE.Matrix4 => {
      const m = new THREE.Matrix4();
      m.makeBasis(
        new THREE.Vector3(tile.u.x, tile.u.y, tile.u.z),
        new THREE.Vector3(-tile.v.x, -tile.v.y, -tile.v.z),
        new THREE.Vector3(tile.normal.x, tile.normal.y, tile.normal.z),
      );
      m.setPosition(tile.center.x, tile.center.y, tile.center.z);
      return m;
    };

    // ── Construcción Rubik del sólido (arte v4.1) ──
    // Tres familias: piezas INTERIORES (extrusión biselada), piezas de ARISTA
    // (una caja por PAR de celdas conectadas a través del pliegue: sus dos
    // caras exteriores son las tapas de ambas celdas) y 8 piezas ESQUINERAS
    // (0.89³, muestran 3 caras). Así las piezas de caras vecinas SE ENCUENTRAN
    // en la arista con el mismo gap que dentro de la cara y el sólido cierra.
    const REACH = 1 - (1 - TILE_SIDE) / 2; // del plano de la arista al gap interior
    const CORNER_SIDE = REACH + TILE_TOP; // 0.89: llega al filo real del cubo

    const presentIds = new Set(model0.tiles.map((t) => t.id));
    const isFaceCorner = (i: number, j: number): boolean =>
      (i === 0 || i === S - 1) && (j === 0 || j === S - 1);

    // Celdas cubiertas por piezas de arista/esquina (no llevan tile interior).
    const coveredByBox = new Set<string>();

    // Esquineras: agrupa las celdas-esquina presentes por vértice del cubo.
    const cornerGroups = new Map<string, string[]>();
    for (const cell of topo.cells) {
      if (!presentIds.has(cell.id) || !isFaceCorner(cell.i, cell.j)) {
        continue;
      }
      const key = [
        cell.center.x < S / 2 ? 0 : S,
        cell.center.y < S / 2 ? 0 : S,
        cell.center.z < S / 2 ? 0 : S,
      ].join('|');
      cornerGroups.set(key, [...(cornerGroups.get(key) ?? []), cell.id]);
    }
    const cornerGeometry = new THREE.BoxGeometry(CORNER_SIDE, CORNER_SIDE, CORNER_SIDE);
    const cornerMeshes: THREE.Mesh[] = [];
    for (const [key, cellIds] of cornerGroups) {
      if (cellIds.length !== 3) {
        continue; // esquina incompleta (agujero): sus celdas caen al tile normal
      }
      cellIds.forEach((id) => coveredByBox.add(id));
      const [cxs, cys, czs] = key.split('|').map(Number);
      const centerOf = (coord: number): number =>
        coord === 0 ? CORNER_SIDE / 2 - TILE_TOP : S + TILE_TOP - CORNER_SIDE / 2;
      // Caras exteriores con tapa clara; el resto, laterales oscuros.
      const mats = [
        cxs === S ? capMaterial : sideMaterial, // +x
        cxs === 0 ? capMaterial : sideMaterial, // -x
        cys === S ? capMaterial : sideMaterial, // +y
        cys === 0 ? capMaterial : sideMaterial, // -y
        czs === S ? capMaterial : sideMaterial, // +z
        czs === 0 ? capMaterial : sideMaterial, // -z
      ];
      const mesh = new THREE.Mesh(cornerGeometry, mats);
      mesh.position.set(centerOf(cxs), centerOf(cys), centerOf(czs));
      scene3.add(mesh);
      cornerMeshes.push(mesh);
    }

    // Piezas de arista: una por conexión de pliegue entre celdas NO-esquina.
    const edgePairs: Array<{ a: string; b: string }> = [];
    for (const conn of topo.edgeConnections) {
      const a = topo.cellById.get(conn.fromCell)!;
      const b = topo.cellById.get(conn.toCell)!;
      if (
        presentIds.has(a.id) && presentIds.has(b.id) &&
        !isFaceCorner(a.i, a.j) && !isFaceCorner(b.i, b.j)
      ) {
        edgePairs.push({ a: a.id, b: b.id });
      }
    }
    const edgeGeometry = new THREE.BoxGeometry(TILE_SIDE, CORNER_SIDE, CORNER_SIDE);
    // Grupos de BoxGeometry: +x,-x,+y,-y,+z,-z → tapas en +y (normal A) y +z (normal B).
    const edgeMesh = new THREE.InstancedMesh(
      edgeGeometry,
      [sideMaterial, sideMaterial, capMaterial, sideMaterial, capMaterial, sideMaterial],
      edgePairs.length,
    );
    edgePairs.forEach(({ a, b }, idx) => {
      coveredByBox.add(a);
      coveredByBox.add(b);
      const cellA = topo.cellById.get(a)!;
      const cellB = topo.cellById.get(b)!;
      const nA = topo.faces[cellA.layer].normal;
      const nB = topo.faces[cellB.layer].normal;
      const seg = sharedEdgeSegment(topo.faces[cellA.layer], topo.faces[cellB.layer], S)!;
      const from = new THREE.Vector3(seg.from.x, seg.from.y, seg.from.z);
      const dir = new THREE.Vector3(seg.to.x - seg.from.x, seg.to.y - seg.from.y, seg.to.z - seg.from.z).normalize();
      const centerA = new THREE.Vector3(cellA.center.x, cellA.center.y, cellA.center.z);
      const along = centerA.clone().sub(from).dot(dir);
      const vA = new THREE.Vector3(nA.x, nA.y, nA.z);
      const vB = new THREE.Vector3(nB.x, nB.y, nB.z);
      // Base diestra garantizada: x = nA×nB (eje de la arista), y = nA, z = nB.
      const axisX = vA.clone().cross(vB).normalize();
      const m = new THREE.Matrix4().makeBasis(axisX, vA, vB);
      const pos = from
        .clone()
        .addScaledVector(dir, along)
        .addScaledVector(vA, TILE_TOP - CORNER_SIDE / 2)
        .addScaledVector(vB, TILE_TOP - CORNER_SIDE / 2);
      m.setPosition(pos.x, pos.y, pos.z);
      edgeMesh.setMatrixAt(idx, m);
    });
    edgeMesh.instanceMatrix.needsUpdate = true;
    scene3.add(edgeMesh);

    // Interiores (y celdas de borde huérfanas por agujero): la extrusión biselada.
    const interiorTiles = model0.tiles.filter((t) => !coveredByBox.has(t.id));
    const tilesMesh = new THREE.InstancedMesh(
      tileGeometry,
      [capMaterial, sideMaterial],
      interiorTiles.length,
    );
    interiorTiles.forEach((tile, i) => tilesMesh.setMatrixAt(i, basisMatrix(tile)));
    tilesMesh.instanceMatrix.needsUpdate = true;
    scene3.add(tilesMesh);

    // ── El agujero negro: tiles AUSENTES revelando el vacío + plano shader
    //    (centro oscuro profundo, glow violeta en el borde, remolino sutil) ──
    const holePlanes: Array<{ material: THREE.ShaderMaterial; mesh: THREE.Mesh }> = [];
    {
      const byFace = new Map<number, typeof model0.holes>();
      for (const hole of model0.holes) {
        const list = byFace.get(hole.layer) ?? [];
        list.push(hole);
        byFace.set(hole.layer, list);
      }
      for (const [faceIndex, holes] of byFace) {
        const face = topo.faces[faceIndex];
        const locals = holes.map((t) => {
          const rel = {
            x: t.center.x - face.origin.x,
            y: t.center.y - face.origin.y,
            z: t.center.z - face.origin.z,
          };
          return {
            x: rel.x * face.u.x + rel.y * face.u.y + rel.z * face.u.z,
            y: rel.x * face.v.x + rel.y * face.v.y + rel.z * face.v.z,
          };
        });
        const minX = Math.min(...locals.map((p) => p.x)) - 0.5;
        const maxX = Math.max(...locals.map((p) => p.x)) + 0.5;
        const minY = Math.min(...locals.map((p) => p.y)) - 0.5;
        const maxY = Math.max(...locals.map((p) => p.y)) + 0.5;
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const scale = 1.45; // el glow desborda un poco el pozo
        const w = (maxX - minX) * scale;
        const hgt = (maxY - minY) * scale;

        const material = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          uniforms: { uTime: { value: 0 }, uInstability: { value: 0 } },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform float uInstability; // devoradas/3, suavizado (juice del agujero)
            varying vec2 vUv;
            void main() {
              vec2 p = vUv * 2.0 - 1.0;
              float r = length(p);
              float ang = atan(p.y, p.x);
              // Reacción SUAVE del pozo (el drama vive en el NÚCLEO central):
              // apenas respira — ondulación y aceleración leves por escalón.
              float wobble = 0.012 * uInstability * sin(ang * 5.0 + uTime * 2.6);
              float rr = r + wobble;
              float speed = 1.7 + 0.18 * uInstability;
              float swirl = 0.5 + 0.5 * sin(ang * 3.0 - uTime * speed - rr * 7.0);
              float band = smoothstep(0.25, 0.85, swirl);
              float coreEdge = 0.42 + 0.015 * uInstability;
              float core = 1.0 - smoothstep(coreEdge, coreEdge + 0.28, rr);
              float ring = smoothstep(0.3, 0.55, rr) * (1.0 - smoothstep(0.72, 1.0, rr));
              float innerRim = smoothstep(0.4, 0.5, rr) * (1.0 - smoothstep(0.52, 0.62, rr));
              float rage = 1.0 + 0.1 * uInstability;
              vec3 violet = vec3(0.5, 0.24, 1.0);
              vec3 hotRim = vec3(0.78, 0.6, 1.0);
              vec3 color = (violet * ring * (0.35 + 1.1 * band) + hotRim * innerRim * band * 0.9) * rage;
              // El centro sigue siendo la VENTANA al universo interior.
              float alpha = max(core * 0.78, min(1.0, ring * (0.5 + 0.5 * band) * rage));
              alpha *= 1.0 - smoothstep(0.92, 1.0, r);
              gl_FragColor = vec4(color, alpha);
            }
          `,
        });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, hgt), material);
        const center3 = {
          x: face.origin.x + face.u.x * cx + face.v.x * cy + face.normal.x * 0.06,
          y: face.origin.y + face.u.y * cx + face.v.y * cy + face.normal.y * 0.06,
          z: face.origin.z + face.u.z * cx + face.v.z * cy + face.normal.z * 0.06,
        };
        plane.applyMatrix4(basisMatrix({ center: center3, u: face.u, v: face.v, normal: face.normal }));
        scene3.add(plane);
        holePlanes.push({ material, mesh: plane });
      }
    }

    // Celdas locales por cara (para pintar el dot de nodo de cada celda real,
    // el mismo lenguaje del tablero 2D; los agujeros no llevan dot).
    const faceCells: Array<Array<{ i: number; j: number }>> = topo.faces.map(() => []);
    for (const tile of model0.tiles) {
      const cell = topo.cellById.get(tile.id);
      if (cell !== undefined) {
        faceCells[cell.layer].push({ i: cell.i, j: cell.j });
      }
    }

    // ── Lienzos por cara: EL glifo 2D pintado sobre la superficie ──
    const overlayGeometry = new THREE.PlaneGeometry(S, S);
    interface FaceOverlay {
      ctx: CanvasRenderingContext2D;
      texture: THREE.CanvasTexture;
      material: THREE.MeshBasicMaterial;
    }
    const overlays: FaceOverlay[] = topo.faces.map((face) => {
      const canvas = document.createElement('canvas');
      canvas.width = S * FACE_PX;
      canvas.height = S * FACE_PX;
      const ctx = canvas.getContext('2d')!;
      const texture = new THREE.CanvasTexture(canvas);
      // flipY por defecto (true): con la base (u, −v, n) del plano, la fila 0
      // del canvas cae en el lado v=0 de la cara — coordenadas locales tal cual.
      // sRGB: los colores del canvas son sRGB; sin esto el glifo sale pálido.
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(overlayGeometry, material);
      const faceCenter = {
        x: face.origin.x + (face.u.x + face.v.x) * (S / 2) + face.normal.x * OVERLAY_LIFT,
        y: face.origin.y + (face.u.y + face.v.y) * (S / 2) + face.normal.y * OVERLAY_LIFT,
        z: face.origin.z + (face.u.z + face.v.z) * (S / 2) + face.normal.z * OVERLAY_LIFT,
      };
      plane.applyMatrix4(basisMatrix({ center: faceCenter, u: face.u, v: face.v, normal: face.normal }));
      scene3.add(plane);
      return { ctx, texture, material };
    });

    // Corrimiento de las tapas de borde respecto al centro de celda lógico:
    // TODO el pintado (dots y glifos) se warpea a los centros visuales (v4.3).
    const glyphShift = ((1 - TILE_SIDE) / 2 + TILE_TOP) / 2;

    /** Dibuja un tramo del glifo (estilo EXACTO del SVG 2D) en su lienzo. */
    const drawRun = (
      run: FaceRun,
      color: string,
      tipDir2: { x: number; y: number } | null,
    ): void => {
      const { ctx } = overlays[run.faceIndex];
      const px = (raw: { x: number; y: number }): [number, number] => {
        const p = warpToPieceCenters(raw, S, glyphShift);
        return [p.x * FACE_PX, p.y * FACE_PX];
      };

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = ARROW_GLYPH.bodyStrokeRatio * FACE_PX;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      const [x0, y0] = px(run.points[0]);
      ctx.moveTo(x0, y0);
      if (run.points.length === 1) {
        ctx.lineTo(x0 + 0.01, y0); // cap redondo visible (caso una celda, como el SVG)
      } else {
        for (let i = 1; i < run.points.length; i++) {
          const [x, y] = px(run.points[i]);
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      if (tipDir2 !== null) {
        const lead = run.points[run.points.length - 1];
        const len = Math.hypot(tipDir2.x, tipDir2.y) || 1;
        const dir = { x: tipDir2.x / len, y: tipDir2.y / len };
        const perp = { x: -dir.y, y: dir.x };
        const tip = ARROW_GLYPH.headTipRatio;
        const back = ARROW_GLYPH.headBackRatio;
        const half = ARROW_GLYPH.headHalfBaseRatio;
        const apex = { x: lead.x + dir.x * tip, y: lead.y + dir.y * tip };
        const baseMid = { x: lead.x - dir.x * back, y: lead.y - dir.y * back };
        ctx.beginPath();
        ctx.moveTo(...px(apex));
        ctx.lineTo(...px({ x: baseMid.x + perp.x * half, y: baseMid.y + perp.y * half }));
        ctx.lineTo(...px({ x: baseMid.x - perp.x * half, y: baseMid.y - perp.y * half }));
        ctx.closePath();
        ctx.fill();
      }
    };

    // ── Flechas: animador de riel + hit-spheres + glifo pintado ──
    const hitGroup = new THREE.Group();
    scene3.add(hitGroup);
    const hitGeometry = new THREE.SphereGeometry(0.46, 8, 8);
    // Hit-target generoso e invisible: el material no pinta pero el raycast pega.
    const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });

    interface ArrowVisual {
      animator: CubeRailAnimator;
      group: THREE.Group;
      hits: THREE.Mesh[];
      count: number;
      color: string;
      fallbackTipDir: THREE.Vector3;
      cachedRuns: FaceRun[];
      faces: Set<number>;
      lastTipFace: number;
      /** Inicio del pulso de recoil (0 = sin recoil activo). */
      recoilStart: number;
    }
    const visuals = new Map<string, ArrowVisual>();

    const tipDir2Of = (vis: ArrowVisual, sample: RailSample3): { x: number; y: number } => {
      const leadRunFace = vis.cachedRuns.length > 0
        ? vis.cachedRuns[vis.cachedRuns.length - 1].faceIndex
        : 0;
      const face = topo.faces[leadRunFace];
      let d = projectDirToFace(face, sample.tipDir);
      if (Math.hypot(d.x, d.y) < 1e-6) {
        d = projectDirToFace(face, {
          x: vis.fallbackTipDir.x,
          y: vis.fallbackTipDir.y,
          z: vis.fallbackTipDir.z,
        });
      }
      return d;
    };

    /** Recalcula el muestreo del riel y sus tramos por cara (cache del frame). */
    const refreshCache = (vis: ArrowVisual): RailSample3 => {
      const sample = vis.animator.sample();
      vis.cachedRuns = splitBodyByFace(topo.faces, sample.body);
      vis.faces = new Set(vis.cachedRuns.map((r) => r.faceIndex));
      sample.vertices.forEach((p, i) => {
        vis.hits[i]?.position.set(p.x, p.y, p.z);
      });
      return sample;
    };

    /** Repinta los lienzos indicados con TODOS los glifos que los tocan. */
    const repaintFaces = (dirty: ReadonlySet<number>): void => {
      if (dirty.size === 0) {
        return;
      }
      // Dots de nodo (lenguaje 2D): tematizados con el token CSS del tablero.
      const dotColor =
        getComputedStyle(document.documentElement).getPropertyValue('--board-dot').trim() ||
        '#94a3b8';
      // El dot va CENTRADO en la tapa VISIBLE de cada pieza — mismo warp que
      // los glifos (una sola verdad de alineación, v4.3).
      for (const f of dirty) {
        const { ctx } = overlays[f];
        ctx.clearRect(0, 0, S * FACE_PX, S * FACE_PX);
        ctx.fillStyle = dotColor;
        for (const { i, j } of faceCells[f]) {
          const c = warpToPieceCenters({ x: i + 0.5, y: j + 0.5 }, S, glyphShift);
          ctx.beginPath();
          ctx.arc(c.x * FACE_PX, c.y * FACE_PX, DOT_RADIUS_RATIO * FACE_PX, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      for (const vis of visuals.values()) {
        let touches = false;
        for (const f of vis.faces) {
          if (dirty.has(f)) {
            touches = true;
            break;
          }
        }
        if (!touches) {
          continue;
        }
        const sample = vis.animator.sample();
        // Recoil activo: el glifo entero se empuja a lo largo del tipDir y
        // regresa (espejo del rebote del SVG); se re-parte el cuerpo desplazado.
        let runs = vis.cachedRuns;
        if (vis.recoilStart > 0) {
          const progress = (performance.now() - vis.recoilStart) / RECOIL_MS;
          const shift = recoilOffset(progress);
          if (shift > 0) {
            const dir =
              Math.hypot(sample.tipDir.x, sample.tipDir.y, sample.tipDir.z) > 1e-6
                ? sample.tipDir
                : { x: vis.fallbackTipDir.x, y: vis.fallbackTipDir.y, z: vis.fallbackTipDir.z };
            const shiftedBody = sample.body.map((p) => ({
              x: p.x + dir.x * shift,
              y: p.y + dir.y * shift,
              z: p.z + dir.z * shift,
            }));
            runs = splitBodyByFace(topo.faces, shiftedBody);
          }
        }
        const tip2 = tipDir2Of(vis, sample);
        runs.forEach((run) => {
          if (!dirty.has(run.faceIndex)) {
            return;
          }
          drawRun(run, vis.color, run.isLead ? tip2 : null);
        });
      }
      for (const f of dirty) {
        overlays[f].texture.needsUpdate = true;
      }
    };

    // ── Pulso de brillo en la arista al cruzar (~120ms) ──
    const pulseGeometry = new THREE.BoxGeometry(1, 0.06, 0.06);
    interface EdgePulse {
      mesh: THREE.Mesh;
      material: THREE.MeshBasicMaterial;
      start: number;
    }
    const pulses: EdgePulse[] = [];

    const spawnPulse = (faceA: number, faceB: number, now: number): void => {
      const seg = sharedEdgeSegment(topo.faces[faceA], topo.faces[faceB], S);
      if (seg === null) {
        return;
      }
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(pulseGeometry, material);
      const from = new THREE.Vector3(seg.from.x, seg.from.y, seg.from.z);
      const to = new THREE.Vector3(seg.to.x, seg.to.y, seg.to.z);
      const dir = to.clone().sub(from);
      mesh.position.copy(from).add(to).multiplyScalar(0.5);
      // Levanta el pulso hacia afuera por la bisectriz de ambas caras.
      const nA = topo.faces[faceA].normal;
      const nB = topo.faces[faceB].normal;
      mesh.position.add(
        new THREE.Vector3(nA.x + nB.x, nA.y + nB.y, nA.z + nB.z).multiplyScalar(0.05),
      );
      mesh.scale.set(dir.length(), 1, 1);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.normalize());
      scene3.add(mesh);
      pulses.push({ mesh, material, start: now });
    };

    const updatePulses = (now: number): void => {
      for (let i = pulses.length - 1; i >= 0; i--) {
        const t = (now - pulses[i].start) / PULSE_MS;
        if (t >= 1) {
          scene3.remove(pulses[i].mesh);
          pulses[i].material.dispose();
          pulses.splice(i, 1);
        } else {
          pulses[i].material.opacity = 0.9 * (1 - t);
        }
      }
    };

    // ── Devorado: la forma se estira hacia el centro del cubo y se funde ──
    const devourNodeGeometry = new THREE.SphereGeometry(0.19, 12, 10);
    const devourLinkGeometry = new THREE.CylinderGeometry(0.11, 0.11, 1, 8);
    // Conteo de devoradas → nivel de inestabilidad del agujero (juice).
    let devouredCount = 0;
    let instability = 0;

    interface DevourAnim {
      rail: Vec3[];
      count: number;
      group: THREE.Group;
      nodes: THREE.Mesh[];
      links: THREE.Mesh[];
      material: THREE.MeshBasicMaterial;
      start: number;
    }
    const devours: DevourAnim[] = [];
    const upAxis = new THREE.Vector3(0, 1, 0);

    const updateDevours = (now: number): void => {
      for (let i = devours.length - 1; i >= 0; i--) {
        const d = devours[i];
        const t = (now - d.start) / DEVOUR_MS;
        if (t >= 1) {
          scene3.remove(d.group);
          d.material.dispose();
          devours.splice(i, 1);
          continue;
        }
        const s = sampleDevourShape(d.rail, t, d.count);
        s.vertices.forEach((p, j) => {
          d.nodes[j]?.position.set(p.x, p.y, p.z);
        });
        const segs = Math.max(0, s.body.length - 1);
        for (let j = 0; j < d.links.length; j++) {
          const link = d.links[j];
          if (j >= segs) {
            link.visible = false;
            continue;
          }
          const a = s.body[j];
          const b = s.body[j + 1];
          const from = new THREE.Vector3(a.x, a.y, a.z);
          const to = new THREE.Vector3(b.x, b.y, b.z);
          const dir = to.clone().sub(from);
          link.visible = true;
          link.position.copy(from).add(to).multiplyScalar(0.5);
          link.scale.set(1, Math.max(dir.length(), 1e-6), 1);
          link.quaternion.setFromUnitVectors(upAxis, dir.normalize());
        }
        d.material.opacity = s.opacity;
      }
    };

    // ── Cámara orbital + cortesía ──
    let yaw = -0.65;
    let pitch = 0.42;
    const radius = S * 2.6;
    let courtesy: { yaw: number; pitch: number } | null = null;
    const updateCamera = (): void => {
      camera.position.set(
        center.x + radius * Math.cos(pitch) * Math.sin(yaw),
        center.y + radius * Math.sin(pitch),
        center.z + radius * Math.cos(pitch) * Math.cos(yaw),
      );
      camera.lookAt(center);
    };
    updateCamera();

    // ── Gestos, inercia, oclusión ──
    const gesture = new OrbitTapGesture();
    const inertia = new SpinInertia();
    let lastInteraction = performance.now() - 10_000; // arranca girando suave
    const raycaster = new THREE.Raycaster();

    const pickArrowId = (clientX: number, clientY: number): string | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      // El oclusor invisible participa: ni por el pozo ni por las ranuras se
      // juega una flecha de la cara oculta.
      const targets: THREE.Object3D[] = [
        tilesMesh,
        edgeMesh,
        ...cornerMeshes,
        occluderMesh,
        hitGroup,
      ];
      const hits = raycaster.intersectObjects(targets, true).map((hit) => ({
        arrowId:
          typeof hit.object.userData.arrowId === 'string'
            ? (hit.object.userData.arrowId as string)
            : null,
      }));
      return firstTapTarget(hits);
    };

    const onPointerDown = (e: PointerEvent): void => {
      renderer.domElement.setPointerCapture(e.pointerId);
      inertia.cancel(); // agarrar el cubo detiene el impulso en seco
      courtesy = null; // el usuario manda SIEMPRE
      gesture.pointerDown(e.clientX, e.clientY, e.timeStamp);
      lastInteraction = performance.now();
    };
    const onPointerMove = (e: PointerEvent): void => {
      const event = gesture.pointerMove(e.clientX, e.clientY);
      if (event !== null && event.type === 'orbit') {
        const dYaw = -event.dx * ORBIT_SPEED;
        const newPitch = Math.max(
          -PITCH_LIMIT,
          Math.min(PITCH_LIMIT, pitch + event.dy * ORBIT_SPEED),
        );
        const dPitch = newPitch - pitch;
        yaw += dYaw;
        pitch = newPitch;
        updateCamera();
        inertia.addSample(dYaw, dPitch, e.timeStamp);
      }
      if (gesture.isDown) {
        lastInteraction = performance.now();
      }
    };
    const onPointerUp = (e: PointerEvent): void => {
      const wasDragging = gesture.isDragging;
      const event = gesture.pointerUp(e.clientX, e.clientY, e.timeStamp);
      lastInteraction = performance.now();
      if (wasDragging) {
        inertia.release(e.timeStamp);
      }
      if (event !== null && event.type === 'tap' && interactiveRef.current) {
        const arrowId = pickArrowId(event.x, event.y);
        if (arrowId !== null) {
          // Regla v4.3: la cortesía es SOLO de la última flecha jugada — un
          // tap nuevo cancela cualquier cortesía pendiente o en vuelo de
          // flechas anteriores (no se encolan; el pointerdown ya la había
          // cortado y esto la veta también para lo que venga en cola).
          courtesy = null;
          onArrowTapRef.current(arrowId);
        }
      }
    };
    const onPointerCancel = (): void => {
      gesture.cancel();
      lastInteraction = performance.now();
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('pointercancel', onPointerCancel);

    // ── Sincronización con la proyección del dominio ──
    const createVisual = (
      arrowId: string,
      color: string,
      points: Vec3[],
      tipDir: Vec3,
    ): ArrowVisual => {
      const group = new THREE.Group();
      group.userData.arrowId = arrowId;
      const hits: THREE.Mesh[] = [];
      for (let i = 0; i < points.length; i++) {
        const hit = new THREE.Mesh(hitGeometry, hitMaterial);
        hit.userData.arrowId = arrowId;
        hits.push(hit);
        group.add(hit);
      }
      hitGroup.add(group);
      const vis: ArrowVisual = {
        animator: new CubeRailAnimator(points),
        group,
        hits,
        count: points.length,
        color,
        fallbackTipDir: new THREE.Vector3(tipDir.x, tipDir.y, tipDir.z),
        cachedRuns: [],
        faces: new Set(),
        lastTipFace: -1,
        recoilStart: 0,
      };
      const sample = refreshCache(vis);
      vis.lastTipFace = faceIndexOfPoint(topo.faces, sample.vertices[sample.vertices.length - 1]);
      return vis;
    };

    const removeVisual = (id: string, dirty: Set<number>): void => {
      const vis = visuals.get(id);
      if (vis !== undefined) {
        for (const f of vis.faces) {
          dirty.add(f);
        }
        hitGroup.remove(vis.group);
        visuals.delete(id);
      }
    };

    const syncArrows = (): void => {
      const model = buildCubeRenderModel(topo, boardRef.current);
      const dirty = new Set<number>();
      const seen = new Set<string>();
      for (const arrow of model.arrows) {
        seen.add(arrow.id);
        const existing = visuals.get(arrow.id);
        if (existing === undefined) {
          const vis = createVisual(arrow.id, arrow.color, arrow.points, arrow.tipDir);
          visuals.set(arrow.id, vis);
          for (const f of vis.faces) {
            dirty.add(f);
          }
        } else if (existing.count !== arrow.points.length) {
          // Cambio de largo (encogida en el agujero, restore del return):
          // recrear = snap silencioso con la forma real.
          removeVisual(arrow.id, dirty);
          const vis = createVisual(arrow.id, arrow.color, arrow.points, arrow.tipDir);
          visuals.set(arrow.id, vis);
          for (const f of vis.faces) {
            dirty.add(f);
          }
        } else {
          for (const f of existing.faces) {
            dirty.add(f);
          }
          existing.fallbackTipDir.set(arrow.tipDir.x, arrow.tipDir.y, arrow.tipDir.z);
          existing.animator.retarget(arrow.points);
          refreshCache(existing);
          for (const f of existing.faces) {
            dirty.add(f);
          }
        }
      }
      for (const id of Array.from(visuals.keys())) {
        if (!seen.has(id)) {
          removeVisual(id, dirty); // destruida: el devorado la despide
        }
      }
      repaintFaces(dirty);
    };
    syncArrows();

    const startDevour = (signal: VanishSignal): void => {
      devouredCount += 1; // alimenta la inestabilidad del agujero
      const now = performance.now();
      const points: Vec3[] = [];
      for (const cellId of signal.cellIds) {
        const cell = topo.cellById.get(cellId);
        if (cell !== undefined) {
          const n = topo.faces[cell.layer].normal;
          points.push({
            x: cell.center.x + n.x * ARROW_LIFT,
            y: cell.center.y + n.y * ARROW_LIFT,
            z: cell.center.z + n.z * ARROW_LIFT,
          });
        }
      }
      if (points.length === 0) {
        return;
      }
      const rail = buildDevourRail(points, { x: S / 2, y: S / 2, z: S / 2 });
      const material = new THREE.MeshBasicMaterial({
        color: signal.color,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      });
      const group = new THREE.Group();
      const nodes: THREE.Mesh[] = [];
      for (let i = 0; i < points.length; i++) {
        const node = new THREE.Mesh(devourNodeGeometry, material);
        nodes.push(node);
        group.add(node);
      }
      const links: THREE.Mesh[] = [];
      for (let i = 0; i < points.length + rail.length; i++) {
        const link = new THREE.Mesh(devourLinkGeometry, material);
        link.visible = false;
        links.push(link);
        group.add(link);
      }
      scene3.add(group);
      devours.push({ rail, count: points.length, group, nodes, links, material, start: now });

      // Cámara de cortesía: SOLO si el desenlace quedó en cara oculta, y nunca
      // contra el usuario (drag o inercia viva la vetan; también la cancelan).
      const holeFaceIndex = faceIndexOfPoint(topo.faces, points[points.length - 1]);
      const face = topo.faces[holeFaceIndex];
      const faceCenter = {
        x: face.origin.x + (face.u.x + face.v.x) * (S / 2),
        y: face.origin.y + (face.u.y + face.v.y) * (S / 2),
        z: face.origin.z + (face.u.z + face.v.z) * (S / 2),
      };
      const camPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
      if (
        !isFaceVisible(face.normal, faceCenter, camPos) &&
        !gesture.isDown &&
        !inertia.isAlive
      ) {
        courtesy = courtesyTarget(face.normal, yaw, PITCH_LIMIT);
      }
    };

    // ── Tamaño reactivo ──
    const resize = (): void => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    // ── Render loop ──
    let rafId = 0;
    let lastTime = performance.now();
    const frame = (now: number): void => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      // Riel: avanza los animadores y repinta solo las caras tocadas.
      const dirty = new Set<number>();
      for (const vis of visuals.values()) {
        // Recoil vivo: la cara del glifo se repinta cada frame del pulso, y
        // una vez más al terminar para restaurar la posición exacta.
        if (vis.recoilStart > 0) {
          for (const f of vis.faces) {
            dirty.add(f);
          }
          if (now - vis.recoilStart > RECOIL_MS) {
            vis.recoilStart = 0;
          }
        }
        if (vis.animator.settled) {
          continue;
        }
        for (const f of vis.faces) {
          dirty.add(f);
        }
        vis.animator.tick(dt);
        const sample = refreshCache(vis);
        for (const f of vis.faces) {
          dirty.add(f);
        }
        // Pulso de arista: la punta cambió de cara durante el glide.
        const tipFace = faceIndexOfPoint(
          topo.faces,
          sample.vertices[sample.vertices.length - 1],
        );
        if (tipFace !== vis.lastTipFace) {
          spawnPulse(vis.lastTipFace, tipFace, now);
          vis.lastTipFace = tipFace;
        }
      }
      repaintFaces(dirty);
      updatePulses(now);
      updateDevours(now);
      for (const hp of holePlanes) {
        hp.material.uniforms.uTime.value = now / 1000; // remolino del agujero
      }

      // Inestabilidad del agujero: crece un escalón por cada 3 devoradas, con
      // transición suave (aproximación exponencial, sin saltos secos).
      const instabilityTarget = Math.min(4, Math.floor(devouredCount / 3));
      instability = approachAngle(instability, instabilityTarget, 1.6, dt);
      for (const hp of holePlanes) {
        hp.material.uniforms.uInstability.value = instability;
        hp.mesh.scale.setScalar(1 + 0.035 * instability); // respiración sutil
      }

      // Universo interior: rotación lenta + twinkle desfasado por nube.
      starsGroup.rotation.y = now * 0.00004;
      starsGroup.rotation.x = Math.sin(now * 0.00001) * 0.18;
      starClouds.forEach((cloud, i) => {
        cloud.material.opacity = 0.55 + 0.35 * Math.sin(now * 0.0013 + i * 2.1);
      });

      // EL ARCO DEL NÚCLEO: se alimenta y vibra cada vez más — amplitud y
      // frecuencia crecen por escalón hasta casi desestabilizarse (nivel 4:
      // temblor violento + parpadeo, conteniendo la explosión).
      const vib = instability;
      const t1k = now * 0.001;
      const amp = 0.015 + 0.06 * vib;
      const freq = 5 + 6 * vib;
      nucleusMesh.position.set(
        Math.sin(t1k * freq * 7.1) * amp,
        Math.sin(t1k * freq * 8.7 + 1.3) * amp,
        Math.sin(t1k * freq * 6.3 + 2.1) * amp,
      );
      glowSprite.position.copy(nucleusMesh.position).multiplyScalar(0.5);
      const flicker = vib > 2.5 ? 0.12 * Math.sin(now * 0.045) : 0;
      const corePulse =
        1 + (0.06 + 0.1 * vib) * Math.sin(t1k * (2 + 3.2 * vib) * Math.PI) + flicker;
      nucleusMesh.scale.setScalar(Math.max(0.2, corePulse * (1 + 0.18 * vib)));
      const glowBase = S * 0.42 * (1 + 0.24 * vib);
      glowSprite.scale.set(glowBase * corePulse, glowBase * corePulse, 1);
      glowMaterial.opacity = Math.min(
        1,
        Math.max(0, 0.72 + 0.08 * vib + (0.22 + 0.06 * vib) * Math.sin(now * 0.0011 * (1 + vib)) + flicker),
      );

      // Explosión de victoria: la RESOLUCIÓN del arco — el núcleo, vibrando
      // al máximo, REVIENTA desde el corazón del cubo (flash + onda + burst
      // estelar visibles por ranuras y pozo). El pozo no explota.
      if (celebrationStart > 0) {
        const t = (now - celebrationStart) / CELEBRATION_MS;
        if (t >= 1) {
          celebrationStart = 0;
          flashMaterial.opacity = 0;
          shockMaterial.opacity = 0;
          starsGroup.scale.setScalar(1);
        } else {
          // El núcleo estalla: expansión brusca que se consume en el flash.
          const burst = Math.min(1, t * 2.5);
          nucleusMesh.scale.setScalar(Math.max(0.001, (1 + 6 * burst) * (1 - t)));
          const easeOut = 1 - Math.pow(1 - Math.min(1, t), 3);
          flashSprite.scale.set(S * (0.4 + 3.4 * Math.min(1, t * 3)), S * (0.4 + 3.4 * Math.min(1, t * 3)), 1);
          flashMaterial.opacity = Math.pow(1 - t, 1.6);
          shockMesh.scale.setScalar(0.2 + S * 2.8 * easeOut);
          shockMaterial.opacity = 0.85 * (1 - t);
          shockMesh.quaternion.copy(camera.quaternion); // la onda mira a cámara
          starsGroup.scale.setScalar(1 + 1.4 * easeOut);
        }
      }

      if (!gesture.isDown) {
        if (courtesy !== null) {
          if (inertia.isAlive) {
            courtesy = null; // la cortesía nunca pelea con el usuario
          } else {
            yaw = approachAngle(yaw, courtesy.yaw, COURTESY_RATE, dt);
            pitch = approachAngle(pitch, courtesy.pitch, COURTESY_RATE, dt);
            updateCamera();
            lastInteraction = now;
            if (
              Math.abs(courtesy.yaw - yaw) < 0.01 &&
              Math.abs(courtesy.pitch - pitch) < 0.01
            ) {
              courtesy = null;
            }
          }
        }
        const impulse = inertia.step(dt);
        if (impulse !== null) {
          yaw += impulse.dYaw;
          pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch + impulse.dPitch));
          updateCamera();
          lastInteraction = now; // el idle corre desde que la inercia muere
        } else if (courtesy === null) {
          const v = idleAngularVelocity(now - lastInteraction);
          if (v > 0) {
            yaw += v * dt;
            updateCamera();
          }
        }
      }

      renderer.render(scene3, camera);
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);

    const startRecoil = (arrowId: string): void => {
      const vis = visuals.get(arrowId);
      if (vis !== undefined) {
        vis.recoilStart = performance.now();
      }
    };

    worldRef.current = { syncArrows, startDevour, startRecoil, startCelebration };

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointercancel', onPointerCancel);
      for (const overlay of overlays) {
        overlay.texture.dispose();
        overlay.material.dispose();
      }
      for (const pulse of pulses) {
        pulse.material.dispose();
      }
      for (const devour of devours) {
        devour.material.dispose();
      }
      flashMaterial.dispose();
      shockGeometry.dispose();
      shockMaterial.dispose();
      overlayGeometry.dispose();
      tileGeometry.dispose();
      edgeGeometry.dispose();
      cornerGeometry.dispose();
      edgeMesh.dispose();
      occluderGeometry.dispose();
      for (const geometry of starGeometries) {
        geometry.dispose();
      }
      for (const cloud of starClouds) {
        cloud.material.dispose();
      }
      glowTexture.dispose();
      glowMaterial.dispose();
      nucleusGeometry.dispose();
      nucleusMaterial.dispose();
      hitGeometry.dispose();
      pulseGeometry.dispose();
      devourNodeGeometry.dispose();
      devourLinkGeometry.dispose();
      capMaterial.dispose();
      sideMaterial.dispose();
      occluderMaterial.dispose();
      hitMaterial.dispose();
      for (const hp of holePlanes) {
        hp.material.dispose();
        hp.mesh.geometry.dispose();
      }
      tilesMesh.dispose();
      renderer.dispose();
      container.removeChild(dom);
      worldRef.current = null;
    };
    // La escena (y por tanto topo) es fija durante la partida; el mundo se
    // construye una sola vez por montaje.
  }, [topo]);

  // Reproyección del dominio tras cada tick.
  useEffect(() => {
    worldRef.current?.syncArrows();
  }, [board]);

  // Señal de destrucción → devorado (+ cortesía si la cara está oculta).
  useEffect(() => {
    if (vanishing !== undefined && vanishing.nonce !== lastVanishNonce.current) {
      lastVanishNonce.current = vanishing.nonce;
      worldRef.current?.startDevour(vanishing);
    }
  }, [vanishing]);

  // Señal de bloqueo → recoil del glifo (espejo del rebote 2D).
  useEffect(() => {
    if (collision !== undefined && collision.nonce !== lastCollisionNonce.current) {
      lastCollisionNonce.current = collision.nonce;
      worldRef.current?.startRecoil(collision.arrowId);
    }
  }, [collision]);

  // Victoria → explosión + "¡COMPLETADO!" (prólogo visual; el overlay WON
  // sigue su flujo normal — la celebración jamás lo bloquea).
  const startCelebrationUi = (): void => {
    worldRef.current?.startCelebration();
    setCelebrating(true);
    if (celebrationTimer.current !== null) {
      clearTimeout(celebrationTimer.current);
    }
    celebrationTimer.current = setTimeout(() => setCelebrating(false), 1500);
  };
  const wasWon = useRef(false);
  useEffect(() => {
    if (won === true && !wasWon.current) {
      wasWon.current = true;
      startCelebrationUi();
    }
    if (won !== true) {
      wasWon.current = false;
    }
  }, [won]);
  useEffect(() => {
    return () => {
      if (celebrationTimer.current !== null) {
        clearTimeout(celebrationTimer.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, cursor: 'grab' }}
      data-testid="board-3d"
    >
      {celebrating && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: 'clamp(30px, 7vw, 68px)',
              fontWeight: 900,
              letterSpacing: '0.08em',
              color: '#ffffff',
              textShadow:
                '0 0 26px rgba(178, 122, 255, 0.95), 0 0 60px rgba(120, 60, 220, 0.6), 0 2px 10px rgba(0, 0, 0, 0.5)',
            }}
          >
            ¡COMPLETADO!
          </span>
        </div>
      )}
    </div>
  );
};
