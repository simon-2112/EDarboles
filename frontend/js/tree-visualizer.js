/**
 * Tree Visualizer - Renderiza el árbol AVL en canvas
 */

class TreeVisualizer {
  /**
   * @param {string} canvasId - ID del elemento <canvas> donde se dibujará.
   * @param {object} [options]
   * @param {'avl'|'bst'} [options.treeType='avl'] - Solo los nodos AVL muestran el factor de equilibrio.
   * @param {number}  [options.nodeRadius=28]  - Radio del círculo de cada nodo.
   * @param {number}  [options.xSpacing=65]    - Píxeles horizontales entre centros de nodos.
   * @param {number}  [options.ySpacing=85]    - Píxeles verticales entre niveles.
   */
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) throw new Error(`No se encontró el canvas #${canvasId}`);
    this.ctx = this.canvas.getContext("2d");

    this.treeType = options.treeType || "avl";
    this.nodeRadius = options.nodeRadius || 28;
    this.xSpacing = options.xSpacing || 65;
    this.ySpacing = options.ySpacing || 85;

    // Estado del viewport: nivel de zoom y desplazamiento X/Y
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 20;

    // Referencia al árbol actual para que pan/zoom redibuje sin llamadas externas
    this.currentTree = null;

    // Set de IDs de nodos con conflictos de balance (para marcar en rojo)
    this.conflictNodes = new Set();

    // Paleta de colores según el estado del nodo
    this.colors = {
      normal: "#4ECDC4", // nodo sin condición especial
      promotion: "#51CF66", // nodo con promoción activa
      alert: "#FF6B6B", // nodo con alerta
      critical: "#FFD93D", // nodo crítico por profundidad (penalización de precio)
      edge: "#94a3b8", // color de las aristas entre nodos
      border: "#1e293b", // borde del círculo del nodo
      text: "#ffffff", // texto dentro del nodo
      background: "#f8fafc", // color de fondo del canvas
    };

    this._resizeCanvas();
    window.addEventListener("resize", () => {
      this._resizeCanvas();
      if (this.currentTree) this._redraw();
    });
    this._configureMouseEvents();
  }

  // ───────────────────────── Configuración del canvas ──────────────────────

  /** Ajusta el tamaño del canvas al tamaño de su contenedor padre. */
  _resizeCanvas() {
    const container = this.canvas.parentElement;
    if (!container) return;
    this.canvas.width = container.clientWidth || 800;
    this.canvas.height = container.clientHeight || 600;
  }

  /** Configura los eventos de arrastre con el ratón y zoom con la rueda. */
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

    // Zoom con la rueda del ratón: acercar hacia arriba, alejar hacia abajo
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.9;
      this.zoomLevel = Math.max(0.2, Math.min(5, this.zoomLevel * factor));
      this._redraw();
    });

    this.canvas.style.cursor = "grab";
  }

  // ───────────────────────── Cálculo del layout ─────────────────────────────

  /**
   * Asigna _layoutX (índice inorden) y _layoutY (profundidad) a cada nodo.
   * El recorrido inorden garantiza que los subárboles nunca se solapan en X.
   */
  _calculateLayout(node, state = { x: 0 }, depth = 0) {
    if (!node) return;
    this._calculateLayout(node.izquierdo, state, depth + 1);
    node._layoutX = state.x++;
    node._layoutY = depth;
    this._calculateLayout(node.derecho, state, depth + 1);
  }

  /** Cuenta el número total de nodos del subárbol de forma recursiva. */
  _countNodes(node) {
    if (!node) return 0;
    return (
      1 + this._countNodes(node.izquierdo) + this._countNodes(node.derecho)
    );
  }

  // ───────────────────────── API pública ────────────────────────────────────

  /**
   * Dibuja el árbol en el canvas. Guarda la referencia interna para que
   * el pan y el zoom funcionen sin que el código externo tenga que pasar
   * el árbol de nuevo.
   * @param {object} tree - Árbol en formato JSON devuelto por el backend.
   */
  draw(tree) {
    this.currentTree = tree;
    this._redraw();
  }

  /** Restablece el zoom y el desplazamiento a la vista inicial. */
  resetView() {
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 20;
    this._redraw();
  }

  /** Acerca la vista un 20 %. */
  zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel * 1.2, 5);
    this._redraw();
  }

  /** Aleja la vista un 20 %. */
  zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.2);
    this._redraw();
  }

  /**
   * Dibuja el árbol marcando nodos con conflictos de balance en amarillo.
   * Se usa en la visualización de pasos de concurrencia.
   * @param {object} tree - Árbol en formato JSON.
   * @param {Array}  [conflictNodes] - IDs de nodos con conflictos (si no se proporciona, dibuja normal).
   */
  markConflicts(tree, conflictNodes = []) {
    this.currentTree = tree;
    this.conflictNodes = new Set(conflictNodes);
    this._redraw();
  }

  /**
   * Retorna estadísticas básicas del árbol para el panel de comparación AVL vs BST.
   * @param {object} [node] - Nodo raíz (por defecto el árbol actualmente dibujado).
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

  // ───────────────────────── Dibujo interno ─────────────────────────────────

  /** Limpia el canvas y redibuja el árbol completo con la transformación actual. */
  _redraw() {
    const ctx = this.ctx;
    const broad = this.canvas.width;
    const high = this.canvas.height;

    // Limpiar y pintar el fondo
    ctx.clearRect(0, 0, broad, high);
    ctx.fillStyle = this.colors.background;
    ctx.fillRect(0, 0, broad, high);

    if (!this.currentTree) return;

    // Paso 1: calcular coordenadas de layout para cada nodo
    this._calculateLayout(this.currentTree, { x: 0 }, 0);

    // Paso 2: calcular desplazamiento para centrar el árbol horizontalmente
    const n = this._countNodes(this.currentTree);
    const broadTotal = n * this.xSpacing;
    const desplX =
      (broad / this.zoomLevel - broadTotal) / 2 + this.xSpacing / 2;
    const desplY = 50;

    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoomLevel, this.zoomLevel);

    // Las aristas se dibujan primero para que queden por debajo de los nodos
    this._drawEdges(this.currentTree, desplX, desplY);
    this._drawNodes(this.currentTree, desplX, desplY);

    ctx.restore();
  }

  /** Convierte las coordenadas de layout a píxeles en pantalla. */
  _screenPosition(node, ox, oy) {
    return {
      x: node._layoutX * this.xSpacing + ox,
      y: node._layoutY * this.ySpacing + oy,
    };
  }

  /** Dibuja las aristas (líneas) entre cada nodo y sus hijos de forma recursiva. */
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
   * Determina el color de relleno del nodo según su estado.
   * Orden de prioridad: crítico (conflicto o esCritico) > alerta > promoción > normal.
   */
  _colorNode(node) {
    // Mayor prioridad: si está marcado como conflicto durante concurrencia → usar color crítico
    if (this.conflictNodes && this.conflictNodes.has(node.codigo))
      return this.colors.critical;
    if (node.esCritico) return this.colors.critical;
    if (node.alerta) return this.colors.alert;
    if (node.promocion) return this.colors.promotion;
    return this.colors.normal;
  }

  /** Dibuja el círculo, el código del vuelo y el factor de equilibrio de cada nodo. */
  _drawNodes(node, ox, oy) {
    if (!node) return;
    const ctx = this.ctx;
    const { x, y } = this._screenPosition(node, ox, oy);
    const r = this.nodeRadius;

    // Sombra para dar profundidad visual al nodo
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    // Círculo principal del nodo
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = this._colorNode(node);
    ctx.fill();

    // Borde del nodo (se desactiva la sombra para el borde)
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = this.colors.border;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Configuración del texto
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = this.colors.text;

    // Código del vuelo (se trunca a 7 caracteres si es más largo)
    const code = String(node.codigo);
    ctx.font = `bold 11px 'Segoe UI', sans-serif`;
    ctx.fillText(code.length > 7 ? code.slice(0, 7) : code, x, y - 5);

    // Factor de equilibrio: solo se muestra en modo AVL y si el campo existe
    if (this.treeType === "avl" && node.factorEquilibrio !== undefined) {
      const Bf = node.factorEquilibrio;
      ctx.font = `9px 'Segoe UI', sans-serif`;
      // Se muestra en rojo si el factor es inválido (árbol en modo estrés)
      ctx.fillStyle = Math.abs(Bf) > 1 ? "#ff4444" : this.colors.text;
      ctx.fillText(`BF:${Bf}`, x, y + 8);
    }

    // Dibujar hijos de forma recursiva
    this._drawNodes(node.izquierdo, ox, oy);
    this._drawNodes(node.derecho, ox, oy);
  }

  // ───────────────────────── Funciones auxiliares ───────────────────────────

  /** Calcula la altura del árbol desde un nodo raíz dado. */
  _heightTree(node) {
    if (!node) return -1;
    return (
      1 +
      Math.max(this._heightTree(node.izquierdo), this._heightTree(node.derecho))
    );
  }

  /** Cuenta la cantidad de hojas (nodos sin hijos) del árbol. */
  _countLeaves(node) {
    if (!node) return 0;
    if (!node.izquierdo && !node.derecho) return 1;
    return this._countLeaves(node.izquierdo) + this._countLeaves(node.derecho);
  }
}

// Compatibilidad con entornos Node.js / CommonJS además del navegador
if (typeof module !== "undefined" && module.exports) {
  module.exports = TreeVisualizer;
}
