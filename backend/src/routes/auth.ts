import { Router } from 'express';
import { validateLogin } from '../middlewares/validacao';
import { authController } from '../controllers/authController';

const router = Router();

router.post('/login',  validateLogin, authController.login);
router.post('/logout', authController.logout);

export default router;
