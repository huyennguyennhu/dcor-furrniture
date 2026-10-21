import { Router } from 'express';
import { consultationController } from '../controllers/consultation.controller';

const router = Router();

router.get('/showrooms', consultationController.getShowrooms);
router.get('/availability', consultationController.getAvailability);
router.post('/', consultationController.createConsultation);
router.get('/my-appointments', consultationController.getMyAppointments);

export default router;
