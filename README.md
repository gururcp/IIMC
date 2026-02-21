# ConstructOS - IIMC Amravati Project Tracker

A construction project progress tracking application built with React, FastAPI, and MongoDB.

## Features

- 📊 **Dashboard** - Overall project progress, phase-wise breakdown, status distribution
- 🌳 **Task Tree** - Hierarchical view of 138 tasks with inline editing
- 📅 **Gantt Chart** - Interactive timeline with zoom, scroll, and today marker
- ⚡ **Quick Update** - Mobile-friendly task update interface
- 🔘 **Floating Update Button** - Update tasks from any page instantly
- 📑 **Reports** - Generate Daily/Weekly/Monthly reports in Excel or PDF
- 📜 **Update History** - Track all changes with timestamps and notes
- ⚠️ **Risk Management** - Flag at-risk tasks with custom notes

## Tech Stack

- **Frontend**: React, Tailwind CSS, Shadcn/UI, Recharts
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB

### Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URL

# Run server
uvicorn server:app --host 0.0.0.0 --port 8001
```

### Frontend Setup

```bash
cd frontend
yarn install

# Create .env file
cp .env.example .env
# Edit .env with your backend URL

# Development
yarn start

# Production build
yarn build
```

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=constructos
CORS_ORIGINS=https://your-frontend-domain.com
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://your-backend-domain.com
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks` | GET | Get all tasks |
| `/api/tasks/{id}/progress` | PUT | Update task progress |
| `/api/tasks/{id}/dates` | PUT | Update task dates |
| `/api/tasks/{id}/risk` | PUT | Update risk status |
| `/api/tasks/{id}/history` | GET | Get task update history |
| `/api/dashboard/stats` | GET | Get dashboard statistics |
| `/api/reports/generate` | GET | Generate Excel/PDF report |

## Project Structure

```
├── backend/
│   ├── server.py           # FastAPI application
│   ├── seed_data.py        # Initial task data (138 items)
│   └── requirements.txt    # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   └── App.js          # Main application
│   └── package.json        # Node dependencies
│
└── memory/
    └── PRD.md              # Product requirements
```

## License

MIT
