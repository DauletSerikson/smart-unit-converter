const form = document.getElementById("form");
const query = document.getElementById("query");
const result = document.getElementById("result");
const historyEl = document.getElementById("history");
const copyBtn = document.getElementById("copyLink");

// ===== История =====
const HISTORY_KEY = "suc_history_v1";
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}
function saveHistory(arr) { localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 10))); }
function addHistory(item) {
  const arr = loadHistory();
  if (!arr.includes(item)) arr.unshift(item);
  saveHistory(arr);
  renderHistory();
}
function renderHistory() {
  const arr = loadHistory();
  historyEl.innerHTML = "";
  arr.forEach(s => {
    const li = document.createElement("li");
    li.textContent = s;
    li.addEventListener("click", () => {
      query.value = s;
      handleConvert(s);
    });
    historyEl.appendChild(li);
  });
}

// ===== Подсказка в плейсхолдере при фокусе =====
const DEFAULT_PLACEHOLDER = "Введите запрос... (например, 5 ft 7 in to cm)";
const EXAMPLE_PLACEHOLDER = "Примеры: 5 ft 7 in to cm • 2.4 kg -> lb • 100 km/h в m/s • 32 F to C";
query.placeholder = DEFAULT_PLACEHOLDER;
query.addEventListener("focus", () => { query.placeholder = EXAMPLE_PLACEHOLDER; });
query.addEventListener("blur", () => { query.placeholder = DEFAULT_PLACEHOLDER; });

// ===== Парсер =====
const SEP = /\s*(?:->|to|в)\s*/i;

function parseInput(input) {
  const trimmed = input.trim();
  const parts = trimmed.split(SEP);
  if (parts.length !== 2) return null;

  const left = parts[0].trim();
  const targetUnitRaw = parts[1].trim();

  // токены вида: число + единица
  const tokens = [];
  const re = /(-?\d+(?:\.\d+)?)\s*([A-Za-z°\/"']+)/g;
  let m;
  while ((m = re.exec(left)) !== null) {
    tokens.push({ value: parseFloat(m[1]), unit: m[2] });
  }
  if (tokens.length === 0) return null;

  const toUnit = UnitAPI.normalizeUnit(targetUnitRaw);
  const catTo = UnitAPI.whichCategory(toUnit);
  if (!catTo) return null;

  return { tokens, toUnit, catTo };
}

function tryCompoundLength(tokens, toUnit) {
  const units = tokens.map(t => UnitAPI.normalizeUnit(t.unit));
  if (units.every(u => UnitAPI.whichCategory(u) === "length")) {
    let meters = 0;
    tokens.forEach(t => {
      const u = UnitAPI.normalizeUnit(t.unit);
      meters += UnitAPI.convertValue(t.value, u, "m");
    });
    const out = UnitAPI.convertValue(meters, "m", toUnit);
    return { value: out, category: "length" };
  }
  return null;
}

// ===== Округление по типу =====
function roundByCategory(n, category) {
  const abs = Math.abs(n);
  switch (category) {
    case "temperature": return Number(n.toFixed(2));               // °C/°F/K -> 2 знака
    case "length":      return Number(n.toFixed(abs >= 1 ? 3 : 4)); // 3–4 знака
    case "mass":        return Number(n.toFixed(abs >= 1 ? 3 : 4)); // близко к длине
    case "speed":       return Number(n.toFixed(abs >= 1 ? 3 : 4));
    default:            return Number(n.toFixed(abs >= 1 ? 4 : 6)); // fallback
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

// ===== Copy Link =====
function setUrlQuery(s) {
  const url = new URL(location.href);
  url.searchParams.set("q", s);
  history.replaceState(null, "", url.toString());
  return url.toString();
}

async function copyCurrentLink() {
  const str = query.value.trim();
  if (!str) return;
  const url = setUrlQuery(str);
  try {
    await navigator.clipboard.writeText(url);
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy Link"), 1200);
  } catch {
    // запасной вариант
    prompt("Скопируйте ссылку вручную:", url);
  }
}

// ===== UI helpers =====
function renderSuccess(value, unit, source) {
  const niceUnit = UnitAPI.ALIAS[unit] || unit;
  result.classList.remove("alert");
  result.innerHTML = `
    <div class="value">${value} ${niceUnit}</div>
    <div class="muted">Запрос: <code>${escapeHtml(source)}</code></div>
  `;
}

function showError(message, hint = "") {
  result.classList.add("alert");
  result.innerHTML = `
    <strong>Ошибка:</strong> ${escapeHtml(message)}
    ${hint ? `<div class="muted" style="margin-top:6px">${hint}</div>` : ""}
  `;
}

function clearError() {
  result.classList.remove("alert");
}

// ===== Основная логика конвертации =====
function handleConvert(inputStr) {
  const parsed = parseInput(inputStr);
  if (!parsed) {
    showError(
      "Не удалось распарсить запрос.",
      "Примеры: 5 ft 7 in to cm · 2.4 kg -> lb · 100 km/h в m/s · 32 F to C"
    );
    return;
  }
  const { tokens, toUnit, catTo } = parsed;

  // 1) Композитная длина (фут + дюйм и т.п.)
  if (tokens.length > 1) {
    const compound = tryCompoundLength(tokens, toUnit);
    if (compound) {
      const val = roundByCategory(compound.value, compound.category);
      clearError();
      renderSuccess(val, toUnit, inputStr);
      addHistory(inputStr);
      setUrlQuery(inputStr);
      return;
    }
  }

  // 2) Обычный случай: один токен
  if (tokens.length === 1) {
    const t = tokens[0];
    const from = UnitAPI.normalizeUnit(t.unit);
    const val = t.value;

    const catFrom = UnitAPI.whichCategory(from);
    if (!catFrom || catFrom !== catTo) {
      showError(
        `Несовместимые единицы: ${from} → ${toUnit}`,
        "Убедись, что обе единицы одной категории (например, длина→длина, масса→масса)."
      );
      return;
    }

    try {
      const out = UnitAPI.convertValue(val, from, toUnit);
      const v = roundByCategory(out, catTo);
      clearError();
      renderSuccess(v, toUnit, inputStr);
      addHistory(inputStr);
      setUrlQuery(inputStr);
    } catch (e) {
      showError("Ошибка конвертации: " + e.message);
    }
    return;
  }

  // 3) Несколько токенов, но не длина — пока не поддерживаем
  showError(
    "Сейчас поддержаны только композитные длины (например, 5 ft 7 in to cm) и одиночные значения.",
    "Скоро добавим композиты и для других категорий."
  );
}

// ===== Инициализация =====
function initFromUrl() {
  const url = new URL(location.href);
  const q = url.searchParams.get("q");
  if (q) {
    query.value = q;
    handleConvert(q);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const str = query.value.trim();
  if (!str) return;
  handleConvert(str);
});

copyBtn.addEventListener("click", copyCurrentLink);

renderHistory();
initFromUrl();
