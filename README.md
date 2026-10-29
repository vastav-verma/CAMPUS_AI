# CampusAI | AI-Powered Campus Management Platform

**CampusAI** is a multi-tenant SaaS platform designed to streamline campus support through AI-powered knowledge assistance, college-specific information retrieval, and structured student grievance management.

It combines a React-based frontend, a Node.js backend, MongoDB persistence, and AI-powered document retrieval to provide a centralized platform for students, staff, and college administrators.

**Live Application:** https://campus-ai-fawn.vercel.app  
**Backend API:** https://campus-ai-lqur.onrender.com  
**Repository:** https://github.com/vastav-verma/CAMPUS_AI

---

## Overview

Educational institutions often manage student queries, institutional policies, and grievances through disconnected systems and manual processes. CampusAI aims to simplify these workflows through a unified, role-based platform.

The application provides a college-specific AI assistant that can retrieve information from institutional documents, alongside a complaint management workflow that helps students submit grievances and follow their resolution progress.

Its multi-tenant architecture is designed to support multiple colleges while maintaining college-specific users, documents, and operational data.

## Core Features

### AI-Powered Knowledge Assistant
- Conversational assistance for campus-related queries.
- Retrieval-Augmented Generation (RAG) for document-grounded responses.
- College-specific knowledge retrieval from institutional documents.
- Document processing and text chunking for semantic search.
- Integration with configurable AI services.

### Multi-Tenant Architecture
- Separate workspaces for participating colleges.
- College-specific user registration and configuration.
- Tenant-aware data access and knowledge management.
- Configurable assistant identity and workspace settings.

### Document Management
- Upload and manage institutional knowledge resources.
- Process documents into searchable text chunks.
- Associate document content and metadata with the relevant college.
- Retrieve relevant context to support AI-generated answers.

### Student Grievance Management
- Submit and track student complaints.
- Support complaint assignment and staff workflows.
- Update complaint status and resolution details.
- Support resolution evidence where configured.
- Provide administrative visibility into complaint activity.

### Role-Based Access Control

| Role | Primary Responsibilities |
|---|---|
| Student | Ask questions, submit grievances, and track updates |
| Staff | Access assigned complaints and manage resolutions |
| College Admin | Manage college users, documents, settings, and complaints |
| Super Admin | Manage colleges and platform-level operations |

### Administration and Notifications
- Manage student and staff accounts.
- Support user invitations and CSV-based imports.
- Configure college-specific settings.
- View complaint analytics.
- Provide notification and status-update interfaces.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| API Communication | Axios, REST APIs |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JSON Web Tokens, bcryptjs |
| AI Integration | Google Gemini SDK, Groq SDK |
| Knowledge Retrieval | RAG, document chunking, embeddings, vector retrieval |
| Security | Helmet, CORS, Express Rate Limit |
| File Handling | Multer |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Version Control | Git, GitHub |

## Architecture

```text
Users
  |
  v
React + Vite Frontend
       |
       | REST API
       v
Node.js + Express Backend
       |
       +------ MongoDB Atlas
       |       Users, documents,
       |       complaints and metadata
       |
       +------ AI Services
               Context retrieval
               and response generation
```

### AI Query Workflow

1. A user submits a campus-related question.
2. The frontend sends the request to the backend.
3. The backend applies authentication and college context.
4. Relevant information is retrieved from the college's knowledge base.
5. The configured AI service generates a context-informed response.
6. The answer is returned to the user through the frontend.

## Project Structure

```text
CAMPUS_AI/
├── backend/
│   ├── src/
│   ├── scripts/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

The backend contains API routes, application logic, data models, authentication middleware, and AI-related services. The frontend contains the user interface, pages, reusable components, and API integration.

## Local Development

### Prerequisites

- Node.js and npm
- Git
- MongoDB Atlas or a compatible MongoDB instance
- Valid credentials for the AI provider being used

### 1. Clone the Repository

```bash
git clone https://github.com/vastav-verma/CAMPUS_AI.git
cd CAMPUS_AI
```

### 2. Configure the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=3000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_random_secret
CLIENT_URL=http://localhost:5173

GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=your_supported_model
```

Configure any additional variables required by the application's current backend configuration.

Start the backend:

```bash
npm run dev
```

### 3. Configure the Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:3000/api
```

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

### 4. Verify the Application

- Confirm that MongoDB connects successfully.
- Register or log in using a test account.
- Verify that API requests reach the backend.
- Upload a sample institutional document and test document-based queries.
- Test complaint submission and role-specific workflows.
- Review backend logs if an API or AI request fails.

## Production Deployment

### Frontend — Vercel

**Production URL:** https://campus-ai-fawn.vercel.app

| Setting | Configuration |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Environment Variable | `VITE_API_URL` |

Set the production environment variable to:

```env
VITE_API_URL=https://campus-ai-lqur.onrender.com/api
```

Redeploy after modifying environment variables.

### Backend — Render

**Service URL:** https://campus-ai-lqur.onrender.com

| Setting | Configuration |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |

Configure the required backend environment variables in Render, including:

```env
NODE_ENV=production
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_random_secret
CLIENT_URL=https://campus-ai-fawn.vercel.app
```

Also configure the AI provider credentials and any additional required application variables.

## Security

- Password hashing using bcryptjs.
- JWT-based authentication.
- Role-based access control.
- College-aware data scoping.
- Environment-based configuration for secrets.
- HTTP security headers and rate limiting.
- CORS configuration for frontend-backend communication.

Production deployments should validate tenant isolation across all relevant operations, restrict file uploads appropriately, and avoid exposing credentials or sensitive student information.

## Future Improvements

- Real-time notifications and status updates.
- Integrated subscription billing.
- Enhanced analytics and reporting.
- Automated API and tenant-isolation tests.
- Improved document retrieval evaluation.
- Additional integrations with institutional systems.

These are potential enhancements and are not necessarily implemented in the current deployment.

## Author

**Vastav Verma**

- GitHub: https://github.com/vastav-verma
- Project: https://github.com/vastav-verma/CAMPUS_AI
- Live Application: https://campus-ai-fawn.vercel.app

---

*CampusAI — Bringing intelligent assistance and structured support to campus communities.*
