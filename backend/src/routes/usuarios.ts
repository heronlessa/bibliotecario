import { Router } from 'express';
import { authenticate } from '../middlewares/sessao';
import { validateUser } from '../middlewares/validacao';
import { usuariosController } from '../controllers/usuariosController';

const router = Router();

router.get('/',       authenticate, usuariosController.list);
router.get('/:id',    authenticate, usuariosController.findById);
router.post('/',      authenticate, validateUser, usuariosController.create);
router.put('/:id',    authenticate, validateUser, usuariosController.update);
router.delete('/:id', authenticate,               usuariosController.remove);

export default router;
