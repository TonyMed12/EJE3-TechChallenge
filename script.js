/* =========================
   Traxión – Predictive Maintenance Agent (Rules-based)
   ========================= */

function calcularRiesgo() {
  // 1) Leer valores (si están vacíos => null)
  const km = parseNumberOrNull(document.getElementById("km")?.value);
  const months = parseNumberOrNull(document.getElementById("months")?.value);

  const failures = document.getElementById("failures")?.value ?? "";
  const severity = document.getElementById("severity")?.value ?? "";
  const driving = document.getElementById("driving")?.value ?? "";

  // Opcionales (si los agregas al HTML)
  const route = document.getElementById("route")?.value ?? "";        // highway/mixed/urban
  const repeated = document.getElementById("repeated")?.value ?? "";  // yes/no

  let score = 0;
  const reasons = [];
  const assumptions = [];

  // 2) Reglas – Uso (KM)
  // (Si falta dato, sumamos +5 por manejo conservador y lo declaramos)
  if (km === null) {
    score += 5;
    assumptions.push("No se indicó KM desde último servicio; se asumió riesgo medio (+5).");
  } else if (km < 5000) {
    score += 5;
  } else if (km <= 10000) {
    score += 15;
    reasons.push("Kilometraje medio desde el último servicio.");
  } else {
    score += 25;
    reasons.push("Alto kilometraje sin mantenimiento reciente.");
  }

  // 3) Reglas – Tiempo sin servicio (meses)
  if (months === null) {
    score += 5;
    assumptions.push("No se indicó meses sin servicio; se asumió riesgo medio (+5).");
  } else if (months < 3) {
    score += 2;
  } else if (months <= 6) {
    score += 5;
    reasons.push("Tiempo prolongado sin servicio preventivo.");
  } else {
    score += 10;
    reasons.push("Exceso de tiempo sin servicio preventivo.");
  }

  // 4) Reglas – Fallas recientes (0 / 1-2 / 3+)
  // Tu select usa values: 0, 1, 3
  if (!failures) {
    score += 5;
    assumptions.push("No se indicó historial de fallas; se asumió riesgo medio (+5).");
  } else if (failures === "0") {
    score += 0;
  } else if (failures === "1") {
    score += 10;
    reasons.push("Registro de 1–2 fallas recientes.");
  } else if (failures === "3") {
    score += 20;
    reasons.push("Fallas recurrentes (3+ en periodo reciente).");
  }

  // 5) Reglas – Severidad (low/medium/high)
  if (!severity) {
    score += 5;
    assumptions.push("No se indicó severidad; se asumió riesgo medio (+5).");
  } else if (severity === "low") {
    score += 5;
  } else if (severity === "medium") {
    score += 10;
    reasons.push("Alertas de severidad media (sensores/eléctrico).");
  } else if (severity === "high") {
    score += 20;
    reasons.push("Alertas críticas (motor/transmisión/frenos).");
  }

  // 6) Reglas – Conducción (smooth/normal/aggressive)
  if (!driving) {
    score += 5;
    assumptions.push("No se indicó conducción; se asumió riesgo medio (+5).");
  } else if (driving === "smooth") {
    score += 2;
  } else if (driving === "normal") {
    score += 5;
  } else if (driving === "aggressive") {
    score += 10;
    reasons.push("Telemetría sugiere conducción agresiva (desgaste acelerado).");
  }

  // 7) Reglas – Ruta / operación (opcional)
  if (route) {
    if (route === "highway") score += 3;
    if (route === "mixed") score += 5;
    if (route === "urban") {
      score += 10;
      reasons.push("Operación urbana: mayor desgaste de frenos/suspensión.");
    }
  }

  // 8) Reglas – Fallas repetidas (opcional)
  if (repeated) {
    if (repeated === "yes") {
      score += 10;
      reasons.push("Historial de falla repetida: mayor probabilidad de reincidencia.");
    }
  }

  // 9) Normalizar score y decidir semáforo
  score = clamp(score, 0, 100);

  const decision = decide(score);
  paintTrafficLight(decision.level);
  renderScore(score);
  renderDecision(decision);
  renderList("reasonsList", reasons.length ? reasons : ["No se detectaron factores críticos con la información proporcionada."]);

  // Si no existe assumptionsList en HTML, lo creamos dentro de results-panel
  ensureAssumptionsCard();
  renderList("assumptionsList", assumptions.length ? assumptions : ["Sin supuestos adicionales."]);
}

/* ===== Helpers ===== */

function parseNumberOrNull(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function decide(score) {
  if (score < 40) {
    return {
      level: "green",
      label: "BAJO",
      pillClass: "pill pill--green",
      action: "Mantener unidad en operación y continuar monitoreo.",
      detail: "Riesgo bajo según variables actuales. Recomendada vigilancia y mantenimiento programado normal."
    };
  }
  if (score < 70) {
    return {
      level: "yellow",
      label: "MEDIO",
      pillClass: "pill pill--yellow",
      action: "Programar revisión preventiva (taller / diagnóstico).",
      detail: "Riesgo moderado: conviene inspección preventiva para evitar falla en ruta y costos correctivos."
    };
  }
  return {
    level: "red",
    label: "ALTO",
    pillClass: "pill pill--red",
    action: "Intervenir de inmediato: retirar y priorizar atención en taller.",
    detail: "Riesgo alto: alta probabilidad de falla. Priorizar disponibilidad y seguridad operativa."
  };
}

function paintTrafficLight(level) {
  const red = document.getElementById("light-red");
  const yellow = document.getElementById("light-yellow");
  const green = document.getElementById("light-green");
  if (!red || !yellow || !green) return;

  // reset
  [red, yellow, green].forEach(el => {
    el.classList.remove("active", "light--red", "light--yellow", "light--green");
  });

  if (level === "red") {
    red.classList.add("active", "light--red");
  } else if (level === "yellow") {
    yellow.classList.add("active", "light--yellow");
  } else {
    green.classList.add("active", "light--green");
  }
}

function renderScore(score) {
  const el = document.getElementById("scoreValue");
  if (el) el.textContent = String(score);
}

function renderDecision(decision) {
  const actionText = document.getElementById("actionText");
  const panel = document.querySelector(".results-panel");
  if (!panel) return;

  if (actionText) {
    actionText.innerHTML = `
      <span class="${decision.pillClass}">
        <span class="dot"></span> ${decision.label}
      </span>
      <span class="divider"></span>
      <strong>${escapeHtml(decision.action)}</strong><br/>
      <span style="color: rgba(255,255,255,0.75)">${escapeHtml(decision.detail)}</span>
    `;
  }
}

function renderList(listId, items) {
  const ul = document.getElementById(listId);
  if (!ul) return;
  ul.innerHTML = "";
  items.forEach(txt => {
    const li = document.createElement("li");
    li.textContent = txt;
    ul.appendChild(li);
  });
}

function ensureAssumptionsCard() {
  // Si ya existe, no hacemos nada
  if (document.getElementById("assumptionsList")) return;

  const resultsPanel = document.querySelector(".results-panel");
  if (!resultsPanel) return;

  // Insertar card debajo de reasons-card
  const reasonsCard = resultsPanel.querySelector(".reasons-card");
  const card = document.createElement("div");
  card.className = "reasons-card";
  card.innerHTML = `
    <h3>Supuestos / Datos incompletos:</h3>
    <ul id="assumptionsList" class="list">
      <li>Sin supuestos adicionales.</li>
    </ul>
  `;

  if (reasonsCard && reasonsCard.parentNode) {
    reasonsCard.parentNode.insertBefore(card, reasonsCard.nextSibling);
  } else {
    resultsPanel.appendChild(card);
  }
}

// Seguridad mínima para HTML
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
