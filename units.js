// Категории и базовые единицы для нормализации
// Длина -> базовая: meter; Масса -> kilogram; Температура -> celsius; Скорость -> mps
const UNITS = {
  length: {
    base: "m",
    map: {
      m: 1,
      meter: 1,
      meters: 1,
      metre: 1,
      cm: 0.01,
      centimeter: 0.01,
      centimeters: 0.01,
      mm: 0.001,
      kilometer: 1000,
      km: 1000,
      inch: 0.0254,
      in: 0.0254,
      "\"": 0.0254,
      foot: 0.3048,
      ft: 0.3048,
      "'": 0.3048,
      yard: 0.9144,
      yd: 0.9144,
      mile: 1609.344,
      mi: 1609.344
    }
  },
  mass: {
    base: "kg",
    map: {
      kg: 1,
      kilogram: 1,
      g: 0.001,
      gram: 0.001,
      mg: 0.000001,
      lb: 0.45359237,
      pound: 0.45359237,
      oz: 0.028349523125
    }
  },
  temperature: {
    base: "c",
    map: {
      c: 1, C:1, "°C":1, celsius:1,
      f: 1, F:1, "°F":1, fahrenheit:1,
      k: 1, K:1, kelvin:1
    }
  },
  speed: {
    base: "mps", // meters per second
    map: {
      "m/s": 1,
      mps: 1,
      "km/h": 1000/3600,
      "kmh": 1000/3600,
      "kmph": 1000/3600,
      "mph": 1609.344/3600,
      "ft/s": 0.3048,
      "fps": 0.3048
    }
  }
};

// Нормализации алиасов для вывода
const ALIAS = {
  m: "m", cm: "cm", mm: "mm", km: "km", in: "in", ft: "ft", yd: "yd", mi: "mi",
  kg: "kg", g: "g", mg: "mg", lb: "lb", oz: "oz",
  c: "C", f: "F", k: "K",
  "m/s": "m/s", "km/h": "km/h", "mph": "mph", "ft/s": "ft/s"
};

function whichCategory(unit) {
  const u = unit.toLowerCase();
  // Проверяем по картам
  if (UNITS.length.map[u] != null) return "length";
  if (UNITS.mass.map[u] != null) return "mass";
  if (UNITS.temperature.map[unit] != null || UNITS.temperature.map[u] != null) return "temperature";
  if (UNITS.speed.map[u] != null) return "speed";
  return null;
}

// Температура — особые формулы
function toCelsius(value, unit) {
  const u = unit.toLowerCase();
  if (u === "c" || u === "°c" || u === "celsius") return value;
  if (u === "f" || u === "°f" || u === "fahrenheit") return (value - 32) * (5/9);
  if (u === "k" || u === "kelvin") return value - 273.15;
  throw new Error("Unknown temperature unit: " + unit);
}
function fromCelsius(c, unit) {
  const u = unit.toLowerCase();
  if (u === "c" || u === "°c" || u === "celsius") return c;
  if (u === "f" || u === "°f" || u === "fahrenheit") return c * 9/5 + 32;
  if (u === "k" || u === "kelvin") return c + 273.15;
  throw new Error("Unknown temperature unit: " + unit);
}

function convertValue(value, from, to) {
  const catFrom = whichCategory(from);
  const catTo = whichCategory(to);
  if (!catFrom || !catTo || catFrom !== catTo) throw new Error("Несовместимые единицы");

  if (catFrom === "temperature") {
    const c = toCelsius(value, from);
    return fromCelsius(c, to);
  }
  // Прочие категории — переводим в базовую, потом из базовой в целевую
  if (catFrom === "length") {
    const base = value * UNITS.length.map[from.toLowerCase()];
    return base / UNITS.length.map[to.toLowerCase()];
  }
  if (catFrom === "mass") {
    const base = value * UNITS.mass.map[from.toLowerCase()];
    return base / UNITS.mass.map[to.toLowerCase()];
  }
  if (catFrom === "speed") {
    const base = value * UNITS.speed.map[from.toLowerCase()];
    return base / UNITS.speed.map[to.toLowerCase()];
  }
  throw new Error("Unknown category");
}

function normalizeUnit(u) {
  // Убираем лишние символы
  return u.replace(/\s+/g, "").toLowerCase();
}

window.UnitAPI = { convertValue, normalizeUnit, whichCategory, ALIAS };
