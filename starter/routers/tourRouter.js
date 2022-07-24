const express = require('express');
const tourControllers=require('../controllers/tourControllers');
const authController=require('../controllers/authController');
const reviewsRouter = require("./reviewRouter");

const router = express.Router();

// router.route('/:tourId/reviews')
//     .post   (authController.protect, 
//             authController.restrictTo('user'),
//             reviewController.createReview)
router.use('/:tourId/reviews',reviewsRouter);

// router.param('id',tourControllers.validId)
router.route('/top-5-cheap')
    .get(   tourControllers.alliasTopTours,
            tourControllers.getAllTours);
router.route('/tours-stats')
    .get(   tourControllers.getToursStats);
router.route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourControllers.getToursWithin);
router.route('/distances/center/:latlng/unit/:unit')
    .get(tourControllers.getDistances);
router.route('/monthly-plan/:year')
    .get(   authController.protect,
            authController.restrictTo('admin','lead-guide','guide'),
            tourControllers.getMonthlyPlan);
router.route('/')
    .get(   tourControllers.getAllTours)
    .post(  authController.protect,
            authController.restrictTo('admin','lead-guide'),
            tourControllers.addTour);
router.route('/:id')
    .get(   tourControllers.getSpecificTour)
    .patch( authController.protect,
            authController.restrictTo('admin','lead-guide'),
            tourControllers.uploadTourImages,
            tourControllers.resizeTourImages,
            tourControllers.updateTour)
    .delete(authController.protect,
            authController.restrictTo('admin','lead-guide'),
            tourControllers.deleteTour);

module.exports = router;
