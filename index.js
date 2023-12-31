import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import { Strategy as LocalStrategy } from "passport-local";
import crypto from "node:crypto";
import { Strategy as JwtStrategy } from "passport-jwt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from 'node:url';

import productRouter from "./routes/product.js";
import brandsRouter from "./routes/brand.js";
import categoriesRouter from "./routes/category.js";
import authRouter from "./routes/auth.js";
import userRouter from "./routes/user.js";
import cartRouter from "./routes/cart.js";
import orderRouter from "./routes/order.js";
import User from "./model/user.js";
import { cookieExtractor, isAuth, sanitizeUser } from "./service/common.js";
import Stripe from "stripe";

dotenv.config();
const server = express();
const stripe = Stripe(process.env.STRIPE_SERVER_KEY);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
server.use(express.static(path.resolve(__dirname, 'dist')));

server.use(cookieParser());
// server.use(express.raw({ type: "application/json" }));

server.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
  })
);
server.use(passport.authenticate("session"));
server.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    exposedHeaders: ["X-Total-Count", "Set-Cookie"],
  })
);

server.use(express.json()); // to parse req.body(json) into JS object
server.use(express.static(path.resolve(__dirname, 'build')));

// local strategies
passport.use(
  "local",
  new LocalStrategy(
    { usernameField: "email" }, // by default 'username'
    async function (email, password, done) {
      // by default passport uses username
      try {
        const user = await User.findOne({ email }).exec();

        if (!user) {
          return done(null, false, { message: "invalid credentials" });
        }

        crypto.pbkdf2(
          password,
          user.salt,
          310000,
          32,
          "sha256",
          async function (err, hashedPassword) {
            if (err) {
              return cb(err);
            }
            if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
              return done(null, false, { message: "invalid credentials" });
            }
            const token = jwt.sign(
              sanitizeUser(user),
              process.env.JWT_SECRET_KEY
            );

            done(null, { token }); // this lines sends to serializer
          }
        );
      } catch (err) {
        done(err);
      }
    }
  )
);

// this creates session variable req.user on being called from callbacks
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

// this function parse serialized req.user and gave it as req.user to the next controller
passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

var opts = {};
opts.jwtFromRequest = cookieExtractor;
opts.secretOrKey = process.env.JWT_SECRET_KEY;

passport.use(
  "jwt",
  new JwtStrategy(opts, async function (jwt_payload, done) {
    try {
      const user = await User.findById(jwt_payload.id);
      if (user) {
        return done(null, sanitizeUser(user)); // this calls serializer
      } else {
        return done(null, false);
        // or you could create a new account
      }
    } catch (err) {
      return done(err, false);
    }
  })
);

server.post("/create-payment-intent", async (req, res) => {
  const { totalAmount } = req.body;
  const customer = await stripe.customers.create({
    name: "Jenny Rosen",
    address: {
      line1: "510 Townsend St",
      postal_code: "98140",
      city: "San Francisco",
      state: "CA",
      country: "US",
    },
  });

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount * 100, // 1400 considered as 14.00
    currency: "inr",
    description: "Software development services",
    shipping: {
      name: "Jenny Rosen",
      address: {
        line1: "510 Townsend St",
        postal_code: "98140",
        city: "San Francisco",
        state: "CA",
        country: "US",
      },
    },
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.ENDPOINT_SECRET;

server.get("/webhook");
server.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (request, response) => {
    const sig = request.headers["stripe-signature"];
    console.log("hi");
    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntentSucceeded = event.data.object;
        // Then define and call a function to handle the event payment_intent.succeeded
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
  }
);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected with Database!"))
  .catch((error) => console.log(error));

server.use("/products", isAuth(), productRouter);
server.use("/brands", isAuth(), brandsRouter);
server.use("/categories", isAuth(), categoriesRouter);
server.use("/auth", authRouter);
server.use("/users", isAuth(), userRouter);
server.use("/cart", isAuth(), cartRouter);
server.use("/orders", isAuth(), orderRouter);

// this line we add to make react router work in case of other routes doesnt match
server.get('*', (req, res) =>
  res.sendFile(path.resolve('dist', 'index.html'))
);

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server is running on ${port}!`);
});
