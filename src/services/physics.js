import * as THREE from "/lib/three.module.js";

export const PhysicsService = () => {
  const physicsState = {
    gravity: -9.8,
    animationSpeed: 1.0,
    shrinkDuration: 500, // ms
    blinkDuration: 100, // ms per blink
  };

  const animateBlockRemoval = (block, onComplete) => {
    const blinkCount = 3;
    let currentBlink = 0;
    const mesh = block.getMesh();

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

  const checkVisualObstruction = (camera, targetBlock, allBlocks) => {
    const raycaster = new THREE.Raycaster();
    const rayDirection = targetBlock
      .getMesh()
      .position.clone()
      .sub(camera.position)
      .normalize();

    raycaster.set(camera.position, rayDirection);

    const intersects = raycaster.intersectObjects(
      allBlocks.map((block) => block.getMesh())
    );

    if (intersects.length > 0) {
      const firstHitBlock = allBlocks.find(
        (block) => block.getMesh() === intersects[0].object
      );

      if (firstHitBlock && firstHitBlock !== targetBlock) {
        return firstHitBlock;
      }
    }

    return null;
  };

  return {
    animateBlockRemoval,
    checkVisualObstruction,
    setAnimationSpeed: (speed) => {
      physicsState.animationSpeed = speed;
    },
    getState: () => ({ ...physicsState }),
  };
};
