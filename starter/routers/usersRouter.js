const express = require('express');
const usersControllers=require('../controllers/usersControllers')
const authControllers=require('../controllers/authController')

const router=express.Router();

router.post('/signup',authControllers.signup);
router.post('/login',authControllers.login);
router.get('/logout',authControllers.logout);
router.post('/forgotPassword',authControllers.forgotPassword);
router.patch('/resetPassword/:token',authControllers.resetPassword);

//protect all routes after this middleware
router.use(authControllers.protect);

router.param('id',(req,res,next,val)=>{
  console.log(`user id#${val}`);
  next();
})

router.patch('/updatePassword/:token',authControllers.resetPassword);
router.patch('/updateMyPassword',authControllers.updatePassword);
router.patch('/updateMe',usersControllers.uploadUserPhoto,usersControllers.resizeUserPhoto,usersControllers.updateMe);
router.delete('/deleteMe',usersControllers.deleteMe);
router.get('/Me',usersControllers.getMe,usersControllers.getSpecificUser);

//restrict all routes after this middleware
router.use(authControllers.restrictTo('admin'));

router.route('/')
  .get( usersControllers.getAllUsers)
  .post(usersControllers.addUser);
router
  .route('/:id')
  .get( usersControllers.getSpecificUser)
  .patch(usersControllers.updateUser)
  .delete(usersControllers.deleteUser);

     
module.exports=router;