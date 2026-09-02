# Lovers of Selfcare — YClients API integration

`index.html` — публичная страница (колесо фортуны), не трогали.

`api/yclients/*` — серверные (Vercel Serverless Functions) прокси к YClients API.
Токен YClients хранится только в переменных окружения на сервере и никогда не
попадает в браузер — на его основе дальше можно строить дашборды.

## Настройка

1. В Vercel Project Settings → Environment Variables добавить:
   - `YCLIENTS_PARTNER_TOKEN` — партнёрский токен (YClients marketplace / dev panel → ваше приложение → API key).
   - `YCLIENTS_USER_TOKEN` — пользовательский токен. Нужен для чтения записей/клиентов
     (получается через `POST https://api.yclients.com/api/v1/auth` с логином/паролем салона).
   - `YCLIENTS_COMPANY_ID` — id филиала (виден в адресе страницы салона в админке YClients).
   - `DASHBOARD_API_KEY` — придуманный вами секрет, обязателен в заголовке `X-Api-Key` при каждом запросе к `/api/yclients/*`.
   - `DASHBOARD_ALLOWED_ORIGIN` — опционально, домен будущего дашборда, если он будет ходить в API прямо из браузера.
2. Задеплоить (`vercel deploy` или пуш в подключённую ветку).

Локально: скопировать `.env.example` в `.env` и заполнить, `vercel dev`.

## Эндпоинты

Все требуют заголовок `X-Api-Key: <DASHBOARD_API_KEY>`.

- `GET /api/yclients/ping` — проверка, что токен и company id рабочие.
- `GET /api/yclients/company` — данные компании/филиала.
- `GET /api/yclients/staff` — список сотрудников.
- `GET /api/yclients/services?category_id=&staff_id=` — список услуг.
- `GET /api/yclients/records?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&staff_id=&client_id=` — сырые записи/брони.
- `GET /api/yclients/clients?name=&phone=&page=&count=` — поиск клиентов.
- `GET /api/yclients/analytics/summary?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` — готовая агрегация для дашборда: сумма бронирований и выручки, разбивка по дням, по сотрудникам, по статусу визита.

### Проверка после деплоя

```bash
curl -H "X-Api-Key: $DASHBOARD_API_KEY" https://<ваш-домен>/api/yclients/ping
```

Если `connected: true` и вернулись данные компании — токен подключён верно.

## Важно

- `records`, `clients` и `analytics/summary` требуют `YCLIENTS_USER_TOKEN` —
  одного партнёрского токена YClients для чтения броней/клиентов недостаточно.
- Поля выручки в `analytics/summary` (`cost` / `services[].cost`) — по документированной
  структуре ответа YClients v1; после первого реального запроса стоит сверить их
  с тем, что реально приходит в вашем аккаунте (тарифы/интеграции могут отличаться),
  и поправить `recordRevenue()` в `api/yclients/analytics/summary.js` при расхождении.
- `DASHBOARD_API_KEY` защищает эндпоинты только на уровне общего секрета. Если
  дашборд будет открытым сайтом с фронтенд-запросами напрямую из браузера — ключ
  будет виден в коде страницы. Для продакшн-дашборда с реальными пользователями
  нужна полноценная авторизация (логин/пароль, сессии) поверх этого API, а не
  просто ключ в заголовке.
