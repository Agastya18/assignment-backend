import { Router } from "express";

import { contact } from '../controllers/contactController';

 const router = Router();

    router.post('/contact',contact);

   
 

export default router;