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

## 📌 Overview

<details>
<summary><h3><b>Public Website</b></h3></summary>
<img src="https://i.imgur.com/8k0C3bT.png" alt="Homepage"/>
  
### Notable features
- Automatic online/offline status (status from Discord)
- Automatic latest tweet status update (via Tweetshift)
- Automatic service status section for monitored services from Uptime Kuma (via webhook call)
- Real-time websocket chat (two way sync with Discord)
- Dynamic blog (managed via admin dashboard)
- Dynamic projects list (managed via admin dashboard
</details>

<details>
<summary><h3><b>Admin Dashboard</b></h3></summary>
<h3>Login</h3>
<img src="https://i.imgur.com/hnm2ye1.png" alt="Login Page"/>
  
- Secure login page
- 2FA prompt (if setup, optional)

<h3>Statistics Page</h3>
<img src="https://i.imgur.com/wHsRfZ2.png" alt="Statistics Page"/>
<img src="https://i.imgur.com/NoqtzHG.png" alt="Statistics Page"/>

- Displays statistics of web traffic (public pages only)
- Configurable timeframe (24h, 7d, 30d, all time)
- Displays total site visits, number of individual visitors,
- Chart displaying total visits + individual visitor changes over time
- Chart displaying individual page popularity and total page visits per page
- Table of top ten most-viewed blog posts w/ number of views per post
- Visitor countries donut chart + list of top ten countries
- List of top ten most popular visitor user agents
- Raw request logs (public pages only)

<h3>Blog Page</h3>
<img src="https://i.imgur.com/v0IzJzV.png" alt="Blog Page"/>
<img src="https://i.imgur.com/PLNqi3a.png" alt="Blog Page - Add/Edit"/>

- List of all blog posts
- Option to create new blog post
- Edit/delete existing post functionality
- Rich-text content editor w/ preview (markdown formatting)
- Image upload functionality (thumbnail + blog post content)
- Publish/unpublish option (changes whether post is shown on public website or not)
- Blog post tagging functionality (displays on public website)

<h3>Projects Page</h3>
<img src="https://i.imgur.com/0MT5E9e.png" alt="Projects Page"/>
<img src="https://i.imgur.com/l1EERt0.png" alt="Projects Page - Add/Edit"/>

- List of all projects
- Seperate project list per category
- Drag'n'drop ordering of projects (order that projects are returned on public site)
- Option to create new project
- Edit/delete existing project functionality
- Project category selection dropdown + management modal to add/edit/delete categories
- Rich-text description editor w/ preview (markdown formatting)
- Image upload functionality (thumbnail)
- Featured option (if disabled, project is only shown when clicking "view all" on public site)
- Customizable button URL + text
- Project tagging functionality + management modal to add/edit/delete tags

<h3>User Management Page</h3>
<img src="https://i.imgur.com/kSyU8dC.png" alt="User Management Page"/>
<img src="https://i.imgur.com/SkeIpBb.png" alt="User Management Page - Add"/>
<img src="https://i.imgur.com/qTd7AAb.png" alt="User Management Page - Edit"/>

- List of all available user accounts
- Ability to add new accounts
- Ability to edit/delete existing user accounts
- Ability to reset existing user passwords + reset 2FA if setup
- Only accessible by user accounts marked as admin (standard accounts cannot reach this page)

<h3>Account Page</h3>
<img src="https://i.imgur.com/QHuPH0D.png" alt="Account Management Page"/>

- Management page for logged-in user
- Displays whether account is an administrator account or standard account
- Option to change username w/ availability checking
- Option to change password w/ existing password checking
- Option to setup & enable app-based 2FA authentication on account
</details>

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
