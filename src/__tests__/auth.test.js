const request = require("supertest");
const app = require("../index");
const User = require("../models/User");
const { hashPassword } = require("../utils/hash");

describe("Authentication API", () => {
    beforeEach(async () => {
        await User.deleteMany({});
    });

    // ==============================
    // POST /auth/register
    // ==============================
    describe("POST /auth/register", () => {
        // valid registration with all fields
        test("should register a new user with valid data and return csrf token", async () => {
            const res = await request(app)
                .post("/auth/register")
                .send({
                    email: "john@example.com",
                    password: "123456",
                    confirmPassword: "123456",
                    username: "john_doe",
                    bio: "hello world"
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            // check that csrf token is returned
            expect(res.body.csrfToken).toBeDefined();
            expect(res.body.csrfToken.length).toBeGreaterThan(0);

            const user = await User.findOne({ email: "john@example.com" });
            expect(user).not.toBeNull();
            expect(user.username).toBe("john_doe");
            expect(user.bio).toBe("hello world");
        });

        // auto‑generate username if not provided
        test("should auto‑generate username when not provided and return csrf token", async () => {
            const res = await request(app)
                .post("/auth/register")
                .send({
                    email: "auto@example.com",
                    password: "123456",
                    confirmPassword: "123456"
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.csrfToken).toBeDefined();
            
            const user = await User.findOne({ email: "auto@example.com" });
            expect(user.username).toBeDefined();
            expect(user.username.length).toBeGreaterThan(0);
        });

        // bio defaults to empty string
        test("should set empty bio if not provided and return csrf token", async () => {
            const res = await request(app)
                .post("/auth/register")
                .send({
                    email: "nobio@example.com",
                    password: "123456",
                    confirmPassword: "123456",
                    username: "nobio"
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.csrfToken).toBeDefined();
            
            const user = await User.findOne({ email: "nobio@example.com" });
            expect(user.bio).toBe("");
        });

        // duplicate email → 409
        test("should return 409 if email already exists", async () => {
            await User.create({
                email: "dup@example.com",
                password: "hashed",
                username: "existing"
            });

            const res = await request(app)
                .post("/auth/register")
                .send({
                    email: "dup@example.com",
                    password: "123456",
                    confirmPassword: "123456"
                });

            expect(res.statusCode).toBe(409);
            expect(res.body.msg).toBe("this email is already in use");
            // no csrf token on error
            expect(res.body.csrfToken).toBeUndefined();
        });

        // password mismatch
        test("should return 400 if passwords do not match", async () => {
            const res = await request(app)
                .post("/auth/register")
                .send({
                    email: "mismatch@example.com",
                    password: "123456",
                    confirmPassword: "different"
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.errors).toBeDefined();
            expect(res.body.csrfToken).toBeUndefined();
            
            const user = await User.findOne({ email: "mismatch@example.com" });
            expect(user).toBeNull();
        });

        // email missing
        test("should return 400 if email is missing", async () => {
            const res = await request(app)
                .post("/auth/register")
                .send({
                    password: "123456",
                    confirmPassword: "123456"
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.csrfToken).toBeUndefined();
        });

        // invalid email format
        test("should return 400 for invalid email format", async () => {
            const res = await request(app)
                .post("/auth/register")
                .send({
                    email: "not-an-email",
                    password: "123456",
                    confirmPassword: "123456"
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.csrfToken).toBeUndefined();
        });

        // password too short (<6)
        test("should return 400 if password is shorter than 6 characters", async () => {
            const res = await request(app)
                .post("/auth/register")
                .send({
                    email: "short@example.com",
                    password: "123",
                    confirmPassword: "123"
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.csrfToken).toBeUndefined();
        });

        // password too long (>100)
        test("should return 400 if password exceeds 100 characters", async () => {
            const long = "a".repeat(101);
            const res = await request(app)
                .post("/auth/register")
                .send({
                    email: "long@example.com",
                    password: long,
                    confirmPassword: long
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.csrfToken).toBeUndefined();
        });

        // username too long (>30)
        test("should return 400 if username exceeds 30 characters", async () => {
            const res = await request(app)
                .post("/auth/register")
                .send({
                    email: "longname@example.com",
                    password: "123456",
                    confirmPassword: "123456",
                    username: "a".repeat(31)
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.csrfToken).toBeUndefined();
        });

        // bio too long (>300)
        test("should return 400 if bio exceeds 300 characters", async () => {
            const res = await request(app)
                .post("/auth/register")
                .send({
                    email: "longbio@example.com",
                    password: "123456",
                    confirmPassword: "123456",
                    bio: "b".repeat(301)
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.csrfToken).toBeUndefined();
        });
    });

    // ==============================
    // POST /auth/login
    // ==============================
    describe("POST /auth/login", () => {
        let testUser;

        beforeEach(async () => {
            const hashed = await hashPassword("secret123");
            testUser = await User.create({
                email: "login@example.com",
                password: hashed,
                username: "logintest"
            });
        });

        // valid login
        test("should login successfully with correct credentials and return csrf token", async () => {
            const res = await request(app)
                .post("/auth/login")
                .send({
                    email: "login@example.com",
                    password: "secret123"
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            // check that csrf token is returned
            expect(res.body.csrfToken).toBeDefined();
            expect(res.body.csrfToken.length).toBeGreaterThan(0);

            const cookies = res.headers["set-cookie"];
            expect(cookies).toBeDefined();
            expect(cookies[0]).toMatch(/sessionId=/);
        });

        // wrong password
        test("should return 401 with wrong password", async () => {
            const res = await request(app)
                .post("/auth/login")
                .send({
                    email: "login@example.com",
                    password: "wrongpassword"
                });

            expect(res.statusCode).toBe(401);
            expect(res.body.msg).toBe("invalid credentials");
            expect(res.body.csrfToken).toBeUndefined();
        });

        // non‑existent email
        test("should return 401 for non‑existent email", async () => {
            const res = await request(app)
                .post("/auth/login")
                .send({
                    email: "nonexistent@example.com",
                    password: "secret123"
                });

            expect(res.statusCode).toBe(401);
            expect(res.body.msg).toBe("invalid credentials");
            expect(res.body.csrfToken).toBeUndefined();
        });

        // missing email
        test("should return 400 if email is missing", async () => {
            const res = await request(app)
                .post("/auth/login")
                .send({ password: "secret123" });

            expect(res.statusCode).toBe(400);
            expect(res.body.csrfToken).toBeUndefined();
        });

        // missing password
        test("should return 400 if password is missing", async () => {
            const res = await request(app)
                .post("/auth/login")
                .send({ email: "login@example.com" });

            expect(res.statusCode).toBe(400);
            expect(res.body.csrfToken).toBeUndefined();
        });

        // invalid email format
        test("should return 400 for invalid email format", async () => {
            const res = await request(app)
                .post("/auth/login")
                .send({
                    email: "not-an-email",
                    password: "secret123"
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.csrfToken).toBeUndefined();
        });

        // password too short
        test("should return 400 if password is shorter than 6 characters", async () => {
            const res = await request(app)
                .post("/auth/login")
                .send({
                    email: "login@example.com",
                    password: "123"
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.csrfToken).toBeUndefined();
        });
    });

    // ==============================
    // POST /auth/logout
    // ==============================
    describe("POST /auth/logout", () => {
        // helper to login and return agent with session
        const loginAndGetAgent = async () => {
            const agent = request.agent(app);
            const hashed = await hashPassword("logoutpass");
            await User.create({
                email: "logout@example.com",
                password: hashed,
                username: "logoutuser"
            });
            await agent
                .post("/auth/login")
                .send({ email: "logout@example.com", password: "logoutpass" });
            return agent;
        };

        // normal logout after login
        test("should clear session and return success", async () => {
            const agent = await loginAndGetAgent();
            const res = await agent.post("/auth/logout").send();

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.csrfToken).toBeUndefined();

            const cookies = res.headers["set-cookie"];
            expect(cookies).toBeDefined();
            expect(cookies[0]).toMatch(/sessionId=;/);
        });

        // logout without active session
        test("should return 200 even if no active session", async () => {
            const res = await request(app).post("/auth/logout").send();
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.csrfToken).toBeUndefined();
        });
    });
});