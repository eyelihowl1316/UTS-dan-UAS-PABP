const express = require("express");
const controller = require("../controllers/profileController");
const authMiddleware = require("../middlewares_helpers/auth-middleware");

const router = express.Router();

router.get("/", authMiddleware, controller.get);
router.put("/", authMiddleware, controller.update);

module.exports = router;
