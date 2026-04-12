/**
 * App Main - SkyBalance AVL
 * Handles all interface events, API calls, and visual updates.
 * Dependencies (must be loaded in the HTML beforehand):
 * api-client.js → functions for communicating with the Flask backend
 * tree-visualizer.js → TreeVisualizer class for drawing on canvas
 */

// ════════════════════════════════════════════════════════════
// GLOBAL STATE
// ════════════════════════════════════════════════════════════

let visualizer = null; // Instance of TreeVisualizer for main canvas
let currentTree = null; // Latest AVL tree received from backend
let stressModeActive = false; // Indicates if stress mode is activated
let lastLoadedJson = null; // JSON of last loaded file (to build local BST)

// ── Insertion Queue (Requirement 3) ──────────────────────────
let flightQueue = []; // Array of pending flights to process
let processingQueue = false; // Flag to indicate if processing
let stopProcess = false; // Flag to cancel processing

// ── Flight Editing ────────────────────────────────────────────
let flightInEdit = null; // Stores flight in edit mode

// ════════════════════════════════════════════════════════════
// INICIALIZATION
// ════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  visualizer = new TreeVisualizer("tree-canvas");

  // Load the tree that backend has in memory when opening the app
  loadTree();

  updateVersionList();

  // load cities with airports
  loadCities();
  // ── Load file ──────────────────────────────────────
  document
    .getElementById("btn-load-file")
    .addEventListener("click", () =>
      document.getElementById("file-input").click(),
    );
  document
    .getElementById("file-input")
    .addEventListener("change", handleFileSelected);

  // ── Insert flight ────────────────────────────────────────
  document
    .getElementById("form-insert")
    .addEventListener("submit", handleInsertion);

  // ── Edit flight ────────────────────────────────────────
  document
    .getElementById("btn-load-flight")
    .addEventListener("click", handleLoadFlight);
  document
    .getElementById("btn-cancel-edit")
    .addEventListener("click", () => cancelEdit(true));

  // ── Delete / Cancel ───────────────────────────────────
  document
    .getElementById("btn-delete")
    .addEventListener("click", handleDeletion);
  document
    .getElementById("btn-cancel")
    .addEventListener("click", handleCancellation);
  document
    .getElementById("btn-delete-rental-node")
    .addEventListener("click", handleDeleteLowestProfit);
  document
    .getElementById("btn-delete-all")
    .addEventListener("click", handleDeleteAll);
  // ── Undo / export ───────────────────────────────────
  document.getElementById("btn-undo").addEventListener("click", handleUndo);
  document.getElementById("btn-export").addEventListener("click", handleExport);

  // ── Navegation ────────────────────────────────────────────
  document
    .getElementById("btn-home")
    .addEventListener("click", () => (window.location.href = "index.html"));

  // ── Stress Mode ───────────────────────────────────────────
  document
    .getElementById("toggle-stress")
    .addEventListener("change", handleStressMode);
  document
    .getElementById("btn-rebalance")
    .addEventListener("click", handleRebalance);
  document
    .getElementById("btn-verify-avl")
    .addEventListener("click", handleAVLAudit);

  // ── Zoom ──────────────────────────────────────────────────
  document
    .getElementById("btn-zoom-in")
    .addEventListener("click", () => visualizer.zoomIn());
  document
    .getElementById("btn-zoom-out")
    .addEventListener("click", () => visualizer.zoomOut());
  document
    .getElementById("btn-reset-view")
    .addEventListener("click", () => visualizer.resetView());

  // ── Search flights ──────────────────────────────────────────────────
  document
    .getElementById("btn-search-flight")
    .addEventListener("click", handleFlightSearch);
  document
    .getElementById("input-search-codigo")
    .addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleFlightSearch();
    });

  // ── Traversals ────────────────────────────────────────────
  ["inorder", "preorder", "postorder", "bfs"].forEach((tipo) =>
    document
      .getElementById(`btn-traversal-${tipo}`)
      .addEventListener("click", () => handleTraversal(tipo)),
  );

  // ── depth Critical ────────────────────────────────────
  document
    .getElementById("btn-update-depth")
    .addEventListener("click", handleUpdateDepth);

  // ── Versions ──────────────────────────────────────────────
  document
    .getElementById("btn-save-version")
    .addEventListener("click", handleSaveVersion);

  // ── Insertion Queue (Requirement 3) ──────────────────
  document
    .getElementById("btn-enqueue")
    .addEventListener("click", handleEnqueueFlight);
  document
    .getElementById("btn-process-queue")
    .addEventListener("click", handleProcessQueue);
  document
    .getElementById("btn-clear-queue")
    .addEventListener("click", handleClearQueue);
  document
    .getElementById("btn-stop-processing")
    .addEventListener("click", handleStopProcessing);

  // ESC cancels edit or clears the form
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (flightInEdit) {
        cancelEdit(true);
      } else {
        clearForm();
      }
    }
  });
});

// ════════════════════════════════════════════════════════════
// LOAD / UPDATE TREE
// ════════════════════════════════════════════════════════════

/** Requests the current tree from backend and updates the UI. */
async function loadTree() {
  try {
    const response = await getTree();
    currentTree = response.data;
    await updateUI();
  } catch {
    showEmptyState();
  }
}

/**
 * Redraws the tree and updates metrics and version list.
 *
 * CANVAS FIX: the canvas may have 0 dimensions if it was
 * hidden (display:none) when the DOM was built. That's why it's
 * explicitly resized before drawing, using requestAnimationFrame
 * to ensure the browser has already calculated the visible layout.
 */
async function updateUI() {
  if (!currentTree) {
    showEmptyState();
    return;
  }

  // 1. Make the canvas visible first
  hideEmptyState();

  // 2. Wait for a layout frame to be ready so that the canvas has real dimensions.
  await new Promise((resolve) => requestAnimationFrame(resolve));

  // 3. Resize and draw
  visualizer._resizeCanvas();
  visualizer.draw(currentTree);

  // 4. Update metrics and versions (async, does not block drawing)
  updateMetrics();
  updateVersionList();
}

function showEmptyState() {
  document.getElementById("empty-state")?.classList.remove("hidden");
  document.getElementById("tree-canvas").style.display = "none";
  clearMetrics();
}

function hideEmptyState() {
  document.getElementById("empty-state")?.classList.add("hidden");
  document.getElementById("tree-canvas").style.display = "block";
}

// ════════════════════════════════════════════════════════════
// LOAD FILE JSON
// ════════════════════════════════════════════════════════════

/**
 * Reads the JSON file selected by the user, sends it to the backend
 * (endpoint /create) and displays the resulting tree.
 * For INSERCION type opens the AVL vs BST comparison modal (req. 1.1).
 */
async function handleFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = ""; // allows re-selecting the same file

  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    showToast("El archivo seleccionado no es un JSON válido.", "error");
    return;
  }

  if (!data.tipo) {
    showToast(
      'El JSON debe tener el campo "tipo": INSERCION o TOPOLOGIA.',
      "error",
    );
    return;
  }

  const type = data.tipo.toUpperCase();
  if (type !== "INSERCION" && type !== "TOPOLOGIA") {
    showToast('El campo "tipo" debe ser INSERCION o TOPOLOGIA.', "error");
    return;
  }

  const btn = document.getElementById("btn-load-file");
  setLoading(btn, true, "Cargando…");
  try {
    const response = await createTree(data);
    currentTree = response.data;
    lastLoadedJson = response.dataBst;

    await updateUI();

    document.getElementById("file-name").textContent = `📄 ${file.name}`;
    document.getElementById("file-info").classList.remove("hidden");

    showToast(`Árbol cargado desde: ${file.name}`, "success");

    if (
      type === "INSERCION" &&
      Array.isArray(data.vuelos) &&
      data.vuelos.length > 0
    ) {
      setTimeout(() => showComparisonModal(currentTree, lastLoadedJson), 150);
    }
  } catch (err) {
    showToast(`Error al crear el árbol: ${err.message}`, "error");
  } finally {
    setLoading(btn, false, "Seleccionar archivo JSON");
  }
}

// ────────────────────────────────────────────────────────────
// AVL vs BST comparison mode (requirement 1.1)
// ────────────────────────────────────────────────────────────

function showComparisonModal(treeAVL, treeBST) {
  document.getElementById("modal-comparacion")?.remove();

  const background = document.createElement("div");
  background.id = "modal-comparacion";
  background.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.55);
    z-index:2000;display:flex;align-items:center;justify-content:center;
  `;

  background.innerHTML = `
    <div style="
      background:#fff;border-radius:14px;padding:1.5rem;
      width:92vw;max-width:1150px;max-height:88vh;
      overflow:hidden;display:flex;flex-direction:column;gap:1rem;
      box-shadow:0 20px 60px rgba(0,0,0,.3);
    ">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h2 style="font-size:1.15rem;font-weight:700;margin:0"> Comparación: AVL vs BST</h2>
        <button id="btn-cerrar-comparacion" style="
          border:none;background:#f3f4f6;border-radius:8px;
          padding:.45rem .9rem;cursor:pointer;font-weight:600;font-size:.9rem;">✕ Cerrar</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;flex:1;min-height:0;">
        <div style="display:flex;flex-direction:column;gap:.5rem;">
          <h3 style="margin:0;font-size:1rem;font-weight:700;color:#2563eb">Árbol AVL — Balanceado </h3>
          <p id="stats-avl" style="margin:0;font-size:.83rem;color:#6b7280">Calculando…</p>
          <div style="flex:1;min-height:350px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
            <canvas id="canvas-avl-comparacion" style="width:100%;height:100%;display:block;"></canvas>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:.5rem;">
          <h3 style="margin:0;font-size:1rem;font-weight:700;color:#7c3aed">Árbol BST — Sin Balanceo </h3>
          <p id="stats-bst" style="margin:0;font-size:.83rem;color:#6b7280">Calculando…</p>
          <div style="flex:1;min-height:350px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
            <canvas id="canvas-bst-comparacion" style="width:100%;height:100%;display:block;"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(background);
  document
    .getElementById("btn-cerrar-comparacion")
    .addEventListener("click", () => background.remove());
  background.addEventListener("click", (e) => {
    if (e.target === background) background.remove();
  });

  requestAnimationFrame(() => {
    const vizAVL = new TreeVisualizer("canvas-avl-comparacion", {
      treeType: "avl",
      xSpacing: 55,
      ySpacing: 70,
      nodeRadius: 22,
    });
    vizAVL.draw(treeAVL);
    const sA = vizAVL.getStats(treeAVL);
    document.getElementById("stats-avl").innerHTML =
      `Raíz: <strong>${sA.root}</strong> &nbsp;|&nbsp; Profundidad: <strong>${sA.depth}</strong> &nbsp;|&nbsp; Hojas: <strong>${sA.leaves}</strong>`;

    const vizBST = new TreeVisualizer("canvas-bst-comparacion", {
      treeType: "bst",
      xSpacing: 55,
      ySpacing: 70,
      nodeRadius: 22,
    });
    vizBST.draw(treeBST);
    const sB = vizBST.getStats(treeBST);
    document.getElementById("stats-bst").innerHTML =
      `Raíz: <strong>${sB.root}</strong> &nbsp;|&nbsp; Profundidad: <strong>${sB.depth}</strong> &nbsp;|&nbsp; Hojas: <strong>${sB.leaves}</strong>`;
  });
}

// ════════════════════════════════════════════════════════════
// FLIGHT INSERTION
// ════════════════════════════════════════════════════════════

async function handleInsertion(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  setLoading(btn, true, flightInEdit ? "Guardando..." : "Insertando…");
  try {
    const data = {
      codigo: document
        .getElementById("input-codigo")
        .value.trim()
        .toUpperCase(),
      origen: document.getElementById("input-origen").value.trim(),
      destino: document.getElementById("input-destino").value.trim(),
      horaSalida: document.getElementById("input-hora").value,
      precioBase: parseFloat(document.getElementById("input-precio").value),
      pasajeros: flightInEdit
        ? flightInEdit.finalPassengers || flightInEdit.originalPassengers
        : parseInt(document.getElementById("input-pasajeros").value),
      promocion: document.getElementById("input-promocion").checked,
      alerta: document.getElementById("input-alerta").checked,
      prioridad: parseInt(document.getElementById("input-prioridad").value),
    };

    if (!data.codigo || !data.origen || !data.destino) {
      showToast(
        "Completa los campos obligatorios: código, origen y destino.",
        "warning",
      );
      return;
    }
    if (data.origen === data.destino) {
      showToast(
        "El origen y el destino no pueden ser la misma ciudad.",
        "warning",
      );
      return;
    }

    // Duplicate validation in insert mode
    if (!flightInEdit) {
      try {
        await searchFlight(data.codigo);
        // Si llegamos aquí, el vuelo ya existe
        showToast(`El código ${data.codigo} ya existe en el árbol.`, "error");
        setLoading(btn, false, "Insertar");
        return;
      } catch (err) {
        //
        if (!err.message.includes("Flight not found")) {
          throw err;
        }
      }
    }

    let response;

    if (flightInEdit) {
      // EDIT MODE
      response = await updateFlight(data.codigo, data);
      currentTree = response.data;
      await updateUI();
      cancelEdit();
      showToast(`Vuelo ${data.codigo} actualizado correctamente.`, "success");
    } else {
      // INSERTION MODE
      response = await insertFlight(data);
      currentTree = response.data;
      await updateUI();
      clearForm();
      showToast(`Vuelo ${data.codigo} insertado correctamente.`, "success");
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  } finally {
    setLoading(btn, false, flightInEdit ? "Guardar Cambios" : "Insertar");
  }
}

function clearForm() {
  document.getElementById("form-insert").reset();
  if (flightInEdit) {
    cancelEdit();
  }
}

// ════════════════════════════════════════════════════════════
// EDIT FLIGHT
// ════════════════════════════════════════════════════════════

async function handleLoadFlight() {
  if (!currentTree) {
    showToast("No hay árbol cargado.", "warning");
    return;
  }
  const code = document.getElementById("input-edit-codigo").value.trim();

  if (!code) {
    showToast("Ingresa el código del vuelo a editar.", "warning");
    return;
  }

  try {
    const response = await searchFlight(code);
    const flight = response.data;

    // Store reference to flight in edit
    flightInEdit = flight;

    // Upload data to the form
    document.getElementById("input-codigo").value = flight.codigo;
    document.getElementById("input-origen").value = flight.origen;
    document.getElementById("input-destino").value = flight.destino;
    document.getElementById("input-hora").value = flight.horaSalida;
    document.getElementById("input-precio").value = flight.precioBase;
    document.getElementById("input-prioridad").value = flight.prioridad;
    document.getElementById("input-promocion").checked = flight.promocion;
    document.getElementById("input-alerta").checked = flight.alerta;

    // NEW: Store original passengers and show improved interface
    flightInEdit.originalPassengers = flight.pasajeros;
    showPassengersUI(flight.pasajeros);

    document.getElementById("input-codigo").disabled = true;
    // Enable only update fields
    document.getElementById("input-origen").disabled = false;
    document.getElementById("input-destino").disabled = false;
    document.getElementById("input-hora").disabled = false;
    document.getElementById("input-precio").disabled = false;
    document.getElementById("input-prioridad").disabled = false;
    document.getElementById("input-promocion").disabled = false;
    document.getElementById("input-alerta").disabled = false;

    // Change form button
    const btnSubmit = document
      .getElementById("form-insert")
      .querySelector("button[type=submit]");
    btnSubmit.textContent = "Guardar Cambios";
    btnSubmit.dataset.textoOriginal = "Guardar Cambios";
    btnSubmit.classList.remove("btn-success");
    btnSubmit.classList.add("btn-primary");

    // Show edit mode indicator
    document.getElementById("edit-mode-indicator").style.display = "block";
    document.getElementById("btn-cancel-edit").style.display = "block";
    document.getElementById("input-edit-codigo").disabled = true;
    document.getElementById("btn-load-flight").disabled = true;

    showToast(`Vuelo ${code} cargado en modo edición.`, "info");
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  }
}

function showPassengersUI(currentPassengers) {
  const container = document.getElementById("pasajeros-container");

  container.innerHTML = `
    <div style="background: #f0f4ff; padding: 0.8rem; border-radius: 4px; border-left: 3px solid #3b82f6;">
      <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #666;"><strong>Pasajeros Actuales:</strong> ${currentPassengers}</p>
      
      <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
        <label style="flex: 1;">
          <input type="radio" name="operacion-pasajeros" value="agregar" checked style="margin-right: 0.3rem;">
          Agregar
        </label>
        <label style="flex: 1;">
          <input type="radio" name="operacion-pasajeros" value="eliminar" style="margin-right: 0.3rem;">
          Eliminar
        </label>
      </div>
      
      <input type="number" id="input-pasajeros-cambio" placeholder="Cantidad a agregar/eliminar" min="0" value="0" style="width: 100%; padding: 0.6rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
      
      <p id="pasajeros-preview" style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #0066cc;">
        Total será: <strong>${currentPassengers}</strong> pasajeros
      </p>
    </div>
  `;

  // Event listeners to update the preview
  const radios = container.querySelectorAll(
    'input[name="operacion-pasajeros"]',
  );
  const inputChange = document.getElementById("input-pasajeros-cambio");

  const updatePreview = () => {
    const operation = container.querySelector(
      'input[name="operacion-pasajeros"]:checked',
    ).value;
    const amount = parseInt(inputChange.value) || 0;

    let total;
    if (operation === "agregar") {
      total = currentPassengers + amount;
    } else {
      total = Math.max(0, currentPassengers - amount);
    }

    document.getElementById("pasajeros-preview").innerHTML =
      `Total será: <strong>${total}</strong> pasajeros`;

    // Save calculated total
    flightInEdit.finalPassengers = total;
  };

  radios.forEach((radio) => radio.addEventListener("change", updatePreview));
  inputChange.addEventListener("input", updatePreview);

  // Initialize pasajerosFinal with current value (important if user doesn't change)
  flightInEdit.finalPassengers = currentPassengers;
}

function cancelEdit(isExplicit = false) {
  flightInEdit = null;

  // Restore normal passenger field
  const container = document.getElementById("pasajeros-container");
  container.innerHTML = `<input type="number" id="input-pasajeros" placeholder="Pasajeros" min="0" required>`;

  // Restore button
  const btnSubmit = document
    .getElementById("form-insert")
    .querySelector("button[type=submit]");
  btnSubmit.textContent = "Insertar";
  btnSubmit.dataset.textoOriginal = "Insertar";
  btnSubmit.classList.add("btn-success");
  btnSubmit.classList.remove("btn-primary");

  document.getElementById("input-codigo").disabled = false;

  // Hide indicator
  document.getElementById("edit-mode-indicator").style.display = "none";
  document.getElementById("btn-cancel-edit").style.display = "none";
  document.getElementById("input-edit-codigo").disabled = false;
  document.getElementById("btn-load-flight").disabled = false;
  document.getElementById("input-edit-codigo").value = "";

  clearForm();
  if (isExplicit) {
    showToast("Edición cancelada.", "info");
  }
}

// ════════════════════════════════════════════════════════════
// DELETION / CANCELLATION
// ════════════════════════════════════════════════════════════

/**
 * Deletes only the indicated node.
 * Its children are reorganized via inorder predecessor and tree is rebalanced.
 *
 * NOTE: with the _delete_with_two_children bug fixed in the backend,
 * this operation now works correctly for ALL cases
 * (leaf, one child, two children).
 */
async function handleDeletion() {
  const code = document.getElementById("input-delete-codigo").value.trim();

  if (!currentTree) {
    showToast("No hay árbol cargado.", "warning");
    return;
  }
  if (!code) {
    showToast("Ingresa el código del vuelo a eliminar.", "warning");
    return;
  }
  if (!confirm(`¿Eliminar el vuelo ${code}? (solo este nodo)`)) return;

  const btn = document.getElementById("btn-delete");
  setLoading(btn, true, "Eliminando…");
  try {
    const response = await deleteFlight(code);
    currentTree = response.data;
    await updateUI();
    document.getElementById("input-delete-codigo").value = "";
    showToast(`Vuelo ${code} eliminado y árbol rebalanceado.`, "success");
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  } finally {
    setLoading(btn, false, "Eliminar Nodo");
  }
}

/**
 * Cancels the indicated flight AND its entire subtree (descendants).
 * This operation is more aggressive than simple deletion.
 */
async function handleCancellation() {
  const code = document.getElementById("input-delete-codigo").value.trim();

  if (!currentTree) {
    showToast("No hay árbol cargado.", "warning");
    return;
  }

  if (!code) {
    showToast("Ingresa el código del vuelo a cancelar.", "warning");
    return;
  }
  if (!confirm(`¿Cancelar ${code} y TODOS sus descendientes?`)) return;

  const btn = document.getElementById("btn-cancel");
  setLoading(btn, true, "Cancelando…");
  try {
    const response = await cancelSubtree(code);
    currentTree = response.data;
    await updateUI();
    document.getElementById("input-delete-codigo").value = "";
    showToast(
      `Vuelo ${code} y todos sus descendientes han sido cancelados.`,
      "success",
    );
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  } finally {
    setLoading(btn, false, "Cancelar Vuelo + Descendientes");
  }
}

/**
 * Deletes the flight with the lowest profitability and its entire subtree.
 * Formula: passengers × finalPrice − promotion + penalty.
 * Tiebreaker: greater depth → larger code.
 */
async function handleDeleteLowestProfit() {
  if (!currentTree) {
    showToast("No hay árbol cargado.", "warning");
    return;
  }
  if (!confirm("¿Eliminar el vuelo de menor rentabilidad y toda su subrama?"))
    return;

  const btn = document.getElementById("btn-delete-rental-node");
  setLoading(btn, true, "Calculando…");
  try {
    const response = await deleteLowestProfit();
    currentTree = response.tree;
    await updateUI();
    showToast(response.message, "success");
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  } finally {
    setLoading(btn, false, "Eliminar Nodo Menor Rentabilidad");
  }
}

/**
 * Deletes the entire tree.
 */
async function handleDeleteAll() {
  if (!currentTree) {
    showToast("No hay árbol para eliminar.", "warning");
    return;
  }

  if (!confirm("¿Eliminar todo el árbol?")) return;

  const btn = document.getElementById("btn-delete-all");
  setLoading(btn, true, "Eliminando…");
  try {
    const response = await resetTree();
    currentTree = response.tree;
    await updateUI();
    showToast(response.message, "success");
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  } finally {
    setLoading(btn, false, "Eliminar Todo El Árbol");
  }
}
// ════════════════════════════════════════════════════════════
// UNDO / EXPORT
// ════════════════════════════════════════════════════════════

async function handleUndo() {
  const btn = document.getElementById("btn-undo");
  setLoading(btn, true, "Deshaciendo…");
  try {
    const response = await undoAction();
    currentTree = response.data;
    await updateUI();
    showToast("Acción deshecha correctamente.", "success");
  } catch (err) {
    showToast(`Error al deshacer: ${err.message}`, "error");
  } finally {
    setLoading(btn, false, "Deshacer (Ctrl+Z)");
  }
}

async function handleExport() {
  if (!currentTree) {
    showToast("No hay árbol para exportar.", "warning");
    return;
  }
  try {
    const response = await exportTree();
    const json = JSON.stringify(response.data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), {
      href: url,
      download: `skybalance-${new Date().toISOString().split("T")[0]}.json`,
    }).click();
    URL.revokeObjectURL(url);
    showToast("Árbol exportado correctamente.", "success");
  } catch (err) {
    showToast(`Error al exportar: ${err.message}`, "error");
  }
}

// ════════════════════════════════════════════════════════════
// STRESS MODE
// ════════════════════════════════════════════════════════════

async function handleStressMode(e) {
  const btnSaveVersion = document.getElementById("btn-save-version");
  const activating = e.target.checked;
  const btnRebalance = document.getElementById("btn-rebalance");
  const btnVerify = document.getElementById("btn-verify-avl");
  const indicator = document.getElementById("mode-indicator");

  if (activating) {
    try {
      await activateStress();
      stressModeActive = true;
      btnRebalance.disabled = false;
      btnVerify.disabled = false;
      btnSaveVersion.disabled = true;
      indicator.textContent = "⚠ Modo Estrés";
      indicator.classList.add("stress-mode");
      await loadTree();
      showToast(
        "Modo estrés activado. El balanceo automático está deshabilitado.",
        "warning",
      );
    } catch (err) {
      e.target.checked = false;
      showToast(`Error: ${err.message}`, "error");
    }
  } else {
    try {
      // response.data = { stressMode: false, rebalance: {...}, tree: <arbolJSON> }
      const response = await deactivateStress();
      stressModeActive = false;
      currentTree = response.data.tree;
      btnRebalance.disabled = true;
      btnVerify.disabled = true;
      btnSaveVersion.disabled = false;
      indicator.textContent = "Modo Normal";
      indicator.classList.remove("stress-mode");
      console.log(response);
      await updateUI();
      showToast(
        "Modo estrés desactivado. Árbol rebalanceado automáticamente.",
        "success",
      );
    } catch (err) {
      e.target.checked = true;
      showToast(`Error: ${err.message}`, "error");
    }
  }
}

async function handleRebalance() {
  if (!currentTree) {
    showToast("No hay árbol para rebalancear.", "warning");
    return;
  }
  if (!confirm("¿Rebalancear todo el árbol ahora?")) return;
  const btn = document.getElementById("btn-rebalance");
  setLoading(btn, true, "Rebalanceando…");
  try {
    const response = await rebalanceStress();
    const { nodes, rotations } = response.data;
    const totalRot =
      (rotations.LL || 0) +
      (rotations.RR || 0) +
      (rotations.LR || 0) +
      (rotations.RL || 0);
    showToast(
      `Rebalanceo completado. Nodos: ${nodes} | Rotations: ${totalRot}`,
      "success",
    );
    await loadTree();
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  } finally {
    setLoading(btn, false, "Rebalancear Todo");
  }
}

/**
 * Checks AVL properties on entire tree (only in stress mode)
 * and displays modal with report of inconsistent nodes.
 */
async function handleAVLAudit() {
  if (!currentTree) {
    showToast("No hay árbol para verificar propiedad.", "warning");
    return;
  }
  try {
    const response = await auditAVL();
    showAuditModal(response);
  } catch (err) {
    showToast(`Error en auditoría: ${err.message}`, "error");
  }
}

function showAuditModal(response) {
  document.getElementById("modal-auditoria")?.remove();
  const inconsistent = response.inconsistentNodes || [];
  const isValid = inconsistent.length === 0;

  const background = document.createElement("div");
  background.id = "modal-auditoria";
  background.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.5);
    z-index:2000;display:flex;align-items:center;justify-content:center;
  `;

  background.innerHTML = `
    <div style="background:#fff;border-radius:12px;padding:1.5rem;
      width:480px;max-width:95vw;box-shadow:0 16px 48px rgba(0,0,0,.28);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h2 style="margin:0;font-size:1.1rem;font-weight:700;"> Auditoría AVL</h2>
        <button id="btn-cerrar-auditoria" style="border:none;background:#f3f4f6;border-radius:6px;padding:.4rem .8rem;cursor:pointer;font-weight:600;">✕</button>
      </div>
      <div style="padding:.8rem;border-radius:8px;margin-bottom:1rem;
        background:${isValid ? "#f0fdf4" : "#fff1f2"};
        border-left:4px solid ${isValid ? "#22c55e" : "#ef4444"};">
        <strong>${
          isValid
            ? " El árbol cumple la propiedad AVL en todos sus nodos. Nodos consistentes ( |BF| ∈ { -1, 0, 1 } )"
            : " Se encontraron nodos que violan la propiedad AVL."
        }</strong>
      </div>
      ${
        inconsistent.length > 0
          ? `
        <p style="font-size:.88rem;margin-bottom:.5rem;font-weight:600;">Nodos inconsistentes ( |BF| ∉ { -1, 0, 1 } ):</p>
        <ul style="margin:0;padding-left:1.2rem;font-size:.85rem;color:#6b7280;">
          ${inconsistent.map((n) => `<li>${n}</li>`).join("")}
        </ul>`
          : ""
      }
      <div style="margin-top:1rem;text-align:right;">
        <button id="btn-aceptar-auditoria" style="
          border:none;background:#2563eb;color:#fff;
          border-radius:8px;padding:.5rem 1.2rem;cursor:pointer;font-weight:600;">Aceptar</button>
      </div>
    </div>
  `;

  document.body.appendChild(background);
  const close = () => background.remove();
  document
    .getElementById("btn-cerrar-auditoria")
    .addEventListener("click", close);
  document
    .getElementById("btn-aceptar-auditoria")
    .addEventListener("click", close);
  background.addEventListener("click", (e) => {
    if (e.target === background) close();
  });
}

// ════════════════════════════════════════════════════════════
// TRAVERSALS
// ════════════════════════════════════════════════════════════

/**
 * Gets pre-calculated traversals from backend and displays them on screen.
 * InOrder, PreOrder, PostOrder and BFS algorithms are implemented in
 * AvlTree.py --- logic isn't duplicated here.
 */
async function handleTraversal(type) {
  try {
    const response = await getMetrics();
    const traversals = response.data.recorridos;
    const list = traversals?.[type];

    if (!list || list.length === 0) {
      showToast("El árbol está vacío.", "warning");
      return;
    }

    // Each element in the list is a Flight object; we extract the idFlight
    const codes = list.map((f) =>
      typeof f === "object" ? (f.idFlight ?? f.codigo) : f,
    );
    document.getElementById("traversal-result").innerHTML =
      `<strong>${type.toUpperCase()}:</strong> ${codes.join(" → ")}`;
  } catch (err) {
    showToast(`Error al obtener el recorrido: ${err.message}`, "error");
  }
}

// ════════════════════════════════════════════════════════════
// FLIGHT SEARCH
// ════════════════════════════════════════════════════════════

async function handleFlightSearch() {
  const code = document.getElementById("input-search-codigo").value.trim();
  if (!code) {
    showToast("Ingresa un código de vuelo.", "warning");
    return;
  }

  const result = document.getElementById("flight-info-result");
  const notFound = document.getElementById("flight-info-notfound");
  result.classList.add("hidden");
  notFound.classList.add("hidden");

  try {
    const response = await searchFlight(code);
    const f = response.data;

    document.getElementById("fi-codigo").textContent = f.codigo;
    document.getElementById("fi-origen").textContent = f.origen;
    document.getElementById("fi-destino").textContent = f.destino;
    document.getElementById("fi-hora").textContent = f.horaSalida;
    document.getElementById("fi-pasajeros").textContent = f.pasajeros;
    document.getElementById("fi-precio-base").textContent =
      `$${f.precioBase.toFixed(2)}`;
    document.getElementById("fi-precio-final").textContent =
      `$${f.precioFinal.toFixed(2)}`;
    document.getElementById("fi-prioridad").textContent = f.prioridad;
    document.getElementById("fi-altura").textContent = f.altura;
    document.getElementById("fi-bf").textContent = f.factorEquilibrio;
    document.getElementById("fi-critico").textContent = f.esCritico
      ? "Sí ⚠"
      : "No";

    // Status badges
    let badges = "";
    if (f.promocion) badges += `<span class="fi-badge promo">PROMO</span>`;
    if (f.alerta) badges += `<span class="fi-badge alerta">ALERTA</span>`;
    if (f.esCritico) badges += `<span class="fi-badge critico">CRÍTICO</span>`;
    document.getElementById("fi-badges").innerHTML = badges;

    result.classList.remove("hidden");
  } catch {
    notFound.classList.remove("hidden");
  }
}

// ════════════════════════════════════════════════════════════
// METRICS
// ════════════════════════════════════════════════════════════

/**
 * Updates metrics panel with backend data.
 *
 * Response structure:
 *   { altura, rotaciones:{LL,RR,LR,RL}, cancelacionesMasivas, hojas, recorridos }
 *
 * Rotations are shown as cumulative totals since tree was loaded.
 * When loading a new tree (createTree) the backend creates a fresh AvlTree(),
 * so counters automatically reset.
 */
async function updateMetrics() {
  try {
    const response = await getMetrics();
    const m = response.data;
    const rot = m.rotaciones || {};
    const totalRotations =
      (rot.LL || 0) + (rot.RR || 0) + (rot.LR || 0) + (rot.RL || 0);

    document.getElementById("metric-altura").textContent = m.altura ?? "-";
    document.getElementById("metric-nodos").textContent =
      countNodes(currentTree);
    document.getElementById("metric-hojas").textContent = m.hojas ?? "0";
    document.getElementById("metric-rotaciones").textContent = totalRotations;
    document.getElementById("metric-ll").textContent = rot.LL ?? "0";
    document.getElementById("metric-rr").textContent = rot.RR ?? "0";
    document.getElementById("metric-lr").textContent = rot.LR ?? "0";
    document.getElementById("metric-rl").textContent = rot.RL ?? "0";
  } catch {
    // Metrics are secondary; a failure shouldn't break the UI
  }
}

/** Counts the total number of tree nodes. */
function countNodes(node) {
  if (!node) return 0;
  return 1 + countNodes(node.izquierdo) + countNodes(node.derecho);
}

function clearMetrics() {
  [
    "metric-altura",
    "metric-nodos",
    "metric-hojas",
    "metric-rotaciones",
    "metric-ll",
    "metric-rr",
    "metric-lr",
    "metric-rl",
  ].forEach((id) => {
    document.getElementById(id).textContent =
      id === "metric-altura" ? "-" : "0";
  });
}

// ════════════════════════════════════════════════════════════
// CRITICAL DEPTH
// ════════════════════════════════════════════════════════════

async function handleUpdateDepth() {
  const depth = parseInt(document.getElementById("input-critical-depth").value);
  if (isNaN(depth) || depth < 0) {
    showToast("Ingresa una profundidad válida (número entero ≥ 0).", "warning");
    return;
  }

  try {
    const response = await setDepthLimit(depth);
    currentTree = response.tree;
    await updateUI();
    showToast(`Profundidad crítica actualizada a ${depth}.`, "success");
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  }
}

// ════════════════════════════════════════════════════════════
// VERSIONS
// ════════════════════════════════════════════════════════════

async function handleSaveVersion() {
  const name = document.getElementById("input-version-name").value.trim();
  if (!name) {
    showToast("Escribe un nombre para la versión.", "warning");
    return;
  }

  if (!currentTree) {
    showToast("Debes cargar un árbol primero.", "warning");
    return;
  }

  try {
    await saveVersion(name);
    document.getElementById("input-version-name").value = "";
    await updateVersionList();
    showToast(`Versión "${name}" guardada correctamente.`, "success");
  } catch (err) {
    showToast(`Error al guardar versión: ${err.message}`, "error");
  }
}

async function updateVersionList() {
  try {
    const response = await getVersions();
    const list = response.data || [];
    const container = document.getElementById("version-list");
    container.innerHTML = "";

    if (list.length === 0) {
      container.innerHTML = `
        <p style="font-size:.83rem;color:#9ca3af;text-align:center;margin:.5rem 0">
          Sin versiones guardadas.
        </p>`;
      return;
    }

    list.forEach((name) => {
      const element = document.createElement("div");
      element.className = "version-item";
      element.innerHTML = `
        <span class="version-name">${name}</span>
        <button class="btn btn-sm btn-primary" style="font-size:.78rem;padding:.3rem .6rem;">
          Cargar
        </button>
      `;
      element
        .querySelector("button")
        .addEventListener("click", () => handleLoadVersion(name));
      container.appendChild(element);
    });
  } catch {
    // it's not critical
  }
}

async function handleLoadVersion(name) {
  if (!confirm(`¿Restaurar la versión "${name}"?`)) return;
  try {
    const response = await loadVersion(name);
    currentTree = response.data;
    await updateUI();
    showToast(`Versión "${name}" restaurada.`, "success");
  } catch (err) {
    showToast(`Error al cargar versión: ${err.message}`, "error");
  }
}

// ════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════

/**
 * Enables or disables the charging status of a button.
 * While charging, the button displays the charging text and is disabled.
 * To prevent double-clicking during asynchronous operation.
 *
 * @param {HTMLButtonElement} btn   - The button to be modified.
 * @param {boolean}           asset - True to activate, False to restore.
 * @param {string}            text  - Text to display while loading.
 */
function setLoading(btn, asset, text) {
  if (!btn) return;
  if (asset) {
    btn.dataset.textoOriginal = btn.textContent;
    btn.textContent = text;
    btn.disabled = true;
    btn.style.opacity = "0.7";
  } else {
    btn.textContent = btn.dataset.textoOriginal || text;
    btn.disabled = false;
    btn.style.opacity = "";
  }
}

/**
 * Displays a toast notification in the upper right corner.
 * @param {string}   message            - Text to display.
 * @param {'success'|'error'|'warning'|'info'} type - Notification type.
 * @param {number}   [duration=3500]    - Milliseconds before it disappears.
 */
function showToast(message, type = "info", duration = 3500) {
  const icons = { success: "✓", error: "✗", warning: "⚠", info: "ℹ" };
  const toast = document.createElement("div");
  toast.className = `sky-toast ${type}`;
  console.log("TOAST DEFINIDO");
  toast.innerHTML = `
    <span class="sky-toast-icon">${icons[type] ?? "ℹ"}</span>
    <span class="sky-toast-message">${message}</span>
    <button class="sky-toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  document.getElementById("toast-container").appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ════════════════════════════════════════════════════════════
// INSERTION QUEUE (Requirement 3: Concurrency Simulation)
// ════════════════════════════════════════════════════════════

/**
 * Extracts flight data from form and returns it as flight object
 */
function getFlightDataFromForm() {
  return {
    codigo: document.getElementById("input-codigo").value.trim(),
    origen: document.getElementById("input-origen").value.trim(),
    destino: document.getElementById("input-destino").value.trim(),
    horaSalida: document.getElementById("input-hora").value.trim(),
    precioBase: parseFloat(document.getElementById("input-precio").value) || 0,
    pasajeros: parseInt(document.getElementById("input-pasajeros").value) || 0,
    promocion: document.getElementById("input-promocion").checked,
    alerta: document.getElementById("input-alerta").checked,
    prioridad: parseInt(document.getElementById("input-prioridad").value) || 1,
  };
}

/**
 * Handles adding a flight to the queue
 */
async function handleEnqueueFlight() {
  const flight = getFlightDataFromForm();

  // Basic validations
  if (
    !flight.codigo ||
    !flight.origen ||
    !flight.destino ||
    !flight.pasajeros ||
    !flight.precioBase
  ) {
    showToast("Completa todos los campos obligatorios", "warning");
    return;
  }
  if (flight.origen === flight.destino) {
    showToast(
      "El origen y el destino no pueden ser la misma ciudad.",
      "warning",
    );
    return;
  }
  if (!flight.horaSalida) {
    showToast("Debes ingresar la hora de salida.", "warning");
    return;
  }
  try {
    // Send to the backend to add it to the queue
    await enqueueFlight(flight);

    // Add to queue locally for tracking
    flightQueue.push(flight);

    // Update UI
    updateQueueCounter();
    updateQueueList();
    clearForm();

    showToast(`Vuelo "${flight.codigo}" agregado a la cola.`, "success");
  } catch (err) {
    showToast(`Error at enqueue: ${err.message}`, "error");
  }
}

/**
 * Updates visual counter of the queue
 */
function updateQueueCounter() {
  const count = flightQueue.length;
  const counter = document.getElementById("queue-counter");
  counter.textContent =
    count === 0
      ? "0 vuelos en cola"
      : `${count} vuelo${count === 1 ? "" : "s"} en cola`;

  // Enable/disable buttons
  document.getElementById("btn-process-queue").disabled = count === 0;
  document.getElementById("btn-clear-queue").disabled = count === 0;
}

/**
 * Updates visual list of flights in the queue
 */
function updateQueueList() {
  const listContainer = document.getElementById("queue-list");

  if (flightQueue.length === 0) {
    listContainer.innerHTML =
      '<p style="text-align: center; color: rgba(255,255,255,0.5); font-size: 0.9rem;">Vacío</p>';
    return;
  }

  listContainer.innerHTML = flightQueue
    .map(
      (flight, idx) => `
    <div style="padding: 0.4rem 0.5rem; background: rgba(255,165,0,0.15); border-radius: 3px; margin-bottom: 0.4rem; font-size: 0.85rem; border-left: 3px solid #FFA500; display: flex; justify-content: space-between; align-items: center;">
      <span>
        <strong>#${idx + 1}:</strong> ${flight.codigo} (${flight.origen}→${flight.destino})
      </span>
      <button onclick="removeFromQueue(${idx})" style="background: #FF4444; color: white; border: none; border-radius: 3px; padding: 0.2rem 0.5rem; cursor: pointer; font-size: 0.8rem;">×</button>
    </div>
  `,
    )
    .join("");
}

/**
 * Removes a specific flight from the queue
 */
function removeFromQueue(index) {
  flightQueue.splice(index, 1);
  updateQueueCounter();
  updateQueueList();
  showToast("Vuelo removido de la cola.", "info");
}

/**
 * Clears entire queue
 */
function handleClearQueue() {
  if (flightQueue.length === 0) {
    showToast("La cola ya está vacía.", "info");
    return;
  }

  if (!confirm(`¿Limpiar los ${flightQueue.length} vuelos en la cola?`)) return;

  flightQueue = [];
  updateQueueCounter();
  updateQueueList();
  showToast("Cola limpiada.", "success");
}

/**
 * Processes the queue: sends to backend and visualizes steps
 */
async function handleProcessQueue() {
  if (flightQueue.length === 0) {
    showToast("La cola está vacía.", "warning");
    return;
  }

  processingQueue = true;
  stopProcess = false;

  try {
    // Show processing panel
    document.getElementById("processing-panel").style.display = "block";
    document.getElementById("btn-process-queue").disabled = true;
    document.getElementById("btn-clear-queue").disabled = true;
    document.getElementById("btn-enqueue").disabled = true;

    // Call endpoint to process the queue
    const response = await processQueue();

    if (!response.steps) {
      throw new Error("No se recibieron pasos del servidor");
    }

    // Visualize the steps
    await visualizeConcurrencySteps(response.steps);

    showToast("Procesamiento de cola completado.", "success");
  } catch (err) {
    if (!stopProcess) {
      showToast(`Error al procesar cola: ${err.message}`, "error");
    }
  } finally {
    processingQueue = false;
    stopProcess = false;
    flightQueue = [];

    // Hide panel
    document.getElementById("processing-panel").style.display = "none";
    document.getElementById("btn-process-queue").disabled = true;
    document.getElementById("btn-clear-queue").disabled = true;
    document.getElementById("btn-enqueue").disabled = false;

    updateQueueCounter();
    updateQueueList();

    // When stress mode is inactive, reload the entire UI (fetches from backend)
    // When stress mode is active, only redraw the current tree without reloading (prevents auto-balancing)
    if (!stressModeActive) {
      updateUI();
    } else {
      visualizer._resizeCanvas();
      visualizer.draw(currentTree);
      updateMetrics();
      updateVersionList();
    }
  }
}

/**
 * Stops the queue processing
 */
function handleStopProcessing() {
  stopProcess = true;
  showToast("Procesamiento cancelado por el usuario.", "warning");
}

/**
 * Visualizes step by step concurrent insertion
 * @param {Array} steps - Array of steps from server
 */
async function visualizeConcurrencySteps(steps) {
  // Ensure canvas is visible and properly sized before drawing visualization steps
  hideEmptyState(); // Make canvas visible and hide the empty state message
  await new Promise((resolve) => requestAnimationFrame(resolve)); // Wait for browser layout recalculation
  visualizer._resizeCanvas(); // Resize canvas to match container's actual dimensions
  visualizer.resetView(); // Reset zoom and pan to initial centered view

  for (let i = 0; i < steps.length && !stopProcess; i++) {
    const step = steps[i];

    // Update information in panel
    const stepInfo = document.getElementById("step-info");
    const stepMetrics = document.getElementById("step-metrics");

    if (step.flight) {
      stepInfo.textContent = `Step ${i + 1}/${steps.length}: Inserting ${step.flight.idFlight}`;
    } else {
      stepInfo.textContent = `Step ${i + 1}/${steps.length}`;
    }

    // Show metrics for this step
    if (step.metrics) {
      const metricsText = [
        `Height: ${step.metrics.altura ?? "-"}`,
        `Rotations: ${step.metrics.rotaciones ?? 0}`,
        `Balance: ${step.metrics.desbalanceDetectado ? "⚠ CRITICAL" : "✓ OK"}`,
      ].join(" | ");
      stepMetrics.textContent = metricsText;
    }

    // Update tree in canvas if available
    if (step.tree) {
      currentTree = step.tree;

      // Mark critical nodes in red if applicable
      if (step.metrics && step.metrics.desbalanceDetectado) {
        visualizer.markConflicts(step.tree);
      } else {
        visualizer.draw(step.tree);
      }
    }

    // Wait before showing next step
    if (i < steps.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5 seconds
    }
  }

  // Final summary
  const conflicts = steps.filter(
    (s) => s.metrics && s.metrics.desbalanceDetectado,
  ).length;
  showToast(
    `Processed: ${steps.length} steps | Detected conflicts: ${conflicts}`,
    conflicts > 0 ? "warning" : "success",
    3000,
  );

  // Update metrics with the final tree
  await updateMetrics();
  await updateVersionList();
}

/**
 * Loads cities with airports and populates selectors
 */
async function loadCities() {
  try {
    const response = await getCities();
    const cities = response.data.ciudades_con_aeropuerto_colombia;
    populateCitySelects(cities);
  } catch (error) {
    console.error("Error al obtener las ciudades:", error);
  }
}

/**
 * Populates origin and destination selectors with available cities
 */
function populateCitySelects(cities) {
  const selectOrigen = document.getElementById("input-origen");
  const selectDestino = document.getElementById("input-destino");

  if (!selectOrigen || !selectDestino) return;

  // Clear existing options (keep disabled select option)
  selectOrigen.innerHTML =
    '<option value="" disabled selected>Selecciona Origen</option>';
  selectDestino.innerHTML =
    '<option value="" disabled selected>Selecciona Destino</option>';

  // Add the cities as options
  cities.forEach((city) => {
    const optionOrigen = document.createElement("option");
    optionOrigen.value = city;
    optionOrigen.textContent = city;
    selectOrigen.appendChild(optionOrigen);

    const optionDestino = document.createElement("option");
    optionDestino.value = city;
    optionDestino.textContent = city;
    selectDestino.appendChild(optionDestino);
  });
}
