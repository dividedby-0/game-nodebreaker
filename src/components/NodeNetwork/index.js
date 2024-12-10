import { Node } from "../Node/index.js";
import { GameConfig } from "../../config/gameConfig.js";
import { GameState } from "../../store/gameState.js";

export const NodeNetwork = (gameState, eventBus) => {
  const nodeNetwork = {
    nodesArray: [],
    size: GameConfig.game.nodeNetworkSize,
    spacing: GameConfig.game.nodeNetworkSpacing,
    nonClickableNodesCount: GameConfig.game.nonClickableNodesCount,
    breakerNodesCount: GameConfig.game.breakerNodesCount,
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

  const checkNetworkConnectivity = () => {
    const startNode = nodeNetwork.nodesArray.find(
      (node) => !node.isBreakable(),
    );
    if (!startNode) {
      return false;
    }

    const visited = new Set();
    const queue = [startNode];
    visited.add(startNode);

    while (queue.length > 0) {
      const currentNode = queue.shift();

      for (const neighbor of currentNode.getConnections()) {
        if (!visited.has(neighbor) && !neighbor.isBreakable()) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    const accessibleNodes = nodeNetwork.nodesArray.filter(
      (node) => !node.isBreakable(),
    ).length;

    return visited.size === accessibleNodes;
  };

  const setRandomBreakableNodes = () => {
    const indices = [...Array(nodeNetwork.nodesArray.length).keys()];

    let validConfiguration = false;

    while (!validConfiguration) {
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      nodeNetwork.nodesArray.forEach((node) => node.setBreakable(false));
      for (let i = 0; i < nodeNetwork.nonClickableNodesCount; i++) {
        nodeNetwork.nodesArray[indices[i]].setBreakable(true);
      }
      validConfiguration = checkNetworkConnectivity();
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

    nodeNetwork.nodesArray.forEach((node) => {
      node.setValid(false);
    });

    validMoves.forEach((validNode) => {
      validNode.setValid(true);
    });

    if (validMoves.length === 0) {
      checkGameCompleted();

      if (
        gameState &&
        gameState.isGameCompleted() &&
        gameState.areValidNodesLeft()
      ) {
        gameState.setProcessing(true);
        eventBus.emit("scene:flash");
        eventBus.emit("message:hide");
        gameState.setTraced(false);
        gameState.showGameOver("You got stuck ¯\\_(ツ)_/¯");
      } else if (gameState && gameState.isGameCompleted()) {
        gameState.setProcessing(true);
        eventBus.emit("scene:flash");
        eventBus.emit("message:hide");
        gameState.setTraced(false);
        gameState.showWin("You linked all the nodes!");
      } else {
        gameState.setProcessing(true);
        eventBus.emit("scene:flash");
        eventBus.emit("message:hide");
        gameState.setTraced(false);
        gameState.showGameOver("That's a dead end :(");
      }
    }
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

  const checkGameCompleted = () => {
    const validNodesLeft = nodeNetwork.nodesArray.filter(
      (node) =>
        !node.isVisited() &&
        !node.isBreakable() &&
        gameState.getBreakerCount() === 0,
    );

    if (validNodesLeft.length > 0) {
      gameState.setValidNodesLeft(true);
    } else {
      gameState.setValidNodesLeft(false);
      gameState.setGameCompleted(true);
    }
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
    checkGameCompleted,
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
