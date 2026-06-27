const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

exports.generateAccessToken = (user) => {
  return jwt.sign({ userId: user._id, role: user.role }, ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

exports.generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id, tokenId: crypto.randomUUID() },
    REFRESH_SECRET,
    { expiresIn: "7d" },
  );
};

exports.generateCSRFToken = () => {
  return crypto.randomBytes(32).toString("hex");
};
