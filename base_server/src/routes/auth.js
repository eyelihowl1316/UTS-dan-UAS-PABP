const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { dbRun, dbGet } = require("../middlewares_helpers/sqlite3_helpers");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ok(res, status, message, data) {
    return res.status(status).json({ success: true, message, data });
    }
    function fail(res, status, message) {
    return res
        .status(status)
        .json({ success: false, message, data: null, error: message });
    }

    function signToken(user) {
    return jwt.sign({ role: user.role }, process.env.JWT_SECRET, {
        subject: String(user.id),
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (name.length < 2) return fail(res, 400, "Nama minimal 2 karakter.");
        if (!EMAIL_RE.test(email)) return fail(res, 400, "Format email tidak valid.");
        if (password.length < 8)
        return fail(res, 400, "Password minimal 8 karakter.");

        const existing = await dbGet("SELECT id FROM users WHERE email = ?", [email]);
        if (existing) return fail(res, 409, "Email sudah terdaftar.");

        const hash = await bcrypt.hash(password, 10);
        const result = await dbRun(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hash],
        );

        const user = { id: result.lastID, name, email, role: "admin" };
        return ok(res, 201, "Pendaftaran berhasil.", {
        token: signToken(user),
        user: publicUser(user),
        });
    } catch (err) {
        
        if (err && err.code === "SQLITE_CONSTRAINT")
        return fail(res, 409, "Email sudah terdaftar.");
        console.error(err);
        return fail(res, 500, "Terjadi kesalahan pada server.");
    }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (!email || !password)
        return fail(res, 400, "Email dan password wajib diisi.");

        const user = await dbGet("SELECT * FROM users WHERE email = ?", [email]);

        // pesan sama untuk email salah / password salah
        const valid = user && (await bcrypt.compare(password, user.password));
        if (!valid) return fail(res, 401, "Email atau password salah.");

        return ok(res, 200, "Login berhasil.", {
        token: signToken(user),
        user: publicUser(user),
        });
    } catch (err) {
        console.error(err);
        return fail(res, 500, "Terjadi kesalahan pada server.");
    }
});

module.exports = router;