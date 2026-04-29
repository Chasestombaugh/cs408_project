# RiftTracker

RiftTracker is a full-stack web application designed to help players track and analyze their League of Legends match performance without relying on external APIs.

Users can log matches, review detailed statistics, and gain insights into their performance over time through a clean and intuitive interface.

---

## Features

- Add, edit, and delete match records
- Track core stats (K/D/A, result, champion, role)
- Optional advanced stats (gold, CS, damage, duration, vision)
- Filter matches by username
- Detailed match view
- Stats dashboard with:
  - Win rate
  - Average K/D/A
  - GPM and CSM
  - Average damage dealt
  - Match history and trends
- Range filtering (All Time, Last 20, Last 10, Last 5)
- League client-inspired dark UI theme

---

## Tech Stack

### Backend
- Node.js
- Express
- SQLite

### Frontend
- EJS (server-side rendering)
- Bootstrap

### DevOps / Deployment
- Docker
- AWS EC2
- Nginx (reverse proxy)

### Testing
- Playwright (end-to-end testing)

---

##  Running Tests

```bash
npm test
```
Runs the full Playwright test suite including:
- Create match
- Edit match
- Delete match
- Stats page validation

---

### Running Locally

```bash
npm install
npm start
```

then visit:

http://localhost:3000

---

### Running with Docker

```bash
./dev.sh build
./dev.sh start
```

---

### Deployment (EC2)

The app is deployed using Docker on an AWS EC2 instance

Steps:

- Launch EC2 instance
- Install Docker
- Clone repository
- Run deployment script

See detailed instructions in the [docs README](docs/deploy-docker/README.md) 

---

### Example Workflow

- Add a match
- View matches by username or a match by ID
- Edit or delete matches
- View your stats dashboard
- Analyze performance trends

---

### Important notes

- This project does NOT use Riot's API
- All data is manually entered by the user
- This was designed with personal performance tracking in mind
