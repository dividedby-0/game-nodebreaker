import * as THREE from "../../lib/three.module.js";
import { OrbitControls } from "../../lib/OrbitControls.js";
import { EffectComposer } from "../../lib/postprocessing/EffectComposer.js";
import { RenderPass } from "../../lib/postprocessing/RenderPass.js";
import { GlitchPass } from "../../lib/postprocessing/GlitchPass.js";
import { ScanlinesShader } from "../../lib/shaders/scanlines.js";
import { ShaderPass } from "../../lib/postprocessing/ShaderPass.js";
import { GameConfig } from "../config/gameConfig.js";
import { easeOutCubic } from "../utils/easing.js";

export const RenderService = (
  gameContainer,
  gameState,
  eventBus,
) => {
  let flashRafId = null;
  let cameraRafId = null;

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
    renderer.camera.lookAt(0, 0, 0);
    renderer.controls.enabled = false;

    // Setup post-processing
    renderer.composer = new EffectComposer(renderer.renderer);
    const renderPass = new RenderPass(renderer.scene, renderer.camera);
    renderer.composer.addPass(renderPass);

    renderer.scanlinesPass = new ShaderPass(ScanlinesShader);
    renderer.scanlinesPass.uniforms.resolution.value.set(
      window.innerWidth * 0.5,
      window.innerHeight * 0.5,
    );
    renderer.composer.addPass(renderer.scanlinesPass);

    renderer.glitchPass = new GlitchPass();
    renderer.glitchPass.enabled = false;
    renderer.composer.addPass(renderer.glitchPass);

    renderer.composer.setPixelRatio(window.devicePixelRatio * 0.5);

    // Event listeners
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
    if (renderer.scanlinesPass) {
      renderer.scanlinesPass.uniforms.resolution.value.set(
        window.innerWidth * 0.5,
        window.innerHeight * 0.5,
      );
    }
  };

  renderer.renderer.setSize(window.innerWidth, window.innerHeight);
  gameContainer.appendChild(renderer.renderer.domElement);

  renderer.controls = new OrbitControls(
    renderer.camera,
    renderer.renderer.domElement,
  );
  renderer.controls.enabled = false;
  renderer.controls.enableDamping = true;
  renderer.controls.dampingFactor = GameConfig.game.camera.dampingFactor;
  renderer.controls.rotateSpeed = GameConfig.game.camera.rotateSpeed;
  renderer.controls.enablePan = false;
  renderer.controls.minDistance = GameConfig.game.camera.minDistance;
  renderer.controls.maxDistance = GameConfig.game.camera.maxDistance;

  const triggerGlitchEffect = () => {
    renderer.glitchPass.enabled = true;
    setTimeout(() => {
      renderer.glitchPass.enabled = false;
    }, GameConfig.game.timing.glitchDuration);
  };

  const flashScene = () => {
    if (flashRafId) {cancelAnimationFrame(flashRafId);}

    renderer.scene.background = new THREE.Color(GameConfig.colors.flashColor);
    renderer.renderer.setClearAlpha(1);

    const startTime = Date.now();
    const duration = GameConfig.game.timing.flashDuration;

    const fadeBack = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeOutCubic(progress);

      if (progress < 1) {
        renderer.scene.background = new THREE.Color(
          GameConfig.colors.flashColor,
        ).multiplyScalar(1 - easeProgress);
        renderer.renderer.setClearAlpha(1 - easeProgress);
        flashRafId = requestAnimationFrame(fadeBack);
      } else {
        renderer.scene.background = null;
        renderer.renderer.setClearAlpha(0);
        flashRafId = null;
      }
    };
    flashRafId = requestAnimationFrame(fadeBack);
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
    if (cameraRafId) {cancelAnimationFrame(cameraRafId);}

    const startPosition = {
      x: Math.random() * 5,
      y: Math.random() * 5,
      z: Math.random() * 5,
    };
    const endPosition = { x: GameConfig.game.camera.defaultDistance, y: GameConfig.game.camera.defaultDistance, z: GameConfig.game.camera.defaultDistance };
    const duration = GameConfig.game.timing.cameraAnimDuration;
    const startTime = Date.now();

    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeOutCubic(progress);

      renderer.camera.position.set(
        startPosition.x + (endPosition.x - startPosition.x) * easeProgress,
        startPosition.y + (endPosition.y - startPosition.y) * easeProgress,
        startPosition.z + (endPosition.z - startPosition.z) * easeProgress,
      );

      renderer.camera.lookAt(0, 0, 0);
      renderer.controls.target.set(0, 0, 0);
      renderer.controls.update();

      if (progress < 1) {
        cameraRafId = requestAnimationFrame(animateCamera);
      } else {
        cameraRafId = null;
        if (onComplete) {
          onComplete();
        }
      }
    };

    cameraRafId = requestAnimationFrame(animateCamera);
  };

  const focusCamOnNode = (node) => {
    if (cameraRafId) {cancelAnimationFrame(cameraRafId);}

    renderer.controls.enabled = false;

    const cubeCenter = new THREE.Vector3(0, 0, 0);
    const previousCamFocusPoint = renderer.controls.target.clone();
    const newCamFocusPoint = node.getMesh().position.clone();

    const startCameraPos = renderer.camera.position.clone();
    const currentOffset = startCameraPos.clone().sub(previousCamFocusPoint);

    const direction = newCamFocusPoint.clone().sub(cubeCenter);
    direction.normalize();

    const distance = currentOffset.length();
    const minDistance = GameConfig.game.camera.focusMinDistance;
    const adjustedDistance = distance < minDistance ? minDistance : distance;
    const endCameraPos = newCamFocusPoint
      .clone()
      .add(direction.multiplyScalar(adjustedDistance * GameConfig.game.camera.focusDistanceMultiplier));

    const duration = GameConfig.game.timing.focusAnimDuration;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeOutCubic(progress);

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
        cameraRafId = null;
        eventBus.emit("camera:focused", {
          node,
          camera: renderer.camera,
          scene: renderer.scene,
        });
        renderer.controls.enabled = true;
        return;
      }
      cameraRafId = requestAnimationFrame(animate);
    };
    cameraRafId = requestAnimationFrame(animate);
  };

  const resetCamera = () => {
    renderer.camera.position.set(
      GameConfig.game.camera.defaultDistance,
      GameConfig.game.camera.defaultDistance,
      GameConfig.game.camera.defaultDistance,
    );
    renderer.camera.lookAt(0, 0, 0);
    if (renderer.controls) {
      renderer.controls.target.set(0, 0, 0);
      renderer.controls.update();
    }
  };

  const animate = () => {
    requestAnimationFrame(animate);
    renderer.controls.update();
    if (renderer.composer) {
      renderer.composer.render();
    } else {
      renderer.renderer.render(renderer.scene, renderer.camera);
    }
  };

  return {
    initialize,
    startGameAnimations,
    getScene: () => renderer.scene,
    getCamera: () => renderer.camera,
    getControls: () => renderer.controls,
    getRenderer: () => renderer.renderer,
    setControls: (value) => {
      renderer.controls.enabled = value;
    },
    onWindowResize,
    focusCamOnNode,
    triggerGlitchEffect,
    flashScene,
    resetCamera,
  };
};
