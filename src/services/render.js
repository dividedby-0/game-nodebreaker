import * as THREE from "../../lib/three.module.js";
import { OrbitControls } from "../../lib/OrbitControls.js";
import { EffectComposer } from "../../lib/postprocessing/EffectComposer.js";
import { RenderPass } from "../../lib/postprocessing/RenderPass.js";
import { GlitchPass } from "../../lib/postprocessing/GlitchPass.js";
import { ScanlinesShader } from "../../lib/shaders/scanlines.js";
import { ShaderPass } from "../../lib/postprocessing/ShaderPass.js";

export const RenderService = (
  gameContainer,
  gameState,
  physicsService,
  eventBus,
) => {
  const renderer = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    ),
    renderer: new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      precision: "mediump",
      alpha: true,
    }),
    controls: null,
    composer: null,
    glitchPass: null,
  };

  renderer.renderer.capabilities.maxTextureSize = 2048;

  const initialize = () => {
    renderer.renderer.setClearColor(0x000000, 0);
    renderer.scene.background = null;
    // renderer.renderer.setClearAlpha(0);
    renderer.camera.lookAt(0, 0, 0);
    renderer.controls.enabled = false;

    // Setup post-processing
    renderer.composer = new EffectComposer(renderer.renderer);
    const renderPass = new RenderPass(renderer.scene, renderer.camera);
    renderer.composer.addPass(renderPass);

    const scanlinesPass = new ShaderPass(ScanlinesShader);
    scanlinesPass.uniforms.resolution.value.set(
      window.innerWidth * 0.5,
      window.innerHeight * 0.5,
    );
    renderer.composer.addPass(scanlinesPass);

    renderer.glitchPass = new GlitchPass();
    renderer.glitchPass.enabled = false;
    renderer.composer.addPass(renderer.glitchPass);

    renderer.composer.setPixelRatio(window.devicePixelRatio * 0.5);

    // Event listeners
    eventBus.on("glitch:trigger", () => {
      triggerGlitchEffect();
    });

    eventBus.on("scene:flash", () => {
      flashScene();
    });

    animate();
  };

  // Renderer-related

  const onWindowResize = () => {
    renderer.camera.aspect = window.innerWidth / window.innerHeight;
    renderer.camera.updateProjectionMatrix();
    renderer.renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.composer.setSize(window.innerWidth, window.innerHeight);
  };

  renderer.renderer.setSize(window.innerWidth, window.innerHeight);
  gameContainer.appendChild(renderer.renderer.domElement);

  renderer.controls = new OrbitControls(
    renderer.camera,
    renderer.renderer.domElement,
  );
  renderer.controls.enabled = false;
  renderer.controls.enableDamping = true;
  renderer.controls.dampingFactor = 0.05;
  renderer.controls.rotateSpeed = 0.6;
  renderer.controls.enablePan = false;
  renderer.controls.minDistance = 5;
  renderer.controls.maxDistance = 15;

  const triggerGlitchEffect = () => {
    renderer.glitchPass.enabled = true;
    setTimeout(() => {
      renderer.glitchPass.enabled = false;
    }, 1000); // Disable after 1 second
  };

  const flashScene = () => {
    renderer.scene.background = new THREE.Color(0xff0000);
    renderer.renderer.setClearAlpha(1);

    const startTime = Date.now();
    const duration = 2000;

    const fadeBack = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      if (progress < 1) {
        renderer.scene.background = new THREE.Color(0xff0000).multiplyScalar(
          1 - easeProgress,
        );
        renderer.renderer.setClearAlpha(1 - easeProgress);
        requestAnimationFrame(fadeBack);
      } else {
        renderer.scene.background = null;
        renderer.renderer.setClearAlpha(0);
      }
    };
    requestAnimationFrame(fadeBack);
  };

  // Camera-related

  const startGameAnimations = () =>
    new Promise((resolve) => {
      gameState.setProcessing(true);
      animateInitialCamera(() => {
        resolve();
      });
    });

  const animateInitialCamera = (onComplete) => {
    const startPosition = {
      x: Math.random() * 5,
      y: Math.random() * 5,
      z: Math.random() * 5,
    };
    const endPosition = { x: 10, y: 10, z: 10 };
    const duration = 2000;
    const startTime = Date.now();

    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      renderer.camera.position.set(
        startPosition.x + (endPosition.x - startPosition.x) * easeProgress,
        startPosition.y + (endPosition.y - startPosition.y) * easeProgress,
        startPosition.z + (endPosition.z - startPosition.z) * easeProgress,
      );

      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        if (onComplete) {
          onComplete();
        }
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
        easeProgress,
      );

      const newTarget = new THREE.Vector3().lerpVectors(
        previousCamFocusPoint,
        node.getMesh().position,
        easeProgress,
      );

      renderer.camera.position.copy(newCameraPos);
      renderer.controls.target.copy(newTarget);
      renderer.controls.update();

      if (progress >= 1) {
        physicsService.checkVisualObstructions(
          renderer.camera,
          node,
          gameState.getSelectedNodes(),
          renderer.scene,
        );

        gameState.setProcessing(false);
        renderer.controls.enabled = true;
        return;
      }
      requestAnimationFrame(animate);
    };
    animate();
  };

  const animate = () => {
    requestAnimationFrame(animate);
    renderer.controls.update();
    if (renderer.composer) {
      renderer.composer.render();
    } else {
      renderer.renderer.render(renderer.scene, renderer.camera);
    }
    renderer.renderer.state.reset();
  };

  return {
    initialize,
    startGameAnimations,
    getScene: () => renderer.scene,
    getCamera: () => renderer.camera,
    getControls: () => renderer.controls,
    getRenderer: () => renderer.renderer,
    onWindowResize,
    focusCamOnNode,
    triggerGlitchEffect,
    flashScene,
  };
};
