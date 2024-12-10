export const GameConfig = {
  game: {
    nodeNetworkSize: 4,
    nodeNetworkSpacing: 4,
    nonClickableNodesCount: 24,
    breakerNodesCount: 2,
    scoreIncrement: {
      normal: 5,
      breaker: 5,
      breakable: 10,
    },
    traceSpeed: 2000,
  },
  // -- for testing on a small scale
  // game: {
  //   nodeNetworkSize: 2,
  //   nodeNetworkSpacing: 3,
  //   nonClickableNodesCount: 2,
  //   breakerNodesCount: 1,
  //   scoreIncrement: {
  //     normal: 5,
  //     breaker: 5,
  //     breakable: 10,
  //   },
  // },
  colors: {
    validNode: 0x32cd32,
    breakableNode: 0xff4500,
    breakerNode: 0x7799cc,
    normalNode: 0x2c2c54,
    nodeEdgeLines: 0x4682b4,
    normalConnection: 0x87cefa,
    traceConnection: 0xff0000,
    flashColor: 0xff0000,
    textColor: "#00ff00",
    caretColor: "#00ff00",
  },
  groundColors: [0x1e90ff, 0xff69b4, 0x32cd32, 0x8a2be2],
};
