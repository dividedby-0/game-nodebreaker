import * as THREE from "../../lib/three.module.js";
import { EffectComposer } from "../../lib/postprocessing/EffectComposer.js";
import { GlitchPass } from "../../lib/postprocessing/GlitchPass.js";
import { RenderPass } from "../../lib/postprocessing/RenderPass.js";

export const GlitchService = (renderer, scene, camera) => {
  const pixelRatio = window.devicePixelRatio;
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(pixelRatio);
  composer.setSize(window.innerWidth, window.innerHeight);

  const glitchPass = new GlitchPass();

  const initialize = () => {
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(glitchPass);
  };

  const update = () => {
    composer.render();
  };

  const setGlitchIntensity = (intensity) => {
    glitchPass.goWild = intensity > 0.1;
  };

  const onWindowResize = () => {
    composer.setSize(window.innerWidth, window.innerHeight);
  };

  return {
    initialize,
    update,
    setGlitchIntensity,
    onWindowResize,
  };
};
