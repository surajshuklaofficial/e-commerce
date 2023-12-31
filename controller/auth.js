import User from "../model/user.js";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import { sanitizeUser } from "../service/common.js";

const SECRET_KEY = "SECRET_KEY";

export const createUser = async (req, res) => {
  try {
    var salt = crypto.randomBytes(16);
    crypto.pbkdf2(
      req.body.password,
      salt,
      310000,
      32,
      "sha256",
      async function (err, hashedPassword) {
        const user = new User({ ...req.body, password: hashedPassword, salt });
        const doc = await user.save();

        req.login(sanitizeUser(doc), (err) => {
          // this also calls serializer and adds to session
          if (err) {
            res.status(400).json(err);
          } else {
            const token = jwt.sign(sanitizeUser(doc), SECRET_KEY);

            res
              .cookie("jwt", token, {
                expires: new Date(Date.now() + 3600000),
                httpOnly: true,
              })
              .status(201)
              .json(token);
          }
        });
      }
    );
  } catch (err) {
    res.status(400).json(err);
  }
};

export const loginUser = async (req, res) => {
  console.log(req.user.token);
  res
    .cookie("jwt", req.user.token, {
      expires: new Date(Date.now() + 3600000),
    })
    .status(200)
    .json({ token: req.user.token });
};

export const authenticateLoggedInUser = async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.sendStatus(401);
  }
};

export const logout = async (req, res) => {
  res
    .cookie("jwt", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .sendStatus(200);
};
