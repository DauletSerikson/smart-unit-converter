# Smart Unit Converter (NL)

Умный конвертер единиц, понимающий **свободный ввод**:  
`5 ft 7 in to cm`, `2.4 kg -> lb`, `100 km/h в m/s`, `32 F to C`.

**Демо:** https://DauletSerikson.github.io/smart-unit-converter/  
**Репозиторий:** https://github.com/DauletSerikson/smart-unit-converter

![screenshot](assets/screenshot.png)

---

## Фичи (v0)
- Поддержка категорий: **длина**, **масса**, **температура**, **скорость**.
- Составной ввод для длины (например, `5 ft 7 in to cm`).
- Красивые сообщения об ошибках (несовместимые единицы, неверный ввод).
- История последних запросов (**localStorage**).
- Шаринг настроек через URL (`?q=...`) и кнопка **Copy Link**.
- Умное округление:
  - температура — до 2 знаков;
  - длина/масса/скорость — 3–4 знака (зависит от величины).

---

## Быстрый старт

Открой страницу локально (через любой статический сервер).

### Вариант 1: VS Code + Live Server
1. Установи расширение **Live Server** (Ritwick Dey).
2. ПКМ по `index.html` → **Open with Live Server**.
