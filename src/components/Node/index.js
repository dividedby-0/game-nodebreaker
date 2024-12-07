import * as THREE from "../../../lib/three.module.js";
import { GameConfig } from "../../config/gameConfig.js";

export const Node = (position) => {
  const node = {
    position,
    isVisited: false,
    isSelected: false,
    isValid: false,
    isBreakable: false,
    isBreaker: false,
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
    linewidth: 2,
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

  const updateNodeAppearance = () => {
    if (node.isBreakable) {
      nodeMesh.material.color.setHex(GameConfig.colors.breakableNode);
    } else if (node.isSelected && node.isBreaker) {
      nodeMesh.material.color.setHex(GameConfig.colors.breakerNode);
    } else if (node.isSelected) {
      fadeToColor(GameConfig.colors.validNode);
    } else if (node.isValid && node.isBreaker) {
      nodeMesh.material.color.setHex(GameConfig.colors.breakerNode);
    } else if (node.isValid) {
      fadeToColor(GameConfig.colors.validNode);
    } else if (node.isBreaker) {
      nodeMesh.material.color.setHex(GameConfig.colors.breakerNode);
    } else {
      nodeMesh.material.color.setHex(GameConfig.colors.normalNode);
    }
  };

  const fadeToColor = (color) => {
    const startTime = Date.now();
    const duration = 1000;

    const fadeAnimation = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      nodeMesh.material.color.lerpColors(
        nodeMesh.material.color,
        new THREE.Color(color),
        easeProgress,
      );

      if (progress < 1) {
        requestAnimationFrame(fadeAnimation);
      }
    };
    fadeAnimation();
  };

  return {
    getMesh: () => nodeMesh,
    getPosition: () => node.position,
    isSelected: () => node.isSelected,
    isValid: () => node.isValid,
    isBreakable: () => node.isBreakable,
    isBreaker: () => node.isBreaker,
    isVisited: () => node.isVisited,
    addConnection: (otherNode) => node.connections.add(otherNode),
    removeConnection: (node) => node.connections.delete(node),
    clearConnections: () => node.connections.clear(),
    getConnections: () => node.connections,
    updateAppearance: updateNodeAppearance,
    setSelected: (value) => {
      node.isSelected = value;
      updateNodeAppearance();
    },
    setValid: (value) => {
      node.isValid = value;
      updateNodeAppearance();
    },
    setBreakable: (value) => {
      node.isBreakable = value;
      updateNodeAppearance();
    },
    setBreaker: (value) => {
      node.isBreaker = value;
      updateNodeAppearance();
    },
    setVisited: (value) => {
      node.isVisited = value;
    },
    setPosition: (newPosition) => {
      node.position = newPosition;
      nodeMesh.position.set(newPosition.x, newPosition.y, newPosition.z);
    },
  };
};
