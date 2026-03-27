

let visualizador      = null;   // Instancia de TreeVisualizer para el canvas principal
let arbolActual       = null;   // Último árbol AVL recibido del backend
let modoEstresActivo  = false;  // Indica si el modo estrés está activado

// Guarda el JSON del último archivo cargado (necesario para construir el BST local)
let ultimoJsonCargado = null;

// ═══════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  // Crear el visualizador sobre el canvas principal
  visualizador = new TreeVisualizer("tree-canvas");

  // Cargar el árbol que el backend tenga en memoria (si existe)
  cargarArbol();

  // ── Carga de archivo ──────────────────────────────────────
  document.getElementById("btn-load-file")
    .addEventListener("click", () => document.getElementById("file-input").click());

  document.getElementById("file-input")
    .addEventListener("change", manejarArchivoSeleccionado);

  // ── Insertar vuelo ────────────────────────────────────────
  document.getElementById("form-insert")
    .addEventListener("submit", manejarInsercion);

  // ── Eliminar / cancelar ───────────────────────────────────
  document.getElementById("btn-delete")
    .addEventListener("click", manejarEliminacion);
  document.getElementById("btn-cancel")
    .addEventListener("click", manejarCancelacion);
  document.getElementById("btn-delete-rental-node")
    .addEventListener("click", manejarEliminarMenorRentabilidad);

  // ── Deshacer / exportar ───────────────────────────────────
  document.getElementById("btn-undo")
    .addEventListener("click", manejarDeshacer);
  document.getElementById("btn-export")
    .addEventListener("click", manejarExportar);

  // ── Navegación ────────────────────────────────────────────
  document.getElementById("btn-home")
    .addEventListener("click", () => (window.location.href = "index.html"));

  // ── Modo estrés ───────────────────────────────────────────
  document.getElementById("toggle-stress")
    .addEventListener("change", manejarModoEstres);
  document.getElementById("btn-rebalance")
    .addEventListener("click", manejarRebalanceo);
  document.getElementById("btn-verify-avl")
    .addEventListener("click", manejarAuditoriaAVL);

  // ── Zoom ──────────────────────────────────────────────────
  document.getElementById("btn-zoom-in")
    .addEventListener("click", () => visualizador.zoomIn());
  document.getElementById("btn-zoom-out")
    .addEventListener("click", () => visualizador.zoomOut());
  document.getElementById("btn-reset-view")
    .addEventListener("click", () => visualizador.resetView());

  // ── Recorridos ────────────────────────────────────────────
  ["inorder", "preorder", "postorder", "bfs"].forEach((tipo) =>
    document.getElementById(`btn-traversal-${tipo}`)
      .addEventListener("click", () => manejarRecorrido(tipo))
  );

  // ── Profundidad crítica ────────────────────────────────────
  document.getElementById("btn-update-depth")
    .addEventListener("click", manejarActualizarProfundidad);

  // ── Versiones ──────────────────────────────────────────────
  document.getElementById("btn-save-version")
    .addEventListener("click", manejarGuardarVersion);

  // Presionar ESC limpia el formulario de inserción
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") limpiarFormulario();
  });
});

// ════════════════════════════════════════════════════════════
// CARGAR / ACTUALIZAR ÁRBOL
// ════════════════════════════════════════════════════════════

/** Solicita el árbol actual al backend y actualiza la interfaz. */
async function cargarArbol() {
  try {
    const respuesta = await getTree();
    arbolActual = respuesta.data;
    actualizarInterfaz();
  } catch {
    mostrarEstadoVacio();
  }
}

/** Redibuja el árbol y actualiza métricas y lista de versiones. */
function actualizarInterfaz() {
  if (!arbolActual) {
    mostrarEstadoVacio();
    return;
  }
  ocultarEstadoVacio();
  visualizador.draw(arbolActual);
  actualizarMetricas();
  actualizarListaVersiones();
}

/** Muestra el mensaje de "árbol vacío" y oculta el canvas. */
function mostrarEstadoVacio() {
  document.getElementById("empty-state")?.classList.remove("hidden");
  document.getElementById("tree-canvas").style.display = "none";
  limpiarMetricas();
}

/** Oculta el mensaje de vacío y muestra el canvas. */
function ocultarEstadoVacio() {
  document.getElementById("empty-state")?.classList.add("hidden");
  document.getElementById("tree-canvas").style.display = "block";
}

// ════════════════════════════════════════════════════════════
// CARGA DE ARCHIVO JSON
// ════════════════════════════════════════════════════════════

/**
 * Lee el archivo JSON seleccionado por el usuario, lo envía al backend
 * (endpoint /create) y muestra el árbol resultante.
 *
 * Si el tipo es INSERCION, abre además una ventana de comparación AVL vs BST
 * tal como requiere el enunciado (sección 1.1).
 */
async function manejarArchivoSeleccionado(e) {
  const archivo = e.target.files[0];
  if (!archivo) return;

  // Resetear el input para permitir cargar el mismo archivo de nuevo si es necesario
  e.target.value = "";

  // Leer y parsear el JSON
  let datos;
  try {
    const texto = await archivo.text();
    datos = JSON.parse(texto);
  } catch {
    mostrarToast("El archivo seleccionado no es un JSON válido.", "error");
    return;
  }

  // Validar que tenga el campo "tipo"
  if (!datos.tipo) {
    mostrarToast('El JSON debe tener el campo "tipo": INSERCION o TOPOLOGIA.', "error");
    return;
  }

  const tipo = datos.tipo.toUpperCase();
  if (tipo !== "INSERCION" && tipo !== "TOPOLOGIA") {
    mostrarToast('El campo "tipo" debe ser INSERCION o TOPOLOGIA.', "error");
    return;
  }

  try {
    // Enviar al backend para construir el árbol AVL
    const respuesta = await createTree(datos);
    arbolActual = respuesta.data;
    ultimoJsonCargado = datos;

    actualizarInterfaz();

    // Mostrar el nombre del archivo en la barra lateral
    document.getElementById("file-name").textContent = `📄 ${archivo.name}`;
    document.getElementById("file-info").classList.remove("hidden");

    mostrarToast(`Árbol cargado desde: ${archivo.name}`, "success");

    // Si es de tipo INSERCION, abrir el modal de comparación AVL vs BST
    if (tipo === "INSERCION" && Array.isArray(datos.vuelos) && datos.vuelos.length > 0) {
      // Pequeño retraso para que el canvas principal se renderice primero
      setTimeout(() => mostrarModalComparacion(arbolActual, datos.vuelos), 150);
    }

  } catch (err) {
    mostrarToast(`Error al crear el árbol: ${err.message}`, "error");
  }
}

// ────────────────────────────────────────────────────────────
// Construcción del BST local para la comparación
// El backend solo expone el AVL; el BST se reconstruye en JavaScript
// a partir de la lista de vuelos del archivo JSON.
// ────────────────────────────────────────────────────────────

/** Extrae la parte numérica del código de un vuelo para comparar en el BST. */
function _codigoNumerico(codigo) {
  const digitos = String(codigo).replace(/\D/g, "");
  return digitos ? parseInt(digitos, 10) : 0;
}

/** Crea un nodo BST simple a partir de los datos de un vuelo. */
function _crearNodoBST(vuelo) {
  return {
    codigo:           vuelo.codigo,
    _numCodigo:       _codigoNumerico(vuelo.codigo),
    origen:           vuelo.origen,
    destino:          vuelo.destino,
    alerta:           !!vuelo.alerta,
    promocion:        !!vuelo.promocion,
    esCritico:        false,
    factorEquilibrio: undefined, // El BST no tiene factor de equilibrio
    izquierdo:        null,
    derecho:          null,
  };
}

/** Inserta un vuelo en el BST local de forma iterativa. */
function _insertarEnBST(raiz, vuelo) {
  const nodo = _crearNodoBST(vuelo);
  if (!raiz) return nodo;

  let actual = raiz;
  while (true) {
    if (nodo._numCodigo < actual._numCodigo) {
      if (!actual.izquierdo) { actual.izquierdo = nodo; break; }
      actual = actual.izquierdo;
    } else if (nodo._numCodigo > actual._numCodigo) {
      if (!actual.derecho)   { actual.derecho   = nodo; break; }
      actual = actual.derecho;
    } else {
      break; // Código duplicado, se ignora
    }
  }
  return raiz;
}

/** Construye un BST completo a partir de la lista de vuelos del JSON. */
function construirBSTLocal(vuelos) {
  let raiz = null;
  for (const v of vuelos) raiz = _insertarEnBST(raiz, v);
  return raiz;
}

// ────────────────────────────────────────────────────────────
// Modal de comparación AVL vs BST (requerimiento 1.1)
// ────────────────────────────────────────────────────────────

/**
 * Abre una ventana modal que muestra lado a lado el árbol AVL (balanceado,
 * devuelto por el backend) y el BST (sin balanceo, construido localmente),
 * junto con sus propiedades: raíz, profundidad máxima y número de hojas.
 */
function mostrarModalComparacion(arbolAVL, vuelos) {
  // Eliminar modal anterior si existe
  document.getElementById("modal-comparacion")?.remove();

  const arbolBST = construirBSTLocal(vuelos);

  const fondo = document.createElement("div");
  fondo.id = "modal-comparacion";
  fondo.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.55);
    z-index:2000;display:flex;align-items:center;justify-content:center;
  `;

  fondo.innerHTML = `
    <div style="
      background:#fff;border-radius:14px;padding:1.5rem;
      width:92vw;max-width:1150px;max-height:88vh;
      overflow:hidden;display:flex;flex-direction:column;gap:1rem;
      box-shadow:0 20px 60px rgba(0,0,0,.3);
    ">
      <!-- Encabezado del modal -->
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h2 style="font-size:1.15rem;font-weight:700;margin:0">
          🌳 Comparación: AVL vs BST
        </h2>
        <button id="btn-cerrar-comparacion" style="
          border:none;background:#f3f4f6;border-radius:8px;
          padding:.45rem .9rem;cursor:pointer;font-weight:600;font-size:.9rem;
        ">✕ Cerrar</button>
      </div>

      <!-- Dos columnas: AVL a la izquierda, BST a la derecha -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;flex:1;min-height:0;">

        <!-- Columna AVL -->
        <div style="display:flex;flex-direction:column;gap:.5rem;">
          <h3 style="margin:0;font-size:1rem;font-weight:700;color:#2563eb">
            Árbol AVL — Balanceado ✅
          </h3>
          <p id="stats-avl" style="margin:0;font-size:.83rem;color:#6b7280">Calculando…</p>
          <div style="flex:1;min-height:350px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;position:relative;">
            <canvas id="canvas-avl-comparacion" style="width:100%;height:100%;display:block;"></canvas>
          </div>
        </div>

        <!-- Columna BST -->
        <div style="display:flex;flex-direction:column;gap:.5rem;">
          <h3 style="margin:0;font-size:1rem;font-weight:700;color:#7c3aed">
            Árbol BST — Sin Balanceo ⚠️
          </h3>
          <p id="stats-bst" style="margin:0;font-size:.83rem;color:#6b7280">Calculando…</p>
          <div style="flex:1;min-height:350px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;position:relative;">
            <canvas id="canvas-bst-comparacion" style="width:100%;height:100%;display:block;"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(fondo);

  // Cerrar al hacer clic en el botón o en el fondo oscuro
  document.getElementById("btn-cerrar-comparacion")
    .addEventListener("click", () => fondo.remove());
  fondo.addEventListener("click", (e) => { if (e.target === fondo) fondo.remove(); });

  // Dibujar ambos árboles tras renderizar el DOM
  requestAnimationFrame(() => {
    // Árbol AVL
    const vizAVL = new TreeVisualizer("canvas-avl-comparacion", {
      treeType: "avl", xSpacing: 55, ySpacing: 70, nodeRadius: 22,
    });
    vizAVL.draw(arbolAVL);
    const statsAVL = vizAVL.getStats(arbolAVL);
    document.getElementById("stats-avl").innerHTML =
      `Raíz: <strong>${statsAVL.root}</strong> &nbsp;|&nbsp; Profundidad: <strong>${statsAVL.depth}</strong> &nbsp;|&nbsp; Hojas: <strong>${statsAVL.leaves}</strong>`;

    // Árbol BST
    const vizBST = new TreeVisualizer("canvas-bst-comparacion", {
      treeType: "bst", xSpacing: 55, ySpacing: 70, nodeRadius: 22,
    });
    vizBST.draw(arbolBST);
    const statsBST = vizBST.getStats(arbolBST);
    document.getElementById("stats-bst").innerHTML =
      `Raíz: <strong>${statsBST.root}</strong> &nbsp;|&nbsp; Profundidad: <strong>${statsBST.depth}</strong> &nbsp;|&nbsp; Hojas: <strong>${statsBST.leaves}</strong>`;
  });
}

// ════════════════════════════════════════════════════════════
// INSERCIÓN DE VUELOS
// ════════════════════════════════════════════════════════════

/** Recoge los datos del formulario y llama al backend para insertar el vuelo. */
async function manejarInsercion(e) {
  e.preventDefault();
  try {
    const datos = {
      codigo:     document.getElementById("input-codigo").value.trim(),
      origen:     document.getElementById("input-origen").value.trim(),
      destino:    document.getElementById("input-destino").value.trim(),
      horaSalida: document.getElementById("input-hora").value,
      precioBase: parseFloat(document.getElementById("input-precio").value),
      pasajeros:  parseInt(document.getElementById("input-pasajeros").value),
      promocion:  document.getElementById("input-promocion").checked,
      alerta:     document.getElementById("input-alerta").checked,
      prioridad:  parseInt(document.getElementById("input-prioridad").value),
    };

    // Validaciones básicas antes de llamar al backend
    if (!datos.codigo || !datos.origen || !datos.destino) {
      mostrarToast("Completa los campos obligatorios: código, origen y destino.", "warning");
      return;
    }
    if (datos.origen === datos.destino) {
      mostrarToast("El origen y el destino no pueden ser la misma ciudad.", "warning");
      return;
    }

    const respuesta = await insertFlight(datos);
    arbolActual = respuesta.data;
    actualizarInterfaz();
    limpiarFormulario();
    mostrarToast(`Vuelo ${datos.codigo} insertado correctamente.`, "success");
  } catch (err) {
    mostrarToast(`Error al insertar: ${err.message}`, "error");
  }
}

/** Limpia todos los campos del formulario de inserción. */
function limpiarFormulario() {
  document.getElementById("form-insert").reset();
}

// ════════════════════════════════════════════════════════════
// ELIMINACIÓN / CANCELACIÓN
// ════════════════════════════════════════════════════════════

/** Elimina únicamente el nodo del vuelo indicado (sin afectar descendientes). */
async function manejarEliminacion() {
  const codigo = document.getElementById("input-delete-codigo").value.trim();
  if (!codigo) { mostrarToast("Ingresa el código del vuelo a eliminar.", "warning"); return; }
  if (!confirm(`¿Eliminar el vuelo ${codigo}? (solo este nodo, los hijos se reorganizan)`)) return;

  try {
    const respuesta = await deleteFlight(codigo);
    arbolActual = respuesta.data;
    actualizarInterfaz();
    document.getElementById("input-delete-codigo").value = "";
    mostrarToast(`Vuelo ${codigo} eliminado.`, "success");
  } catch (err) {
    mostrarToast(`Error: ${err.message}`, "error");
  }
}

/** Cancela el vuelo indicado Y toda su subrama (todos sus descendientes). */
async function manejarCancelacion() {
  const codigo = document.getElementById("input-delete-codigo").value.trim();
  if (!codigo) { mostrarToast("Ingresa el código del vuelo a cancelar.", "warning"); return; }
  if (!confirm(`¿Cancelar ${codigo} y TODOS sus descendientes? Esta acción no se puede deshacer con un solo Ctrl+Z.`)) return;

  try {
    const respuesta = await cancelSubtree(codigo);
    arbolActual = respuesta.data;
    actualizarInterfaz();
    document.getElementById("input-delete-codigo").value = "";
    mostrarToast(`Vuelo ${codigo} y todos sus descendientes han sido cancelados.`, "success");
  } catch (err) {
    mostrarToast(`Error: ${err.message}`, "error");
  }
}

/**
 * Llama al backend para encontrar y eliminar el nodo de menor rentabilidad
 * (y toda su subrama). Fórmula: pasajeros × precioFinal − promoción + penalización.
 * Desempate: mayor profundidad → código más grande.
 */
async function manejarEliminarMenorRentabilidad() {
  if (!confirm("¿Eliminar el vuelo de menor rentabilidad y toda su subrama?")) return;
  try {
    const respuesta = await deleteLowestProfit();
    arbolActual = respuesta.tree;
    actualizarInterfaz();
    mostrarToast(respuesta.message, "success");
  } catch (err) {
    mostrarToast(`Error: ${err.message}`, "error");
  }
}

// ════════════════════════════════════════════════════════════
// DESHACER / EXPORTAR
// ════════════════════════════════════════════════════════════

/** Deshace la última acción (equivalente a Ctrl+Z). */
async function manejarDeshacer() {
  try {
    const respuesta = await undoAction();
    arbolActual = respuesta.data;
    actualizarInterfaz();
    mostrarToast("Acción deshecha correctamente.", "success");
  } catch (err) {
    mostrarToast(`Error al deshacer: ${err.message}`, "error");
  }
}

/** Exporta el árbol completo como archivo JSON descargable. */
async function manejarExportar() {
  try {
    const respuesta = await exportTree();
    const json      = JSON.stringify(respuesta.data, null, 2);
    const blob      = new Blob([json], { type: "application/json" });
    const url       = URL.createObjectURL(blob);
    const enlace    = Object.assign(document.createElement("a"), {
      href:     url,
      download: `skybalance-${new Date().toISOString().split("T")[0]}.json`,
    });
    enlace.click();
    URL.revokeObjectURL(url);
    mostrarToast("Árbol exportado correctamente.", "success");
  } catch (err) {
    mostrarToast(`Error al exportar: ${err.message}`, "error");
  }
}

// ════════════════════════════════════════════════════════════
// MODO ESTRÉS
// ════════════════════════════════════════════════════════════

/**
 * Activa o desactiva el modo estrés según el estado del interruptor.
 * En modo estrés el árbol no se rebalancea automáticamente tras cada operación.
 * Al desactivarlo se dispara un rebalanceo global automático.
 */
async function manejarModoEstres(e) {
  const activando      = e.target.checked;
  const btnRebalancear = document.getElementById("btn-rebalance");
  const btnVerificar   = document.getElementById("btn-verify-avl");
  const indicador      = document.getElementById("mode-indicator");

  if (activando) {
    try {
      await activateStress();
      modoEstresActivo = true;
      btnRebalancear.disabled = false;
      btnVerificar.disabled   = false;
      indicador.textContent   = "⚠ Modo Estrés";
      indicador.classList.add("stress-mode");
      await cargarArbol(); // Recargar para mostrar los nodos con esCritico
      mostrarToast("Modo estrés activado. El balanceo automático está deshabilitado.", "warning");
    } catch (err) {
      e.target.checked = false; // Revertir el toggle si hubo error
      mostrarToast(`Error: ${err.message}`, "error");
    }
  } else {
    try {
      // La respuesta incluye { stressMode, rebalance, tree }
      const respuesta  = await deactivateStress();
      modoEstresActivo = false;
      arbolActual      = respuesta.data.tree;
      btnRebalancear.disabled = true;
      btnVerificar.disabled   = true;
      indicador.textContent   = "Modo Normal";
      indicador.classList.remove("stress-mode");
      actualizarInterfaz();
      mostrarToast("Modo estrés desactivado. El árbol fue rebalanceado automáticamente.", "success");
    } catch (err) {
      e.target.checked = true; // Revertir el toggle si hubo error
      mostrarToast(`Error: ${err.message}`, "error");
    }
  }
}

/** Dispara un rebalanceo global del árbol mientras el modo estrés está activo. */
async function manejarRebalanceo() {
  if (!confirm("¿Rebalancear todo el árbol ahora?")) return;
  try {
    await rebalanceStress();
    await cargarArbol();
    mostrarToast("Rebalanceo global completado.", "success");
  } catch (err) {
    mostrarToast(`Error: ${err.message}`, "error");
  }
}

/**
 * Solicita al backend la auditoría AVL (solo disponible en modo estrés)
 * y muestra un modal con el reporte detallado de nodos inconsistentes.
 */
async function manejarAuditoriaAVL() {
  try {
    const respuesta = await auditAVL();
    mostrarModalAuditoria(respuesta);
  } catch (err) {
    mostrarToast(`Error en auditoría: ${err.message}`, "error");
  }
}

/** Muestra el modal de resultados de la auditoría AVL. */
function mostrarModalAuditoria(respuesta) {
  document.getElementById("modal-auditoria")?.remove();

  const inconsistentes = respuesta.inconsistentNodes || [];
  const esValido       = inconsistentes.length === 0;

  const fondo = document.createElement("div");
  fondo.id    = "modal-auditoria";
  fondo.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.5);
    z-index:2000;display:flex;align-items:center;justify-content:center;
  `;

  fondo.innerHTML = `
    <div style="
      background:#fff;border-radius:12px;padding:1.5rem;
      width:480px;max-width:95vw;
      box-shadow:0 16px 48px rgba(0,0,0,.28);
    ">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h2 style="margin:0;font-size:1.1rem;font-weight:700;">🔍 Auditoría AVL</h2>
        <button id="btn-cerrar-auditoria" style="border:none;background:#f3f4f6;border-radius:6px;padding:.4rem .8rem;cursor:pointer;font-weight:600;">✕</button>
      </div>

      <!-- Resultado general -->
      <div style="padding:.8rem;border-radius:8px;margin-bottom:1rem;
        background:${esValido ? "#f0fdf4" : "#fff1f2"};
        border-left:4px solid ${esValido ? "#22c55e" : "#ef4444"};">
        <strong>${esValido
          ? "✅ El árbol cumple la propiedad AVL en todos sus nodos."
          : "❌ Se encontraron nodos que violan la propiedad AVL."}</strong>
      </div>

      <!-- Lista de nodos inconsistentes (si los hay) -->
      ${inconsistentes.length > 0 ? `
        <p style="font-size:.88rem;margin-bottom:.5rem;font-weight:600;">
          Nodos inconsistentes (|FE| > 1):
        </p>
        <ul style="margin:0;padding-left:1.2rem;font-size:.85rem;color:#6b7280;">
          ${inconsistentes.map(n => `<li>${n}</li>`).join("")}
        </ul>
      ` : ""}

      <div style="margin-top:1rem;text-align:right;">
        <button id="btn-aceptar-auditoria" style="
          border:none;background:#2563eb;color:#fff;
          border-radius:8px;padding:.5rem 1.2rem;cursor:pointer;font-weight:600;">
          Aceptar
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(fondo);

  const cerrar = () => fondo.remove();
  document.getElementById("btn-cerrar-auditoria").addEventListener("click", cerrar);
  document.getElementById("btn-aceptar-auditoria").addEventListener("click", cerrar);
  fondo.addEventListener("click", (e) => { if (e.target === fondo) cerrar(); });
}

// ════════════════════════════════════════════════════════════
// RECORRIDOS 
// ════════════════════════════════════════════════════════════

/**
 * Obtiene los recorridos precalculados del backend y los muestra en pantalla.
 * Los recorridos InOrder, PreOrder, PostOrder y BFS ya están implementados
 * en el backend (AvlTree.py); no es necesario duplicarlos aquí.
 */
async function manejarRecorrido(tipo) {
  try {
    const respuesta = await getMetrics();
    const recorridos = respuesta.data.recorridos;

    const mapa = {
      inorder:   recorridos?.inorder,
      preorder:  recorridos?.preorder,
      postorder: recorridos?.postorder,
      bfs:       recorridos?.bfs,
    };

    const lista = mapa[tipo];
    if (!lista || lista.length === 0) {
      mostrarToast("El árbol está vacío.", "warning");
      return;
    }

    // Cada elemento de la lista es un objeto Flight; extraemos el idFlight
    const codigos = lista.map(f => (typeof f === "object" ? (f.idFlight ?? f.codigo) : f));
    document.getElementById("traversal-result").innerHTML =
      `<strong>${tipo.toUpperCase()}:</strong> ${codigos.join(" → ")}`;

  } catch (err) {
    mostrarToast(`Error al obtener el recorrido: ${err.message}`, "error");
  }
}

// ════════════════════════════════════════════════════════════
// MÉTRICAS
// ════════════════════════════════════════════════════════════

/**
 * Actualiza el panel de métricas con los datos devueltos por el backend.
 * Estructura de respuesta del backend:
 *   { altura, rotaciones:{LL,RR,LR,RL}, cancelacionesMasivas, hojas, recorridos }
 */
async function actualizarMetricas() {
  try {
    const respuesta = await getMetrics();
    const m   = respuesta.data;
    const rot = m.rotaciones || {};

    // Total de rotaciones (suma de todos los tipos)
    const totalRotaciones = (rot.LL || 0) + (rot.RR || 0) + (rot.LR || 0) + (rot.RL || 0);

    document.getElementById("metric-altura").textContent     = m.altura     ?? "-";
    document.getElementById("metric-nodos").textContent      = contarNodos(arbolActual);
    document.getElementById("metric-hojas").textContent      = m.hojas      ?? "0";
    document.getElementById("metric-rotaciones").textContent = totalRotaciones;
    document.getElementById("metric-ll").textContent         = rot.LL       ?? "0";
    document.getElementById("metric-rr").textContent         = rot.RR       ?? "0";
    document.getElementById("metric-lr").textContent         = rot.LR       ?? "0";
    document.getElementById("metric-rl").textContent         = rot.RL       ?? "0";
  } catch {
    // Las métricas no son críticas; se falla en silencio
  }
}

/** Cuenta el número total de nodos del árbol local de forma recursiva. */
function contarNodos(nodo) {
  if (!nodo) return 0;
  return 1 + contarNodos(nodo.izquierdo) + contarNodos(nodo.derecho);
}

/** Reinicia todos los contadores de métricas a su valor inicial. */
function limpiarMetricas() {
  ["metric-altura", "metric-nodos", "metric-hojas",
   "metric-rotaciones", "metric-ll", "metric-rr", "metric-lr", "metric-rl"]
    .forEach(id => {
      document.getElementById(id).textContent = id === "metric-altura" ? "-" : "0";
    });
}

// ════════════════════════════════════════════════════════════
// PROFUNDIDAD CRÍTICA (sistema de penalización)
// ════════════════════════════════════════════════════════════

/**
 * Actualiza el límite de profundidad crítica.
 * Si el modo estrés está activo, llama al backend para que recalcule
 * el flag esCritico y el precio de todos los nodos afectados.
 * Si no está activo, guarda el valor localmente para usarlo al activar el modo estrés.
 */
async function manejarActualizarProfundidad() {
  const profundidad = parseInt(document.getElementById("input-critical-depth").value);
  if (isNaN(profundidad) || profundidad < 0) {
    mostrarToast("Ingresa una profundidad válida (número entero ≥ 0).", "warning");
    return;
  }

  if (!modoEstresActivo) {
    mostrarToast(
      `Profundidad límite guardada en ${profundidad}. Se aplicará cuando actives el modo estrés.`,
      "info"
    );
    return;
  }

  try {
    const respuesta = await setDepthLimit(profundidad);
    arbolActual = respuesta.tree;
    actualizarInterfaz();
    mostrarToast(`Profundidad crítica actualizada a ${profundidad}.`, "success");
  } catch (err) {
    mostrarToast(`Error: ${err.message}`, "error");
  }
}

// ════════════════════════════════════════════════════════════
// VERSIONES
// ════════════════════════════════════════════════════════════

/** Guarda una instantánea con nombre del estado actual del árbol. */
async function manejarGuardarVersion() {
  const nombre = document.getElementById("input-version-name").value.trim();
  if (!nombre) { mostrarToast("Escribe un nombre para la versión.", "warning"); return; }

  try {
    await saveVersion(nombre);
    document.getElementById("input-version-name").value = "";
    await actualizarListaVersiones();
    mostrarToast(`Versión "${nombre}" guardada correctamente.`, "success");
  } catch (err) {
    mostrarToast(`Error al guardar versión: ${err.message}`, "error");
  }
}

/** Refresca la lista de versiones guardadas en el panel derecho. */
async function actualizarListaVersiones() {
  try {
    const respuesta  = await getVersions();
    const lista      = respuesta.data || [];
    const contenedor = document.getElementById("version-list");
    contenedor.innerHTML = "";

    if (lista.length === 0) {
      contenedor.innerHTML = `
        <p style="font-size:.83rem;color:#9ca3af;text-align:center;margin:.5rem 0">
          Sin versiones guardadas.
        </p>`;
      return;
    }

    lista.forEach((nombre) => {
      const elemento = document.createElement("div");
      elemento.className = "version-item";
      elemento.innerHTML = `
        <span class="version-name">${nombre}</span>
        <button class="btn btn-sm btn-primary" style="font-size:.78rem;padding:.3rem .6rem;">
          Cargar
        </button>
      `;
      elemento.querySelector("button")
        .addEventListener("click", () => manejarCargarVersion(nombre));
      contenedor.appendChild(elemento);
    });
  } catch {
    // No es crítico; se falla en silencio
  }
}

/** Restaura el árbol a una versión guardada previamente. */
async function manejarCargarVersion(nombre) {
  if (!confirm(`¿Restaurar la versión "${nombre}"? El árbol actual se reemplazará.`)) return;
  try {
    const respuesta = await loadVersion(nombre);
    arbolActual = respuesta.data;
    actualizarInterfaz();
    mostrarToast(`Versión "${nombre}" restaurada.`, "success");
  } catch (err) {
    mostrarToast(`Error al cargar versión: ${err.message}`, "error");
  }
}

// ════════════════════════════════════════════════════════════
// NOTIFICACIONES (TOAST)
// ════════════════════════════════════════════════════════════

/**
 * Muestra una notificación tipo toast en la esquina superior derecha.
 * @param {string} mensaje            - Texto a mostrar.
 * @param {'success'|'error'|'warning'|'info'} tipo - Tipo de notificación.
 * @param {number} [duracion=3500]    - Milisegundos antes de que desaparezca.
 */
function mostrarToast(mensaje, tipo = "info", duracion = 3500) {
  const iconos = { success: "✓", error: "✗", warning: "⚠", info: "ℹ" };

  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  toast.innerHTML = `
    <span class="toast-icon">${iconos[tipo] ?? "ℹ"}</span>
    <span class="toast-message">${mensaje}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

  document.getElementById("toast-container").appendChild(toast);
  setTimeout(() => toast.remove(), duracion);
}