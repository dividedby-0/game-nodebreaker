class GraphNode {
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

// TODO repurpose or remove
class CubeGraph {
  constructor() {
    this.nodes = new Map(); // Maps block positions to nodes
  }

  addNode(block) {
    const position = `${block.position.x},${block.position.y},${block.position.z}`;
    const node = new GraphNode(block);
    this.nodes.set(position, node);
    return node;
  }

  addEdge(block1, block2) {
    const pos1 = `${block1.position.x},${block1.position.y},${block1.position.z}`;
    const pos2 = `${block2.position.x},${block2.position.y},${block2.position.z}`;

    const node1 = this.nodes.get(pos1);
    const node2 = this.nodes.get(pos2);

    if (node1 && node2) {
      node1.addEdge(node2);
      node2.addEdge(node1);
    }
  }

  getNode(block) {
    const position = `${block.position.x},${block.position.y},${block.position.z}`;
    return this.nodes.get(position);
  }

  removeNode(block) {
    const position = `${block.position.x},${block.position.y},${block.position.z}`;
    const node = this.nodes.get(position);

    if (node) {
      // Remove all edges connected to this node
      node.adjacentNodes.forEach((_, adjacentNode) => {
        adjacentNode.removeEdge(node);
      });
      this.nodes.delete(position);
    }
  }

  findValidMoves(block) {
    const node = this.getNode(block);
    if (!node) return [];

    return Array.from(node.adjacentNodes.keys())
      .filter((adjacentNode) => {
        const adjacentBlock = adjacentNode.block;
        return !adjacentBlock.isBreakable && !adjacentBlock.isSelected;
      })
      .map((node) => node.block);
  }
}
