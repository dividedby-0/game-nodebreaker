import * as THREE from "/lib/three.module.js";
import { OrbitControls } from "/lib/OrbitControls.js";

export const RenderService = (gameContainer, gameState) => {
  const renderer = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    ),
    renderer: new THREE.WebGLRenderer({ antialias: true }),
    controls: null,
  };

  const initialize = () => {
    renderer.camera.lookAt(0, 0, 0);
    animateInitialCamera();
    animate();
  };

  const onWindowResize = () => {
    renderer.camera.aspect = window.innerWidth / window.innerHeight;
    renderer.camera.updateProjectionMatrix();
    renderer.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  renderer.renderer.setSize(window.innerWidth, window.innerHeight);
  gameContainer.appendChild(renderer.renderer.domElement);
  renderer.scene.background = new THREE.Color(0x000000);

  // Controls initialization

  renderer.controls = new OrbitControls(
    renderer.camera,
    renderer.renderer.domElement
  );
  renderer.controls.enabled = false;
  renderer.controls.enableDamping = true;
  renderer.controls.dampingFactor = 0.05;
  renderer.controls.rotateSpeed = 0.6;
  renderer.controls.enablePan = false;
  renderer.controls.minDistance = 5;
  renderer.controls.maxDistance = 15;

  // Camera movements

  const animateInitialCamera = () => {
    const startPosition = {
      x: Math.random() * 5,
      y: Math.random() * 5,
      z: Math.random() * 5,
    };
    const endPosition = { x: 10, y: 10, z: 10 };
    const duration = 2000; // ms
    const startTime = Date.now();

    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Use smooth easing
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      renderer.camera.position.set(
        startPosition.x + (endPosition.x - startPosition.x) * easeProgress,
        startPosition.y + (endPosition.y - startPosition.y) * easeProgress,
        startPosition.z + (endPosition.z - startPosition.z) * easeProgress
      );

      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        gameState.setProcessing(false);
        renderer.controls.enabled = true;
      }
    };

    animateCamera();
  };

  const focusCamOnNode = (node) => {
    gameState.setProcessing(true);
    renderer.controls.enabled = false;

    const cubeCenter = new THREE.Vector3(0, 0, 0);
    const previousCamFocusPoint = renderer.controls.target.clone();
    const newCamFocusPoint = node.getMesh().position.clone();

    const startCameraPos = renderer.camera.position.clone();
    const currentOffset = startCameraPos.clone().sub(previousCamFocusPoint);

    const direction = newCamFocusPoint.clone().sub(cubeCenter);
    direction.normalize();

    const distance = currentOffset.length();
    const minDistance = 12;
    const adjustedDistance = distance < minDistance ? minDistance : distance;
    const endCameraPos = newCamFocusPoint
      .clone()
      .add(direction.multiplyScalar(adjustedDistance * 0.9));

    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const newCameraPos = new THREE.Vector3().lerpVectors(
        startCameraPos,
        endCameraPos,
        easeProgress
      );

      const newTarget = new THREE.Vector3().lerpVectors(
        previousCamFocusPoint,
        node.getMesh().position,
        easeProgress
      );

      renderer.camera.position.copy(newCameraPos);
      renderer.controls.target.copy(newTarget);
      renderer.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        gameState.setProcessing(false);
        renderer.controls.enabled = true;
      }
    };
    animate();
  };

  const animate = () => {
    requestAnimationFrame(animate);
    renderer.controls.update();
    renderer.renderer.render(renderer.scene, renderer.camera);
  };

  return {
    initialize,
    getScene: () => renderer.scene,
    getCamera: () => renderer.camera,
    getControls: () => renderer.controls,
    getRenderer: () => renderer.renderer,
    onWindowResize,
    focusCamOnNode,
  };
};
