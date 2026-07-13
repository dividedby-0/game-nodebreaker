import * as THREE from "../../lib/three.module.js";
import { GameConfig } from "../config/gameConfig.js";

export const LineManager = (eventBus) => {
  const lines = [];
  const redLines = new Map();
  let traceTimeoutId = null;
  let traceRafId = null;
  let traceStopped = false;

  const drawConnectionLine = (scene, fromNode, toNode) => {
    const geometry = new THREE.BufferGeometry();
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
    lines.push(line);
    redLines.set(line, false);
    return line;
  };

  const clearConnectionLines = (scene) => {
    if (!scene) { return; }

    lines.forEach((line) => {
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
    lines.length = 0;
  };

  const triggerTraceAnimation = (onTraceGameOver) => {
    if (traceStopped) { return; }

    if (lines.length === 0) {
      eventBus.emit("scene:flash");
      eventBus.emit("message:hide");
      if (onTraceGameOver) { onTraceGameOver(); }
      return;
    }
    const startColor = new THREE.Color(GameConfig.colors.normalConnection);
    const endColor = new THREE.Color(GameConfig.colors.traceConnection);
    const duration = GameConfig.game.traceSpeed;
    const startTime = Date.now();

    const updateColor = () => {
      if (traceStopped) { return; }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentColor = new THREE.Color();
      const line = lines[0];
      currentColor.lerpColors(startColor, endColor, progress);
      line.material.color = currentColor;

      if (progress < 1) {
        traceRafId = requestAnimationFrame(updateColor);
      } else {
        redLines.set(line, true);
        lines.shift();
        traceTimeoutId = setTimeout(() => {
          triggerTraceAnimation(onTraceGameOver);
        }, GameConfig.game.traceSpeed);
      }
    };
    traceRafId = requestAnimationFrame(updateColor);
  };

  const startTrace = (onTraceGameOver) => {
    traceStopped = false;
    traceTimeoutId = null;
    traceRafId = null;
    triggerTraceAnimation(onTraceGameOver);
  };

  const stop = () => {
    traceStopped = true;
    if (traceTimeoutId !== null) {
      clearTimeout(traceTimeoutId);
      traceTimeoutId = null;
    }
    if (traceRafId !== null) {
      cancelAnimationFrame(traceRafId);
      traceRafId = null;
    }
  };

  const getLines = () => lines;
  const getRedLines = () => redLines;

  return {
    drawConnectionLine,
    clearConnectionLines,
    startTrace,
    stop,
    getLines,
    getRedLines,
  };
};
