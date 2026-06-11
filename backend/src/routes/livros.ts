import { Router } from 'express';
import { authenticate } from '../middlewares/sessao';
import { validateBook } from '../middlewares/validacao';
import { livrosController } from '../controllers/livrosController';

const router = Router();

router.get('/',       authenticate, livrosController.list);
router.get('/:id',    authenticate, livrosController.findById);
router.post('/',      authenticate, validateBook, livrosController.create);
router.put('/:id',    authenticate, validateBook, livrosController.update);
router.delete('/:id', authenticate,               livrosController.remove);

export default router;
