# 🍪 Milk — уютный мини-мессенджер

Лоу-фай чат в молочных тонах. Два готовых аккаунта, реалтайм через WebSocket.

## Аккаунты

| Ник | Пароль | Плашка |
|---|---|---|
| vamped | lowyysx | **Main Dev** |
| eawie | teawave1 | — |

## Запуск локально

```bash
npm install
node server.js
```
Открыть http://localhost:3000

## Деплой на Render (если понадобится)

1. Залить папку в репозиторий на GitHub.
2. render.com → New → Web Service → выбрать репозиторий.
3. Build Command: `npm install` · Start Command: `node server.js`
4. Create. Через пару минут будет ссылка вида `milk-chat.onrender.com`.

Файл `render.yaml` уже лежит в проекте — Render подхватит настройки сам.

Важно: на бесплатном тарифе файловая система сбрасывается при перезапуске,
поэтому история чата (`data.json`) не переживёт передеплой. Для теста это нормально.

## Что внутри

- `server.js` — Express + WebSocket, авторизация, хранение истории
- `public/index.html` — весь интерфейс одним файлом
- `public/avatars/` — аватарки 1:1
