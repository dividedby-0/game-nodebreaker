import * as THREE from "/lib/three.module.js";

export const PhysicsService = () => {
  const physicsState = {
    gravity: -9.8,
    animationSpeed: 1.0,
    shrinkDuration: 500, // ms
    blinkDuration: 100, // ms per blink
  };

  // Node-related

  const animateNodeRemoval = (node, onComplete) => {
    const blinkCount = 3;
    let currentBlink = 0;
    const mesh = node.getMesh();

    // Blink animation
    const blinkInterval = setInterval(() => {
      mesh.visible = !mesh.visible;
      currentBlink++;

      if (currentBlink >= blinkCount * 2) {
        clearInterval(blinkInterval);
        mesh.visible = true;

        // Start shrinking animation after blinking
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
            if (onComplete) {
              onComplete();
            }
          }
        }, 16); // ~60fps
      }
    }, physicsState.blinkDuration);
  };

  // Lines-related

  const drawConnectionLine = (scene, fromNode, toNode) => {
    const points = [];
    points.push(fromNode.getMesh().position.clone());
    points.push(toNode.getMesh().position.clone());

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 5,
    });

    const line = new THREE.Line(geometry, material);
    scene.add(line);
    return line;
  };

  // Camera-related

  const checkVisualObstructions = (camera, targetNode, allNodes) => {
    const raycaster = new THREE.Raycaster();
    const rayDirection = targetNode
      .getMesh()
      .position.clone()
      .sub(camera.position)
      .normalize();

    raycaster.set(camera.position, rayDirection);

    const intersects = raycaster.intersectObjects(
      allNodes.map((node) => node.getMesh())
    );

    if (intersects.length > 0) {
      const firstHitNode = allNodes.find(
        (node) => node.getMesh() === intersects[0].object
      );

      if (firstHitNode && firstHitNode !== targetNode) {
        return firstHitNode;
      }
    }

    return null;
  };

  return {
    animateNodeRemoval,
    drawConnectionLine,
    checkVisualObstructions,
    setAnimationSpeed: (speed) => {
      physicsState.animationSpeed = speed;
    },
    getState: () => ({ ...physicsState }),
  };
};
