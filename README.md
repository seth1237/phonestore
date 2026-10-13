# Rai Merchants

A local phone, accessories, and gadgets shop. The site and its Node API run on your machine. Shop copy, hours, products, reviews, offers, and the blog live in a local MySQL database.

The shop is at Njoguini Building, at the intersection of Ronald Ngala Street and Mfangano Street. It is open Monday to Friday, 9am to 6pm. The office lines are 0702119333 and 0717159863.

## What you need

- Node.js 20 or newer
- MySQL or MariaDB running on this computer

## Run it

```bash
cp .env.example .env
```

`.env.example` already has the local database name, user, and password. Create that database from a MySQL admin prompt:

```sql
CREATE DATABASE IF NOT EXISTS elevat10_rai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'elevat10_rai'@'localhost' IDENTIFIED BY 'Ned3agbzGfqM2JpPyQz7';
GRANT ALL PRIVILEGES ON elevat10_rai.* TO 'elevat10_rai'@'localhost';
FLUSH PRIVILEGES;
```

If the user already exists with a different password, set it again:

```sql
ALTER USER 'elevat10_rai'@'localhost' IDENTIFIED BY 'Ned3agbzGfqM2JpPyQz7';
FLUSH PRIVILEGES;
```

Install, load the catalog, and start the API and the site as separate processes:

```bash
npm install
npm run db:seed
npm run dev:api
npm run dev:web
```

The site calls the API at `NEXT_PUBLIC_API_URL`. The API allows the browser origins listed in `WEB_ORIGIN`. On Vercel, leave `NEXT_PUBLIC_API_URL` empty so the site serves the API on the same host. A localhost address is ignored there. Set `MONGODB_URI` in the Vercel project so reviews and product photos stay attached to the catalog. Shop hours and offers come from MySQL when `MYSQL_HOST` is a database the deployment can reach, and from the built-in shop profile otherwise.

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The API listens on `127.0.0.1:3001`. `.env` stays on your machine and is not committed.

## Scripts

- `npm run dev:api` — API only
- `npm run dev:web` — site only
- `npm run dev` — both, in one terminal, still separate processes
- `npm run db:seed` — load the shop profile and catalog into MySQL
- `npm run build` — production build of the site
- `npm run start:api` — production API
- `npm run start:web` — production site
- `npm run lint` — ESLint

## API

- `GET /api/site` — name, phones, hours, address, and copy
- `GET /api/categories` and `GET /api/products`
- `GET /api/search?q=`
- `GET /api/reviews` and `POST /api/reviews`
- `GET /api/offers` and `GET /api/posts`
- `POST /api/messages` — contact form
- `POST /api/orders` — checkout

The browser calls these through `/backend/...` on the site.
# phonestore
