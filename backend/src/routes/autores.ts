import { Router } from 'express';
import { authenticate } from '../middlewares/sessao';
import { validateAuthor } from '../middlewares/validacao';
import { autoresController } from '../controllers/autoresController';

const router = Router();

router.get('/',       authenticate, autoresController.list);
router.get('/:id',    authenticate, autoresController.findById);
router.post('/',      authenticate, validateAuthor, autoresController.create);
router.put('/:id',    authenticate, validateAuthor, autoresController.update);
router.delete('/:id', authenticate,                 autoresController.remove);

export default router;
