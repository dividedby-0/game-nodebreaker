import * as THREE from "../../lib/three.module.js";
import { easeOutCubic } from "../utils/easing.js";
import { GameConfig } from "../config/gameConfig.js";

export const VisualService = () => {
  const activeIntervals = new Set();
  const nodeFadeRafIds = new Map();

  const cancelAllAnimations = () => {
    activeIntervals.forEach((id) => clearInterval(id));
    activeIntervals.clear();
    nodeFadeRafIds.forEach((id) => cancelAnimationFrame(id));
    nodeFadeRafIds.clear();
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

  return {
    animateNodeRemoval,
    cancelAllAnimations,
    checkVisualObstructions,
    unhideObstructingNodes,
  };
};
