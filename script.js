function calcularRiesgo() {
  const km = leerNumeroONulo(document.getElementById("km")?.value);
  const meses = leerNumeroONulo(document.getElementById("meses")?.value);

  const fallas = document.getElementById("fallas")?.value ?? "";
  const severidad = document.getElementById("severidad")?.value ?? "";
  const conduccion = document.getElementById("conduccion")?.value ?? "";
  const ruta = document.getElementById("ruta")?.value ?? "";
  const repetida = document.getElementById("repetida")?.value ?? "";

  let score = 0;
  const razones = [];
  const supuestos = [];

  if (km === null) {
    score += 5;
    supuestos.push("No se indicó KM desde el último servicio; se asumió riesgo medio (+5).");
  } else if (km < 5000) {
    score += 5;
  } else if (km <= 10000) {
    score += 15;
    razones.push("Kilometraje medio desde el último servicio.");
  } else {
    score += 25;
    razones.push("Alto kilometraje sin mantenimiento reciente.");
  }

  if (meses === null) {
    score += 5;
    supuestos.push("No se indicó meses sin servicio; se asumió riesgo medio (+5).");
  } else if (meses < 3) {
    score += 2;
  } else if (meses <= 6) {
    score += 5;
    razones.push("Tiempo prolongado sin servicio preventivo.");
  } else {
    score += 10;
    razones.push("Exceso de tiempo sin servicio preventivo.");
  }

  if (!fallas) {
    score += 5;
    supuestos.push("No se indicó historial de fallas; se asumió riesgo medio (+5).");
  } else if (fallas === "0") {
    score += 0;
  } else if (fallas === "1") {
    score += 10;
    razones.push("Registro de 1–2 fallas recientes.");
  } else if (fallas === "3") {
    score += 20;
    razones.push("Fallas recurrentes (3+ en periodo reciente).");
  }

  if (!severidad) {
    score += 5;
    supuestos.push("No se indicó severidad; se asumió riesgo medio (+5).");
  } else if (severidad === "baja") {
    score += 5;
  } else if (severidad === "media") {
    score += 10;
    razones.push("Alertas de severidad media (sensores/eléctrico).");
  } else if (severidad === "alta") {
    score += 20;
    razones.push("Alertas críticas (motor/transmisión/frenos).");
  }

  if (!conduccion) {
    score += 5;
    supuestos.push("No se indicó conducción; se asumió riesgo medio (+5).");
  } else if (conduccion === "suave") {
    score += 2;
  } else if (conduccion === "normal") {
    score += 5;
  } else if (conduccion === "agresiva") {
    score += 10;
    razones.push("Telemetría sugiere conducción agresiva (desgaste acelerado).");
  }

  if (ruta) {
    if (ruta === "carretera") score += 3;
    if (ruta === "mixta") score += 5;
    if (ruta === "urbana") {
      score += 10;
      razones.push("Operación urbana: mayor desgaste de frenos/suspensión.");
    }
  }

  if (repetida) {
    if (repetida === "si") {
      score += 10;
      razones.push("Historial de falla repetida: mayor probabilidad de reincidencia.");
    }
  }

  score = limitar(score, 0, 100);

  const decision = decidir(score);
  pintarSemaforo(decision.nivel);
  mostrarScore(score);
  mostrarDecision(decision);

  pintarLista("reasonsList", razones.length ? razones : ["No se detectaron factores críticos con la info proporcionada."]);

  asegurarTarjetaSupuestos();
  pintarLista("assumptionsList", supuestos.length ? supuestos : ["Sin supuestos adicionales."]);
}

function leerNumeroONulo(valor) {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  if (!texto) return null;
  const n = Number(texto);
  return Number.isFinite(n) ? n : null;
}

function limitar(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function decidir(score) {
  if (score < 40) {
    return {
      nivel: "verde",
      etiqueta: "BAJO",
      clasePill: "pill pill--green",
      accion: "Mantener unidad en operación y continuar monitoreo.",
      detalle: "Riesgo bajo con las variables actuales. Mantener plan normal y revisar de forma periódica."
    };
  }

  if (score < 70) {
    return {
      nivel: "amarillo",
      etiqueta: "MEDIO",
      clasePill: "pill pill--yellow",
      accion: "Programar revisión preventiva (taller / diagnóstico).",
      detalle: "Riesgo moderado: conviene checar antes de que se convierta en falla en ruta."
    };
  }

  return {
    nivel: "rojo",
    etiqueta: "ALTO",
    clasePill: "pill pill--red",
    accion: "Intervenir de inmediato: retirar y priorizar atención en taller.",
    detalle: "Riesgo alto: alta probabilidad de falla. Priorizar seguridad y disponibilidad."
  };
}

function pintarSemaforo(nivel) {
  const rojo = document.getElementById("light-red");
  const amarillo = document.getElementById("light-yellow");
  const verde = document.getElementById("light-green");
  if (!rojo || !amarillo || !verde) return;

  [rojo, amarillo, verde].forEach(el => {
    el.classList.remove("active", "light--red", "light--yellow", "light--green");
  });

  if (nivel === "rojo") rojo.classList.add("active", "light--red");
  else if (nivel === "amarillo") amarillo.classList.add("active", "light--yellow");
  else verde.classList.add("active", "light--green");
}

function mostrarScore(score) {
  const textoScore = document.getElementById("scoreValue");
  const circulo = document.getElementById("progressCircle");

  if (textoScore) textoScore.textContent = String(score);

  const grados = (score / 100) * 360;

  let color = "#22c55e";
  if (score >= 40) color = "#f5b301";
  if (score >= 70) color = "#ef4444";

  if (circulo) {
    circulo.style.background = `conic-gradient(${color} ${grados}deg, rgba(255,255,255,0.1) ${grados}deg)`;
  }
}

function mostrarDecision(decision) {
  const actionText = document.getElementById("actionText");
  if (!actionText) return;

  actionText.innerHTML = `
    <span class="${decision.clasePill}">
      <span class="dot"></span> ${escaparHtml(decision.etiqueta)}
    </span>
    <span class="divider"></span>
    <strong>${escaparHtml(decision.accion)}</strong><br/>
    <span style="color: rgba(255,255,255,0.75)">${escaparHtml(decision.detalle)}</span>
  `;
}

function pintarLista(idLista, items) {
  const ul = document.getElementById(idLista);
  if (!ul) return;

  ul.innerHTML = "";
  items.forEach(txt => {
    const li = document.createElement("li");
    li.textContent = txt;
    ul.appendChild(li);
  });
}

function asegurarTarjetaSupuestos() {
  if (document.getElementById("assumptionsList")) return;

  const panel = document.querySelector(".results-panel");
  if (!panel) return;

  const tarjetaRiesgos = panel.querySelector(".reasons-card");
  const card = document.createElement("div");
  card.className = "card reasons-card";
  card.style.marginTop = "12px";
  card.innerHTML = `
    <h3>Supuestos / Datos incompletos</h3>
    <ul id="assumptionsList" class="list">
      <li>Sin supuestos adicionales.</li>
    </ul>
  `;

  if (tarjetaRiesgos && tarjetaRiesgos.parentNode) {
    tarjetaRiesgos.parentNode.insertBefore(card, tarjetaRiesgos.nextSibling);
  } else {
    panel.appendChild(card);
  }
}

function escaparHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.addEventListener("DOMContentLoaded", () => {
  mostrarScore(0);
});
