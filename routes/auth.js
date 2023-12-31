import express from 'express';
import { createUser, loginUser, authenticateLoggedInUser, logout } from '../controller/auth.js';
import passport from 'passport';
import { isAuth } from '../service/common.js';

const router = express.Router();
//  /auth is already added in base path
router
    .post('/signup', createUser)
    // .post('/login', (req, res) => res.send("hi"))
    .post('/login', passport.authenticate('local'), loginUser)
    .get('/authenticate-logged-in-user', isAuth(), authenticateLoggedInUser)
    .get('/logout', logout)
    ;
export default router;