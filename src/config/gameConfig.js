export const GameConfig = {
  game: {
    nodeNetworkSize: 4,
    nodeNetworkSpacing: 3,
    nonClickableNodesCount: 8,
    breakerNodesCount: 2,
    scoreIncrement: {
      normal: 5,
      breaker: 5,
      breakable: 10,
    },
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
    normalConnection: 0x7fff00,
    traceConnection: 0xff0000,
    flashColor: 0xff0000,
    textColor: "#00ff00",
    caretColor: "#00ff00",
  },
};
