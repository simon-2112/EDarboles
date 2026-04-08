/**
 *  Client API for communication with the Flask backend (AVL)
 */

const API_BASE_URL = "http://localhost:5000/api/tree";

/**
 * Function base for HTTP requests
 */
async function apiFetch(endpoint, method = "GET", data = null) {
  const options = {
    method: method,
    headers: { "Content-Type": "application/json" },
  };

  if (data) options.body = JSON.stringify(data);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(response.message || `Error ${response.status}`);
  }

  return result;
}

// ─────────────── Tree AVL ───────────────

/** Get the tree */
async function getTree() {
  return apiFetch("");
}

/** brings cities with airports */
async function getCities() {
  return apiFetch("/cities", "GET");
}

/** Create or load a tree */
async function createTree(data) {
  return apiFetch("/create", "POST", data);
}

/** Insert a flight */
async function insertFlight(flight) {
  return apiFetch("/insert", "POST", flight);
}

/** Search for a flight by code */
async function searchFlight(code) {
  return apiFetch(`/search/${code}`);
}

/** Delete a flight */
async function deleteFlight(code) {
  return apiFetch(`/delete/${code}`, "DELETE");
}

/** Update a flight */
async function updateFlight(codeOriginal, flight) {
  return apiFetch(`/update/${codeOriginal}`, "PUT", flight);
}

/** Cancel a node and its subtree */
async function cancelSubtree(code) {
  return apiFetch(`/cancel/${code}`, "DELETE");
}

/** Reset the tree */
async function resetTree() {
  return apiFetch("/reset", "DELETE");
}

// ─────────────── History ───────────────

/** Undo the last action */
async function undoAction() {
  return apiFetch("/undo", "POST");
}

// ─────────────── Export ───────────────

/** Export the tree */
async function exportTree() {
  return apiFetch("/export");
}

// ─────────────── Versions ───────────────

/** save a version */
async function saveVersion(name) {
  return apiFetch("/version/save", "POST", { name: name });
}

/** load a version */
async function loadVersion(name) {
  return apiFetch(`/version/load/${name}`, "POST");
}

/** List versions */
async function getVersions() {
  return apiFetch("/version");
}

// ─────────────── Queue ───────────────

/** Enqueue a flight  */
async function enqueueFlight(flight) {
  return apiFetch("/queue/enqueue", "POST", flight);
}

/** Process the queue */
async function processQueue() {
  return apiFetch("/queue/process", "POST");
}

// ─────────────── Métrics ───────────────

/** Get metrics */
async function getMetrics() {
  return apiFetch("/metrics");
}

// ─────────────── Mode Stress ───────────────

/** Activate stress mode */
async function activateStress() {
  return apiFetch("/stress/activate", "POST");
}

/** Deactivate stress mode and rebalance */
async function deactivateStress() {
  return apiFetch("/stress/desactivate", "POST");
}

/** Manual rebalancing in stress */
async function rebalanceStress() {
  return apiFetch("/stress/rebalance", "POST");
}

// ─────────────── Penalty ───────────────

/** Define depth limit */
async function setDepthLimit(limit) {
  return apiFetch("/penalty/setDepthLimit", "POST", { limit: limit });
}

// ─────────────── Auditory ───────────────

/** Check AVL properties */
async function auditAVL() {
  return apiFetch("/auditory");
}

// ─────────────── Profit ───────────────

/** Eliminate the least profitable flight */
async function deleteLowestProfit() {
  return apiFetch("/profit/deleteLowest", "POST");
}
