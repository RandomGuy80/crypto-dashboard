# Crypto Dashboard

## Ссылки

| Сервис | URL |
| --- | --- |
| Фронтенд | https://unique-fenglisu-3aef9a.netlify.app |
| Бэкенд API | https://crypto-dashboard-hzgl.onrender.com |
| Health check | https://crypto-dashboard-hzgl.onrender.com/health |
| GitHub | https://github.com/RandomGuy80/crypto-dashboard |

## Техстек

| Слой | Технология |
| --- | --- |
| Бэкенд | Go 1.27, Fiber v2 |
| Фронтенд | React, TypeScript, Vite, TailwindCSS |
| База данных | PostgreSQL (Render free) |
| Кэш | Redis (Upstash free) |
| Хостинг бэкенд | Render (Docker, free tier) |
| Хостинг фронтенд | Netlify (free tier) |
| Цены монет | CoinPaprika API (бесплатно, без ключа) |
| Графики OHLCV | Binance REST API (бесплатно, без ключа) |

## Функционал

- Регистрация / вход (JWT, refresh токены)
- Дашборд с топ-20 монет: цена, изменение 24h, market cap, объём
- Спарклайны цен (мини-график 7д)
- Глобальная статистика рынка (total market cap, BTC/ETH dominance)
- Страница монеты: OHLCV-график (1д, 7д, 30д, 90д)
- Вишлист: добавить / удалить монету
- Портфолио: учёт позиций, P&L, donut-чарт распределения
- Ценовые алерты: условие above/below, уведомление через WebSocket
- Тикер цен в реальном времени (Binance WebSocket / REST polling)
- Дизайн: гласcморфизм, toast-уведомления, Landing page

## API эндпоинты

| Метод | Путь | Описание |
| --- | --- | --- |
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Вход |
| POST | /api/auth/refresh | Обновление токена |
| POST | /api/auth/logout | Выход |
| GET | /api/coins/?limit=20 | Топ монет |
| GET | /api/coins/:id/history?days=7 | OHLCV история |
| GET | /api/market/global | Глобальная статистика |
| GET | /api/watchlist | Вишлист (протект) |
| POST | /api/watchlist/:coin_id | Добавить в вишлист |
| DELETE | /api/watchlist/:coin_id | Удалить из вишлиста |
| GET | /api/portfolio | Портфолио с P&L (протект) |
| POST | /api/portfolio | Добавить позицию |
| PUT | /api/portfolio/:id | Обновить позицию |
| DELETE | /api/portfolio/:id | Удалить позицию |
| GET | /api/alerts | Алерты (протект) |
| POST | /api/alerts | Создать алерт |
| DELETE | /api/alerts/:id | Удалить алерт |
| GET | /api/ws | WebSocket (тикер цен) |
| GET | /health | Статус сервера |
