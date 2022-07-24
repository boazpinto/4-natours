const path=require('path');
const express = require('express');
const cookieParser=require('cookie-parser');
const morgan = require('morgan');
const rateLimit=require('express-rate-limit');
const helmet=require('helmet');
const mongoSanitize=require('express-mongo-sanitize');
const hpp=require('hpp');
const xss=require('xss-clean');
const tourRouter = require('./routers/tourRouter');
const usersRouter = require('./routers/usersRouter');
const reviewsRouter = require('./routers/reviewRouter');
const viewRouter = require('./routers/viewRouter');
const AppError =require('./utils/appError');
const globalErrorHandler=require('./controllers/errorController');


const app = express();

app.set('view engine','pug');
app.set('views', path.join(__dirname,'views'));

//GLOBAL MIDDLEWARES
//use static page
app.use(express.static(`${__dirname}/public`));

//set security http headers
app.use(helmet());

//set limit requests from same IP
const limiter=rateLimit({
  max:100,
  windowMS:60*60*1000,
  message:'Too many requests from this IP, please try again in an hour'
})
app.use('/api',limiter);

// data sanitization against noSQL query injections
app.use(mongoSanitize()); //against using {$gt:''} for example, by replacing the $ sign for example

// data sanitization against XSS
app.use(xss()); //replaces any html tags like <h> or <div> for example

//http parameters polutions
app.use(hpp({             // against wrong parameters use like multi use of same param: ?sort=duration&sort=name instead of ?sort=duration,name
  whitelist:['duration','ratingsQuantity','ratingsAverage','difficulty','maxGroupSize','price'] //sets up exeption (allows multi use of same param) allows ?duration=5&duration=9
})); 


//use morgan in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//use express json to parse the request body into req.body
app.use(express.json({limit:'10kb'})); //will not accept a body larger than 10kb

//use express urlencoded to parse request body into req.body from html form calls
app.use(express.urlencoded({extended:true,limit:'10kb'}));

// use cookie-parser to parse cookies to req.cookies
app.use(cookieParser());
//middleware to set the request time (later we will calculate the time the request took)
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//ROUTERS
app.use('/',viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewsRouter);

app.all('*',(req,res,next)=>{
  next(new AppError(`Can't find ${req.originalUrl} on this server`,404));
})

app.use(globalErrorHandler);

module.exports = app;
