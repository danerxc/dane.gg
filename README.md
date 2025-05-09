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

<details>
<summary><h3><b>Discord Integrations</b></h3></summary>
I use a custom Discord bot for both the logic behind retrieving and displaying my latest tweet from Twitter & to enable the websockets chat to post/send from a channel in my Discord channel.
<br>
<br>
You can read the <a href="https://github.com/danerxc/dane.gg/wiki">repo wiki</a> for information on these integrations & how to set them up.
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

- Backend: <img alt="Node JS" src="https://img.shields.io/badge/Node%20JS-87cf30?style=flat&logo=nodedotjs&logoColor=87cf30&labelColor=595959&color=87cf30" height="18"> <img alt="Express JS" src="https://img.shields.io/badge/Express_JS-000000?style=flat&logo=express&logoColor=000000&labelColor=595959&color=000000" height="18">
- Frontend: <img alt="HTML" src="https://img.shields.io/badge/HTML-dd4b25?style=flat&logo=html5&logoColor=dd4b25&labelColor=595959&color=dd4b25" height="18"> <img alt="Static Badge" src="https://img.shields.io/badge/CSS-2d53e5?style=flat&logo=css3&logoColor=2d53e5&labelColor=595959&color=2d53e5" height="18"> <img alt="Static Badge" src="https://img.shields.io/badge/JavaScript-f7e025?style=flat&logo=javascript&logoColor=f7e025&labelColor=595959&color=f7e025" height="18">
- Admin Panel: <img alt="Static Badge" src="https://img.shields.io/badge/React-61dbfb?style=flat&logo=react&logoColor=61dbfb&labelColor=595959&color=61dbfb" height="18"> <img alt="Static Badge" src="https://img.shields.io/badge/TypeScript-2d79c7?style=flat&logo=typescript&logoColor=2d79c7&labelColor=595959&color=2d79c7" height="18"> <img alt="Static Badge" src="https://img.shields.io/badge/Tailwind%20CSS-35bef8?style=flat&logo=tailwindcss&logoColor=35bef8&labelColor=595959&color=35bef8" height="18">
- Database: <img alt="Static Badge" src="https://img.shields.io/badge/PostgreSQL-2f6792?style=flat&logo=postgresql&logoColor=2f6792&labelColor=595959&color=2f6792" height="18">
- Real-time: <img alt="Static Badge" src="https://img.shields.io/badge/WebSocket-ff6600?style=flat&logo=socket&logoColor=ff6600&labelColor=595959&color=ff6600" height="18">
- Authentication: <img alt="Static Badge" src="https://img.shields.io/badge/JWT-fb015c?style=flat&logo=jsonwebtokens&logoColor=fb015c&labelColor=595959&color=fb015c" height="18"> <img alt="Static Badge" src="https://img.shields.io/badge/TOTP-00ac4f?style=flat&logo=googleauthenticator&logoColor=00ac4f&labelColor=595959&color=00ac4f" height="18">
- Container: <img alt="Static Badge" src="https://img.shields.io/badge/Docker-2496ed?style=flat&logo=docker&logoColor=2496ed&labelColor=595959&color=2496ed" height="18">
