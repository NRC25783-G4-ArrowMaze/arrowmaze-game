import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Scene as GameScene } from '../game/scene';
import type { BoardViewModel } from '../viewModel';
import { OrbitTapGesture } from '../input/orbitTapGesture';
import { buildVolumeRenderModel } from '../game/volume/volumeRenderModel';

export interface BoardComponentVolume3DProps {
  scene: GameScene;
  board: BoardViewModel;
  interactive: boolean;
  onArrowTap: (arrowId: string) => void;
}

export const BoardComponentVolume3D: React.FC<BoardComponentVolume3DProps> = ({
  /* scene is not used directly here, but passed in props */
  board,
  interactive,
  onArrowTap,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const model = useMemo(() => buildVolumeRenderModel(board.cells, board.arrows), [board.cells, board.arrows]);

  const interactiveRef = useRef(interactive);
  const onArrowTapRef = useRef(onArrowTap);
  useEffect(() => {
    interactiveRef.current = interactive;
    onArrowTapRef.current = onArrowTap;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);

    const scene3 = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(3, 3, 4.5);
    camera.lookAt(0, 0, 0);

    scene3.add(new THREE.AmbientLight(0xffffff, 0.6));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 5, 5);
    scene3.add(keyLight);

    // ── Celdas: Cubos de cristal ──
    const glassGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      opacity: 1,
      metalness: 0.1,
      roughness: 0.2,
      ior: 1.5,
      thickness: 0.5,
      transparent: true,
      side: THREE.FrontSide,
    });

    const tilesGroup = new THREE.Group();
    for (const tile of model.tiles) {
      const mesh = new THREE.Mesh(glassGeometry, glassMaterial);
      mesh.position.set(tile.center.x, tile.center.y, tile.center.z);
      // Opcional: añadir bordes
      const edges = new THREE.EdgesGeometry(glassGeometry);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true }));
      mesh.add(line);
      tilesGroup.add(mesh);
    }
    scene3.add(tilesGroup);

    // ── Flechas: Tubos 3D y Hit Targets ──
    const arrowGroup = new THREE.Group();
    const hitMeshes: { mesh: THREE.Mesh; arrowId: string }[] = [];
    const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });

    for (const arrow of model.arrows) {
      if (arrow.points.length === 0) continue;

      // Generar tubo para la flecha
      let curve: THREE.Curve<THREE.Vector3>;
      if (arrow.points.length === 1) {
        // Un solo punto: dibujamos una pequeña esfera o tubo corto
        const p = new THREE.Vector3(arrow.points[0].x, arrow.points[0].y, arrow.points[0].z);
        curve = new THREE.LineCurve3(p, p.clone().add(new THREE.Vector3(0, 0.01, 0)));
      } else {
        const vecs = arrow.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
        curve = new THREE.CatmullRomCurve3(vecs, false, 'catmullrom', 0.5);
      }

      const tubeGeom = new THREE.TubeGeometry(curve, arrow.points.length * 4, 0.15, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: arrow.color,
        roughness: 0.2,
        metalness: 0.1,
      });
      const tube = new THREE.Mesh(tubeGeom, tubeMat);
      arrowGroup.add(tube);

      // Hit targets esféricos en cada nodo de la flecha
      for (const p of arrow.points) {
        const hitGeom = new THREE.SphereGeometry(0.4, 8, 8);
        const hitMesh = new THREE.Mesh(hitGeom, hitMaterial);
        hitMesh.position.set(p.x, p.y, p.z);
        arrowGroup.add(hitMesh);
        hitMeshes.push({ mesh: hitMesh, arrowId: arrow.id });
      }
      
      // Cabeza de flecha visual en la punta (primer punto es la cabeza en viewModel)
      const headPos = arrow.points[0];
      const headGeom = new THREE.SphereGeometry(0.22, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, emissive: arrow.color, emissiveIntensity: 0.5 });
      const headMesh = new THREE.Mesh(headGeom, headMat);
      headMesh.position.set(headPos.x, headPos.y, headPos.z);
      arrowGroup.add(headMesh);
    }
    scene3.add(arrowGroup);

    // ── Interacción: Orbit y Tap ──
    const raycaster = new THREE.Raycaster();
    const gesture = new OrbitTapGesture({ tapMaxDistancePx: 8, tapMaxDurationMs: 300 });

    const pivot = new THREE.Group();
    pivot.add(tilesGroup);
    pivot.add(arrowGroup);
    scene3.add(pivot);

    let currentYaw = Math.PI / 4;
    let currentPitch = Math.PI / 6;

    const updateCamera = () => {
      pivot.rotation.y = currentYaw;
      pivot.rotation.x = currentPitch;
    };
    updateCamera();

    const handlePointerDown = (e: PointerEvent) => {
      if (!interactiveRef.current) return;
      gesture.pointerDown(e.clientX, e.clientY, e.timeStamp);
      container.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const ev = gesture.pointerMove(e.clientX, e.clientY);
      if (ev && ev.type === 'orbit') {
        currentYaw += ev.dx * 0.01;
        currentPitch += ev.dy * 0.01;
        currentPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, currentPitch));
        updateCamera();
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const ev = gesture.pointerUp(e.clientX, e.clientY, e.timeStamp);
      container.releasePointerCapture(e.pointerId);

      if (ev && ev.type === 'tap') {
        const rect = container.getBoundingClientRect();
        const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

        const intersects = raycaster.intersectObjects(hitMeshes.map(h => h.mesh), false);
        if (intersects.length > 0) {
          const hit = intersects[0];
          const found = hitMeshes.find(h => h.mesh === hit.object);
          if (found) {
            onArrowTapRef.current(found.arrowId);
          }
        }
      }
    };

    const handlePointerCancel = () => {
      gesture.cancel();
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointercancel', handlePointerCancel);

    // ── Loop ──
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (renderer.domElement.width !== width * renderer.getPixelRatio() || renderer.domElement.height !== height * renderer.getPixelRatio()) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      // Animación suave de los tubos
      const time = performance.now() * 0.001;
      arrowGroup.children.forEach((child, idx) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.TubeGeometry) {
          (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + 0.3 * Math.sin(time * 3 + idx);
        }
      });

      renderer.render(scene3, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerCancel);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [model]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />;
};
