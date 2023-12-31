import express from 'express';
import { fetchUserById, updateUser } from '../controller/user.js';

const router = express.Router();
//  /users is already added in base path
router.get('/own', fetchUserById)
      .patch('', updateUser)

export default router;