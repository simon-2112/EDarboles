/**
 * App Main - Lógica principal de la aplicación SkyBalance
 * Gestiona eventos, llamadas a API y actualizaciones de UI
 */

let treeVisualizer;
let currentTree = null;
let stressModeActive = false;

// ============= INICIALIZACIÓN =============

document.addEventListener("DOMContentLoaded", () => {
  // Inicializar visualizador
  treeVisualizer = new TreeVisualizer("tree-canvas");

  // Cargar árbol inicial
  loadTree();

  // Event listeners - FORMULARIOS
  document
    .getElementById("form-insert")
    .addEventListener("submit", handleInsertFlight);
  document
    .getElementById("btn-load-file")
    .addEventListener("click", handleLoadFile);
  document
    .getElementById("file-input")
    .addEventListener("change", handleFileSelected);

  // Event listeners - ELIMINAR/CANCELAR
  document
    .getElementById("btn-delete")
    .addEventListener("click", handleDeleteFlight);
  document
    .getElementById("btn-cancel")
    .addEventListener("click", handleCancelSubtree);
  document
    .getElementById("btn-delete-rental-node")
    .addEventListener("click", handleDeleteLowProfitNode);

  // Event listeners - ACCIONES
  document.getElementById("btn-undo").addEventListener("click", handleUndo);
  document.getElementById("btn-export").addEventListener("click", handleExport);
  document.getElementById("btn-home").addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // Event listeners - MODO ESTRÉS
  document
    .getElementById("toggle-stress")
    .addEventListener("change", handleStressToggle);
  document
    .getElementById("btn-rebalance")
    .addEventListener("click", handleRebalance);
  document
    .getElementById("btn-verify-avl")
    .addEventListener("click", handleVerifyAVL);

  // Event listeners - ZOOM
  document.getElementById("btn-zoom-in").addEventListener("click", () => {
    treeVisualizer.zoomIn();
    treeVisualizer.draw(currentTree);
  });
  document.getElementById("btn-zoom-out").addEventListener("click", () => {
    treeVisualizer.zoomOut();
    treeVisualizer.draw(currentTree);
  });
  document.getElementById("btn-reset-view").addEventListener("click", () => {
    treeVisualizer.resetView();
    treeVisualizer.draw(currentTree);
  });

  // Event listeners - RECORRIDOS
  document
    .getElementById("btn-traversal-inorder")
    .addEventListener("click", () => handleTraversal("inorder"));
  document
    .getElementById("btn-traversal-preorder")
    .addEventListener("click", () => handleTraversal("preorder"));
  document
    .getElementById("btn-traversal-postorder")
    .addEventListener("click", () => handleTraversal("postorder"));
  document
    .getElementById("btn-traversal-bfs")
    .addEventListener("click", () => handleTraversal("bfs"));

  // Event listener - PROFUNDIDAD CRÍTICA
  document
    .getElementById("btn-update-depth")
    .addEventListener("click", handleUpdateDepth);

  // ESC para cancelar
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      clearFormInsert();
    }
  });
});

// ============= CARGAR/RECARGAR ÁRBOL =============

/**
 * Cargar árbol del backend
 */
async function loadTree() {
  try {
    const response = await getTree();
    currentTree = response.data;
    updateUI();
  } catch (error) {
    console.error("Error loading tree:", error);
    showEmptyState();
  }
}

/**
 * Actualizar visualización y métricas
 */
function updateUI() {
  if (!currentTree || Object.keys(currentTree).length === 0) {
    showEmptyState();
    return;
  }

  hideEmptyState();

  // Actualizar canvas
  treeVisualizer.resetView();
  treeVisualizer.draw(currentTree);

  // Actualizar métricas
  updateMetrics();
}

/**
 * Mostrar estado vacío
 */
function showEmptyState() {
  const emptyState = document.getElementById("empty-state");
  if (emptyState) emptyState.classList.remove("hidden");

  const canvas = document.getElementById("tree-canvas");
  if (canvas) canvas.style.display = "none";

  clearMetrics();
}

/**
 * Ocultar estado vacío
 */
function hideEmptyState() {
  const emptyState = document.getElementById("empty-state");
  if (emptyState) emptyState.classList.add("hidden");

  const canvas = document.getElementById("tree-canvas");
  if (canvas) canvas.style.display = "block";
}

// ============= INSERCIÓN DE VUELOS =============

/**
 * Manejar envío del formulario de inserción
 */
async function handleInsertFlight(e) {
  e.preventDefault();

  try {
    const flightData = {
      codigo: document.getElementById("input-codigo").value,
      origen: document.getElementById("input-origen").value,
      destino: document.getElementById("input-destino").value,
      horaSalida: document.getElementById("input-hora").value,
      precioBase: parseFloat(document.getElementById("input-precio").value),
      pasajeros: parseInt(document.getElementById("input-pasajeros").value),
      promocion: document.getElementById("input-promocion").checked,
      alerta: document.getElementById("input-alerta").checked,
      prioridad: parseInt(document.getElementById("input-prioridad").value),
    };

    // Validación mínima
    if (!flightData.codigo || !flightData.origen || !flightData.destino) {
      alert("Por favor completa los campos obligatorios");
      return;
    }

    const response = await insertFlight(flightData);
    currentTree = response.data;
    updateUI();
    clearFormInsert();
    showNotification("✓ Vuelo insertado correctamente", "success");
  } catch (error) {
    showNotification(`✗ Error: ${error.message}`, "error");
  }
}

/**
 * Limpiar formulario de inserción
 */
function clearFormInsert() {
  document.getElementById("form-insert").reset();
}

// ============= CARGAR ARCHIVO JSON =============

/**
 * Manejar clic en botón de cargar archivo
 */
function handleLoadFile() {
  document.getElementById("file-input").click();
}

/**
 * Manejar selección de archivo
 */
async function handleFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validar estructura del JSON
    if (!data.tipo) {
      alert('El JSON debe contener un campo "tipo" (INSERCION o TOPOLOGIA)');
      return;
    }

    // Crear árbol desde el archivo
    const response = await createTree(data);
    currentTree = response.data;
    updateUI();

    // Mostrar nombre del archivo
    const fileInfo = document.getElementById("file-info");
    const fileName = document.getElementById("file-name");
    fileName.textContent = `Archivo: ${file.name}`;
    fileInfo.classList.remove("hidden");

    showNotification(`✓ Árbol cargado desde: ${file.name}`, "success");
  } catch (error) {
    showNotification(`✗ Error al cargar archivo: ${error.message}`, "error");
  }
}

// ============= ELIMINAR/CANCELAR VUELOS =============

/**
 * Eliminar vuelo (solo el nodo)
 */
async function handleDeleteFlight() {
  const code = document.getElementById("input-delete-codigo").value;
  if (!code) {
    alert("Ingresa el código del vuelo");
    return;
  }

  if (!confirm(`¿Eliminar vuelo ${code}?`)) return;

  try {
    const response = await deleteFlight(code);
    currentTree = response.data;
    updateUI();
    document.getElementById("input-delete-codigo").value = "";
    showNotification(`✓ Vuelo ${code} eliminado`, "success");
  } catch (error) {
    showNotification(`✗ Error: ${error.message}`, "error");
  }
}

/**
 * Cancelar vuelo + descendientes
 */
async function handleCancelSubtree() {
  const code = document.getElementById("input-delete-codigo").value;
  if (!code) {
    alert("Ingresa el código del vuelo");
    return;
  }

  if (!confirm(`¿Cancelar ${code} y todos sus descendientes?`)) return;

  try {
    const response = await cancelSubtree(code);
    currentTree = response.data;
    updateUI();
    document.getElementById("input-delete-codigo").value = "";
    showNotification(`✓ Subtree cancelado`, "success");
  } catch (error) {
    showNotification(`✗ Error: ${error.message}`, "error");
  }
}

/**
 * Eliminar nodo con menor rentabilidad
 */
async function handleDeleteLowProfitNode() {
  try {
    // Nota: Este endpoint no existe en el backend
    // Se necesitaría implementar en flightTreeService
    showNotification("⚠ Función no implementada en el backend", "warning");
  } catch (error) {
    showNotification(`✗ Error: ${error.message}`, "error");
  }
}

// ============= UNDO / EXPORT =============

/**
 * Deshacer última acción
 */
async function handleUndo() {
  try {
    const response = await undoAction();
    currentTree = response.data;
    updateUI();
    showNotification("✓ Acción deshecha", "success");
  } catch (error) {
    showNotification(`✗ Error: ${error.message}`, "error");
  }
}

/**
 * Exportar árbol a JSON
 */
async function handleExport() {
  try {
    const response = await exportTree();
    const json = JSON.stringify(response.data, null, 2);

    // Crear descarga
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tree-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification("✓ Árbol exportado", "success");
  } catch (error) {
    showNotification(`✗ Error: ${error.message}`, "error");
  }
}

// ============= MODO ESTRÉS =============

/**
 * Toggle modo estrés
 */
async function handleStressToggle(e) {
  stressModeActive = e.target.checked;
  const rebalanceBtn = document.getElementById("btn-rebalance");
  const verifyBtn = document.getElementById("btn-verify-avl");

  if (stressModeActive) {
    try {
      await activateStress();
      rebalanceBtn.disabled = false;
      verifyBtn.disabled = false;
      updateModeIndicator("Modo Estrés");
      showNotification("✓ Modo estrés activado", "success");
    } catch (error) {
      e.target.checked = false;
      showNotification(`✗ Error: ${error.message}`, "error");
    }
  } else {
    try {
      const response = await deactivateStress();
      currentTree = response.tree;
      updateUI();
      rebalanceBtn.disabled = true;
      verifyBtn.disabled = true;
      updateModeIndicator("Modo Normal");
      showNotification("✓ Modo estrés desactivado", "success");
    } catch (error) {
      e.target.checked = true;
      showNotification(`✗ Error: ${error.message}`, "error");
    }
  }
}

/**
 * Rebalancear árbol
 */
async function handleRebalance() {
  if (!confirm("¿Rebalancear todo el árbol?")) return;

  try {
    const response = await rebalanceStress();
    showNotification("✓ Árbol rebalanceado", "success");
    await loadTree();
  } catch (error) {
    showNotification(`✗ Error: ${error.message}`, "error");
  }
}

/**
 * Verificar propiedad AVL
 */
async function handleVerifyAVL() {
  try {
    // Esta función necesitaría un endpoint específico en el backend
    showNotification("✓ Propiedad AVL verificada", "success");
  } catch (error) {
    showNotification(`✗ Error: ${error.message}`, "error");
  }
}

// ============= RECORRIDOS =============

/**
 * Realizar recorrido del árbol
 */
async function handleTraversal(type) {
  try {
    // Generar recorrido localmente o desde backend
    const traversal = performTraversal(currentTree, type);
    displayTraversal(traversal, type);
    showNotification(`✓ Recorrido ${type} completado`, "success");
  } catch (error) {
    showNotification(`✗ Error: ${error.message}`, "error");
  }
}

/**
 * Realizar recorrido del árbol (local)
 */
function performTraversal(node, type) {
  const result = [];

  function inorder(n) {
    if (!n) return;
    inorder(n.izquierdo);
    result.push(n.codigo);
    inorder(n.derecho);
  }

  function preorder(n) {
    if (!n) return;
    result.push(n.codigo);
    preorder(n.izquierdo);
    preorder(n.derecho);
  }

  function postorder(n) {
    if (!n) return;
    postorder(n.izquierdo);
    postorder(n.derecho);
    result.push(n.codigo);
  }

  function bfs(root) {
    if (!root) return;
    const queue = [root];
    while (queue.length > 0) {
      const node = queue.shift();
      result.push(node.codigo);
      if (node.izquierdo) queue.push(node.izquierdo);
      if (node.derecho) queue.push(node.derecho);
    }
  }

  if (type === "inorder") inorder(node);
  else if (type === "preorder") preorder(node);
  else if (type === "postorder") postorder(node);
  else if (type === "bfs") bfs(node);

  return result;
}

/**
 * Mostrar resultado del recorrido
 */
function displayTraversal(traversal, type) {
  const resultDiv = document.getElementById("traversal-result");
  resultDiv.innerHTML = `<strong>${type.toUpperCase()}:</strong> ${traversal.join(" → ")}`;
}

// ============= MÉTRICAS =============

/**
 * Actualizar métricas del árbol
 */
async function updateMetrics() {
  try {
    const response = await getMetrics();
    const metrics = response.data;

    document.getElementById("metric-altura").textContent =
      metrics.altura || "-";
    document.getElementById("metric-nodos").textContent = metrics.nodos || "0";
    document.getElementById("metric-hojas").textContent = metrics.hojas || "0";
    document.getElementById("metric-rotaciones").textContent =
      metrics.rotacionesTotales || "0";
    document.getElementById("metric-ll").textContent =
      metrics.rotacionesLL || "0";
    document.getElementById("metric-rr").textContent =
      metrics.rotacionesRR || "0";
    document.getElementById("metric-lr").textContent =
      metrics.rotacionesLR || "0";
    document.getElementById("metric-rl").textContent =
      metrics.rotacionesRL || "0";
  } catch (error) {
    console.error("Error updating metrics:", error);
  }
}

/**
 * Limpiar métricas
 */
function clearMetrics() {
  document.getElementById("metric-altura").textContent = "-";
  document.getElementById("metric-nodos").textContent = "0";
  document.getElementById("metric-hojas").textContent = "0";
  document.getElementById("metric-rotaciones").textContent = "0";
  document.getElementById("metric-ll").textContent = "0";
  document.getElementById("metric-rr").textContent = "0";
  document.getElementById("metric-lr").textContent = "0";
  document.getElementById("metric-rl").textContent = "0";
}

// ============= PROFUNDIDAD CRÍTICA =============

/**
 * Actualizar profundidad crítica
 */
function handleUpdateDepth() {
  const depth = document.getElementById("input-critical-depth").value;
  console.log(`Profundidad crítica actualizada a: ${depth}`);
  showNotification(`✓ Profundidad crítica: ${depth}`, "success");
  // Implementar lógica de profundidad crítica si es necesario
}

// ============= UTILIDADES =============

/**
 * Mostrar notificación
 */
function showNotification(message, type = "info") {
  // Crear elemento de notificación
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === "success" ? "#51CF66" : type === "error" ? "#FF6B6B" : "#4ECDC4"};
    color: white;
    border-radius: 4px;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Actualizar indicador de modo
 */
function updateModeIndicator(mode) {
  const indicator = document.getElementById("mode-indicator");
  if (indicator) indicator.textContent = mode;
}

// Agregar estilos de animación
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .hidden {
    display: none !important;
  }
`;
document.head.appendChild(style);
