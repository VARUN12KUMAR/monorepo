import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const taskController = new TaskController();

router.use(authMiddleware);

router.post('/', (req, res) => taskController.createTask(req, res));
router.get('/', (req, res) => taskController.getTasks(req, res));
router.put('/:id', (req, res) => taskController.updateTask(req, res));
router.delete('/:id', (req, res) => taskController.deleteTask(req, res));
router.post('/:id/share', (req, res) => taskController.shareTask(req, res));

export default router; 