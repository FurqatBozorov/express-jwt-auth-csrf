const User = require("../models/userModels");
const {
  generateAccessToken,
  generateRefreshToken,
  generateCSRFToken,
} = require("../utils/index");

const userRegister = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.register(email, password);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const csrfToken = generateCSRFToken();

    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    await user.save();

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .cookie("csrfToken", csrfToken, {
        secure: true,
        sameSite: "strict",
      })
      .status(200)
      .json({
        message: "Logged in",
        user: { id: user._id, email: user.email },
      });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const userLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const csrfToken = generateCSRFToken();

    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    await user.save();

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .cookie("csrfToken", csrfToken, {
        secure: true,
        sameSite: "strict",
      })
      .status(200)
      .json({
        message: "Logged in",
        user: { id: user._id, email: user.email },
      });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const userRefresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) return res.sendStatus(403);

    const tokenExists = user.refreshTokens.find(
      (t) => t.token === refreshToken,
    );

    if (!tokenExists) {
      // token reuse detected — revoke all sessions
      user.refreshTokens = [];
      await user.save();
      return res.sendStatus(403);
    }

    // Remove old refresh token (rotation)
    user.refreshTokens = user.refreshTokens.filter(
      (t) => t.token !== refreshToken,
    );

    const newRefreshToken = generateRefreshToken(user);
    const newAccessToken = generateAccessToken(user);

    user.refreshTokens.push({
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    await user.save();

    res
      .cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      })
      .json({ message: "Token refreshed" });
  } catch {
    return res.sendStatus(403);
  }
};

const userLogout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    const user = await User.findOne({
      "refreshTokens.token": refreshToken,
    });

    if (user) {
      user.refreshTokens = user.refreshTokens.filter(
        (t) => t.token !== refreshToken,
      );
      await user.save();
    }
  }

  res
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .clearCookie("csrfToken")
    .json({ message: "Logged out" });
};

const getMe = async (req, res) => {
  try {
    const user = User.findById(req.user._id);
    res.status(200).json({ user: { id: user._id, email: user.email } });
  } catch (error) {
    console.error("Getme error: ", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const userController = {
  userRegister,
  userLogin,
  userRefresh,
  userLogout,
};
module.exports = userController;
