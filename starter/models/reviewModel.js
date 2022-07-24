const mongoose = require('mongoose');
const Tour = require('./tourModel');


const reviewSchema = new mongoose.Schema({
    review: {
      type: String,
      required: [true, 'Please write something about your experiance of this tour'],
      trim:true //removes white spaces at the beggining and the end
    },
    rating: {
      type: Number,
      required: [true, 'Rating is a required field'],
      min:[1,'Rating should be between 1.00 to 5.00'],
      max:[5,'Rating should be between 1.00 to 5.00']
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    tour:
      {
        type:mongoose.Schema.ObjectId,
        ref:'Tour',
        required:[true,'Please specify tour id']
      },
    user:
      {
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:[true,'Please specify user id']
      }
  },{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
  });
  reviewSchema.index({tour:1,user:1},{unique:true});
  
  reviewSchema.pre(/^find/,function(next){
    this.populate({
        path:'user',
        select:'name photo'
      })
    //   .populate({
    //     path:'tour',
    //     select:'name'        
    //   });
      next();
  })
  reviewSchema.statics.calcAverageRatings=async function(tourId){
    //calculate tour's review stats
    const stats= await this.aggregate([
      {
        $match:{
          tour:tourId
        }
      },
      {
        $group:{
          _id: '$tour',
          nRatings:{$sum: 1},
          avgRatings:{$avg:"$rating"}
        }
      }
    ])
    //update tour's stats
    if (stats.length > 0) {
      await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: stats[0].nRatings,
        ratingsAverage: stats[0].avgRatings
      });
    } else {
      await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: 0,
        ratingsAverage: 4.5
      });
    }
  }
// create/save
  reviewSchema.post('save',function() {
    this.constructor.calcAverageRatings(this.tour);
  })
// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});


  const Review = mongoose.model('Review', reviewSchema);
  module.exports = Review;