/**
 * Cliente API para comunicarse con el backend Flask (AVL)
 */

const API_BASE_URL = "http://localhost:5000/api/tree";

/**
 * Función base para peticiones HTTP
 */
async function apiFetch(endpoint, metodo = "GET", datos = null) {
  const opciones = {
    method: metodo,
    headers: { "Content-Type": "application/json" },
  };

  if (datos) opciones.body = JSON.stringify(datos);

  const respuesta = await fetch(`${API_BASE_URL}${endpoint}`, opciones);
  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(resultado.message || `Error ${respuesta.status}`);
  }

  return resultado;
}

// ─────────────── Árbol AVL ───────────────

/** Obtiene el árbol */
async function getTree() {
  return apiFetch("");
}

/** Crea o carga un árbol */
async function createTree(datos) {
  return apiFetch("/create", "POST", datos);
}

/** Inserta un vuelo */
async function insertFlight(vuelo) {
  return apiFetch("/insert", "POST", vuelo);
}

/** Busca un vuelo por código */
async function searchFlight(codigo) {
  return apiFetch(`/search/${codigo}`);
}

/** Elimina un vuelo */
async function deleteFlight(codigo) {
  return apiFetch(`/delete/${codigo}`, "DELETE");
}

/** Actualiza un vuelo */
async function updateFlight(codigoOriginal, vuelo) {
  return apiFetch(`/update/${codigoOriginal}`, "PUT", vuelo);
}

/** Cancela un nodo y su subárbol */
async function cancelSubtree(codigo) {
  return apiFetch(`/cancel/${codigo}`, "DELETE");
}

/** Reinicia el árbol */
async function resetTree() {
  return apiFetch("/reset", "DELETE");
}

// ─────────────── Historial ───────────────

/** Deshace la última acción */
async function undoAction() {
  return apiFetch("/undo", "POST");
}

// ─────────────── Exportación ───────────────

/** Exporta el árbol */
async function exportTree() {
  return apiFetch("/export");
}

// ─────────────── Versiones ───────────────

/** Guarda una versión */
async function saveVersion(nombre) {
  return apiFetch("/version/save", "POST", { name: nombre });
}

/** Carga una versión */
async function loadVersion(nombre) {
  return apiFetch(`/version/load/${nombre}`, "POST");
}

/** Lista versiones */
async function getVersions() {
  return apiFetch("/version");
}

// ─────────────── Cola ───────────────

/** Encola un vuelo */
async function enqueueFlight(vuelo) {
  return apiFetch("/queue/enqueue", "POST", vuelo);
}

/** Procesa la cola */
async function processQueue() {
  return apiFetch("/queue/process", "POST");
}

// ─────────────── Métricas ───────────────

/** Obtiene métricas */
async function getMetrics() {
  return apiFetch("/metrics");
}

// ─────────────── Modo estrés ───────────────

/** Activa modo estrés */
async function activateStress() {
  return apiFetch("/stress/activate", "POST");
}

/** Desactiva modo estrés y rebalancea */
async function deactivateStress() {
  return apiFetch("/stress/desactivate", "POST");
}

/** Rebalanceo manual en estrés */
async function rebalanceStress() {
  return apiFetch("/stress/rebalance", "POST");
}

// ─────────────── Penalización ───────────────

/** Define límite de profundidad */
async function setDepthLimit(limite) {
  return apiFetch("/penalty/setDepthLimit", "POST", { limit: limite });
}

// ─────────────── Auditoría ───────────────

/** Verifica propiedades AVL */
async function auditAVL() {
  return apiFetch("/auditory");
}

// ─────────────── Rentabilidad ───────────────

/** Elimina el vuelo menos rentable */
async function deleteLowestProfit() {
  return apiFetch("/profit/deleteLowest", "POST");
}