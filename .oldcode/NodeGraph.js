class NodeGraph {
  constructor(block) {
    this.block = block;
    this.adjacentNodes = new Map(); // Maps nodes to their edge weights (can be useful for pathfinding)
  }

  addEdge(node, weight = 1) {
    this.adjacentNodes.set(node, weight);
  }

  removeEdge(node) {
    this.adjacentNodes.delete(node);
  }
}
