import * as THREE from "../../../lib/three.module.js";
import { GameConfig } from "../../config/gameConfig.js";
import { easeOutCubic } from "../../utils/easing.js";

export const Node = (position) => {
  const node = {
    position,
    targetPosition: null,
    isVisited: false,
    isSelected: false,
    isValid: false,
    isBreakable: false,
    isBreaker: false,
    isBonus: false,
    connections: new Set(),
  };

  const sharedGeometry = new THREE.BoxGeometry(1, 1, 1);
  const sharedMaterial = new THREE.MeshBasicMaterial({
    color: GameConfig.colors.normalNode,
    transparent: true,
    opacity: 1,
    wireframe: false,
  });
  const sharedEdgesGeometry = new THREE.EdgesGeometry(sharedGeometry);
  const sharedEdgesMaterial = new THREE.LineBasicMaterial({
    color: GameConfig.colors.nodeEdgeLines,
    linewidth: 3,
    opacity: 1,
  });

  const createNodeMesh = () => {
    const nodeMesh = new THREE.Mesh(sharedGeometry, sharedMaterial.clone());
    nodeMesh.position.set(position.x, position.y, position.z);

    const edges = new THREE.LineSegments(
      sharedEdgesGeometry,
      sharedEdgesMaterial,
    );
    const edges2 = new THREE.LineSegments(
      sharedEdgesGeometry,
      sharedEdgesMaterial,
    );
    edges2.scale.multiplyScalar(1.02);

    nodeMesh.add(edges);
    nodeMesh.add(edges2);
    return nodeMesh;
  };

  const nodeMesh = createNodeMesh();
  let fadeRafId;
  let validPulseRafId;
  let bonusGlowRafId;

  const updateNodeAppearance = () => {
    if (node.isBonus) {
      nodeMesh.material.color.setHex(GameConfig.colors.bonusNode);
    } else if (node.isSelected) {
      fadeToColor(GameConfig.colors.validNode);
    } else if (node.isValid) {
      const typeColor = node.isBreakable ? GameConfig.colors.breakableNode
                     : node.isBreaker ? GameConfig.colors.breakerNode
                     : GameConfig.colors.normalNode;
      const blended = new THREE.Color(typeColor).lerp(
        new THREE.Color(GameConfig.colors.validNode), 0.3,
      );
      nodeMesh.material.color.setHex(blended.getHex());
    } else if (node.isBreakable) {
      nodeMesh.material.color.setHex(GameConfig.colors.breakableNode);
    } else if (node.isBreaker) {
      nodeMesh.material.color.setHex(GameConfig.colors.breakerNode);
    } else {
      nodeMesh.material.color.setHex(GameConfig.colors.normalNode);
    }
  };

  const fadeToColor = (color) => {
    cancelAnimationFrame(fadeRafId);
    const startTime = Date.now();
    const duration = 1000;

    const fadeAnimation = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeOutCubic(progress);

      nodeMesh.material.color.lerpColors(
        nodeMesh.material.color,
        new THREE.Color(color),
        easeProgress,
      );

      if (progress < 1) {
        fadeRafId = requestAnimationFrame(fadeAnimation);
      }
    };
    fadeAnimation();
  };

  const stopValidPulse = () => {
    if (validPulseRafId !== undefined) {
      cancelAnimationFrame(validPulseRafId);
      validPulseRafId = undefined;
    }
  };

  const stopBonusGlow = () => {
    if (bonusGlowRafId !== undefined) {
      cancelAnimationFrame(bonusGlowRafId);
      bonusGlowRafId = undefined;
    }
  };

  const startBonusGlow = () => {
    stopBonusGlow();
    const baseColor = new THREE.Color(GameConfig.colors.bonusNode);

    const glow = () => {
      const t = Math.sin(Date.now() / 300) * 0.15 + 0.85;
      nodeMesh.material.color.copy(baseColor);
      nodeMesh.material.color.multiplyScalar(t);
      bonusGlowRafId = requestAnimationFrame(glow);
    };
    glow();
  };

  const startValidPulse = () => {
    stopValidPulse();
    const baseColor = nodeMesh.material.color.clone();

    const pulse = () => {
      const t = Math.sin(Date.now() / 400) * 0.12 + 0.88;
      nodeMesh.material.color.copy(baseColor);
      nodeMesh.material.color.multiplyScalar(t);
      validPulseRafId = requestAnimationFrame(pulse);
    };
    pulse();
  };

  return {
    getMesh: () => nodeMesh,
    getPosition: () => node.position,
    isSelected: () => node.isSelected,
    isValid: () => node.isValid,
    isBreakable: () => node.isBreakable,
    isBreaker: () => node.isBreaker,
    isVisited: () => node.isVisited,
    addConnection: (otherNode) => {
      node.connections.add(otherNode);
    },
    removeConnection: (node) => node.connections.delete(node),
    clearConnections: () => node.connections.clear(),
    getConnections: () => node.connections,
    updateAppearance: updateNodeAppearance,
    setSelected: (value) => {
      node.isSelected = value;
      stopValidPulse();
      updateNodeAppearance();
    },
    setValid: (value) => {
      node.isValid = value;
      cancelAnimationFrame(fadeRafId);
      updateNodeAppearance();
      if (value) {
        stopBonusGlow();
        startValidPulse();
      } else {
        stopValidPulse();
        if (node.isBonus) {
          startBonusGlow();
        }
      }
    },
    setBreakable: (value) => {
      node.isBreakable = value;
      updateNodeAppearance();
    },
    setBreaker: (value) => {
      node.isBreaker = value;
      updateNodeAppearance();
    },
    setBonus: (value) => {
      node.isBonus = value;
      updateNodeAppearance();
      if (value) {
        startBonusGlow();
      } else {
        stopBonusGlow();
      }
    },
    isBonus: () => node.isBonus,
    setVisited: (value) => {
      node.isVisited = value;
    },
    setPosition: (newPosition) => {
      node.position = newPosition;
      nodeMesh.position.set(newPosition.x, newPosition.y, newPosition.z);
    },
    setTargetPosition: (pos) => {
      node.targetPosition = { x: pos.x, y: pos.y, z: pos.z };
    },
    getTargetPosition: () => node.targetPosition,
  };
};
