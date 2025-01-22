<p align="center">
<img src="https://i.imgur.com/pRf4zZU.png" alt="dane.gg" />
</p>

<p align="center">
  <b>My personal portfolio/blog site + admin management (CMS) dashboard</b>
</p>

<p align="center">
<a href="https://dane.gg"><img src="https://img.shields.io/website-up-down-green-red/http/dane.gg.svg" alt="" /></a>
<a href="https://github.com/danexrc/dane.gg/blob/master/LICENSE"><img src="https://img.shields.io/github/license/danexrc/dane.gg.svg" alt="License" /></a>
</p>

<hr>

## 📂 Project Structure

- The files for the public website are located within the **``/public``** folder
- The admin panel react project is located within the **``/admin``** folder

*The full project structure is shown below:*
```
.
├── admin/             # React admin panel
├── config/            # Configuration for uptime status monitoring
├── controllers/       # API/webhook controllers
├── data/              # JSON files to store API data (latest tweet, online/offline status, services status)
├── middleware/        # Express auth/stats tracking middleware
├── public/            # Public website files
├── routes/            # Express routes
├── services/          # Express API service logic
└── server.js          # Express app entry point
```
<hr>

## 📦 Build

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Docker (Recommended)

### Environment Variables

Create a ``.env`` file in the root directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname //PostgreSQL datatbase connection string
LASTFM_USERNAME=your_lastfm_username //Last.fm username
LASTFM_API_KEY=your_lastfm_api_key //API key from last.fm development account
WEBHOOK_AUTH_TOKEN=your_webhook_token //Random token to use for authorization when posting to the webhook endpoints
DEFAULT_WEATHER=snow/rain //
JWT_SECRET=your_jwt_secret
```

## Docker (Recommended)
<details>
<summary><b>Development</b></summary>

1. Build the development image
```sh
docker compose build
```

2. Run the image in Docker
This will automatically create a PostgreSQL Docker image with the required schema
```sh
docker compose up
```

3. Create the initial admin user in the users database:
```sh
docker compose exec web node createInitialUser.js <username> <password>
```

This will start:
- Backend server on port 3000
- Admin dev server on port 3001

</details>

<details>
  <summary><b>Production</b></summary>

  1. Build the production image
```sh
docker compose -f docker-compose.prod.yml build
```

2. Run the production Docker image
```sh
docker compose -f docker-compose.prod.yml up -d
```

3. Create the initial admin user:
```sh
docker compose -f docker-compose.prod.yml exec web node createInitialUser.js <username> <password>
```
</details>

## Node.js

<details>
  <summary><b>Development</b></summary>

  1. Install dependencies:
```sh
npm install
cd admin && npm install
```

2. Create initial admin user:
```sh
node createInitialUser.js <username> <password>
```

3. Start development servers:
```
npm run dev
```

This will start:
- Backend server on port 3000
- Admin dev server on port 3001

</details>

<details>
  <summary><b>Production</b></summary>

  1. Install dependencies and build admin panel:
```
npm install
cd admin && npm install && npm run build
cd ..
```

2. Create initial admin user:
```
node createInitialUser.js <username> <password>
```

3. Start production server:
```
npm start
```

</details>

<hr>

## Technologies

- Backend: ![Node.js](https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![Express](https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=whit)
- Frontend: HTML, CSS, JavaScript
- Admin Panel: React, TypeScript, Material-UI
- Database: PostgreSQL
- Real-time: WebSocket
- Authentication: JWT, TOTP
- Container: Docker
