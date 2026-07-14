import * as THREE from "../../lib/three.module.js";
import { easeOutCubic } from "../utils/easing.js";
import { GameConfig } from "../config/gameConfig.js";

export const VisualService = () => {
  const activeIntervals = new Set();
  const nodeFadeRafIds = new Map();
  const particleSystems = new Map();

  const cancelAllAnimations = () => {
    activeIntervals.forEach((id) => clearInterval(id));
    activeIntervals.clear();
    nodeFadeRafIds.forEach((id) => cancelAnimationFrame(id));
    nodeFadeRafIds.clear();
    particleSystems.forEach((data, points) => {
      if (data.rafId !== null) { cancelAnimationFrame(data.rafId); }
      data.scene.remove(points);
      data.geometry.dispose();
      data.material.dispose();
    });
    particleSystems.clear();
  };

  const animateNodeRemoval = (node, onComplete) => {
    const blinkCount = GameConfig.game.timing.blinkCount;
    let currentBlink = 0;
    const mesh = node.getMesh();

    const blinkInterval = setInterval(() => {
      mesh.visible = !mesh.visible;
      currentBlink++;

      if (currentBlink >= blinkCount * 2) {
        clearInterval(blinkInterval);
        activeIntervals.delete(blinkInterval);
        mesh.visible = true;

        const startScale = mesh.scale.x;
        const targetScale = GameConfig.game.timing.targetScale;
        const startTime = Date.now();

        const shrinkInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / GameConfig.game.timing.shrinkDuration, 1);

          const easeProgress = easeOutCubic(progress);

          const currentScale =
            startScale + (targetScale - startScale) * easeProgress;
          mesh.scale.set(currentScale, currentScale, currentScale);

          if (progress === 1) {
            clearInterval(shrinkInterval);
            activeIntervals.delete(shrinkInterval);
            if (onComplete) {
              onComplete();
            }
          }
        }, GameConfig.game.timing.shrinkInterval);
        activeIntervals.add(shrinkInterval);
      }
    }, GameConfig.game.timing.blinkDuration);
    activeIntervals.add(blinkInterval);
  };

  const hideObstructingNodes = (obstructingNodeObj, onNodeHidden) => {
    const neighboringNodes = Array.from(obstructingNodeObj.getConnections());
    const nodesToHide = [obstructingNodeObj, ...neighboringNodes];

    nodesToHide.forEach((nodeToHide) => {
      const nodeToHideMesh = nodeToHide.getMesh();

      const existingRaf = nodeFadeRafIds.get(nodeToHideMesh);
      if (existingRaf) {cancelAnimationFrame(existingRaf);}

      const fadeOutDuration = GameConfig.game.timing.nodeFadeDuration;
      const startFadeOutTime = Date.now();
      const startOpacity = 1;
      const targetOpacity = GameConfig.game.timing.targetOpacity;
      nodeToHideMesh.material.transparent = true;
      nodeToHideMesh.layers.disable(0);

      if (onNodeHidden) { onNodeHidden(nodeToHide); }

      const fadeAnimation = () => {
        const elapsed = Date.now() - startFadeOutTime;
        const progress = Math.min(elapsed / fadeOutDuration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        const newOpacity =
          startOpacity + (targetOpacity - startOpacity) * easeProgress;
        nodeToHideMesh.material.opacity = newOpacity;
        if (nodeToHideMesh.children[0]) {
          nodeToHideMesh.children[0].material.opacity = newOpacity;
          nodeToHideMesh.children[0].material.transparent = true;
        }

        if (progress < 1) {
          nodeFadeRafIds.set(nodeToHideMesh, requestAnimationFrame(fadeAnimation));
        } else {
          nodeFadeRafIds.delete(nodeToHideMesh);
        }
      };
      nodeFadeRafIds.set(nodeToHideMesh, requestAnimationFrame(fadeAnimation));
    });
  };

  const unhideObstructingNodes = (node) => {
    const nodeMesh = node.getMesh();

    const existingRaf = nodeFadeRafIds.get(nodeMesh);
    if (existingRaf) {cancelAnimationFrame(existingRaf);}

    const fadeInDuration = GameConfig.game.timing.nodeFadeDuration;
    const startFadeInTime = Date.now();
    const startOpacity = GameConfig.game.timing.targetOpacity;
    const targetOpacity = 1;

    nodeMesh.material.transparent = true;
    nodeMesh.layers.enable(0);
    if (nodeMesh.children[0]) {
      nodeMesh.children[0].visible = true;
    }

    const fadeInAnimation = () => {
      const elapsed = Date.now() - startFadeInTime;
      const progress = Math.min(elapsed / fadeInDuration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const newOpacity =
        startOpacity + (targetOpacity - startOpacity) * easeProgress;
      nodeMesh.material.opacity = newOpacity;
      if (nodeMesh.children[0]) {
        nodeMesh.children[0].material.opacity = newOpacity;
        nodeMesh.children[0].material.transparent = true;
      }

      if (progress < 1) {
        nodeFadeRafIds.set(nodeMesh, requestAnimationFrame(fadeInAnimation));
      } else {
        nodeFadeRafIds.delete(nodeMesh);
        nodeMesh.material.transparent = false;
      }
    };
    nodeFadeRafIds.set(nodeMesh, requestAnimationFrame(fadeInAnimation));
  };

  const rayTarget = new THREE.Vector3();

  const checkVisualObstructions = (camera, targetNode, allNodes, scene, onNodeHidden) => {
    rayTarget
      .copy(targetNode.getMesh().position)
      .sub(camera.position)
      .normalize();
    const raycaster = new THREE.Raycaster();
    raycaster.set(camera.position, rayTarget);

    const intersectedByRaycaster = raycaster.intersectObjects(scene.children);
    if (intersectedByRaycaster.length === 0) { return; }

    const firstIntersectId = intersectedByRaycaster[0].object.id;
    const targetNodeId = targetNode.getMesh().id;

    if (firstIntersectId !== targetNodeId) {
      const obstructingNodeObj = allNodes
        .find((n) => n.getMesh() === intersectedByRaycaster[0].object);
      if (obstructingNodeObj) {
        hideObstructingNodes(obstructingNodeObj, onNodeHidden);
      }
    }
  };

  const emitParticles = (position, scene, { color = 0x87cefa, count = 12, spread = 0.6, lifetime = 500 } = {}) => {
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x + (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * spread;
      velocities.push({
        x: (Math.random() - 0.5) * 0.08,
        y: Math.random() * 0.08,
        z: (Math.random() - 0.5) * 0.08,
      });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color,
      size: 0.15,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const system = { scene, points, geometry, material, rafId: null };
    particleSystems.set(points, system);

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / lifetime, 1);

      const pos = points.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        pos[i * 3] += velocities[i].x;
        pos[i * 3 + 1] += velocities[i].y;
        pos[i * 3 + 2] += velocities[i].z;
        velocities[i].y -= 0.001;
      }
      points.geometry.attributes.position.needsUpdate = true;
      points.material.opacity = 1 - progress;

      if (progress < 1) {
        system.rafId = requestAnimationFrame(animate);
      } else {
        scene.remove(points);
        geometry.dispose();
        material.dispose();
        particleSystems.delete(points);
      }
    };

    system.rafId = requestAnimationFrame(animate);
  };

  const flashNodeInvalid = (node) => {
    const mesh = node.getMesh();
    mesh.material.color.setHex(GameConfig.colors.traceConnection);
    setTimeout(() => {
      node.updateAppearance();
    }, 200);
  };

  const emitBonusSpawnEffect = (position, scene) => {
    const geo = new THREE.IcosahedronGeometry(0.65);
    const edgesGeo = new THREE.EdgesGeometry(geo);
    const mat = new THREE.LineBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.6,
    });
    const wireframe = new THREE.LineSegments(edgesGeo, mat);
    wireframe.position.copy(position);
    scene.add(wireframe);

    const startTime = Date.now();
    const duration = 600;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const scale = 1 + progress * 2;
      wireframe.scale.set(scale, scale, scale);
      mat.opacity = 0.6 * (1 - progress);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        scene.remove(wireframe);
        geo.dispose();
        edgesGeo.dispose();
        mat.dispose();
      }
    };
    animate();
  };

  return {
    animateNodeRemoval,
    cancelAllAnimations,
    checkVisualObstructions,
    emitParticles,
    unhideObstructingNodes,
    flashNodeInvalid,
    emitBonusSpawnEffect,
  };
};
