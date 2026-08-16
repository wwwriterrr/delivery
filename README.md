# cdek-app

SPA оформления предзаказа книги с доставкой СДЭК. Собирается Vite и отдаётся
Django-шаблоном на `https://alterlit.ru`.

## Сборка и раздача

`npm run build` кладёт всё в `dist/`:

```
dist/
  index.html                     ← шаблон, его рендерит Django
  assets/books/preorder/         ← чанки, стили, шрифты, favicon
  preorder/[slug]/index.html     ← копия шаблона для маршрута предзаказа
```

URL и путь на диске совпадают один в один: файл
`dist/assets/books/preorder/index-abc.js` запрашивается как
`/assets/books/preorder/index-abc.js`. Это достигается тем, что `base`
оставлен равным `/`, а префикс задан в `build.assetsDir` — если поместить
префикс в `base`, физическая раскладка перестанет соответствовать URL.

Префикс задаётся один раз константой `ASSETS_DIR` в
[`vite.config.ts`](vite.config.ts). Ссылки в `index.html` на файлы из
`public/` используют плейсхолдер `%ASSETS_DIR%`, чтобы путь не дублировался.
Всё содержимое `public/` лежит в `public/assets/books/preorder/` — так оно
попадает под тот же префикс, что и собранные ассеты.

Django должен отдавать `dist/assets/books/preorder/` по адресу
`/assets/books/preorder/`.

## Запуск

```bash
npm install
```

Скопируйте `.env.example` в `.env` и заполните значения — dev-прокси в
`vite.config.ts` подставляет их в каждый запрос к `/api`, чтобы локальный фронт
ходил на боевой бэкенд от имени авторизованного пользователя:

| Переменная | Что это |
| --- | --- |
| `VITE_ALTERLIT_SESSION_ID` | кука `alterlitsessionid` |
| `VITE_CSRF_TOKEN` | кука `csrftoken`, уходит ещё и заголовком `X-CSRFTOKEN` |

В продакшене эти переменные не используются: страница рендерится внутри
Django-шаблона на том же origin, поэтому сессионная и CSRF куки уже стоят в
браузере и едут с каждым same-origin запросом сами.

```bash
npm run dev      # http://localhost:5173 (порт переопределяется через PORT)
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

## Маршруты

Таблица маршрутов лежит в [`src/routes/paths.ts`](src/routes/paths.ts) и является
единственным источником правды: её импортируют и роутер, и `vite.config.ts` —
чтобы SPA-фолбэк dev-сервера не разъехался с реальными путями.

| URL | Страница |
| --- | --- |
| `/preorder/:slug/` | оформление предзаказа |
| `/orders/` | список заказов |
| `/pay/success/` | возврат после успешной оплаты |
| `/pay/fail/` | возврат после неудачной оплаты |
| остальное | 404 |

Каждая страница — отдельный чанк (`React.lazy`). Leaflet и кластеризация
подгружаются только после выбора города.

## Структура

```
src/
  routes/     таблица маршрутов и конфигурация роутера
  pages/      компоненты уровня маршрута
  components/ переиспользуемый UI
  hooks/      useSession, useBookInfo, useDocumentTitle
  services/   http-обёртка с типизированными ошибками + клиент API
  utils/      телефон, картинки, скролл
```

Все обращения к бэкенду идут через `apiFetch` из
[`src/services/http.ts`](src/services/http.ts): он навешивает CSRF-заголовок и
credentials, а любую неудачу превращает в `ApiError`/`NetworkError`. Текст для
пользователя собирается через `errorMessage()` — сырые статусы и `err.message`
на экран не попадают.
