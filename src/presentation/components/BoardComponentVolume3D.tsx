import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Scene as GameScene } from '../game/scene';
import type { BoardViewModel } from '../viewModel';
import { OrbitTapGesture } from '../input/orbitTapGesture';
import { buildVolumeRenderModel, type VolumeRenderArrow } from '../game/volume/volumeRenderModel';
import { glideAlongRail3D, type RailGlideResult3D } from '../rendering/railGlide3D';
import { GLIDE_SPEED } from '../rendering/glideConfig';
import { portDelta3D } from '../rendering/boardLayout';

export interface BoardComponentVolume3DProps {
  scene: GameScene;
  board: BoardViewModel;
  interactive: boolean;
  onArrowTap: (arrowId: string) => void;
}

export const BoardComponentVolume3D: React.FC<BoardComponentVolume3DProps> = ({
  board,
  interactive,
  onArrowTap,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // References for imperative updates (animation loop)
  const interactiveRef = useRef(interactive);
  const onArrowTapRef = useRef(onArrowTap);
  useEffect(() => {
    interactiveRef.current = interactive;
    onArrowTapRef.current = onArrowTap;
  });

  const boardRef = useRef(board);
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

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

    const tilesGroup = new THREE.Group();
    const arrowGroup = new THREE.Group();
    const pivot = new THREE.Group();
    pivot.add(tilesGroup);
    pivot.add(arrowGroup);
    scene3.add(pivot);

    // Build the static tiles once
    const initialModel = buildVolumeRenderModel(boardRef.current.cells, boardRef.current.arrows);
    const glassGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      opacity: 0.15,
      transparent: true,
      depthWrite: false,
    });
    for (const tile of initialModel.tiles) {
      const mesh = new THREE.Mesh(glassGeometry, glassMaterial);
      mesh.position.set(tile.center.x, tile.center.y, tile.center.z);
      const edges = new THREE.EdgesGeometry(glassGeometry);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true }));
      mesh.add(line);
      tilesGroup.add(mesh);
    }

    const raycaster = new THREE.Raycaster();
    const gesture = new OrbitTapGesture({ tapMaxDistancePx: 8, tapMaxDurationMs: 300 });

    let currentYaw = Math.PI / 4;
    let currentPitch = Math.PI / 6;

    const updateCamera = () => {
      pivot.rotation.y = currentYaw;
      pivot.rotation.x = currentPitch;
    };
    updateCamera();

    let hoveredArrowId: string | null = null;
    const hitMeshesRef: { mesh: THREE.Mesh; arrowId: string }[] = [];

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
      } else if (!gesture.isDragging && interactiveRef.current) {
        const rect = container.getBoundingClientRect();
        const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

        const intersects = raycaster.intersectObjects(hitMeshesRef.map(h => h.mesh), false);
        if (intersects.length > 0) {
          const hit = intersects[0];
          const found = hitMeshesRef.find(h => h.mesh === hit.object);
          hoveredArrowId = found ? found.arrowId : null;
          container.style.cursor = 'pointer';
        } else {
          hoveredArrowId = null;
          container.style.cursor = 'default';
        }
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

        const intersects = raycaster.intersectObjects(hitMeshesRef.map(h => h.mesh), false);
        if (intersects.length > 0) {
          const hit = intersects[0];
          const found = hitMeshesRef.find(h => h.mesh === hit.object);
          if (found) {
            onArrowTapRef.current(found.arrowId);
          }
        }
      }
    };

    const handlePointerCancel = () => {
      gesture.cancel();
      hoveredArrowId = null;
      container.style.cursor = 'default';
    };

    const handlePointerLeave = () => {
      hoveredArrowId = null;
      container.style.cursor = 'default';
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointercancel', handlePointerCancel);
    container.addEventListener('pointerleave', handlePointerLeave);

    // Animation state
    interface ArrowAnimState {
      targetT: number;
      currentT: number;
      prevPoints: THREE.Vector3[];
      currPoints: THREE.Vector3[];
      color: string;
      tubeMesh: THREE.Mesh | null;
      headMesh: THREE.Mesh | null;
      hitMeshes: THREE.Mesh[];
    }
    const animStates = new Map<string, ArrowAnimState>();
    let prevArrows: VolumeRenderArrow[] = [];

    const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });

    let frameId: number;
    let lastTime = performance.now();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (renderer.domElement.width !== width * renderer.getPixelRatio() || renderer.domElement.height !== height * renderer.getPixelRatio()) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      const now = performance.now();
      const dtMs = now - lastTime;
      lastTime = now;

      // 1. Sync React state to internal animation state
      const currentModel = buildVolumeRenderModel(boardRef.current.cells, boardRef.current.arrows);
      
      // Remove dead arrows
      for (const [id, state] of animStates.entries()) {
        if (!currentModel.arrows.find(a => a.id === id)) {
          if (state.tubeMesh) arrowGroup.remove(state.tubeMesh);
          if (state.headMesh) arrowGroup.remove(state.headMesh);
          state.hitMeshes.forEach(h => arrowGroup.remove(h));
          animStates.delete(id);
        }
      }

      // Add/update arrows
      for (const arrow of currentModel.arrows) {
        const prevArr = prevArrows.find(a => a.id === arrow.id);
        let state = animStates.get(arrow.id);
        
        // If it moved
        const pointsMoved = prevArr && (prevArr.points.length !== arrow.points.length || prevArr.points.some((p, i) => p.x !== arrow.points[i].x || p.y !== arrow.points[i].y || p.z !== arrow.points[i].z));
        
        if (!state) {
          state = {
            targetT: 0,
            currentT: 0,
            prevPoints: arrow.points.map(p => new THREE.Vector3(p.x, p.y, p.z)),
            currPoints: arrow.points.map(p => new THREE.Vector3(p.x, p.y, p.z)),
            color: arrow.color,
            tubeMesh: null,
            headMesh: null,
            hitMeshes: []
          };
          animStates.set(arrow.id, state);
        } else if (pointsMoved) {
          // Increment targetT and update currPoints
          state.prevPoints = prevArr.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
          state.currPoints = arrow.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
          state.targetT += 1;
        }
      }
      prevArrows = currentModel.arrows;

      // 2. Clear old hit meshes ref to rebuild it
      hitMeshesRef.length = 0;

      // 3. Animate each arrow
      // GLIDE_SPEED is in cells per second
      const speed = (GLIDE_SPEED) / 1000; // cells per ms
      
      for (const [id, state] of animStates.entries()) {
        if (state.currentT < state.targetT) {
          state.currentT = Math.min(state.currentT + speed * dtMs, state.targetT);
        }

        // We use t in [0, 1] relative to the current step
        const t = state.currentT - Math.floor(state.currentT);
        // If we are exactly at an integer and not moving, t is 0 but we use currPoints
        const isMoving = state.currentT < state.targetT;
        const renderT = isMoving ? t : 0;
        const renderPoints = isMoving ? state.prevPoints : state.currPoints;
        const targetPoints = isMoving ? state.currPoints : state.currPoints;

        let result: RailGlideResult3D | null = null;
        if (isMoving && renderPoints.length > 0 && targetPoints.length > 0) {
          result = glideAlongRail3D(renderPoints, targetPoints, renderT);
        }

        const pts = result ? result.body : renderPoints;

        // Draw the tube
        if (pts.length > 1) {
          const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);

          const tubeGeom = new THREE.TubeGeometry(curve, pts.length * 4, 0.15, 8, false);
          
          if (!state.tubeMesh) {
            const tubeMat = new THREE.MeshStandardMaterial({
              color: state.color,
              roughness: 0.2,
              metalness: 0.1,
            });
            state.tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
            state.tubeMesh.userData.arrowId = id;
            arrowGroup.add(state.tubeMesh);
          } else {
            state.tubeMesh.geometry.dispose();
            state.tubeMesh.geometry = tubeGeom;
            state.tubeMesh.visible = true;
          }
          
          const isHovered = id === hoveredArrowId;
          const mat = state.tubeMesh.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = isHovered ? 1.5 : 0.5;
        } else if (state.tubeMesh) {
           state.tubeMesh.visible = false;
        }

        // Draw the head
        if (pts.length > 0) {
          const headPos = pts[pts.length - 1]; // Tip is the last point in the path
          const headGeom = new THREE.ConeGeometry(0.25, 0.6, 16);
          headGeom.rotateX(Math.PI / 2);
          
          if (!state.headMesh) {
            const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, emissive: state.color, emissiveIntensity: 0.5 });
            state.headMesh = new THREE.Mesh(headGeom, headMat);
            state.headMesh.userData.arrowId = id;
            arrowGroup.add(state.headMesh);
          } else {
            // Update emissive
            const isHovered = id === hoveredArrowId;
            const mat = state.headMesh.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = isHovered ? 1.5 : 0.5;
          }

          state.headMesh.position.copy(headPos);

          const arrowModel = currentModel.arrows.find(a => a.id === id);
          if (arrowModel) {
            const { dCol, dRow, dLayer } = portDelta3D(arrowModel.exitDir);
            const dir = new THREE.Vector3(dCol, -dLayer, dRow).normalize();
            const target = new THREE.Vector3().copy(headPos).add(dir);
            if (state.headMesh.parent) {
              state.headMesh.parent.localToWorld(target);
            }
            state.headMesh.lookAt(target);
          }
        }

        // Rebuild hit meshes for this arrow
        state.hitMeshes.forEach(h => arrowGroup.remove(h));
        state.hitMeshes = [];
        const logicalPts = result ? result.vertices : renderPoints;
        for (const p of logicalPts) {
          const hitGeom = new THREE.SphereGeometry(0.4, 8, 8);
          const hitMesh = new THREE.Mesh(hitGeom, hitMaterial);
          hitMesh.position.copy(p);
          arrowGroup.add(hitMesh);
          state.hitMeshes.push(hitMesh);
          hitMeshesRef.push({ mesh: hitMesh, arrowId: id });
        }
      }

      renderer.render(scene3, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerCancel);
      container.removeEventListener('pointerleave', handlePointerLeave);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />;
};
