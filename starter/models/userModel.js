const crypto = require('crypto');
const mongoose = require('mongoose');
const validator=require('validator');
const bcrypt=require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'Please tell us your name!']
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: {
      type: String,
      default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        // This only works on CREATE and SAVE!!!
        validator: function(el) {
          return el === this.password;
        },
        message: 'Passwords are not the same!'
      }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false
    }
  });

  userSchema.pre('save', async function(next){
    if(!this.isModified('password') || this.isNew) return next();
    
    //update the change password date
    this.passwordChangedAt=Date.now()-1000; // -1000 to prevent the token to be issued before the passwordChangedAt

    next();
  })
  userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();

    //hash the password
    this.password= await bcrypt.hash(this.password,12);
    this.passwordConfirm= undefined;

    next();
  })
  userSchema.pre('save', async function(next){
    if (this.role==='admin') this.role='user'
    next();
  })
  userSchema.methods.correctPassword=async function(candidatePassword,userPassword){
    return await bcrypt.compare(candidatePassword,userPassword);
  }
  userSchema.methods.passwordChangedAfter=(function(TWTTimeStamp){
    if (this.passwordChangedAt) {
        const passwordChangedTimeStamp=parseInt(this.passwordChangedAt.getTime()/1000,10);
        return passwordChangedTimeStamp>TWTTimeStamp;
    }
    return false;
  })
  userSchema.methods.createResetToken= function(){
    const resetToken=crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.passwordResetExpires=Date.now() + 10*60*1000;
    return resetToken;
  }
  //query middleware
  userSchema.pre(/^find/,function(next){ // we use here a regular expression by the / /
                                        //  and the ^find means starts with 'find'
                                        //  this way this middleware will run before any find method (find,findOne)
    this.find({active: {$ne:false}})
    next();
})


  const User = mongoose.model('User', userSchema);
  
  module.exports = User;