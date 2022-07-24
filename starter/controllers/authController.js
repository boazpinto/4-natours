const crypto = require('crypto');
const {promisify} =require('util');
const jwt=require('jsonwebtoken');
const User=require('../models/userModel');
const catchASync=require('../utils/catchASync');
const AppError=require('../utils/appError');
const Email=require('../utils/email');

const cookieOptions={
    expires: new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
    httpOnly:true
}
if (process.env.NODE_ENV==='production') cookieOptions.secure=true;

const cryptoToken=token=>{
    const hashToken=crypto
                            .createHash('sha256')
                            .update(token)
                            .digest('hex');
    return hashToken;
};

const jwtCreateToken= id=>jwt.sign({id},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN});

const createSendToken=(user,statusCode,res)=>{
    const token=jwtCreateToken(user._id);
    res.cookie('jwt',token,cookieOptions);
    user.password=undefined;
    res.status(statusCode).json({
        status:'success',
        token,
        data:{
            user
        }
    })
}


exports.signup = catchASync(async (req,res,next)=>{
    const newUser=await User.create({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        passwordConfirm:req.body.passwordConfirm,
        passwordChangedAt:req.body.passwordChangedAt,
        photo:req.body.photo,
        role:req.body.role
    
    });
    const url=`${req.protocol}://${req.get('host')}/me`;
    // console.log(newUser);
    // console.log(url);
    await new Email(newUser,url).sendWelcome();
    createSendToken(newUser,201,res);

})

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    res.status(200).json({ status: 'success' });
  };
  

exports.login= catchASync(async (req,res,next)=>{
    const {email,password}=req.body;
    if (!email || !password){
        return next(new AppError('Email and Password are required to login!!!',400));
    }
    const user=await User.findOne({email}).select('+password');

    if (!user || !await user.correctPassword(password,user.password)) {
         return next(new AppError('Email or Password are Incorrect!!!',401));
    }
    createSendToken(user,200,res);
})

exports.isLogedIn= async(req,res,next)=>{
    try{
        if (req.cookies.jwt) {

            //verify token from the cookie
            const decoded=await promisify(jwt.verify)(req.cookies.jwt,process.env.JWT_SECRET);

            //check if the user of this token still exists
            const user=await User.findById(decoded.id);
            if (!user) return next()
            //check if the user has changed his password after issuing this token
            if (user.passwordChangedAfter(decoded.iat)) return next();

            //there is a loged in user
            res.locals.user=user;
            next();
        } else return next();
    } catch (err) {
        return next()
    }
}


exports.protect= catchASync(async(req,res,next)=>{
    let token;
    //check if token sent in authorization header and than verify the token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token=req.headers.authorization.split(' ')[1];
    }  else if (req.cookies.jwt) token=req.cookies.jwt;
    if (!token) return next(new AppError('Please log in!!!',401));
 
    const decoded=await promisify(jwt.verify)(token,process.env.JWT_SECRET);

    //check if the user of this token still exists
    const user=await User.findById(decoded.id);
    if (!user) return next(new AppError('Token is no longer relevant because the user no longer exists!!!',401))

    //check if the user has changed his password after issuing this token
    if (user.passwordChangedAfter(decoded.iat))  return next(new AppError('User has changed his password, please log in again!!!',401))

    //token and user have been verified and access is grated to continue
    req.user=user;
    res.locals.user=user;
 
    next();
})

exports.restrictTo=(...roles)=> (req,res,next)=>{ 
    if (!roles.includes(req.user.role)) return next(new AppError('You do not have permission to perform this action!!!',403));
    next();
}

exports.forgotPassword= catchASync(async(req,res,next)=>{
 
    //get the email and check that it exists
 
    const user=await User.findOne({email:req.body.email});

    if (!user) return next(new AppError('Email not found!!!',404));

    //create reset password token and save the user withe the new reset token and expiration date
    const resetToken= await user.createResetToken();
    await user.save({validateBeforeSave:false});

    //send the reset password token to the user by email
    const resetURL=`${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    // const message=`Reset your password by submitting new password and passwordConfirm to this URL: ${resetURL}\nIf you didnt forget your password please ignore this message.`;
    // const subject='Your reset password token from natours'
    try{
        await new Email(user,resetURL).sendPasswordReset();

        res.status(200).json({
            status:'Success',
            message:'Token sent to Email'
        }) 
    }catch(err){
        user.passwordResetToken=undefined;
        user.passwordResetExpires=undefined;
        await user.save({validateBeforeSave:false});
        return next(new AppError('Error sending the email, please try again later',500))
    }

})

exports.resetPassword=catchASync(async (req,res,next)=>{
    //get temp token and new password and check if temp token exists
    const {token}=req.params;
    const {password,passwordConfirm}=req.body;
 
    const user=await User.findOne({passwordResetToken:cryptoToken(token),passwordResetExpires:{$gte:Date.now()}});

    if (!user) return next(new AppError('Invalid token or token expired!!!',400));

    //replace the password
    user.password=password;
    user.passwordConfirm=passwordConfirm;
    user.passwordResetToken=undefined;
    user.passwordResetExpires=undefined;

    await user.save();
    createSendToken(user,200,res);
})

exports.updatePassword=catchASync(async (req,res,next)=>{

    //get user's old password,new password, new password cofirmed
    const {password,newPassword,newPasswordConfirm}=req.body;
    const user=await User.findOne({_id:req.user._id}).select('+password');

    //check if old password is correct
    const confirmOldPass=await user.correctPassword(password,user.password);

    if (!confirmOldPass) return next(new AppError('Password is not correct, if you forgot your password, please use forgotPassword call',401));
    //replace the password
    user.password=newPassword;
    user.passwordConfirm=newPasswordConfirm;

    await user.save();
    createSendToken(user,200,res);
})


