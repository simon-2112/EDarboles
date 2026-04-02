/**
 * App Main - SkyBalance AVL
 *
 * Gestiona todos los eventos de la interfaz, las llamadas a la API y las
 * actualizaciones visuales.
 *
 * Dependencias (deben cargarse antes en el HTML):
 *   api-client.js      → funciones de comunicación con el backend Flask
 *   tree-visualizer.js → clase TreeVisualizer para dibujar en canvas
 */

// ════════════════════════════════════════════════════════════
// ESTADO GLOBAL
// ════════════════════════════════════════════════════════════

let visualizador = null; // Instancia de TreeVisualizer para el canvas principal
let arbolActual = null; // Último árbol AVL recibido del backend
let modoEstresActivo = false; // Indica si el modo estrés está activado
let ultimoJsonCargado = null; // JSON del último archivo cargado (para construir el BST local)

// ── Cola de Inserciones (Requerimiento 3) ──────────────────
let colaVuelos = []; // Array de vuelos pendientes por procesar
let procesandoCola = false; // Flag para indicar si está procesando
let detenerProceso = false; // Flag para cancelar el procesamiento

// ── Edición de Vuelos ────────────────────────────────────────
let vueloEnEdicion = null; // Almacena el vuelo en modo edición

// ════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  visualizador = new TreeVisualizer("tree-canvas");

  // Cargar el árbol que el backend tenga en memoria al abrir la app
  cargarArbol();

  actualizarListaVersiones();

  // cargar las ciudades con aeropuertos
  cargarCiudades();
  // ── Carga de archivo ──────────────────────────────────────
  document
    .getElementById("btn-load-file")
    .addEventListener("click", () =>
      document.getElementById("file-input").click(),
    );
  document
    .getElementById("file-input")
    .addEventListener("change", manejarArchivoSeleccionado);

  // ── Insertar vuelo ────────────────────────────────────────
  document
    .getElementById("form-insert")
    .addEventListener("submit", manejarInsercion);

  // ── Editar vuelo ────────────────────────────────────────
  document
    .getElementById("btn-load-flight")
    .addEventListener("click", manejarCargarVuelo);
  document
    .getElementById("btn-cancel-edit")
    .addEventListener("click", () => cancelarEdicion(true));

  // ── Eliminar / cancelar ───────────────────────────────────
  document
    .getElementById("btn-delete")
    .addEventListener("click", manejarEliminacion);
  document
    .getElementById("btn-cancel")
    .addEventListener("click", manejarCancelacion);
  document
    .getElementById("btn-delete-rental-node")
    .addEventListener("click", manejarEliminarMenorRentabilidad);
  document
    .getElementById("btn-delete-all")
    .addEventListener("click", manejarEliminarTodo);
  // ── Deshacer / exportar ───────────────────────────────────
  document
    .getElementById("btn-undo")
    .addEventListener("click", manejarDeshacer);
  document
    .getElementById("btn-export")
    .addEventListener("click", manejarExportar);

  // ── Navegación ────────────────────────────────────────────
  document
    .getElementById("btn-home")
    .addEventListener("click", () => (window.location.href = "index.html"));

  // ── Modo estrés ───────────────────────────────────────────
  document
    .getElementById("toggle-stress")
    .addEventListener("change", manejarModoEstres);
  document
    .getElementById("btn-rebalance")
    .addEventListener("click", manejarRebalanceo);
  document
    .getElementById("btn-verify-avl")
    .addEventListener("click", manejarAuditoriaAVL);

  // ── Zoom ──────────────────────────────────────────────────
  document
    .getElementById("btn-zoom-in")
    .addEventListener("click", () => visualizador.zoomIn());
  document
    .getElementById("btn-zoom-out")
    .addEventListener("click", () => visualizador.zoomOut());
  document
    .getElementById("btn-reset-view")
    .addEventListener("click", () => visualizador.resetView());

  // ── Buscar vuelos ──────────────────────────────────────────────────
  document
    .getElementById("btn-search-flight")
    .addEventListener("click", manejarBusquedaVuelo);
  document
    .getElementById("input-search-codigo")
    .addEventListener("keydown", (e) => {
      if (e.key === "Enter") manejarBusquedaVuelo();
    });

  // ── Recorridos ────────────────────────────────────────────
  ["inorder", "preorder", "postorder", "bfs"].forEach((tipo) =>
    document
      .getElementById(`btn-traversal-${tipo}`)
      .addEventListener("click", () => manejarRecorrido(tipo)),
  );

  // ── Profundidad crítica ────────────────────────────────────
  document
    .getElementById("btn-update-depth")
    .addEventListener("click", manejarActualizarProfundidad);

  // ── Versiones ──────────────────────────────────────────────
  document
    .getElementById("btn-save-version")
    .addEventListener("click", manejarGuardarVersion);

  // ── Cola de Inserciones (Requerimiento 3) ──────────────────
  document
    .getElementById("btn-enqueue")
    .addEventListener("click", manejarEnqueueVuelo);
  document
    .getElementById("btn-process-queue")
    .addEventListener("click", manejarProcesarCola);
  document
    .getElementById("btn-clear-queue")
    .addEventListener("click", manejarLimpiarCola);
  document
    .getElementById("btn-stop-processing")
    .addEventListener("click", manejarDetenerProcesamiento);

  // ESC cancela edición o limpia el formulario
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (vueloEnEdicion) {
        cancelarEdicion(true);
      } else {
        limpiarFormulario();
      }
    }
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
    await actualizarInterfaz();
  } catch {
    mostrarEstadoVacio();
  }
}

/**
 * Redibuja el árbol y actualiza métricas y lista de versiones.
 *
 * CORRECCIÓN CANVAS: el canvas puede tener dimensiones 0 si estaba
 * oculto (display:none) cuando se construyó el DOM. Por eso se
 * redimensiona explícitamente antes de dibujar, usando requestAnimationFrame
 * para garantizar que el navegador ya calculó el layout visible.
 */
async function actualizarInterfaz() {
  if (!arbolActual) {
    mostrarEstadoVacio();
    return;
  }

  // 1. Hacer el canvas visible primero
  ocultarEstadoVacio();

  // 2. Esperar un frame de layout para que el canvas tenga dimensiones reales
  await new Promise((resolve) => requestAnimationFrame(resolve));

  // 3. Redimensionar y dibujar
  visualizador._redimensionarCanvas();
  visualizador.draw(arbolActual);

  // 4. Actualizar métricas y versiones (async, no bloquea el dibujado)
  actualizarMetricas();
  actualizarListaVersiones();
}

function mostrarEstadoVacio() {
  document.getElementById("empty-state")?.classList.remove("hidden");
  document.getElementById("tree-canvas").style.display = "none";
  limpiarMetricas();
}

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
 * Para tipo INSERCION abre el modal de comparación AVL vs BST (req. 1.1).
 */
async function manejarArchivoSeleccionado(e) {
  const archivo = e.target.files[0];
  if (!archivo) return;
  e.target.value = ""; // permite re-seleccionar el mismo archivo

  let datos;
  try {
    datos = JSON.parse(await archivo.text());
  } catch {
    mostrarToast("El archivo seleccionado no es un JSON válido.", "error");
    return;
  }

  if (!datos.tipo) {
    mostrarToast(
      'El JSON debe tener el campo "tipo": INSERCION o TOPOLOGIA.',
      "error",
    );
    return;
  }

  const tipo = datos.tipo.toUpperCase();
  if (tipo !== "INSERCION" && tipo !== "TOPOLOGIA") {
    mostrarToast('El campo "tipo" debe ser INSERCION o TOPOLOGIA.', "error");
    return;
  }

  const btn = document.getElementById("btn-load-file");
  setLoading(btn, true, "Cargando…");
  try {
    const respuesta = await createTree(datos);
    arbolActual = respuesta.data;
    ultimoJsonCargado = datos;

    await actualizarInterfaz();

    document.getElementById("file-name").textContent = `📄 ${archivo.name}`;
    document.getElementById("file-info").classList.remove("hidden");

    mostrarToast(`Árbol cargado desde: ${archivo.name}`, "success");

    if (
      tipo === "INSERCION" &&
      Array.isArray(datos.vuelos) &&
      datos.vuelos.length > 0
    ) {
      setTimeout(() => mostrarModalComparacion(arbolActual, datos.vuelos), 150);
    }
  } catch (err) {
    mostrarToast(`Error al crear el árbol: ${err.message}`, "error");
  } finally {
    setLoading(btn, false, "Seleccionar archivo JSON");
  }
}

// ────────────────────────────────────────────────────────────
// BST local para la comparación (el backend solo expone el AVL)
// ────────────────────────────────────────────────────────────

function _codigoNumerico(codigo) {
  const digitos = String(codigo).replace(/\D/g, "");
  return digitos ? parseInt(digitos, 10) : 0;
}

function _crearNodoBST(vuelo) {
  return {
    codigo: vuelo.codigo,
    _numCodigo: _codigoNumerico(vuelo.codigo),
    origen: vuelo.origen,
    destino: vuelo.destino,
    alerta: !!vuelo.alerta,
    promocion: !!vuelo.promocion,
    esCritico: false,
    factorEquilibrio: undefined,
    izquierdo: null,
    derecho: null,
  };
}

function _insertarEnBST(raiz, vuelo) {
  const nodo = _crearNodoBST(vuelo);
  if (!raiz) return nodo;
  let actual = raiz;
  while (true) {
    if (nodo._numCodigo < actual._numCodigo) {
      if (!actual.izquierdo) {
        actual.izquierdo = nodo;
        break;
      }
      actual = actual.izquierdo;
    } else if (nodo._numCodigo > actual._numCodigo) {
      if (!actual.derecho) {
        actual.derecho = nodo;
        break;
      }
      actual = actual.derecho;
    } else {
      break; // duplicado, se ignora
    }
  }
  return raiz;
}

function construirBSTLocal(vuelos) {
  let raiz = null;
  for (const v of vuelos) raiz = _insertarEnBST(raiz, v);
  return raiz;
}

// ────────────────────────────────────────────────────────────
// Modal de comparación AVL vs BST (requerimiento 1.1)
// ────────────────────────────────────────────────────────────

function mostrarModalComparacion(arbolAVL, vuelos) {
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

  document.body.appendChild(fondo);
  document
    .getElementById("btn-cerrar-comparacion")
    .addEventListener("click", () => fondo.remove());
  fondo.addEventListener("click", (e) => {
    if (e.target === fondo) fondo.remove();
  });

  requestAnimationFrame(() => {
    const vizAVL = new TreeVisualizer("canvas-avl-comparacion", {
      treeType: "avl",
      xSpacing: 55,
      ySpacing: 70,
      nodeRadius: 22,
    });
    vizAVL.draw(arbolAVL);
    const sA = vizAVL.getStats(arbolAVL);
    document.getElementById("stats-avl").innerHTML =
      `Raíz: <strong>${sA.root}</strong> &nbsp;|&nbsp; Profundidad: <strong>${sA.depth}</strong> &nbsp;|&nbsp; Hojas: <strong>${sA.leaves}</strong>`;

    const vizBST = new TreeVisualizer("canvas-bst-comparacion", {
      treeType: "bst",
      xSpacing: 55,
      ySpacing: 70,
      nodeRadius: 22,
    });
    vizBST.draw(arbolBST);
    const sB = vizBST.getStats(arbolBST);
    document.getElementById("stats-bst").innerHTML =
      `Raíz: <strong>${sB.root}</strong> &nbsp;|&nbsp; Profundidad: <strong>${sB.depth}</strong> &nbsp;|&nbsp; Hojas: <strong>${sB.leaves}</strong>`;
  });
}

// ════════════════════════════════════════════════════════════
// INSERCIÓN DE VUELOS
// ════════════════════════════════════════════════════════════

async function manejarInsercion(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  setLoading(btn, true, vueloEnEdicion ? "Guardando..." : "Insertando…");
  try {
    const datos = {
      codigo: document.getElementById("input-codigo").value.trim(),
      origen: document.getElementById("input-origen").value.trim(),
      destino: document.getElementById("input-destino").value.trim(),
      horaSalida: document.getElementById("input-hora").value,
      precioBase: parseFloat(document.getElementById("input-precio").value),
      pasajeros: vueloEnEdicion
        ? vueloEnEdicion.pasajerosFinal
        : parseInt(document.getElementById("input-pasajeros").value),
      promocion: document.getElementById("input-promocion").checked,
      alerta: document.getElementById("input-alerta").checked,
      prioridad: parseInt(document.getElementById("input-prioridad").value),
    };

    if (!datos.codigo || !datos.origen || !datos.destino) {
      mostrarToast(
        "Completa los campos obligatorios: código, origen y destino.",
        "warning",
      );
      return;
    }
    if (datos.origen === datos.destino) {
      mostrarToast(
        "El origen y el destino no pueden ser la misma ciudad.",
        "warning",
      );
      return;
    }

    let respuesta;

    if (vueloEnEdicion) {
      // MODO EDICIÓN
      respuesta = await updateFlight(datos.codigo, datos);
      arbolActual = respuesta.data;
      await actualizarInterfaz();
      cancelarEdicion();
      mostrarToast(
        `Vuelo ${datos.codigo} actualizado correctamente.`,
        "success",
      );
    } else {
      // MODO INSERCIÓN
      respuesta = await insertFlight(datos);
      arbolActual = respuesta.data;
      await actualizarInterfaz();
      limpiarFormulario();
      mostrarToast(`Vuelo ${datos.codigo} insertado correctamente.`, "success");
    }
  } catch (err) {
    mostrarToast(`Error: ${err.message}`, "error");
  } finally {
    setLoading(btn, false, vueloEnEdicion ? "Guardar Cambios" : "Insertar");
  }
}

function limpiarFormulario() {
  document.getElementById("form-insert").reset();
  if (vueloEnEdicion) {
    cancelarEdicion();
  }
}

// ════════════════════════════════════════════════════════════
// EDITAR VUELO
// ════════════════════════════════════════════════════════════

async function manejarCargarVuelo() {
  const codigo = document.getElementById("input-edit-codigo").value.trim();

  if (!codigo) {
    mostrarToast("Ingresa el código del vuelo a editar.", "warning");
    return;
  }

  try {
    const respuesta = await searchFlight(codigo);
    const vuelo = respuesta.data;

    // Guardar referencia al vuelo en edición
    vueloEnEdicion = vuelo;

    // Cargar datos en el formulario
    document.getElementById("input-codigo").value = vuelo.codigo;
    document.getElementById("input-origen").value = vuelo.origen;
    document.getElementById("input-destino").value = vuelo.destino;
    document.getElementById("input-hora").value = vuelo.horaSalida;
    document.getElementById("input-precio").value = vuelo.precioBase;
    document.getElementById("input-prioridad").value = vuelo.prioridad;
    document.getElementById("input-promocion").checked = vuelo.promocion;
    document.getElementById("input-alerta").checked = vuelo.alerta;

    // NUEVO: Guardar pasajeros originales y mostrar interfaz mejorada
    vueloEnEdicion.pasajerosOriginales = vuelo.pasajeros;
    mostrarInterfazPasajeros(vuelo.pasajeros);

    // Deshabilitar campos que no pueden cambiar
    document.getElementById("input-codigo").disabled = true;
    document.getElementById("input-origen").disabled = true;
    document.getElementById("input-destino").disabled = true;

    // Habilitar solo campos editables
    document.getElementById("input-hora").disabled = false;
    document.getElementById("input-precio").disabled = false;
    document.getElementById("input-prioridad").disabled = false;
    document.getElementById("input-promocion").disabled = false;
    document.getElementById("input-alerta").disabled = false;

    // Cambiar botón de formulario
    const btnSubmit = document
      .getElementById("form-insert")
      .querySelector("button[type=submit]");
    btnSubmit.textContent = "Guardar Cambios";
    btnSubmit.dataset.textoOriginal = "Guardar Cambios";
    btnSubmit.classList.remove("btn-success");
    btnSubmit.classList.add("btn-primary");

    // Mostrar indicador de edición
    document.getElementById("edit-mode-indicator").style.display = "block";
    document.getElementById("btn-cancel-edit").style.display = "block";
    document.getElementById("input-edit-codigo").disabled = true;
    document.getElementById("btn-load-flight").disabled = true;

    mostrarToast(`Vuelo ${codigo} cargado en modo edición.`, "info");
  } catch (err) {
    mostrarToast(`Error: ${err.message}`, "error");
  }
}

function mostrarInterfazPasajeros(pasajerosActuales) {
  const container = document.getElementById("pasajeros-container");

  container.innerHTML = `
    <div style="background: #f0f4ff; padding: 0.8rem; border-radius: 4px; border-left: 3px solid #3b82f6;">
      <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #666;"><strong>Pasajeros Actuales:</strong> ${pasajerosActuales}</p>
      
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
        Total será: <strong>${pasajerosActuales}</strong> pasajeros
      </p>
    </div>
  `;

  // Event listeners para actualizar el preview
  const radios = container.querySelectorAll(
    'input[name="operacion-pasajeros"]',
  );
  const inputCambio = document.getElementById("input-pasajeros-cambio");

  const actualizarPreview = () => {
    const operacion = container.querySelector(
      'input[name="operacion-pasajeros"]:checked',
    ).value;
    const cantidad = parseInt(inputCambio.value) || 0;

    let total;
    if (operacion === "agregar") {
      total = pasajerosActuales + cantidad;
    } else {
      total = Math.max(0, pasajerosActuales - cantidad);
    }

    document.getElementById("pasajeros-preview").innerHTML =
      `Total será: <strong>${total}</strong> pasajeros`;

    // Guardar el total calculado
    vueloEnEdicion.pasajerosFinal = total;
  };

  radios.forEach((radio) =>
    radio.addEventListener("change", actualizarPreview),
  );
  inputCambio.addEventListener("input", actualizarPreview);
}

function cancelarEdicion(esExplicito = false) {
  vueloEnEdicion = null;

  // Restaurar campo de pasajeros normal
  const container = document.getElementById("pasajeros-container");
  container.innerHTML = `<input type="number" id="input-pasajeros" placeholder="Pasajeros" min="0" required>`;

  // Re-habilitar campos
  document.getElementById("input-codigo").disabled = false;
  document.getElementById("input-origen").disabled = false;
  document.getElementById("input-destino").disabled = false;

  // Restaurar botón
  const btnSubmit = document
    .getElementById("form-insert")
    .querySelector("button[type=submit]");
  btnSubmit.textContent = "Insertar";
  btnSubmit.dataset.textoOriginal = "Insertar";
  btnSubmit.classList.add("btn-success");
  btnSubmit.classList.remove("btn-primary");

  // Ocultar indicador
  document.getElementById("edit-mode-indicator").style.display = "none";
  document.getElementById("btn-cancel-edit").style.display = "none";
  document.getElementById("input-edit-codigo").disabled = false;
  document.getElementById("btn-load-flight").disabled = false;
  document.getElementById("input-edit-codigo").value = "";

  limpiarFormulario();
  if (esExplicito) {
    mostrarToast("Edición cancelada.", "info");
  }
}

// ════════════════════════════════════════════════════════════
// ELIMINACIÓN / CANCELACIÓN
// ════════════════════════════════════════════════════════════

/**
 * Elimina únicamente el nodo indicado.
 * Sus hijos se reorganizan mediante el predecesor inorden y el árbol se rebalancea.
 *
 * NOTA: con el bug de _delete_with_two_children corregido en el backend,
 * esta operación ahora funciona correctamente para TODOS los casos
 * (hoja, un hijo, dos hijos).
 */
async function manejarEliminacion() {
  const codigo = document.getElementById("input-delete-codigo").value.trim();
  if (!codigo) {
    mostrarToast("Ingresa el código del vuelo a eliminar.", "warning");
    return;
  }
  if (!confirm(`¿Eliminar el vuelo ${codigo}? (solo este nodo)`)) return;

  const btn = document.getElementById("btn-delete");
  setLoading(btn, true, "Eliminando…");
  try {
    const respuesta = await deleteFlight(codigo);
    arbolActual = respuesta.data;
    await actualizarInterfaz();
    document.getElementById("input-delete-codigo").value = "";
    mostrarToast(`Vuelo ${codigo} eliminado y árbol rebalanceado.`, "success");
  } catch (err) {
    mostrarToast(`Error: ${err.message}`, "error");
  } finally {
    setLoading(btn, false, "Eliminar Nodo");
  }
}

/**
 * Cancela el vuelo indicado Y toda su subrama (descendientes).
 * Esta operación es más agresiva que la eliminación simple.
 */
async function manejarCancelacion() {
  const codigo = document.getElementById("input-delete-codigo").value.trim();
  if (!codigo) {
    mostrarToast("Ingresa el código del vuelo a cancelar.", "warning");
    return;
  }
  if (!confirm(`¿Cancelar ${codigo} y TODOS sus descendientes?`)) return;

  const btn = document.getElementById("btn-cancel");
  setLoading(btn, true, "Cancelando…");
  try {
    const respuesta = await cancelSubtree(codigo);
    arbolActual = respuesta.data;
    await actualizarInterfaz();
    document.getElementById("input-delete-codigo").value = "";
    mostrarToast(
      `Vuelo ${codigo} y todos sus descendientes han sido cancelados.`,
      "success",
    );
  } catch (err) {
    mostrarToast(`Error: ${err.message}`, "error");
  } finally {
    setLoading(btn, false, "Cancelar Vuelo + Descendientes");
  }
}

/**
 * Elimina el vuelo de menor rentabilidad y toda su subrama.
 * Fórmula: pasajeros × precioFinal − promoción + penalización.
 * Desempate: mayor profundidad → código más grande.
 */
async function manejarEliminarMenorRentabilidad() {
  if (!confirm("¿Eliminar el vuelo de menor rentabilidad y toda su subrama?"))
    return;

  const btn = document.getElementById("btn-delete-rental-node");
  setLoading(btn, true, "Calculando…");
  try {
    const respuesta = await deleteLowestProfit();
    arbolActual = respuesta.tree;
    await actualizarInterfaz();
    mostrarToast(respuesta.message, "success");
  } catch (err) {
    mostrarToast(`Error: ${err.message}`, "error");
  } finally {
    setLoading(btn, false, "Eliminar Nodo Menor Rentabilidad");
  }
}

/**
 * Elimina todo el árbol.
 */
async function manejarEliminarTodo() {
  if (!confirm("¿Eliminar todo el árbol?")) return;

  const btn = document.getElementById("btn-delete-all");
  setLoading(btn, true, "Eliminando…");
  try {
    const respuesta = await resetTree();
    arbolActual = respuesta.tree;
    await actualizarInterfaz();
    mostrarToast(respuesta.message, "success");
  } catch (err) {
    mostrarToast(`Error: ${err.message}`, "error");
  } finally {
    setLoading(btn, false, "Eliminar Todo El Árbol");
  }
}
// ════════════════════════════════════════════════════════════
// DESHACER / EXPORTAR
// ════════════════════════════════════════════════════════════

async function manejarDeshacer() {
  const btn = document.getElementById("btn-undo");
  setLoading(btn, true, "Deshaciendo…");
  try {
    const respuesta = await undoAction();
    arbolActual = respuesta.data;
    await actualizarInterfaz();
    mostrarToast("Acción deshecha correctamente.", "success");
  } catch (err) {
    mostrarToast(`Error al deshacer: ${err.message}`, "error");
  } finally {
    setLoading(btn, false, "Deshacer (Ctrl+Z)");
  }
}

async function manejarExportar() {
  try {
    const respuesta = await exportTree();
    const json = JSON.stringify(respuesta.data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), {
      href: url,
      download: `skybalance-${new Date().toISOString().split("T")[0]}.json`,
    }).click();
    URL.revokeObjectURL(url);
    mostrarToast("Árbol exportado correctamente.", "success");
  } catch (err) {
    mostrarToast(`Error al exportar: ${err.message}`, "error");
  }
}

// ════════════════════════════════════════════════════════════
// MODO ESTRÉS
// ════════════════════════════════════════════════════════════

async function manejarModoEstres(e) {
  const btnSaveVersion = document.getElementById("btn-save-version");
  const activando = e.target.checked;
  const btnRebalancear = document.getElementById("btn-rebalance");
  const btnVerificar = document.getElementById("btn-verify-avl");
  const indicador = document.getElementById("mode-indicator");

  if (activando) {
    try {
      await activateStress();
      modoEstresActivo = true;
      btnRebalancear.disabled = false;
      btnVerificar.disabled = false;
      btnSaveVersion.disabled = true;
      indicador.textContent = "⚠ Modo Estrés";
      indicador.classList.add("stress-mode");
      await cargarArbol();
      mostrarToast(
        "Modo estrés activado. El balanceo automático está deshabilitado.",
        "warning",
      );
    } catch (err) {
      e.target.checked = false;
      mostrarToast(`Error: ${err.message}`, "error");
    }
  } else {
    try {
      // respuesta.data = { stressMode: false, rebalance: {...}, tree: <arbolJSON> }
      const respuesta = await deactivateStress();
      modoEstresActivo = false;
      arbolActual = respuesta.data.tree;
      btnRebalancear.disabled = true;
      btnVerificar.disabled = true;
      btnSaveVersion.disabled = false;
      indicador.textContent = "Modo Normal";
      indicador.classList.remove("stress-mode");
      console.log(respuesta);
      await actualizarInterfaz();
      mostrarToast(
        "Modo estrés desactivado. Árbol rebalanceado automáticamente.",
        "success",
      );
    } catch (err) {
      e.target.checked = true;
      mostrarToast(`Error: ${err.message}`, "error");
    }
  }
}

async function manejarRebalanceo() {
  if (!confirm("¿Rebalancear todo el árbol ahora?")) return;
  const btn = document.getElementById("btn-rebalance");
  setLoading(btn, true, "Rebalanceando…");
  try {
    const respuesta = await rebalanceStress();
    const { nodes, rotations } = respuesta.data;
    const totalRot =
      (rotations.LL || 0) +
      (rotations.RR || 0) +
      (rotations.LR || 0) +
      (rotations.RL || 0);
    mostrarToast(
      `Rebalanceo completado. Nodos: ${nodes} | Rotaciones: ${totalRot}`,
      "success",
    );
    await cargarArbol();
  } catch (err) {
    mostrarToast(`Error: ${err.message}`, "error");
  } finally {
    setLoading(btn, false, "Rebalancear Todo");
  }
}

/**
 * Verifica las propiedades AVL en todo el árbol (solo en modo estrés)
 * y muestra un modal con el reporte de nodos inconsistentes.
 */
async function manejarAuditoriaAVL() {
  try {
    const respuesta = await auditAVL();
    mostrarModalAuditoria(respuesta);
  } catch (err) {
    mostrarToast(`Error en auditoría: ${err.message}`, "error");
  }
}

function mostrarModalAuditoria(respuesta) {
  document.getElementById("modal-auditoria")?.remove();
  const inconsistentes = respuesta.inconsistentNodes || [];
  const esValido = inconsistentes.length === 0;

  const fondo = document.createElement("div");
  fondo.id = "modal-auditoria";
  fondo.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.5);
    z-index:2000;display:flex;align-items:center;justify-content:center;
  `;

  fondo.innerHTML = `
    <div style="background:#fff;border-radius:12px;padding:1.5rem;
      width:480px;max-width:95vw;box-shadow:0 16px 48px rgba(0,0,0,.28);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h2 style="margin:0;font-size:1.1rem;font-weight:700;"> Auditoría AVL</h2>
        <button id="btn-cerrar-auditoria" style="border:none;background:#f3f4f6;border-radius:6px;padding:.4rem .8rem;cursor:pointer;font-weight:600;">✕</button>
      </div>
      <div style="padding:.8rem;border-radius:8px;margin-bottom:1rem;
        background:${esValido ? "#f0fdf4" : "#fff1f2"};
        border-left:4px solid ${esValido ? "#22c55e" : "#ef4444"};">
        <strong>${
          esValido
            ? " El árbol cumple la propiedad AVL en todos sus nodos. Nodos consistentes ( |BF| ∈ { -1, 0, 1 } )"
            : " Se encontraron nodos que violan la propiedad AVL."
        }</strong>
      </div>
      ${
        inconsistentes.length > 0
          ? `
        <p style="font-size:.88rem;margin-bottom:.5rem;font-weight:600;">Nodos inconsistentes ( |BF| ∉ { -1, 0, 1 } ):</p>
        <ul style="margin:0;padding-left:1.2rem;font-size:.85rem;color:#6b7280;">
          ${inconsistentes.map((n) => `<li>${n}</li>`).join("")}
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

  document.body.appendChild(fondo);
  const cerrar = () => fondo.remove();
  document
    .getElementById("btn-cerrar-auditoria")
    .addEventListener("click", cerrar);
  document
    .getElementById("btn-aceptar-auditoria")
    .addEventListener("click", cerrar);
  fondo.addEventListener("click", (e) => {
    if (e.target === fondo) cerrar();
  });
}

// ════════════════════════════════════════════════════════════
// RECORRIDOS
// ════════════════════════════════════════════════════════════

/**
 * Obtiene los recorridos precalculados del backend y los muestra en pantalla.
 * Los algoritmos InOrder, PreOrder, PostOrder y BFS están implementados en
 * AvlTree.py — no se duplica la lógica aquí.
 */
async function manejarRecorrido(tipo) {
  try {
    const respuesta = await getMetrics();
    const recorridos = respuesta.data.recorridos;
    const lista = recorridos?.[tipo];

    if (!lista || lista.length === 0) {
      mostrarToast("El árbol está vacío.", "warning");
      return;
    }

    // Cada elemento de la lista es un objeto Flight; extraemos el idFlight
    const codigos = lista.map((f) =>
      typeof f === "object" ? (f.idFlight ?? f.codigo) : f,
    );
    document.getElementById("traversal-result").innerHTML =
      `<strong>${tipo.toUpperCase()}:</strong> ${codigos.join(" → ")}`;
  } catch (err) {
    mostrarToast(`Error al obtener el recorrido: ${err.message}`, "error");
  }
}

// ════════════════════════════════════════════════════════════
// BÚSQUEDA DE VUELOS
// ════════════════════════════════════════════════════════════

async function manejarBusquedaVuelo() {
  const codigo = document.getElementById("input-search-codigo").value.trim();
  if (!codigo) {
    mostrarToast("Ingresa un código de vuelo.", "warning");
    return;
  }

  const resultado = document.getElementById("flight-info-result");
  const notFound = document.getElementById("flight-info-notfound");
  resultado.classList.add("hidden");
  notFound.classList.add("hidden");

  try {
    const respuesta = await searchFlight(codigo);
    const f = respuesta.data;

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

    // Badges de estado
    let badges = "";
    if (f.promocion) badges += `<span class="fi-badge promo">PROMO</span>`;
    if (f.alerta) badges += `<span class="fi-badge alerta">ALERTA</span>`;
    if (f.esCritico) badges += `<span class="fi-badge critico">CRÍTICO</span>`;
    document.getElementById("fi-badges").innerHTML = badges;

    resultado.classList.remove("hidden");
  } catch {
    notFound.classList.remove("hidden");
  }
}

// ════════════════════════════════════════════════════════════
// MÉTRICAS
// ════════════════════════════════════════════════════════════

/**
 * Actualiza el panel de métricas con los datos del backend.
 *
 * Estructura de la respuesta:
 *   { altura, rotaciones:{LL,RR,LR,RL}, cancelacionesMasivas, hojas, recorridos }
 *
 * Las rotaciones se muestran como totales acumulados desde que se cargó el árbol.
 * Al cargar un árbol nuevo (createTree) el backend crea un AvlTree() fresco,
 * por lo que los contadores se reinician automáticamente.
 */
async function actualizarMetricas() {
  try {
    const respuesta = await getMetrics();
    const m = respuesta.data;
    const rot = m.rotaciones || {};
    const totalRotaciones =
      (rot.LL || 0) + (rot.RR || 0) + (rot.LR || 0) + (rot.RL || 0);

    document.getElementById("metric-altura").textContent = m.altura ?? "-";
    document.getElementById("metric-nodos").textContent =
      contarNodos(arbolActual);
    document.getElementById("metric-hojas").textContent = m.hojas ?? "0";
    document.getElementById("metric-rotaciones").textContent = totalRotaciones;
    document.getElementById("metric-ll").textContent = rot.LL ?? "0";
    document.getElementById("metric-rr").textContent = rot.RR ?? "0";
    document.getElementById("metric-lr").textContent = rot.LR ?? "0";
    document.getElementById("metric-rl").textContent = rot.RL ?? "0";
  } catch {
    // Las métricas son secundarias; un fallo no debe romper la UI
  }
}

/** Cuenta el número total de nodos del árbol local. */
function contarNodos(nodo) {
  if (!nodo) return 0;
  return 1 + contarNodos(nodo.izquierdo) + contarNodos(nodo.derecho);
}

function limpiarMetricas() {
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
// PROFUNDIDAD CRÍTICA
// ════════════════════════════════════════════════════════════

async function manejarActualizarProfundidad() {
  const profundidad = parseInt(
    document.getElementById("input-critical-depth").value,
  );
  if (isNaN(profundidad) || profundidad < 0) {
    mostrarToast(
      "Ingresa una profundidad válida (número entero ≥ 0).",
      "warning",
    );
    return;
  }

  try {
    const respuesta = await setDepthLimit(profundidad);
    arbolActual = respuesta.tree;
    await actualizarInterfaz();
    mostrarToast(
      `Profundidad crítica actualizada a ${profundidad}.`,
      "success",
    );
  } catch (err) {
    mostrarToast(`Error: ${err.message}`, "error");
  }
}

// ════════════════════════════════════════════════════════════
// VERSIONES
// ════════════════════════════════════════════════════════════

async function manejarGuardarVersion() {
  const nombre = document.getElementById("input-version-name").value.trim();
  if (!nombre) {
    mostrarToast("Escribe un nombre para la versión.", "warning");
    return;
  }

  try {
    await saveVersion(nombre);
    document.getElementById("input-version-name").value = "";
    await actualizarListaVersiones();
    mostrarToast(`Versión "${nombre}" guardada correctamente.`, "success");
  } catch (err) {
    mostrarToast(`Error al guardar versión: ${err.message}`, "error");
  }
}

async function actualizarListaVersiones() {
  try {
    const respuesta = await getVersions();
    const lista = respuesta.data || [];
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
      elemento
        .querySelector("button")
        .addEventListener("click", () => manejarCargarVersion(nombre));
      contenedor.appendChild(elemento);
    });
  } catch {
    // No es crítico
  }
}

async function manejarCargarVersion(nombre) {
  if (!confirm(`¿Restaurar la versión "${nombre}"?`)) return;
  try {
    const respuesta = await loadVersion(nombre);
    arbolActual = respuesta.data;
    await actualizarInterfaz();
    mostrarToast(`Versión "${nombre}" restaurada.`, "success");
  } catch (err) {
    mostrarToast(`Error al cargar versión: ${err.message}`, "error");
  }
}

// ════════════════════════════════════════════════════════════
// UTILIDADES
// ════════════════════════════════════════════════════════════

/**
 * Activa o desactiva el estado de carga en un botón.
 * Mientras está cargando, el botón muestra el texto de carga y queda deshabilitado
 * para evitar doble clic durante la operación asíncrona.
 *
 * @param {HTMLButtonElement} btn   - El botón a modificar.
 * @param {boolean}           activo - True para activar, False para restaurar.
 * @param {string}            texto  - Texto a mostrar mientras carga.
 */
function setLoading(btn, activo, texto) {
  if (!btn) return;
  if (activo) {
    btn.dataset.textoOriginal = btn.textContent;
    btn.textContent = texto;
    btn.disabled = true;
    btn.style.opacity = "0.7";
  } else {
    btn.textContent = btn.dataset.textoOriginal || texto;
    btn.disabled = false;
    btn.style.opacity = "";
  }
}

/**
 * Muestra una notificación tipo toast en la esquina superior derecha.
 * @param {string}   mensaje            - Texto a mostrar.
 * @param {'success'|'error'|'warning'|'info'} tipo - Tipo de notificación.
 * @param {number}   [duracion=3500]    - Milisegundos antes de desaparecer.
 */
function mostrarToast(mensaje, tipo = "info", duracion = 3500) {
  const iconos = { success: "✓", error: "✗", warning: "⚠", info: "ℹ" };
  const toast = document.createElement("div");
  toast.className = `sky-toast ${tipo}`;
  console.log("TOAST DEFINIDO");
  toast.innerHTML = `
    <span class="sky-toast-icon">${iconos[tipo] ?? "ℹ"}</span>
    <span class="sky-toast-message">${mensaje}</span>
    <button class="sky-toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  document.getElementById("toast-container").appendChild(toast);
  setTimeout(() => toast.remove(), duracion);
}

// ════════════════════════════════════════════════════════════
// COLA DE INSERCIONES (Requerimiento 3: Simulación de Concurrencia)
// ════════════════════════════════════════════════════════════

/**
 * Extrae datos del formulario y los retorna como objeto vuelo
 */
function obtenerDatosVueloDelFormulario() {
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
 * Maneja agregar un vuelo a la cola
 */
async function manejarEnqueueVuelo() {
  const vuelo = obtenerDatosVueloDelFormulario();

  // Validaciones básicas
  if (
    !vuelo.codigo ||
    !vuelo.origen ||
    !vuelo.destino ||
    !vuelo.pasajeros ||
    !vuelo.precioBase
  ) {
    mostrarToast("Completa todos los campos obligatorios", "warning");
    return;
  }
  if (vuelo.origen === vuelo.destino) {
    mostrarToast(
      "El origen y el destino no pueden ser la misma ciudad.",
      "warning",
    );
    return;
  }
  if (!vuelo.horaSalida) {
    mostrarToast("Debes ingresar la hora de salida.", "warning");
    return;
  }
  try {
    // Enviar al backend para agregarlo a la cola
    await enqueueFlight(vuelo);

    // Agregar localmente para seguimiento
    colaVuelos.push(vuelo);

    // Actualizar UI
    actualizarContadorCola();
    actualizarListaCola();
    limpiarFormulario();

    mostrarToast(`Vuelo "${vuelo.codigo}" agregado a la cola.`, "success");
  } catch (err) {
    mostrarToast(`Error al enqueue: ${err.message}`, "error");
  }
}

/**
 * Actualiza el contador visual de la cola
 */
function actualizarContadorCola() {
  const count = colaVuelos.length;
  const contador = document.getElementById("queue-counter");
  contador.textContent =
    count === 0
      ? "0 vuelos en cola"
      : `${count} vuelo${count === 1 ? "" : "s"} en cola`;

  // Habilitar/deshabilitar botones
  document.getElementById("btn-process-queue").disabled = count === 0;
  document.getElementById("btn-clear-queue").disabled = count === 0;
}

/**
 * Actualiza la lista visual de vuelos en la cola
 */
function actualizarListaCola() {
  const listContainer = document.getElementById("queue-list");

  if (colaVuelos.length === 0) {
    listContainer.innerHTML =
      '<p style="text-align: center; color: rgba(255,255,255,0.5); font-size: 0.9rem;">Vacío</p>';
    return;
  }

  listContainer.innerHTML = colaVuelos
    .map(
      (vuelo, idx) => `
    <div style="padding: 0.4rem 0.5rem; background: rgba(255,165,0,0.15); border-radius: 3px; margin-bottom: 0.4rem; font-size: 0.85rem; border-left: 3px solid #FFA500; display: flex; justify-content: space-between; align-items: center;">
      <span>
        <strong>#${idx + 1}:</strong> ${vuelo.codigo} (${vuelo.origen}→${vuelo.destino})
      </span>
      <button onclick="removerDelaCola(${idx})" style="background: #FF4444; color: white; border: none; border-radius: 3px; padding: 0.2rem 0.5rem; cursor: pointer; font-size: 0.8rem;">×</button>
    </div>
  `,
    )
    .join("");
}

/**
 * Remueve un vuelo específico de la cola
 */
function removerDelaCola(indice) {
  colaVuelos.splice(indice, 1);
  actualizarContadorCola();
  actualizarListaCola();
  mostrarToast("Vuelo removido de la cola.", "info");
}

/**
 * Limpia toda la cola
 */
function manejarLimpiarCola() {
  if (colaVuelos.length === 0) {
    mostrarToast("La cola ya está vacía.", "info");
    return;
  }

  if (!confirm(`¿Limpiar los ${colaVuelos.length} vuelos en la cola?`)) return;

  colaVuelos = [];
  actualizarContadorCola();
  actualizarListaCola();
  mostrarToast("Cola limpiada.", "success");
}

/**
 * Procesa la cola: envía al backend y visualiza pasos
 */
async function manejarProcesarCola() {
  if (colaVuelos.length === 0) {
    mostrarToast("La cola está vacía.", "warning");
    return;
  }

  procesandoCola = true;
  detenerProceso = false;

  try {
    // Mostrar panel de procesamiento
    document.getElementById("processing-panel").style.display = "block";
    document.getElementById("btn-process-queue").disabled = true;
    document.getElementById("btn-clear-queue").disabled = true;
    document.getElementById("btn-enqueue").disabled = true;

    // Llamar al endpoint para procesar la cola
    const respuesta = await processQueue();

    if (!respuesta.steps) {
      throw new Error("No se recibieron pasos del servidor");
    }

    // Visualizar los pasos
    await visualizarPasosConcurrencia(respuesta.steps);

    mostrarToast("Procesamiento de cola completado.", "success");
  } catch (err) {
    if (!detenerProceso) {
      mostrarToast(`Error al procesar cola: ${err.message}`, "error");
    }
  } finally {
    procesandoCola = false;
    detenerProceso = false;
    colaVuelos = [];

    // Ocultar panel
    document.getElementById("processing-panel").style.display = "none";
    document.getElementById("btn-process-queue").disabled = true;
    document.getElementById("btn-clear-queue").disabled = true;
    document.getElementById("btn-enqueue").disabled = false;

    actualizarContadorCola();
    actualizarListaCola();

    // Recargar árbol después del procesamiento
    await cargarArbol();
  }
}

/**
 * Detiene el procesamiento de la cola
 */
function manejarDetenerProcesamiento() {
  detenerProceso = true;
  mostrarToast("Procesamiento cancelado por el usuario.", "warning");
}

/**
 * Visualiza paso a paso la inserción concurrente
 * @param {Array} steps - Array de pasos del servidor
 */
async function visualizarPasosConcurrencia(steps) {
  for (let i = 0; i < steps.length && !detenerProceso; i++) {
    const step = steps[i];

    // Actualizar información en el panel
    const stepInfo = document.getElementById("step-info");
    const stepMetrics = document.getElementById("step-metrics");

    if (step.flight) {
      stepInfo.textContent = `Paso ${i + 1}/${steps.length}: Insertando ${step.flight.idFlight}`;
    } else {
      stepInfo.textContent = `Paso ${i + 1}/${steps.length}`;
    }

    // Mostrar métricas del paso
    if (step.metrics) {
      const metricasTexto = [
        `Altura: ${step.metrics.altura ?? "-"}`,
        `Rotaciones: ${step.metrics.rotaciones ?? 0}`,
        `Balance: ${step.metrics.desbalanceDetectado ? "⚠ CRÍTICO" : "✓ OK"}`,
      ].join(" | ");
      stepMetrics.textContent = metricasTexto;
    }

    // Actualizar el árbol en el canvas si está disponible
    if (step.tree) {
      arbolActual = step.tree;

      // Marcar nodos críticos en rojo si aplica
      if (step.metrics && step.metrics.desbalanceDetectado) {
        visualizador.marcarConflictos(step.tree);
      } else {
        visualizador.draw(step.tree);
      }
    }

    // Esperar antes de mostrar el siguiente paso
    if (i < steps.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5 segundos
    }
  }

  // Resumen final
  const conflictos = steps.filter(
    (s) => s.metrics && s.metrics.desbalanceDetectado,
  ).length;
  mostrarToast(
    `Procesados: ${steps.length} pasos | Conflictos detectados: ${conflictos}`,
    conflictos > 0 ? "warning" : "success",
    5000,
  );
}

/**
 * carga las ciudades con aeropuertos y puebla los selectores
 */
async function cargarCiudades() {
  try {
    const respuesta = await getCiudades();
    const ciudades = respuesta.data.ciudades_con_aeropuerto_colombia;
    poblarSelectCiudades(ciudades);
  } catch (error) {
    console.error("Error al obtener las ciudades:", error);
  }
}

/**
 * Puebla los selectores de origen y destino con las ciudades disponibles
 */
function poblarSelectCiudades(ciudades) {
  const selectOrigen = document.getElementById("input-origen");
  const selectDestino = document.getElementById("input-destino");

  if (!selectOrigen || !selectDestino) return;

  // Limpiar opciones existentes (mantener la opción disabled select)
  selectOrigen.innerHTML =
    '<option value="" disabled selected>Selecciona Origen</option>';
  selectDestino.innerHTML =
    '<option value="" disabled selected>Selecciona Destino</option>';

  // Añadir las ciudades como opciones
  ciudades.forEach((ciudad) => {
    const optionOrigen = document.createElement("option");
    optionOrigen.value = ciudad;
    optionOrigen.textContent = ciudad;
    selectOrigen.appendChild(optionOrigen);

    const optionDestino = document.createElement("option");
    optionDestino.value = ciudad;
    optionDestino.textContent = ciudad;
    selectDestino.appendChild(optionDestino);
  });
}
