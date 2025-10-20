# 🟨 Tahwisa Backend

This is the backend service for **Tahwisa**, a web platform developed during my internship at **Naftal – DCSI**.  
The application manages employee registrations and winner selections for the company’s annual trips.

---

## ⚙️ Tech Stack

- **Node.js** – Runtime environment  
- **Express.js** – Web framework  
- **PostgreSQL** – Database  
- **pg** – PostgreSQL client for Node.js  
- **Railway** – Deployment platform  

---

## 📁 Project Structure
```bash

src/
│
├── index.js
│
├── config/
│ └── db.js
│
├── routes/
│ ├── employeeRoutes.js
│ ├── inscriptionRoutes.js
│ ├── periodeRoutes.js
│ ├── resultatSelectionRoutes.js
│ ├── sessionRoutes.js
│ └── authRoutes.js
│
├── controllers/
│ ├── employeeController.js
│ ├── inscriptionController.js
│ ├── periodeController.js
│ ├── resultatSelectionController.js
│ ├── sessionController.js
│ └── authController.js
│
└── middleware/
└── authMiddleware.js
```

---

## 🧠 Core Features

### 🔐 Authentication & Roles
- Login / Registration system  
- Role-based access (Admin / Employee)

### 👥 Employee Management
- CRUD operations on employees  
- Linked with structure (formerly department)

### 📝 Inscriptions
- Register employees for a travel session  
- Admin can view and manage all inscriptions  
- Filtering and history tracking

### 🏆 Winner Generation
- Automatic winner selection after the registration deadline  
- Selects **3 official** and **4 backup** winners per session  
- History of results available through `/winners/history`

### 📅 Periods & Sessions
- Manage trip periods (**60 days split into 6 sections**)  
- Each session tied to a center and period

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/tahwisa-backend.git
cd tahwisa-backend
```

2️⃣ Install Dependencies
```bash
npm install
```

3️⃣ Create .env File
```bash
PORT=8080
DATABASE_URL=postgresql://user:password@localhost:5432/tahwisa
JWT_SECRET=your_secret_key
```

4️⃣ Run the Server
```bash
npm start
```

Server will start at 👉 http://localhost:8080

🧩 API Routes Overview
| Route                   | Method                    | Description               |
| ----------------------- | ------------------------- | ------------------------- |
| `/api/auth/register`    | POST                      | Register new employee     |
| `/api/auth/login`       | POST                      | Login user                |
| `/api/employees`        | GET / POST / PUT / DELETE | Manage employees          |
| `/api/inscriptions`     | GET / POST                | Manage trip registrations |
| `/api/winners`          | GET                       | Get winner list           |
| `/api/winners/generate` | POST                      | Auto-generate winners     |
| `/api/winners/history`  | GET                       | Get historical results    |
| `/api/sessions`         | GET / POST                | Manage sessions           |
| `/api/periodes`         | GET / POST                | Manage periods            |

🧪 Example SQL Tables
```bash
CREATE TABLE employee (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    prénom VARCHAR(100),
    structure VARCHAR(100),
    email VARCHAR(150),
    password TEXT,
    role VARCHAR(20) DEFAULT 'employee'
);

CREATE TABLE session (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    centre VARCHAR(100),
    periode_id INT REFERENCES periode(id)
);
```

☁️ Deployment

The backend is deployed on Railway, connected to a hosted PostgreSQL instance.
You can configure automatic redeployments by linking this GitHub repository.

🙌 Credits

Developed by: Zakaria Tikialine

Supervised by: M. Mustapha

Organization: Naftal – DCSI

Project: Tahwisa – Annual Trip Management Platform

⭐ If you like this project, consider giving it a star on GitHub!
