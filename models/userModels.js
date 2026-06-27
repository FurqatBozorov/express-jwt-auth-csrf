const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const { Schema } = mongoose;

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  //   userAgent: String, // optional (device info)
  //   ip: String, // optional
});

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  refreshTokens: [refreshTokenSchema],
});

userSchema.statics.register = async function (email, password) {
  if (!email || !password) {
    throw new Error("Please make sure all required fields are filled!");
  }

  const exist = await this.findOne({ email });

  if (exist) {
    throw new Error("The user with such email already exists!");
  }

  const saltRounds = 10;

  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = this.create({
    email,
    password: hashedPassword,
  });

  return user;
};

userSchema.statics.login = async function (email, password) {
  if (!email || !password) {
    throw new Error('"Please make sure all required fields are filled!"');
  }

  const user = await this.findOne({ email });

  if (!user) {
    throw new Error("There is no user with such email!");
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw new Error("Wrong password! Please try again!");
  }

  return user;
};

module.exports = mongoose.model("User", userSchema);
