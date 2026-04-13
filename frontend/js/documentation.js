// Definition of manual routes
const manuals = {
  tecnico: {
    title: "Manual Técnico - SkyBalance AVL",
    url: "docs/manual_tecnico.pdf",
  },
  usuario: {
    title: "Manual de Usuario - SkyBalance AVL",
    url: "docs/manual_usuario.pdf",
  },
};

/**
 * Open a manual in a new browser tab.
 */
function openManual(manualKey) {
  const manual = manuals[manualKey];
  if (!manual) {
    alert("Manual no encontrado");
    return;
  }

  window.open(manual.url, "_blank");
}

/**
 * Event listeners for manual cards
 */
document.querySelectorAll(".manual-card").forEach((card) => {
  card.addEventListener("click", function (e) {
    if (e.target.closest(".btn-manual") || !e.target.closest("button")) {
      const manualKey = this.getAttribute("data-manual");
      openManual(manualKey);
    }
  });
});

document.querySelectorAll(".btn-manual").forEach((btn) => {
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    const manualKey = this.closest(".manual-card").getAttribute("data-manual");
    openManual(manualKey);
  });
});

/**
 * Back button
 */
document.getElementById("btn-back").addEventListener("click", function () {
  window.location.href = "index.html";
});
