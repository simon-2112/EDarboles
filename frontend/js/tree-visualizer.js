/**
 * Tree Visualizer - Renderiza el árbol AVL en canvas
 */

class TreeVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");

    // Configuración
    this.nodeRadius = 25;
    this.verticalGap = 80;
    this.horizontalGap = 50;
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;

    // Colores
    this.colors = {
      normal: "#4ECDC4",
      promotion: "#51CF66",
      alert: "#FF6B6B",
      critical: "#FFE66D",
      selected: "#A78BFA",
    };

    this.resizeCanvas();
    this.setupMouseEvents();
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
  }

  setupMouseEvents() {
    let isDragging = false;
    let startX, startY;

    this.canvas.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX - this.panX;
      startY = e.clientY - this.panY;
    });

    this.canvas.addEventListener("mousemove", (e) => {
      if (isDragging) {
        this.panX = e.clientX - startX;
        this.panY = e.clientY - startY;
        this.draw();
      }
    });

    this.canvas.addEventListener("mouseup", () => {
      isDragging = false;
    });

    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoom = e.deltaY < 0 ? 1.1 : 0.9;
      this.zoomLevel *= zoom;
      this.zoomLevel = Math.max(0.5, Math.min(3, this.zoomLevel));
      this.draw();
    });
  }

  /**
   * Dibujar el árbol completo
   * @param {object} tree - Árbol en formato JSON
   */
  draw(tree = null) {
    if (!tree) {
      this.ctx.fillStyle = "#333";
      this.ctx.font = "16px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "No hay árbol cargado",
        this.canvas.width / 2,
        this.canvas.height / 2,
      );
      return;
    }

    // Limpiar canvas
    this.ctx.fillStyle = "#f5f5f5";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Aplicar transformaciones
    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.zoomLevel, this.zoomLevel);

    // Calcular posiciones
    const positions = this.calculatePositions(tree);

    // Dibujar aristas
    this.drawEdges(tree, positions);

    // Dibujar nodos
    this.drawNodes(tree, positions);

    this.ctx.restore();
  }

  calculatePositions(node, x = 0, y = 0, offset = 100) {
    if (!node) return new Map();

    const positions = new Map();
    positions.set(node.codigo, { x, y });

    if (node.izquierdo) {
      const leftPositions = this.calculatePositions(
        node.izquierdo,
        x - offset,
        y + this.verticalGap,
        offset / 2,
      );
      leftPositions.forEach((pos, code) => positions.set(code, pos));
    }

    if (node.derecho) {
      const rightPositions = this.calculatePositions(
        node.derecho,
        x + offset,
        y + this.verticalGap,
        offset / 2,
      );
      rightPositions.forEach((pos, code) => positions.set(code, pos));
    }

    return positions;
  }

  drawEdges(node, positions) {
    if (!node) return;

    const pos = positions.get(node.codigo);
    if (!pos) return;

    this.ctx.strokeStyle = "#999";
    this.ctx.lineWidth = 2;

    if (node.izquierdo) {
      const leftPos = positions.get(node.izquierdo.codigo);
      if (leftPos) {
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        this.ctx.lineTo(leftPos.x, leftPos.y);
        this.ctx.stroke();
      }
      this.drawEdges(node.izquierdo, positions);
    }

    if (node.derecho) {
      const rightPos = positions.get(node.derecho.codigo);
      if (rightPos) {
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        this.ctx.lineTo(rightPos.x, rightPos.y);
        this.ctx.stroke();
      }
      this.drawEdges(node.derecho, positions);
    }
  }

  drawNodes(node, positions) {
    if (!node) return;

    const pos = positions.get(node.codigo);
    if (!pos) return;

    // Seleccionar color basado en propiedades
    let color = this.colors.normal;
    if (node.alerta) color = this.colors.alert;
    else if (node.promocion) color = this.colors.promotion;

    // Dibujar círculo del nodo
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, this.nodeRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Borde del nodo
    this.ctx.strokeStyle = "#333";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Dibujar código del vuelo
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "bold 12px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(node.codigo, pos.x, pos.y - 5);

    // Factor de balance (altura/BF)
    this.ctx.fillStyle = "#666";
    this.ctx.font = "10px Arial";
    this.ctx.fillText(`BF:${node.balanceFactor || 0}`, pos.x, pos.y + 8);

    // Recursivamente dibujar nodos hijos
    if (node.izquierdo) this.drawNodes(node.izquierdo, positions);
    if (node.derecho) this.drawNodes(node.derecho, positions);
  }

  /**
   * Resetear zoom y pan
   */
  resetView() {
    this.zoomLevel = 1;
    this.panX = this.canvas.width / 2;
    this.panY = 50;
  }

  /**
   * Zoom in
   */
  zoomIn() {
    this.zoomLevel *= 1.2;
    this.zoomLevel = Math.min(this.zoomLevel, 3);
  }

  /**
   * Zoom out
   */
  zoomOut() {
    this.zoomLevel /= 1.2;
    this.zoomLevel = Math.max(this.zoomLevel, 0.5);
  }
}

// Exportar para usar en app-main.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = TreeVisualizer;
}
