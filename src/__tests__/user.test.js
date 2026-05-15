const request = require("supertest");
const app = require("../index");
const User = require("../models/User");
const { hashPassword } = require("../utils/hash");

describe("User API", () => {
    let agent;
    let csrfToken;
    let testUser;

    // helper to register and get agent with csrf token
    const registerAndGetAgent = async () => {
        const agent = request.agent(app);
        
        // register new user
        const registerRes = await agent
            .post("/auth/register")
            .send({
                email: "test@example.com",
                password: "secret123",
                confirmPassword: "secret123",
                username: "testuser",
                bio: "test bio"
            });
        
        if (registerRes.statusCode !== 201) {
            throw new Error(`Registration failed: ${registerRes.statusCode}`);
        }
        
        return { 
            agent, 
            csrfToken: registerRes.body.csrfToken,
            userId: registerRes.body.userId 
        };
    };

    // create test user before each test
    beforeEach(async () => {
        await User.deleteMany({});
        
        const result = await registerAndGetAgent();
        agent = result.agent;
        csrfToken = result.csrfToken;
        testUser = await User.findOne({ email: "test@example.com" });
    });

    // ==============================
    // GET /me/
    // ==============================
    describe("GET /me/", () => {
        test("should return current user data without _id", async () => {
            const res = await agent
                .get("/me/")
                .set("X-XSRF-Token", csrfToken);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("email", "test@example.com");
            expect(res.body).toHaveProperty("username", "testuser");
            expect(res.body).toHaveProperty("bio", "test bio");
            expect(res.body).not.toHaveProperty("_id");
            expect(res.body).not.toHaveProperty("password");
        });

        test("should return 401 without authentication", async () => {
            const res = await request(app)
                .get("/me/")
                .set("X-XSRF-Token", csrfToken);
            
            expect(res.statusCode).toBe(401);
        });
    });

    // ==============================
    // POST /me/change-email
    // ==============================
    describe("POST /me/change-email", () => {
        test("should change email successfully with valid data", async () => {
            const res = await agent
                .post("/me/change-email")
                .set("X-XSRF-Token", csrfToken)
                .send({
                    newEmail: "newemail@example.com",
                    password: "secret123"
                });
            
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.msg).toContain("email updated successfully");
            
            // verify email was changed in db
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.email).toBe("newemail@example.com");
        });

        test("should return 409 if new email already exists", async () => {
            // create another user with target email
            await User.create({
                email: "taken@example.com",
                password: "hashed",
                username: "takenuser"
            });
            
            const res = await agent
                .post("/me/change-email")
                .set("X-XSRF-Token", csrfToken)
                .send({
                    newEmail: "taken@example.com",
                    password: "secret123"
                });
            
            expect(res.statusCode).toBe(409);
            expect(res.body.msg).toBe("this email is already in use");
        });

        test("should return 401 with wrong password", async () => {
            const res = await agent
                .post("/me/change-email")
                .set("X-XSRF-Token", csrfToken)
                .send({
                    newEmail: "new@example.com",
                    password: "wrongpassword"
                });
            
            expect(res.statusCode).toBe(401);
            expect(res.body.msg).toBe("invalid password");
        });

        test("should return 400 if new email is missing", async () => {
            const res = await agent
                .post("/me/change-email")
                .set("X-XSRF-Token", csrfToken)
                .send({ password: "secret123" });
            
            expect(res.statusCode).toBe(400);
        });

        test("should return 400 if password is missing", async () => {
            const res = await agent
                .post("/me/change-email")
                .set("X-XSRF-Token", csrfToken)
                .send({ newEmail: "new@example.com" });
            
            expect(res.statusCode).toBe(400);
        });

        test("should return 400 for invalid email format", async () => {
            const res = await agent
                .post("/me/change-email")
                .set("X-XSRF-Token", csrfToken)
                .send({
                    newEmail: "not-an-email",
                    password: "secret123"
                });
            
            expect(res.statusCode).toBe(400);
        });

        test("should return 403 without csrf token", async () => {
            const res = await agent
                .post("/me/change-email")
                .send({
                    newEmail: "new@example.com",
                    password: "secret123"
                });
            
            expect(res.statusCode).toBe(403);
            expect(res.body.error).toBe("invalid csrf token");
        });
    });

    // ==============================
    // POST /me/change-password
    // ==============================
    describe("POST /me/change-password", () => {
        test("should change password successfully with valid data", async () => {
            const res = await agent
                .post("/me/change-password")
                .set("X-XSRF-Token", csrfToken)
                .send({
                    password: "secret123",
                    newPassword: "newsecret456",
                    confirmNewPassword: "newsecret456"
                });
            
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.msg).toContain("password updated successfully");
            
            // verify can't login with old password
            const loginRes = await request(app)
                .post("/auth/login")
                .send({
                    email: "test@example.com",
                    password: "secret123"
                });
            expect(loginRes.statusCode).toBe(401);
            
            // verify can login with new password
            const newLoginRes = await request(app)
                .post("/auth/login")
                .send({
                    email: "test@example.com",
                    password: "newsecret456"
                });
            expect(newLoginRes.statusCode).toBe(200);
        });

        test("should return 401 with wrong current password", async () => {
            const res = await agent
                .post("/me/change-password")
                .set("X-XSRF-Token", csrfToken)
                .send({
                    password: "wrongpassword",
                    newPassword: "newsecret456",
                    confirmNewPassword: "newsecret456"
                });
            
            expect(res.statusCode).toBe(401);
            expect(res.body.msg).toBe("invalid password");
        });

        test("should return 400 if new password is same as current", async () => {
            const res = await agent
                .post("/me/change-password")
                .set("X-XSRF-Token", csrfToken)
                .send({
                    password: "secret123",
                    newPassword: "secret123",
                    confirmNewPassword: "secret123"
                });
            
            expect(res.statusCode).toBe(400);
            expect(res.body.errors).toBeDefined();
        });

        test("should return 400 if new passwords do not match", async () => {
            const res = await agent
                .post("/me/change-password")
                .set("X-XSRF-Token", csrfToken)
                .send({
                    password: "secret123",
                    newPassword: "newsecret456",
                    confirmNewPassword: "different"
                });
            
            expect(res.statusCode).toBe(400);
            expect(res.body.errors).toBeDefined();
        });

        test("should return 400 if new password is too short", async () => {
            const res = await agent
                .post("/me/change-password")
                .set("X-XSRF-Token", csrfToken)
                .send({
                    password: "secret123",
                    newPassword: "123",
                    confirmNewPassword: "123"
                });
            
            expect(res.statusCode).toBe(400);
        });

        test("should return 403 without csrf token", async () => {
            const res = await agent
                .post("/me/change-password")
                .send({
                    password: "secret123",
                    newPassword: "newsecret456",
                    confirmNewPassword: "newsecret456"
                });
            
            expect(res.statusCode).toBe(403);
        });
    });

    // ==============================
    // POST /me/change-username
    // ==============================
    describe("POST /me/change-username", () => {
        test("should change username successfully", async () => {
            const res = await agent
                .post("/me/change-username")
                .set("X-XSRF-Token", csrfToken)
                .send({ newUsername: "newusername" });
            
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.username).toBe("newusername");
            
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.username).toBe("newusername");
        });

        test("should return 400 if new username is missing", async () => {
            const res = await agent
                .post("/me/change-username")
                .set("X-XSRF-Token", csrfToken)
                .send({});
            
            expect(res.statusCode).toBe(400);
        });

        test("should return 400 if username is too long", async () => {
            const res = await agent
                .post("/me/change-username")
                .set("X-XSRF-Token", csrfToken)
                .send({ newUsername: "a".repeat(31) });
            
            expect(res.statusCode).toBe(400);
        });

        test("should return 403 without csrf token", async () => {
            const res = await agent
                .post("/me/change-username")
                .send({ newUsername: "newusername" });
            
            expect(res.statusCode).toBe(403);
        });
    });

    // ==============================
    // POST /me/change-bio
    // ==============================
    describe("POST /me/change-bio", () => {
        test("should change bio successfully", async () => {
            const res = await agent
                .post("/me/change-bio")
                .set("X-XSRF-Token", csrfToken)
                .send({ newBio: "updated bio text" });
            
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.bio).toBe("updated bio text");
            
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.bio).toBe("updated bio text");
        });

        test("should return 400 if new bio is missing", async () => {
            const res = await agent
                .post("/me/change-bio")
                .set("X-XSRF-Token", csrfToken)
                .send({});
            
            expect(res.statusCode).toBe(400);
        });

        test("should return 400 if bio is too long", async () => {
            const res = await agent
                .post("/me/change-bio")
                .set("X-XSRF-Token", csrfToken)
                .send({ newBio: "b".repeat(301) });
            
            expect(res.statusCode).toBe(400);
        });

        test("should return 403 without csrf token", async () => {
            const res = await agent
                .post("/me/change-bio")
                .send({ newBio: "updated bio" });
            
            expect(res.statusCode).toBe(403);
        });
    });

    // ==============================
    // DELETE /me/
    // ==============================
    describe("DELETE /me/", () => {
        test("should delete user successfully", async () => {
            const res = await agent
                .delete("/me/")
                .set("X-XSRF-Token", csrfToken);
            
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe("User deleted successfully");
            
            // verify user was deleted from db
            const deletedUser = await User.findById(testUser._id);
            expect(deletedUser).toBeNull();
            
            // verify session is destroyed
            const profileRes = await agent
                .get("/me/")
                .set("X-XSRF-Token", csrfToken);
            expect(profileRes.statusCode).toBe(401);
        });

        test("should return 403 without csrf token", async () => {
            const res = await agent.delete("/me/");
            expect(res.statusCode).toBe(403);
        });
    });
});