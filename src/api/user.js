const express = require("express");
const jwt = require("jsonwebtoken");
const redisClient = require("../database/redis");
const Tweet = require("../models/tweet");
const User = require("../models/user");

const router = express.Router();

router.get("/user", async (req, res) => {
  const cacheUser = await redisClient.get("users");
  const cacheTweets = await redisClient.get("tweetOfUser");

  if (cacheUser || cacheTweets) {
    return res.status(200).json({
      message: "Get user information from cache",
      result: { user: JSON.parse(cacheUser), tweets: JSON.parse(cacheTweets) },
    });
  } else {
    const jwtToken = req.headers.authorization.split(" ")[1];
    const result = jwt.verify(jwtToken, process.env.JWT_SECRET);

    const userWithEmail = await User.findOne({
      where: { email: result.email },
    }).catch((err) => {
      console.log("Error: ", err);
    });

    const tweetUser = await Tweet.findAll({
      where: { userId: result.id },
    }).catch((err) => {
      console.log("Error: ", err);
    });

    await redisClient.set("users", JSON.stringify(userWithEmail));
    await redisClient.set("tweetOfUser", JSON.stringify(tweetUser));

    if (userWithEmail)
      return res.status(200).json({
        message: "Get user information",
        result: { user: userWithEmail, tweets: tweetUser },
      });

    res.json({
      message: "User not found",
    });
  }
});

router.delete("/user", async (req, res) => {
  const jwtToken = req.headers.authorization.split(" ")[1];
  const result = jwt.verify(jwtToken, process.env.JWT_SECRET);

  const delUserWithEmail = await User.destroy({
    where: { email: result.email },
  }).catch((err) => {
    console.log("Error: ", err);
  });

  if (delUserWithEmail)
    return res.status(200).json({ message: "User deleted successfully" });

  res.json({
    message: "User not found",
  });
});

router.put("/user", async (req, res) => {
  const jwtToken = req.headers.authorization.split(" ")[1];
  const result = jwt.verify(jwtToken, process.env.JWT_SECRET);

  const fullName = req.body.fullName;
  const username = req.body.username;
  const phoneNumber = req.body.phoneNumber;
  const email = req.body.email;
  const password = req.body.password;

  const updateUserWithEmail = await User.upsert({
    id: result.id,
    fullName,
    username,
    phoneNumber,
    email,
    password,
  }).catch((err) => {
    console.log("Error: ", err);
  });

  if (updateUserWithEmail)
    return res.status(200).json({
      message: "User updated successfully",
    });

  res.json({
    message: "User not found",
  });
});

router.patch("/user", async (req, res) => {
  const jwtToken = req.headers.authorization.split(" ")[1];
  const result = jwt.verify(jwtToken, process.env.JWT_SECRET);

  const password = req.body.password;

  const updateUserWithEmail = await User.update(
    {
      password,
    },
    { where: { email: result.email } }
  ).catch((err) => {
    console.log("Error: ", err);
  });

  if (updateUserWithEmail)
    return res.status(200).json({
      message: "User updated successfully",
    });

  res.json({
    message: "User not found",
  });
});

module.exports = router;
