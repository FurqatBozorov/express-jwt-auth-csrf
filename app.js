require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const app = express();

const userRouter = require("./routes/userRoutes");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(userRouter);

const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONDODB_URL)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log("Server running on port:", PORT);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });
