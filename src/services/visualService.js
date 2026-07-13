import * as THREE from "../../lib/three.module.js";
import { easeOutCubic } from "../utils/easing.js";

export const VisualService = () => {
  const state = {
    shrinkDuration: 500,
    blinkDuration: 100,
    showVisualObstructionRaycaster: false,
    debugRaycasterLine: null,
  };

  const activeIntervals = new Set();

  const cancelAllAnimations = () => {
    activeIntervals.forEach((id) => clearInterval(id));
    activeIntervals.clear();
  };

  const animateNodeRemoval = (node, onComplete) => {
    const blinkCount = 3;
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
        const targetScale = 0.3;
        const startTime = Date.now();

        const shrinkInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / state.shrinkDuration, 1);

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
        }, 16);
        activeIntervals.add(shrinkInterval);
      }
    }, state.blinkDuration);
    activeIntervals.add(blinkInterval);
  };

  const hideObstructingNodes = (obstructingNodeObj, onNodeHidden) => {
    const neighboringNodes = Array.from(obstructingNodeObj.getConnections());
    const nodesToHide = [obstructingNodeObj, ...neighboringNodes];

    nodesToHide.forEach((nodeToHide) => {
      const nodeToHideMesh = nodeToHide.getMesh();

      const fadeOutDuration = 500;
      const startFadeOutTime = Date.now();
      const startOpacity = 1;
      const targetOpacity = 0.3;
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
          requestAnimationFrame(fadeAnimation);
        }
      };
      fadeAnimation();
    });
  };

  const unhideObstructingNodes = (node) => {
    const nodeMesh = node.getMesh();
    const fadeInDuration = 500;
    const startFadeInTime = Date.now();
    const startOpacity = 0.3;
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
        requestAnimationFrame(fadeInAnimation);
      } else {
        nodeMesh.material.transparent = false;
      }
    };
    fadeInAnimation();
  };

  const rayTarget = new THREE.Vector3();

  const checkVisualObstructions = (camera, targetNode, allNodes, scene, onNodeHidden) => {
    rayTarget
      .copy(targetNode.getMesh().position)
      .sub(camera.position)
      .normalize();
    const raycaster = new THREE.Raycaster();
    raycaster.set(camera.position, rayTarget);

    if (state.showVisualObstructionRaycaster) {
      if (state.debugRaycasterLine) {
        scene.remove(state.debugRaycasterLine);
      }

      const points = [camera.position, targetNode.getMesh().position];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0xff00ff });
      state.debugRaycasterLine = new THREE.Line(geometry, material);
      scene.add(state.debugRaycasterLine);
    } else if (state.debugRaycasterLine) {
      scene.remove(state.debugRaycasterLine);
      state.debugRaycasterLine = null;
    }

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
    getState: () => ({ ...state }),
  };
};
