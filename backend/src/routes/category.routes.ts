import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', requirePermission('categories', 'view'), categoryController.getAll);
router.post('/', requirePermission('categories', 'create'), categoryController.createCategory);
router.put('/:id', requirePermission('categories', 'edit'), categoryController.updateCategory);
router.patch('/:id/status', requirePermission('categories', 'edit'), categoryController.toggleStatus);
router.delete('/:id', requirePermission('categories', 'delete'), categoryController.deleteCategory);

export default router;
