import express from 'express';
import { createProduct, fetchAllProducts, fetchProductById, updateProduct } from '../controller/product.js';

const router = express.Router();

router.post('/', createProduct)
      .get('/', fetchAllProducts)
      .get('/:id', fetchProductById)
      .patch('/:id', updateProduct)

export default router;