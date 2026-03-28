/**
 * Tree Visualizer - Renderiza el árbol AVL en canvas
 */

class TreeVisualizer {
  /**
   * @param {string} canvasId - ID del elemento <canvas> donde se dibujará.
   * @param {object} [opciones]
   * @param {'avl'|'bst'} [opciones.treeType='avl'] - Solo los nodos AVL muestran el factor de equilibrio.
   * @param {number}  [opciones.nodeRadius=28]  - Radio del círculo de cada nodo.
   * @param {number}  [opciones.xSpacing=65]    - Píxeles horizontales entre centros de nodos.
   * @param {number}  [opciones.ySpacing=85]    - Píxeles verticales entre niveles.
   */
  constructor(canvasId, opciones = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) throw new Error(`No se encontró el canvas #${canvasId}`);
    this.ctx = this.canvas.getContext("2d");
 
    this.treeType   = opciones.treeType   || "avl";
    this.nodeRadius = opciones.nodeRadius  || 28;
    this.xSpacing   = opciones.xSpacing   || 65;
    this.ySpacing   = opciones.ySpacing   || 85;
 
    // Estado del viewport: nivel de zoom y desplazamiento X/Y
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 20;
 
    // Referencia al árbol actual para que pan/zoom redibuje sin llamadas externas
    this.currentTree = null;
 
    // Paleta de colores según el estado del nodo
    this.colores = {
      normal:    "#4ECDC4",  // nodo sin condición especial
      promocion: "#51CF66",  // nodo con promoción activa
      alerta:    "#FF6B6B",  // nodo con alerta
      critico:   "#FFD93D",  // nodo crítico por profundidad (penalización de precio)
      arista:    "#94a3b8",  // color de las aristas entre nodos
      borde:     "#1e293b",  // borde del círculo del nodo
      texto:     "#ffffff",  // texto dentro del nodo
      fondo:     "#f8fafc",  // color de fondo del canvas
    };
 
    this._redimensionarCanvas();
    window.addEventListener("resize", () => {
      this._redimensionarCanvas();
      if (this.currentTree) this._redibujar();
    });
    this._configurarEventosMouse();
  }
 
  // ───────────────────────── Configuración del canvas ──────────────────────
 
  /** Ajusta el tamaño del canvas al tamaño de su contenedor padre. */
  _redimensionarCanvas() {
    const contenedor = this.canvas.parentElement;
    if (!contenedor) return;
    this.canvas.width  = contenedor.clientWidth  || 800;
    this.canvas.height = contenedor.clientHeight || 600;
  }
 
  /** Configura los eventos de arrastre con el ratón y zoom con la rueda. */
  _configurarEventosMouse() {
    let arrastrando = false;
    let inicioX = 0, inicioY = 0;
 
    this.canvas.addEventListener("mousedown", (e) => {
      arrastrando = true;
      inicioX = e.clientX - this.panX;
      inicioY = e.clientY - this.panY;
      this.canvas.style.cursor = "grabbing";
    });
 
    this.canvas.addEventListener("mousemove", (e) => {
      if (!arrastrando) return;
      this.panX = e.clientX - inicioX;
      this.panY = e.clientY - inicioY;
      this._redibujar();
    });
 
    const detenerArrastre = () => {
      arrastrando = false;
      this.canvas.style.cursor = "grab";
    };
    this.canvas.addEventListener("mouseup",    detenerArrastre);
    this.canvas.addEventListener("mouseleave", detenerArrastre);
 
    // Zoom con la rueda del ratón: acercar hacia arriba, alejar hacia abajo
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.9;
      this.zoomLevel = Math.max(0.2, Math.min(5, this.zoomLevel * factor));
      this._redibujar();
    });
 
    this.canvas.style.cursor = "grab";
  }
 
  // ───────────────────────── Cálculo del layout ─────────────────────────────
 
  /**
   * Asigna _layoutX (índice inorden) y _layoutY (profundidad) a cada nodo.
   * El recorrido inorden garantiza que los subárboles nunca se solapan en X.
   */
  _calcularLayout(nodo, estado = { x: 0 }, profundidad = 0) {
    if (!nodo) return;
    this._calcularLayout(nodo.izquierdo, estado, profundidad + 1);
    nodo._layoutX = estado.x++;
    nodo._layoutY = profundidad;
    this._calcularLayout(nodo.derecho, estado, profundidad + 1);
  }
 
  /** Cuenta el número total de nodos del subárbol de forma recursiva. */
  _contarNodos(nodo) {
    if (!nodo) return 0;
    return 1 + this._contarNodos(nodo.izquierdo) + this._contarNodos(nodo.derecho);
  }
 
  // ───────────────────────── API pública ────────────────────────────────────
 
  /**
   * Dibuja el árbol en el canvas. Guarda la referencia interna para que
   * el pan y el zoom funcionen sin que el código externo tenga que pasar
   * el árbol de nuevo.
   * @param {object} arbol - Árbol en formato JSON devuelto por el backend.
   */
  draw(arbol) {
    this.currentTree = arbol;
    this._redibujar();
  }
 
  /** Restablece el zoom y el desplazamiento a la vista inicial. */
  resetView() {
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 20;
    this._redibujar();
  }
 
  /** Acerca la vista un 20 %. */
  zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel * 1.2, 5);
    this._redibujar();
  }
 
  /** Aleja la vista un 20 %. */
  zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.2);
    this._redibujar();
  }
 
  /**
   * Retorna estadísticas básicas del árbol para el panel de comparación AVL vs BST.
   * @param {object} [nodo] - Nodo raíz (por defecto el árbol actualmente dibujado).
   * @returns {{ root: string, depth: number, leaves: number }}
   */
  getStats(nodo = this.currentTree) {
    if (!nodo) return { root: "-", depth: 0, leaves: 0 };
    return {
      root:   nodo.codigo,
      depth:  this._alturaArbol(nodo),
      leaves: this._contarHojas(nodo),
    };
  }
 
  // ───────────────────────── Dibujo interno ─────────────────────────────────
 
  /** Limpia el canvas y redibuja el árbol completo con la transformación actual. */
  _redibujar() {
    const ctx   = this.ctx;
    const ancho = this.canvas.width;
    const alto  = this.canvas.height;
 
    // Limpiar y pintar el fondo
    ctx.clearRect(0, 0, ancho, alto);
    ctx.fillStyle = this.colores.fondo;
    ctx.fillRect(0, 0, ancho, alto);
 
    if (!this.currentTree) return;
 
    // Paso 1: calcular coordenadas de layout para cada nodo
    this._calcularLayout(this.currentTree, { x: 0 }, 0);
 
    // Paso 2: calcular desplazamiento para centrar el árbol horizontalmente
    const n         = this._contarNodos(this.currentTree);
    const anchoTotal = n * this.xSpacing;
    const desplX    = (ancho / this.zoomLevel - anchoTotal) / 2 + this.xSpacing / 2;
    const desplY    = 50;
 
    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoomLevel, this.zoomLevel);
 
    // Las aristas se dibujan primero para que queden por debajo de los nodos
    this._dibujarAristas(this.currentTree, desplX, desplY);
    this._dibujarNodos(this.currentTree, desplX, desplY);
 
    ctx.restore();
  }
 
  /** Convierte las coordenadas de layout a píxeles en pantalla. */
  _posicionPantalla(nodo, ox, oy) {
    return {
      x: nodo._layoutX * this.xSpacing + ox,
      y: nodo._layoutY * this.ySpacing + oy,
    };
  }
 
  /** Dibuja las aristas (líneas) entre cada nodo y sus hijos de forma recursiva. */
  _dibujarAristas(nodo, ox, oy) {
    if (!nodo) return;
    const p   = this._posicionPantalla(nodo, ox, oy);
    const ctx = this.ctx;
 
    for (const hijo of [nodo.izquierdo, nodo.derecho]) {
      if (!hijo) continue;
      const ph = this._posicionPantalla(hijo, ox, oy);
      ctx.beginPath();
      ctx.strokeStyle = this.colores.arista;
      ctx.lineWidth   = 1.8;
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(ph.x, ph.y);
      ctx.stroke();
      this._dibujarAristas(hijo, ox, oy);
    }
  }
 
  /**
   * Determina el color de relleno del nodo según su estado.
   * Orden de prioridad: crítico > alerta > promoción > normal.
   */
  _colorNodo(nodo) {
    if (nodo.esCritico) return this.colores.critico;
    if (nodo.alerta)    return this.colores.alerta;
    if (nodo.promocion) return this.colores.promocion;
    return this.colores.normal;
  }
 
  /** Dibuja el círculo, el código del vuelo y el factor de equilibrio de cada nodo. */
  _dibujarNodos(nodo, ox, oy) {
    if (!nodo) return;
    const ctx       = this.ctx;
    const { x, y }  = this._posicionPantalla(nodo, ox, oy);
    const r         = this.nodeRadius;
 
    // Sombra para dar profundidad visual al nodo
    ctx.shadowColor   = "rgba(0,0,0,0.18)";
    ctx.shadowBlur    = 8;
    ctx.shadowOffsetY = 3;
 
    // Círculo principal del nodo
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = this._colorNodo(nodo);
    ctx.fill();
 
    // Borde del nodo (se desactiva la sombra para el borde)
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = this.colores.borde;
    ctx.lineWidth   = 2;
    ctx.stroke();
 
    // Configuración del texto
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle    = this.colores.texto;
 
    // Código del vuelo (se trunca a 7 caracteres si es más largo)
    const codigo = String(nodo.codigo);
    ctx.font = `bold 11px 'Segoe UI', sans-serif`;
    ctx.fillText(codigo.length > 7 ? codigo.slice(0, 7) : codigo, x, y - 5);
 
    // Factor de equilibrio: solo se muestra en modo AVL y si el campo existe
    if (this.treeType === "avl" && nodo.factorEquilibrio !== undefined) {
      const Bf = nodo.factorEquilibrio;
      ctx.font      = `9px 'Segoe UI', sans-serif`;
      // Se muestra en rojo si el factor es inválido (árbol en modo estrés)
      ctx.fillStyle = Math.abs(Bf) > 1 ? "#ff4444" : this.colores.texto;
      ctx.fillText(`BF:${Bf}`, x, y + 8);
    }
 
    // Dibujar hijos de forma recursiva
    this._dibujarNodos(nodo.izquierdo, ox, oy);
    this._dibujarNodos(nodo.derecho,   ox, oy);
  }
 
  // ───────────────────────── Funciones auxiliares ───────────────────────────
 
  /** Calcula la altura del árbol desde un nodo raíz dado. */
  _alturaArbol(nodo) {
    if (!nodo) return -1;
    return 1 + Math.max(this._alturaArbol(nodo.izquierdo), this._alturaArbol(nodo.derecho));
  }
 
  /** Cuenta la cantidad de hojas (nodos sin hijos) del árbol. */
  _contarHojas(nodo) {
    if (!nodo) return 0;
    if (!nodo.izquierdo && !nodo.derecho) return 1;
    return this._contarHojas(nodo.izquierdo) + this._contarHojas(nodo.derecho);
  }
}
 
// Compatibilidad con entornos Node.js / CommonJS además del navegador
if (typeof module !== "undefined" && module.exports) {
  module.exports = TreeVisualizer;
}
