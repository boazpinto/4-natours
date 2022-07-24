const express=require('express');
const viewsController=require('../controllers/viewControllers');
const authController=require('../controllers/authController');

const router=express.Router();

router.get('/',authController.isLogedIn,viewsController.getOverview);
router.get('/tour/:slug',authController.isLogedIn,viewsController.getTour);
router.get('/login',authController.isLogedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);

module.exports=router;
