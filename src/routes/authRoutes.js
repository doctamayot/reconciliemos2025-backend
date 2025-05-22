const express = require("express");
const authController = require("../controllers/authController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/login", authController.login);
router.get("/me", protect, authController.getMyProfile);
router.post(
  "/admin/create-user",
  protect,
  authorize(["admin"]),
  authController.adminCreateUser
);

// Se elimina la ruta GET /activate/:token

module.exports = router;
