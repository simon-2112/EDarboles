/**
 * API Client - Comunicación con backend SkyBalance
 * Base URL: http://localhost:5000/api/tree
 */

const API_BASE_URL = "http://localhost:5000/api/tree";

/**
 * Realiza una petición HTTP genérica
 * @param {string} endpoint - Ruta del endpoint
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
 * @param {object|null} data - Datos a enviar en el body
 * @returns {Promise<object>} Respuesta del servidor
 */
async function apiFetch(endpoint, method = "GET", data = null) {
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `Error ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    throw error;
  }
}

// ============= CORE TREE OPERATIONS =============

/**
 * Obtener árbol completo
 * @returns {Promise<object>} Árbol en formato JSON
 */
async function getTree() {
  return apiFetch("");
}

/**
 * Crear árbol (por inserción o topología)
 * @param {object} data - Datos del árbol {"tipo": "INSERCION"|"TOPOLOGIA", ...}
 * @returns {Promise<object>} Árbol creado
 */
async function createTree(data) {
  return apiFetch("/create", "POST", data);
}

/**
 * Insertar vuelo
 * @param {object} flight - {"codigo", "origen", "destino", "horaSalida", "precioBase", "pasajeros", "promocion", "alerta", "prioridad"}
 * @returns {Promise<object>} Árbol actualizado
 */
async function insertFlight(flight) {
  return apiFetch("/insert", "POST", flight);
}

/**
 * Buscar vuelo por código
 * @param {string} flightCode - Código del vuelo
 * @returns {Promise<object>} Datos del vuelo
 */
async function searchFlight(flightCode) {
  return apiFetch(`/search/${flightCode}`);
}

/**
 * Eliminar vuelo (solo el nodo)
 * @param {string} flightCode - Código del vuelo
 * @returns {Promise<object>} Árbol actualizado
 */
async function deleteFlight(flightCode) {
  return apiFetch(`/delete/${flightCode}`, "DELETE");
}

/**
 * Actualizar vuelo
 * @param {string} flightCode - Código del vuelo a actualizar
 * @param {object} flight - Nuevos datos del vuelo
 * @returns {Promise<object>} Árbol actualizado
 */
async function updateFlight(flightCode, flight) {
  return apiFetch(`/update/${flightCode}`, "PUT", flight);
}

/**
 * Cancelar vuelo + descendientes
 * @param {string} flightCode - Código del vuelo
 * @returns {Promise<object>} Árbol actualizado
 */
async function cancelSubtree(flightCode) {
  return apiFetch(`/cancel/${flightCode}`, "DELETE");
}

/**
 * Resetear árbol (eliminar todos los nodos)
 * @returns {Promise<object>} Confirmación
 */
async function resetTree() {
  return apiFetch("/reset", "DELETE");
}

// ============= UNDO/HISTORY =============

/**
 * Deshacer última acción
 * @returns {Promise<object>} Árbol revertido
 */
async function undoAction() {
  return apiFetch("/undo", "POST");
}

// ============= EXPORT =============

/**
 * Exportar árbol a JSON
 * @returns {Promise<object>} Árbol en formato exportable
 */
async function exportTree() {
  return apiFetch("/export");
}

// ============= VERSIONS =============

/**
 * Guardar versión del árbol actual
 * @param {string} name - Nombre de la versión
 * @returns {Promise<object>} Confirmación
 */
async function saveVersion(name) {
  return apiFetch("/version/save", "POST", { name });
}

/**
 * Cargar versión guardada
 * @param {string} name - Nombre de la versión
 * @returns {Promise<object>} Árbol cargado
 */
async function loadVersion(name) {
  return apiFetch(`/version/load/${name}`, "POST");
}

/**
 * Obtener lista de versiones guardadas
 * @returns {Promise<object>} Lista de versiones
 */
async function getVersions() {
  return apiFetch("/version");
}

// ============= QUEUE (CONCURRENCY SIMULATION) =============

/**
 * Encolar vuelo para procesamiento concurrente
 * @param {object} flight - Datos del vuelo
 * @returns {Promise<object>} Confirmación
 */
async function enqueueFlight(flight) {
  return apiFetch("/queue/enqueue", "POST", flight);
}

/**
 * Procesar cola de vuelos
 * @returns {Promise<object>} Pasos de procesamiento
 */
async function processQueue() {
  return apiFetch("/queue/process", "POST");
}

// ============= METRICS =============

/**
 * Obtener métricas del árbol
 * @returns {Promise<object>} Métricas (altura, nodos, hojas, rotaciones, etc.)
 */
async function getMetrics() {
  return apiFetch("/metrics");
}

// ============= STRESS MODE =============

/**
 * Activar modo estrés
 * @returns {Promise<object>} Confirmación
 */
async function activateStress() {
  return apiFetch("/stress/activate", "POST");
}

/**
 * Desactivar modo estrés
 * @returns {Promise<object>} Resultado incluye rebalance
 */
async function deactivateStress() {
  return apiFetch("/stress/desactivate", "POST");
}

/**
 * Rebalancear árbol (rebalance global)
 * @returns {Promise<object>} Resultado del rebalance
 */
async function rebalanceStress() {
  return apiFetch("/stress/rebalance", "POST");
}
