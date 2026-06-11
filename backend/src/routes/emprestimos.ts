import { Router } from 'express';
import { authenticate } from '../middlewares/sessao';
import { validateLoan } from '../middlewares/validacao';
import { emprestimosController } from '../controllers/emprestimosController';

const router = Router();

router.get('/',               authenticate, emprestimosController.list);
router.get('/:id',            authenticate, emprestimosController.findById);
router.post('/',              authenticate, validateLoan, emprestimosController.create);
router.put('/:id',            authenticate, validateLoan, emprestimosController.update);
router.patch('/:id/devolver', authenticate,               emprestimosController.return);
router.delete('/:id',         authenticate,               emprestimosController.remove);

export default router;
