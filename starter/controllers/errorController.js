const AppError=require('../utils/appError');

const handleCastErrorDB=err=> {
  const message=`Invalid ${err.path}: ${err.value}`;
  return new AppError(message,400);
}
const handleDuplicateFields=(err)=>{
  //const value=err.errmsg.match(/(["'])(\\?.)*?\1/); // in my version err dont have errmsg , but in general this regular expression supposed to get the text inside quotes
  const message=`Duplicate Tour name: ${err.keyValue.name}`;
  return new AppError(message,400);
}
const handleValidationDB=(err)=>{
  const message= Object.values(err.errors).map(el=>el.message).join(". ");
  return new AppError(message,400);
}
const handleTokenError=(err)=>new AppError('Invalid Token, Please login again',401);

const handleTokenExpired=err=>new AppError('Token Expired, Please login again',401);

const sendErrorDev=(err,req,res)=>{
  //API
  if (req.originalUrl.startsWith('/api')){
    return res.status(err.statusCode).json({
      status:err.status,
      error:err,
      message:err.message,
      stack:err.stack
    })  
  }
  //RENDERed website
  return res.status(err.statusCode).render('error',{
    title:'something went wrong!',
    msg:err.message
  })
}
const sendErrorProd=(err,req,res)=>{
  //API
  if (req.originalUrl.startsWith('/api')){
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status:err.status,
        message:err.message
    }) 
    }
    return res.status(500).json({
      status:'Error',
      message:'Something went wrong!!!'
  }) 
  }
  if (err.isOperational) {
    return res.status(err.statusCode).render('error',{
            title:'something went wrong!',
            msg:err.message
  }) 
  }
  return res.status(500).render('error',{
            title:'something went wrong!',
            msg:'Something went wrong!!!'
    }) 
}

module.exports=(err,req,res,next)=>{
    let error={...err};
    error.message=err.message;
    
    error.statusCode=error.statusCode || 500;
    error.status=error.status || 'error';
    if (process.env.NODE_ENV==='development') {
      sendErrorDev(error,req,res);
    } else {
      if (error.kind==='ObjectId') error=handleCastErrorDB(error);
      if (error.code && error.code===11000) error=handleDuplicateFields(error);
      if (error.errors && Object.values(error.errors)[0].name==='ValidatorError')  error=handleValidationDB(error);
      //if (error._message.includes('validation failed'))  error=handleValidationDB(error);
      if (error.name && error.name==='JsonWebTokenError') error=handleTokenError(error);
      if (error.name && error.name==='TokenExpiredError') error=handleTokenExpired(error);
      sendErrorProd(error,req,res)
    };
  }