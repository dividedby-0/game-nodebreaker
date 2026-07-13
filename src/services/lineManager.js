import * as THREE from "../../lib/three.module.js";
import { GameConfig } from "../config/gameConfig.js";

export const LineManager = (eventBus) => {
  const lines = [];
  const redLines = new Map();
  let traceTimeoutId = null;
  let traceRafId = null;
  let traceStopped = false;
  let segmentIndex = 0;
  let totalTraceLines = 0;

  const drawConnectionLine = (scene, fromNode, toNode) => {
    const curve = new THREE.LineCurve3(
      fromNode.getMesh().position,
      toNode.getMesh().position,
    );
    const geometry = new THREE.TubeGeometry(curve, 1, 0.12, 8, false);
    const material = new THREE.MeshBasicMaterial({
      color: GameConfig.colors.normalConnection,
    });

    const line = new THREE.Mesh(geometry, material);
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
      if (onTraceGameOver) { onTraceGameOver(); }
      return;
    }

    const line = lines[0];
    const startColor = new THREE.Color(GameConfig.colors.normalConnection);
    const endColor = new THREE.Color(GameConfig.colors.traceConnection);
    const duration = GameConfig.game.timing.traceSpeed;
    const startTime = Date.now();

    const updateColor = () => {
      if (traceStopped) { return; }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentColor = new THREE.Color();
      currentColor.lerpColors(startColor, endColor, progress);
      line.material.color = currentColor;

      if (progress < 1) {
        traceRafId = requestAnimationFrame(updateColor);
      } else {
        segmentIndex++;
        redLines.set(line, true);
        lines.shift();

        if (eventBus) {
          const progressValue = totalTraceLines > 0 ? segmentIndex / totalTraceLines : 0;
          eventBus.emit("trace:progress", { progress: progressValue });
        }

        traceTimeoutId = setTimeout(() => {
          triggerTraceAnimation(onTraceGameOver);
        }, GameConfig.game.timing.traceSpeed);
      }
    };
    traceRafId = requestAnimationFrame(updateColor);
  };

  const startTrace = (onTraceGameOver) => {
    traceStopped = false;
    traceTimeoutId = null;
    traceRafId = null;
    segmentIndex = 0;
    totalTraceLines = lines.length;
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

  return {
    drawConnectionLine,
    clearConnectionLines,
    startTrace,
    stop,
  };
};
