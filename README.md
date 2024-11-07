# Work From Home System - IS212 Project

## Overview
This is a Work From Home (WFH) System application developed by SMU Information Systems penultimate students for the Software Project Management (IS212) course. The system provides different access controls and functionalities based on staff roles.

## Live Demo
The application is hosted at: [https://is-212-g9-t5.vercel.app/](https://is-212-g9-t5.vercel.app/)

## Test Credentials
You can use the following Staff IDs to test different roles and access levels:

| Role | Staff ID |
|------|----------|
| Staff | 140002 |
| Manager | 140894 |
| Senior Manager/Director/HR | 140001 |

## Local Development Setup

### Prerequisites
- Python 3.x
- Node.js
- npm
- Git

### Installation Steps

1. Clone the repository
```bash
git clone https://github.com/nlcchi/IS212-G9T5.git
```

2. Set up environment variables
```bash
cp .env.sample .env.local
```

3. Set up Python virtual environment (MacOS)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

4. Install Python dependencies
```bash
cd backend
pip install -r requirements.txt
```

5. Set up local database
- Update `DATABASE_URL` in `.env`
- Run SQL script in `backend/db.sql`

6. Set up and run frontend
```bash
cd frontend
npm install
npm run dev
```

7. Load CSV data and run backend
- Change `TESTING` value in `.env` to `"False"`
```bash
cd backend/util
python3 load_csv.py

cd ../
python3 server.py
```

8. Run tests locally
- Change `TESTING` value in `.env` to `"True"` 
```bash
cd backend
python3 -m unittest discover -s tests
```

## Project Structure
```
IS212-G9T5/
├── frontend/          # React frontend application
├── backend/           # Python backend server
└── README.md         # Project documentation
```

## Features
- Role-based access control
- Different user interfaces for Staff, Managers, and Senior Management
- Work from home request management system

## Technology Stack
- Frontend: React.js
- Backend: Python
- Deployment: Vercel

## Contributing
Please refer to our [GitHub repository](https://github.com/nlcchi/IS212-G9T5) for contribution guidelines and latest updates.

## Team
Group 9 Team 5
School of Information Systems
Singapore Management University