/**
 * Tree Visualizer - Renders the AVL tree in canvas
 */

class TreeVisualizer {
  /**
   * @param {string} canvasId - ID of the element <canvas> where it will be drawn.
   * @param {object} [options]
   * @param {'avl'|'bst'} [options.treeType='avl'] - Only AVL nodes show the balance factor.
   * @param {number}  [options.nodeRadius=28]  - Radius of the circle of each node.
   * @param {number}  [options.xSpacing=65]    - Horizontal pixels between node centers.
   * @param {number}  [options.ySpacing=85]    - Vertical pixels between levels.
   */
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) throw new Error(`No se encontró el canvas #${canvasId}`);
    this.ctx = this.canvas.getContext("2d");

    this.treeType = options.treeType || "avl";
    this.nodeRadius = options.nodeRadius || 28;
    this.xSpacing = options.xSpacing || 65;
    this.ySpacing = options.ySpacing || 85;

    // Viewport state: zoom level and X/Y offset
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 20;

    // Reference to the current tree so that pan/zoom redraws without external calls
    this.currentTree = null;

    // Set of node IDs with balance conflicts (to be marked in red)
    this.conflictNodes = new Set();

    // Color palette according to node state
    this.colors = {
      normal: "#4ECDC4", // node without special condition
      promotion: "#51CF66", // node with active promotion
      alert: "#FF6B6B", // node with alert
      critical: "#FFD93D", // critical node by depth (price penalty)
      edge: "#94a3b8", // color of the edges between nodes
      border: "#1e293b", // edge of the node circle
      text: "#ffffff", // text within the node
      background: "#f8fafc", // canvas background color
    };

    this._resizeCanvas();
    window.addEventListener("resize", () => {
      this._resizeCanvas();
      if (this.currentTree) this._redraw();
    });
    this._configureMouseEvents();
  }

  // ───────────────────────── Canvas settings ──────────────────────

  /** Adjust the canvas size to the size of its parent container. */
  _resizeCanvas() {
    const container = this.canvas.parentElement;
    if (!container) return;
    this.canvas.width = container.clientWidth || 800;
    this.canvas.height = container.clientHeight || 600;
  }

  /** Configure mouse drag events and wheel zoom. */
  _configureMouseEvents() {
    let dragging = false;
    let startX = 0,
      startY = 0;

    this.canvas.addEventListener("mousedown", (e) => {
      dragging = true;
      startX = e.clientX - this.panX;
      startY = e.clientY - this.panY;
      this.canvas.style.cursor = "grabbing";
    });

    this.canvas.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      this.panX = e.clientX - startX;
      this.panY = e.clientY - startY;
      this._redraw();
    });

    const stopDrag = () => {
      dragging = false;
      this.canvas.style.cursor = "grab";
    };
    this.canvas.addEventListener("mouseup", stopDrag);
    this.canvas.addEventListener("mouseleave", stopDrag);

    // Zoom with the mouse wheel: zoom in up, zoom out down
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.9;
      this.zoomLevel = Math.max(0.2, Math.min(5, this.zoomLevel * factor));
      this._redraw();
    });

    this.canvas.style.cursor = "grab";
  }

  // ───────────────────────── Layout calculation ─────────────────────────────

  /**
   * Assign _layoutX (inorder index) and _layoutY (depth) to each node.
   * The inorder traversal ensures that the subtrees never overlap in X.
   */
  _calculateLayout(node, state = { x: 0 }, depth = 0) {
    if (!node) return;
    this._calculateLayout(node.izquierdo, state, depth + 1);
    node._layoutX = state.x++;
    node._layoutY = depth;
    this._calculateLayout(node.derecho, state, depth + 1);
  }

  /** Recursively count the total number of nodes in the subtree. */
  _countNodes(node) {
    if (!node) return 0;
    return (
      1 + this._countNodes(node.izquierdo) + this._countNodes(node.derecho)
    );
  }

  // ───────────────────────── API public ─────────────────────────────────────

  /**
   * Draw the tree on the canvas. Save the internal reference so that
   * panning and zooming work without the external code having to pass
   * the tree again.
   * @param {object} tree - Árbol en formato JSON devuelto por el backend.
   */
  draw(tree) {
    this.currentTree = tree;
    this._redraw();
  }

  /** Reset zoom and pan to the initial view. */
  resetView() {
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 20;
    this._redraw();
  }

  /** Zoom in 20%.. */
  zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel * 1.2, 5);
    this._redraw();
  }

  /** Move your gaze 20% further away. */
  zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.2);
    this._redraw();
  }

  /**
   * Draw the tree, highlighting nodes with balance conflicts in yellow.
   * Used to visualize concurrency steps.
   * @param {object} tree - Tree in JSON format.
   * @param {Array}  [conflictNodes] - IDs of conflicting nodes (if not provided, draw normally).
   */
  markConflicts(tree, conflictNodes = []) {
    this.currentTree = tree;
    this.conflictNodes = new Set(conflictNodes);
    this._redraw();
  }

  /**
   * Returns basic tree statistics for the AVL vs BST comparison panel.
   * @param {object} [node] - Root node (by default the currently drawn tree).
   * @returns {{ root: string, depth: number, leaves: number }}
   */
  getStats(node = this.currentTree) {
    if (!node) return { root: "-", depth: 0, leaves: 0 };
    return {
      root: node.codigo,
      depth: this._heightTree(node),
      leaves: this._countLeaves(node),
    };
  }

  // ───────────────────────── Internal drawing ─────────────────────────────────

  /** Clear the canvas and redraw the entire tree with the current transformation. */
  _redraw() {
    const ctx = this.ctx;
    const broad = this.canvas.width;
    const high = this.canvas.height;

    // Limpiar y pintar el fondo
    ctx.clearRect(0, 0, broad, high);
    ctx.fillStyle = this.colors.background;
    ctx.fillRect(0, 0, broad, high);

    if (!this.currentTree) return;

    // Step 1: Calculate layout coordinates for each node
    this._calculateLayout(this.currentTree, { x: 0 }, 0);

    // Step 2: Calculate the offset to center the tree horizontally
    const n = this._countNodes(this.currentTree);
    const broadTotal = n * this.xSpacing;
    const desplX =
      (broad / this.zoomLevel - broadTotal) / 2 + this.xSpacing / 2;
    const desplY = 50;

    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoomLevel, this.zoomLevel);

    // The edges are drawn first so that they lie below the nodes.
    this._drawEdges(this.currentTree, desplX, desplY);
    this._drawNodes(this.currentTree, desplX, desplY);

    ctx.restore();
  }

  /** Converts layout coordinates to screen pixels. */
  _screenPosition(node, ox, oy) {
    return {
      x: node._layoutX * this.xSpacing + ox,
      y: node._layoutY * this.ySpacing + oy,
    };
  }

  /**  Draw the edges (lines) between each node and its children recursively. */
  _drawEdges(node, ox, oy) {
    if (!node) return;
    const p = this._screenPosition(node, ox, oy);
    const ctx = this.ctx;

    for (const child of [node.izquierdo, node.derecho]) {
      if (!child) continue;
      const ph = this._screenPosition(child, ox, oy);
      ctx.beginPath();
      ctx.strokeStyle = this.colors.edge;
      ctx.lineWidth = 1.8;
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(ph.x, ph.y);
      ctx.stroke();
      this._drawEdges(child, ox, oy);
    }
  }

  /**
   * Determines the node's fill color based on its state.
   * Priority order: critical (conflict or isCritical) > alert > promotion > normal.
   */
  _colorNode(node) {
    // Higher priority: if marked as conflict during concurrency → use critical color
    if (this.conflictNodes && this.conflictNodes.has(node.codigo))
      return this.colors.critical;
    if (node.esCritico) return this.colors.critical;
    if (node.alerta) return this.colors.alert;
    if (node.promocion) return this.colors.promotion;
    return this.colors.normal;
  }

  /** Draw the circle, the flight code, and the balance factor of each node. */
  _drawNodes(node, ox, oy) {
    if (!node) return;
    const ctx = this.ctx;
    const { x, y } = this._screenPosition(node, ox, oy);
    const r = this.nodeRadius;

    // Shadow to give visual depth to the node
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    // Main circle of the node
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = this._colorNode(node);
    ctx.fill();

    // Node edge (shadow for edge is disabled)
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = this.colors.border;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text settings
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = this.colors.text;

    // Flight code (truncated to 7 characters if longer)
    const code = String(node.codigo);
    ctx.font = `bold 11px 'Segoe UI', sans-serif`;
    ctx.fillText(code.length > 7 ? code.slice(0, 7) : code, x, y - 5);

    // Balance factor: only displayed in AVL mode and if the field exists
    if (this.treeType === "avl" && node.factorEquilibrio !== undefined) {
      const Bf = node.factorEquilibrio;
      ctx.font = `9px 'Segoe UI', sans-serif`;
      // It is shown in red if the factor is invalid (tree in stress mode)
      ctx.fillStyle = Math.abs(Bf) > 1 ? "#ff4444" : this.colors.text;
      ctx.fillText(`BF:${Bf}`, x, y + 8);
    }

    // Draw children recursively
    this._drawNodes(node.izquierdo, ox, oy);
    this._drawNodes(node.derecho, ox, oy);
  }

  // ───────────────────────── auxiliary functions ───────────────────────────

  /** Calculate the height of the tree from a given root node. */
  _heightTree(node) {
    if (!node) return -1;
    return (
      1 +
      Math.max(this._heightTree(node.izquierdo), this._heightTree(node.derecho))
    );
  }

  /** Count the number of leaves (nodes without children) in the tree. */
  _countLeaves(node) {
    if (!node) return 0;
    if (!node.izquierdo && !node.derecho) return 1;
    return this._countLeaves(node.izquierdo) + this._countLeaves(node.derecho);
  }
}

// Compatibility with Node.js / CommonJS environments in addition to the browser
if (typeof module !== "undefined" && module.exports) {
  module.exports = TreeVisualizer;
}
