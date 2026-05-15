# 🔐 Session Auth - Express.js Authentication Boilerplate

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/) [![Express.js Version](https://img.shields.io/badge/express-5.x-blue)](https://expressjs.com/) [![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE) [![Tests](https://img.shields.io/badge/tests-jest-brightgreen)](https://jestjs.io/) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/n1kFord/session-auth/pulls)

> 📚 **Educational project** for learning authentication patterns with Express.js, sessions, and CSRF protection.

A production-ready authentication system built with **Express.js**, featuring session-based authentication, CSRF protection, rate limiting, and comprehensive testing. Perfect for learning modern web authentication patterns.

## ✨ **Features**

- 🔑 **Session-based authentication** with express-session
- 🛡️ **CSRF protection** (Synchronizer Token Pattern)
- 📦 **Redis session store** for production scalability
- 🗄️ **MongoDB** with Mongoose ODM
- 🧪 **Comprehensive test suite** with Jest & Supertest
- 🚦 **Rate limiting** to prevent brute force attacks
- 🔐 **Password hashing** with bcrypt
- 🛡️ **CORS** configuration for cross-origin requests
- 📝 **Input validation** with express-validator
- 🔄 **Session regeneration** on login (prevents fixation attacks)
- ✨ **Auto-generated usernames** if not provided

## 🛠️ **Tech Stack**

### Backend
- **Runtime**: Node.js (v20+)
- **Framework**: Express.js 5.x
- **Database**: MongoDB with Mongoose ODM
- **Session Store**: Redis (via connect-redis)
- **Security**: bcrypt, express-session, CSRF protection
- **Validation**: express-validator
- **Rate Limiting**: express-rate-limit
- **CORS**: cors middleware

### Testing
- **Test Runner**: Jest
- **HTTP Testing**: Supertest
- **Test Database**: MongoDB (separate test database)

### Dev Tools
- **Process Manager**: nodemon
- **Environment Variables**: dotenv

## 📋 **Prerequisites**

- Node.js (v20 or higher)
- Docker & Docker Compose (for Redis and MongoDB)
- npm or yarn

## 🚀 **Getting Started**

### 1. Clone the repository

```bash
git clone https://github.com/n1kFord/session-auth.git
cd session-auth
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
PORT=8080
MONGO_URI=mongodb://localhost:27017/authDB
REDIS_CLIENT_URI=redis://localhost:6379
REDIS_SECRET=your-super-secret-key-here
```

### 4. Start MongoDB and Redis with Docker Compose

```bash
docker-compose up -d
```

This will start:
- MongoDB on port `27017`
- Redis on port `6379`

### 5. Run the application

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

Your server will be running at `http://localhost:8080`

## 🧪 **Running Tests**

The project uses a separate test database (`auth_test`) to ensure your development data stays safe.

```bash
# Run all tests
npm test

# Tests will:
# - Use MongoDB on localhost:27017 (make sure Docker is running)
# - Create/use database 'auth_test'
# - Clean up after each test suite
```

## 📁 **Project Structure**

```
session-auth/
├── src/
│   ├── config/
│   │   ├── constants.js      # Environment variables
│   │   ├── mongo.js          # MongoDB connection
│   │   ├── redis.js          # Redis connection
│   │   └── session.js        # Session configuration
│   ├── middlewares/
│   │   ├── authenticate.js   # Authentication middleware
│   │   ├── csrf.js           # CSRF protection
│   │   ├── fallback.js       # Error handling
│   │   └── validation.js     # Input validation
│   ├── models/
│   │   └── User.js           # User model
│   ├── routers/
│   │   ├── authRouter.js     # Auth endpoints
│   │   └── userRouter.js     # User management
│   ├── utils/
│   │   ├── csrf.js           # CSRF token utilities
│   │   ├── handler.js        # Async handler wrapper
│   │   ├── hash.js           # Password hashing
│   │   ├── session.js        # Session utilities
│   │   └── username.js       # Random username generator
│   ├── __tests__/
│   │   ├── auth.test.js      # Auth endpoint tests
│   │   └── user.test.js      # User endpoint tests
│   └── index.js              # Application entry point
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── jest.config.js
├── jest.setup.js
├── package.json
└── README.md
```

## 🔌 **API Endpoints**

### Authentication (`/auth`)

| Method | Endpoint | Description | Requires CSRF |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | ❌ No |
| POST | `/auth/login` | Login user | ❌ No |
| POST | `/auth/logout` | Logout user | ❌ No |

### User Management (`/me`)

| Method | Endpoint | Description | Requires CSRF |
|--------|----------|-------------|---------------|
| GET | `/me/` | Get current user profile | ❌ No |
| POST | `/me/change-email` | Change email address | ✅ Yes |
| POST | `/me/change-password` | Change password | ✅ Yes |
| POST | `/me/change-username` | Change username | ✅ Yes |
| POST | `/me/change-bio` | Change bio | ✅ Yes |
| DELETE | `/me/` | Delete account | ✅ Yes |

### Request Examples

**Register:**
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secret123",
    "confirmPassword": "secret123",
    "username": "john_doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secret123"
  }'
```

**Protected endpoint (with CSRF token):**
```bash
curl -X GET http://localhost:8080/me/ \
  -H "X-XSRF-Token: your-csrf-token-here" \
  -H "Cookie: sessionId=your-session-id"
```

## 🛡️ **Security Features**

1. **Session-based Authentication**
   - HTTP-only cookies
   - Session regeneration on login
   - Configurable session expiration

2. **CSRF Protection**
   - Synchronizer Token Pattern
   - Tokens regenerated on session changes
   - Required for all state-changing operations

3. **Rate Limiting**
   - 100 requests per 15 minutes globally
   - 10 login attempts per 15 minutes

4. **Password Security**
   - Bcrypt hashing (10 rounds)
   - Minimum length requirements
   - No plain-text storage

5. **Input Validation**
   - Email validation
   - Password strength checks
   - Sanitized inputs

## 🐳 **Docker Support**

Build and run with Docker:

```bash
# Build image
docker build -t session-auth .

# Run container
docker run -p 8080:8080 --env-file .env session-auth
```

Or use docker-compose (includes MongoDB and Redis):

```bash
docker-compose up -d
```

## 🧪 **Test Coverage**

The test suite covers:
- ✅ User registration (success, validation, duplicates)
- ✅ User login (success, wrong credentials, validation)
- ✅ User logout
- ✅ Email change (success, duplicate, wrong password)
- ✅ Password change (success, wrong password, validation)
- ✅ Username/bio update
- ✅ Account deletion
- ✅ CSRF protection validation
- ✅ Authentication middleware

## 📝 **Environment Variables**

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/authDB` |
| `REDIS_CLIENT_URI` | Redis connection string | `redis://localhost:6379` |
| `REDIS_SECRET` | Secret for session encryption | Required |


## 📄 **License**

This project is licensed under the [MIT License](./LICENSE).  
Feel free to use, modify, and distribute with attribution.

> 💡 Created with care by [@n1kFord](https://github.com/n1kFord)

## 🙏 **Acknowledgments**

- Inspired by modern authentication patterns
- Built for learning purposes
- Production-ready security practices
- Comprehensive testing strategy

---

**⭐ Star this repo if you found it helpful!**