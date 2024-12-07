export const GameConfig = {
  game: {
    nodeNetworkSize: 4,
    nodeNetworkSpacing: 3,
    nonClickableNodesCount: 6,
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
    validNode: 0x04710b,
    breakableNode: 0xff0000,
    breakerNode: 0x6721ba,
    normalNode: 0x000000,
    nodeEdgeLines: 0x00ff17,
    normalConnection: 0x00fcff,
    traceConnection: 0xff0000,
    flashColor: 0xff0000,
  },
};
