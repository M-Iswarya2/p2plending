const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Register
router.post("/register", async (req, res) => {
  try {
    const existing = await User.findOne({
      $or: [{ username: req.body.username }, { email: req.body.email }],
    });
    if (existing) return res.status(400).send("Username or email already taken.");

    const user = new User(req.body);
    await user.save();
    res.status(201).send("User registered.");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.status(401).send("Invalid credentials");
  res.json(user);
});

module.exports = router;
