import { Node } from "../Node/index.js";

export const NodeNetwork = (gameState, eventBus) => {
  const nodeNetwork = {
    nodesArray: [],
    size: 4,
    spacing: 3,
    nonClickableNodesCount: 2,
    breakerNodesCount: 2,
  };

  const initializeNodes = () => {
    for (let x = 0; x < nodeNetwork.size; x++) {
      for (let y = 0; y < nodeNetwork.size; y++) {
        for (let z = 0; z < nodeNetwork.size; z++) {
          const position = {
            x: (x - (nodeNetwork.size - 1) / 2) * nodeNetwork.spacing,
            y: (y - (nodeNetwork.size - 1) / 2) * nodeNetwork.spacing,
            z: (z - (nodeNetwork.size - 1) / 2) * nodeNetwork.spacing,
          };
          const createdNode = Node(position);
          nodeNetwork.nodesArray.push(createdNode);
        }
      }
    }
  };

  const setupNodesConnections = () => {
    for (let x = 0; x < nodeNetwork.size; x++) {
      for (let y = 0; y < nodeNetwork.size; y++) {
        for (let z = 0; z < nodeNetwork.size; z++) {
          const currentNode = getNode(x, y, z);
          // Check all 6 adjacent directions
          const directions = [
            { x: x + 1, y, z },
            { x: x - 1, y, z },
            { x, y: y + 1, z },
            { x, y: y - 1, z },
            { x, y, z: z + 1 },
            { x, y, z: z - 1 },
          ];
          directions.forEach((dir) => {
            if (isValidAdjacentNode(dir.x, dir.y, dir.z)) {
              const adjacentNode = getNode(dir.x, dir.y, dir.z);
              currentNode.addConnection(adjacentNode);
            }
          });
        }
      }
    }
  };

  const isValidAdjacentNode = (x, y, z) =>
    x >= 0 &&
    x < nodeNetwork.size &&
    y >= 0 &&
    y < nodeNetwork.size &&
    z >= 0 &&
    z < nodeNetwork.size;

  const getNode = (x, y, z) =>
    nodeNetwork.nodesArray[
      x * nodeNetwork.size * nodeNetwork.size + y * nodeNetwork.size + z
    ];

  const setRandomBreakableNodes = () => {
    const indices = [...Array(nodeNetwork.nodesArray.length).keys()];
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Set the first n nodes as breakable
    for (let i = 0; i < nodeNetwork.nonClickableNodesCount; i++) {
      const nodeIndex = indices[i];
      nodeNetwork.nodesArray[nodeIndex].setBreakable(true);
    }
  };

  const setRandomBreakerNodes = () => {
    const indices = [...Array(nodeNetwork.nodesArray.length).keys()].filter(
      (i) =>
        nodeNetwork.nodesArray[i] && !nodeNetwork.nodesArray[i].isBreakable(),
    );

    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Set the first n nodes as breakers
    for (
      let i = 0;
      i < Math.min(nodeNetwork.breakerNodesCount, indices.length);
      i++
    ) {
      const nodeIndex = indices[i];
      if (nodeNetwork.nodesArray[nodeIndex]) {
        nodeNetwork.nodesArray[nodeIndex].setBreaker(true);
      }
    }
  };

  const addToScene = (scene) => {
    nodeNetwork.nodesArray.forEach((node) => {
      scene.add(node.getMesh());
    });
  };

  const findValidNextMoves = (node) => {
    const validMoves = Array.from(node.getConnections()).filter(
      (connectedNode) =>
        !connectedNode.isSelected() &&
        (!connectedNode.isBreakable() || gameState.getBreakerCount() > 0),
    );

    if (validMoves.length === 0) {
      gameState.setProcessing(true);
      gameState.stopTimer();
      eventBus.emit("scene:flash");
      eventBus.emit("message:hide");
      gameState.setTraced(false);
      gameState.showGameOver("You got stuck ¯\\_(ツ)_/¯");
      return;
    }

    nodeNetwork.nodesArray.forEach((node) => {
      node.setValid(false);
    });

    validMoves.forEach((validNode) => {
      validNode.setValid(true);
    });
  };

  const removeNode = (node) => {
    const index = nodeNetwork.nodesArray.indexOf(node);
    if (index > -1) {
      nodeNetwork.nodesArray.splice(index, 1);
    }
  };

  const getNodesArray = () => nodeNetwork.nodesArray;

  const reset = (scene) => {
    nodeNetwork.nodesArray.forEach((node) => {
      scene.remove(node.getMesh());
    });
    nodeNetwork.nodesArray = [];
    initializeNodes();
    setupNodesConnections();
    setRandomBreakableNodes();
    setRandomBreakerNodes();
    addToScene(scene);
  };

  initializeNodes();
  setupNodesConnections();
  setRandomBreakableNodes();
  setRandomBreakerNodes();

  return {
    reset,
    addToScene,
    findValidNextMoves,
    getNodesArray,
    removeNode,
    getSize: () => nodeNetwork.size,
    getSpacing: () => nodeNetwork.spacing,
    getNonClickableNodesCount: () => nodeNetwork.nonClickableNodesCount,
    getBreakerNodesCount: () => nodeNetwork.breakerNodesCount,
    setSize: (newSize) => {
      nodeNetwork.setSize = newSize;
    },
    setSpacing: (newSpacing) => {
      nodeNetwork.spacing = newSpacing;
    },
    setNonClickableNodesCount: (newNonClickableNodesCount) => {
      nodeNetwork.nonClickableNodesCount = newNonClickableNodesCount;
    },
    setBreakerNodesCount: (newBreakerNodesCount) => {
      nodeNetwork.breakerNodesCount = newBreakerNodesCount;
    },
  };
};
