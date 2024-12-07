export const GameConfig = {
  nodeNetwork: {
    size: 4,
    spacing: 3,
  },
  game: {
    initialBreakers: 0,
    scoreIncrement: {
      normal: 5,
      breaker: 5,
      breakable: 10,
    },
  },
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
