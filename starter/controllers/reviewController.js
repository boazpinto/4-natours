// const APIFeatures=require('../utils/apiFeatures');
// const catchASync=require('../utils/catchASync');
// const AppError=require('../utils/appError');
const Review=require('../models/reviewModel');
const factory=require('./handlerFactory');

//operations

exports.setTour =(req, res,next) => {
    req.query.tour=req.query.tour || req.params.tourId;
    next();
};

exports.setUserAndTourId= (req, res,next) => {
    req.body.user=req.body.user || req.user._id;
    req.body.tour=req.body.tour || req.params.tourId;
    next();
};
exports.getSpecificReview =factory.getOne(Review);
exports.getAllReviews = factory.getAll(Review);
exports.deleteReview=factory.deleteOne(Review);
exports.updateReview=factory.updateOne(Review);
exports.addReview = factory.addOne(Review);
