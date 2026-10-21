import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';

const router = Router();

router.get('/', categoryController.getAll);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.patch('/:id/status', categoryController.toggleStatus);
router.delete('/:id', categoryController.deleteCategory);

export default router;
