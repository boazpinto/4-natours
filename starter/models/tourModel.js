const mongoose = require('mongoose');
const slugify=require('slugify');
// const User=require('./userModel');


//const validator=require('validator');

const tourSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: [true, 'This tour name allready exists'],
      trim:true, //removes white spaces at the beggining and the end
      maxlength:[40,'A tour name must have up to 40 characters'],
      minlength:[10,'A tour name must have al least 10 characters']
      // validate: [validator.isAlpha,'Tour name must only contain Alpha Numeric characters']
    },
    slug:String,
    duration: {
      type: Number,
      required:[true,'A tour must have a duration'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min:[1,'Rating should be between 1.00 to 5.00'],
      max:[5,'Rating should be between 1.00 to 5.00'],
      set: val=>Math.round(val*10)/10
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    maxGroupSize:{
      type: Number,
      required:[true,'A tour must have a Max Group Size'],
    },
    difficulty:{
      type: String,
      required:[true,'A tour must have a Difficulty'],
      enum:{
        values:['easy','medium','difficult'],
        message:'Difficulty must be easy,medium or difficult'
      }
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate : {
        validator:function (val){
          return val<=this.price; //this. will only be available on new document and not on updated document
        },
        message:'Discount ({VALUE}) should be less than price'
      }
    },
    summary: {
      type: String,
      trim:true, //removes white spaces at the beggining and the end
      required:[true,'A tour must have a summary']
    },
    description: {
      type: String,
      trim:true //removes white spaces at the beggining and the end
    },
    imageCover: {
      type: String,
      trim:true, //removes white spaces at the beggining and the end
      required:[true,'A tour must have a a Cover Image']
    },
    images:[String],
    createdAt:{
      type: Date,
      default: Date.now(),
      select:false
    },
    startDates:[Date],
    secretTour:{
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides:[
      {
        type:mongoose.Schema.ObjectId,
        ref:'User'
      }
    ]
  },{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
  });

  tourSchema.index({price:1,ratingsAverage:-1});
  tourSchema.index({slug:1});
  tourSchema.index({ startLocation: '2dsphere' });
//virtual properties
  tourSchema.virtual('durationWeeks').get(function(){
    return this.duration/7;
  })
  //virtual populate
  tourSchema.virtual('reviews',{
    ref:'Review',
    foreignField:'tour',
    localField:'_id'
  })
//DOCUMENT middleware this. refers to the document
//this middlewares will run before the .create or .save 
tourSchema.pre('save',function(next){
  this.slug=slugify(this.name,{lower:true});
  next();
})
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save',(next)=>{
//   console.log('Will save document....');
//   next();
// })

//this middlewares will run after the .create or .save 
// tourSchema.post('save',(doc,next)=>{
//   console.log(`Document saved:\n${doc}`);
//   next();
// })


//QUERY middleware this. refers to the query
//this middlewares will run before the .find
tourSchema.pre(/^find/,function(next){ // we use here a regular expression by the / /
                                      //  and the ^find means starts with 'find'
                                      //  this way this middleware will run before any find method (find,findOne)
  this.find({secretTour: {$ne:true}});

  this.start=Date.now();
  next();
})
//this query middleware will retrieve the guides from User 
tourSchema.pre(/^find/,function(next){
  this.populate({
    path:'guides',
    select:'-__v -passwordChangedAt'
  });
  next();
})


//this middlewares will run after the .find
tourSchema.post(/^find/,function(docs,next){ 
console.log(`This query took ${Date.now()-this.start} milliseconds.`)
next();
})

//AGGREGATION MIDDLEWARE this. refers to the aggregation object
// tourSchema.pre('aggregate',function(next){ 
//   this._pipeline.unshift({'$match':{secretTour:{$ne:true}}}); //unshift pushes and object at the beginning of array
//   console.log(this._pipeline);
//   next();
//   })

  const Tour = mongoose.model('Tour', tourSchema);
  
  module.exports = Tour;