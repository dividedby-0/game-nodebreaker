import * as THREE from "../../lib/three.module.js";
import { GameConfig } from "../config/gameConfig.js";

export const PhysicsService = (gameState, nodeNetwork, eventBus) => {
  const physicsState = {
    gravity: -9.8,
    animationSpeed: 1.0,
    shrinkDuration: 500, // ms
    blinkDuration: 100, // ms per blink
    showVisualObstructionRaycaster: false, // set to true for debugging
    debugRaycasterLine: null,
    connectionLines: [],
  };
  const redLines = new Map();

  // Node-related

  const animateNodeRemoval = (node, onComplete) => {
    gameState.setProcessing(true);
    const blinkCount = 3;
    let currentBlink = 0;
    const mesh = node.getMesh();

    const blinkInterval = setInterval(() => {
      mesh.visible = !mesh.visible;
      currentBlink++;

      if (currentBlink >= blinkCount * 2) {
        clearInterval(blinkInterval);
        mesh.visible = true;

        // Start shrinking animation
        const startScale = mesh.scale.x;
        const targetScale = 0.3;
        const startTime = Date.now();

        const shrinkInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / physicsState.shrinkDuration, 1);

          // Ease out cubic
          const easeProgress = 1 - Math.pow(1 - progress, 3);

          // Calculate current scale using linear interpolation
          const currentScale =
            startScale + (targetScale - startScale) * easeProgress;
          mesh.scale.set(currentScale, currentScale, currentScale);

          if (progress === 1) {
            clearInterval(shrinkInterval);
            gameState.setProcessing(false);
            if (onComplete) {
              onComplete();
            }
          }
        }, 16); // ~60fps
      }
    }, physicsState.blinkDuration);
  };

  const hideObstructingNodes = (obstructingNodeObj) => {
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

      gameState.addHiddenNode(nodeToHide);

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
        } else {
          // if (nodeToHideMesh.children[0]) {
          //   nodeToHideMesh.children[0].visible = false;
          // }
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

  // Lines-related
  const lineGeometryPool = [];
  const getLineGeometry = () =>
    lineGeometryPool.pop() || new THREE.BufferGeometry();

  const drawConnectionLine = (scene, fromNode, toNode) => {
    const geometry = getLineGeometry();
    geometry.setFromPoints([
      fromNode.getMesh().position,
      toNode.getMesh().position,
    ]);

    const material = new THREE.LineBasicMaterial({
      color: GameConfig.colors.normalConnection,
      linewidth: 7,
    });

    const line = new THREE.Line(geometry, material);
    scene.add(line);
    physicsState.connectionLines.push(line);
    redLines.set(line, false);
    return line;
  };

  const triggerTraceAnimation = () => {
    if (!gameState.isBeingTraced() === true) {
      return;
    }

    if (physicsState.connectionLines.length === 0) {
      gameState.setProcessing(true);
      eventBus.emit("scene:flash");
      eventBus.emit("message:hide");
      gameState.showGameOver("You have been traced :/");
      return;
    }
    const startColor = new THREE.Color(GameConfig.colors.normalConnection);
    const endColor = new THREE.Color(GameConfig.colors.traceConnection);
    const duration = GameConfig.game.traceSpeed;
    const startTime = Date.now();

    const updateColor = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentColor = new THREE.Color();
      const line = physicsState.connectionLines[0];
      currentColor.lerpColors(startColor, endColor, progress);
      line.material.color = currentColor;

      if (progress < 1) {
        requestAnimationFrame(updateColor);
      } else {
        redLines.set(line, true);
        physicsState.connectionLines.shift();
        setTimeout(() => {
          triggerTraceAnimation();
        }, GameConfig.game.traceSpeed);
      }
    };
    updateColor();
  };

  // Camera-related
  const rayTarget = new THREE.Vector3();

  const checkVisualObstructions = (camera, targetNode, allNodes, scene) => {
    rayTarget
      .copy(targetNode.getMesh().position)
      .sub(camera.position)
      .normalize();
    const raycaster = new THREE.Raycaster();
    raycaster.set(camera.position, rayTarget);

    // Create or update debug ray line
    if (physicsState.showVisualObstructionRaycaster) {
      // Remove existing ray line if it exists
      if (physicsState.debugRaycasterLine) {
        scene.remove(physicsState.debugRaycasterLine);
      }

      // Create ray line geometry
      const points = [camera.position, targetNode.getMesh().position];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0xff00ff });
      physicsState.debugRaycasterLine = new THREE.Line(geometry, material);
      scene.add(physicsState.debugRaycasterLine);
    } else if (physicsState.debugRaycasterLine) {
      scene.remove(physicsState.debugRaycasterLine);
      physicsState.debugRaycasterLine = null;
    }

    const intersectedByRaycaster = raycaster.intersectObjects(scene.children);
    const firstIntersectId = intersectedByRaycaster[0].object.id;
    const targetNodeId = targetNode.getMesh().id;

    if (firstIntersectId !== targetNodeId) {
      const obstructingNodeObj = nodeNetwork
        .getNodesArray()
        .find((n) => n.getMesh() === intersectedByRaycaster[0].object);
      if (obstructingNodeObj) {
        hideObstructingNodes(obstructingNodeObj);
      }
    }
  };

  const clearConnectionLines = (scene) => {
    if (!scene) {
      return;
    }
    physicsState.connectionLines.forEach((line) => {
      if (line && scene.children.includes(line)) {
        scene.remove(line);
        line.geometry.dispose();
        line.material.dispose();
      }
    });
    redLines.forEach((value, line) => {
      scene.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    });
    redLines.clear();
    physicsState.connectionLines = [];
  };

  return {
    animateNodeRemoval,
    triggerTraceAnimation,
    drawConnectionLine,
    checkVisualObstructions,
    unhideObstructingNodes,
    clearConnectionLines,
    getState: () => ({ ...physicsState }),
    getConnectionLines: () => physicsState.connectionLines,
  };
};
