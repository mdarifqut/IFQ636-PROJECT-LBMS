# Library Book Management System (LBMS)

A web-based Library Book Management System developed for **QUT IFQ636 – Software Life Cycle Development**.

The application uses React, Node.js, Express and MongoDB Atlas. It supports two user roles: **Reader** and **Librarian**.

## 1. Implemented Features

### User Management
- User registration and login using JWT authentication.
- Password hashing using bcrypt.
- Reader and Librarian roles with role-based access.
- Reader role assigned automatically during registration.
- Librarian role assigned manually through MongoDB Atlas.
- User profile and logout functionality.

### Catalogue Management
- Librarians can add, view, update and delete books.
- Search books by title or author.
- View book details and availability.
- Prevent deletion or modification of books with active borrowing records where applicable.

### Book Borrowing Management
- Readers can browse available books and submit borrowing requests.
- Readers can view their borrowing requests and borrowed books.
- Librarians can view all borrowing transactions.
- Librarians can approve or reject borrowing requests.
- Approved borrowing requests update the book status to Borrowed.
- Librarians can record book returns.
- Returned books become Available again.

## 2. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, bcrypt |
| Version Control | Git, GitHub |
| Project Management | Jira |
| CI | GitHub Actions |
| Deployment | AWS EC2, PM2, Nginx |

## 3. System Architecture

The application follows a three-tier architecture:

**React Frontend → Express REST API → MongoDB Atlas**

- **Frontend:** Provides user interfaces for Readers and Librarians.
- **Backend:** Implements authentication, business logic and REST APIs.
- **Database:** Stores users, books and borrowing transactions.
- **Deployment:** AWS EC2 hosts the frontend and backend. Nginx serves the frontend and proxies API requests to the Node.js application managed by PM2.

## 4. Local Setup

### Prerequisites

- Node.js and npm
- MongoDB Atlas database
- Git

### Clone Repository

```bash
git clone https://github.com/mdarifqut/IFQ636-PROJECT-LBMS.git
cd IFQ636-PROJECT-LBMS
```

### Backend

```bash
cd backend
npm install
```
### Backend Configuration

Create a `.env` file inside the `backend` directory.

Configure the MongoDB Atlas connection string and JWT secret required by the backend.

Do not commit the `.env` file to GitHub because it contains sensitive configuration information.

Start the backend:

```bash
npm start
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm start
```

The frontend connects to the backend REST API.

## 5. Deployment

The application has been deployed and functionally tested on **AWS EC2 (Ubuntu)**.

- Nginx serves the React production build.
- PM2 manages the Node.js backend on port 5001.
- MongoDB Atlas provides the database.
- GitHub Actions performs CI checks.

**Live Application:** [Insert AWS EC2 deployment URL]

## 6. Version Control and Release

Development was managed using Jira issues, Git feature branches, commits and GitHub pull requests.

Key development areas include:
- User Management
- Catalogue Management
- Book Borrowing Management
- CI configuration

**Release:** `v1.0.0` — First working AWS EC2 deployment.


## 8. Starter Project Acknowledgement

This application was developed using the QUT IFQ636 sample application as its starting point.

**Original repository:** https://github.com/nahaQUT/sampleapp_IFQ636
