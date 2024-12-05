import * as THREE from "../../lib/three.module.js";

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

  const drawConnectionLine = (scene, fromNode, toNode) => {
    const points = [];
    points.push(fromNode.getMesh().position.clone());
    points.push(toNode.getMesh().position.clone());

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      linewidth: 5,
    });

    const line = new THREE.Line(geometry, material);
    scene.add(line);
    physicsState.connectionLines.push(line);
    return line;
  };

  const triggerTraceAnimation = () => {
    if (physicsState.connectionLines.length === 0) {
      console.log("No more lines to trace");
      return;
    }

    const line = physicsState.connectionLines[0];
    const startColor = new THREE.Color(0x00ffff);
    const endColor = new THREE.Color(0xff0000);
    const duration = 2000;
    const startTime = Date.now();

    function updateColor() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentColor = new THREE.Color();
      currentColor.lerpColors(startColor, endColor, progress);
      line.material.color = currentColor;

      if (progress < 1) {
        requestAnimationFrame(updateColor);
      } else {
        physicsState.connectionLines.shift();
        setTimeout(() => {
          triggerTraceAnimation();
        }, 2000);
      }
    }
    updateColor();
  };

  // Camera-related

  const checkVisualObstructions = (camera, targetNode, allNodes, scene) => {
    const raycaster = new THREE.Raycaster();
    const rayTarget = targetNode
      .getMesh()
      .position.clone()
      .sub(camera.position)
      .normalize();

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

  return {
    animateNodeRemoval,
    triggerTraceAnimation,
    drawConnectionLine,
    checkVisualObstructions,
    unhideObstructingNodes,
    getState: () => ({ ...physicsState }),
    getConnectionLines: () => physicsState.connectionLines,
  };
};
