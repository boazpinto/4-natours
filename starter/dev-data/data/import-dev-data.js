const fs=require('fs');
const mongoose = require('mongoose');
const Tour=require('../../models/tourModel');
const Review=require('../../models/reviewModel');
const User=require('../../models/userModel');


const DB = 'mongodb+srv://boaz:Lbbm1397@cluster0.g9hlahd.mongodb.net/natours?retryWrites=true&w=majority';

const tours=JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, {encoding:'utf8', flag:'r'})).map((elm)=>{
    delete elm.id;
    return elm;
})
const users=JSON.parse(fs.readFileSync(`${__dirname}/users.json`, {encoding:'utf8', flag:'r'})).map((elm)=>{
    delete elm.id;
    return elm;
})
const reviews=JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, {encoding:'utf8', flag:'r'})).map((elm)=>{
    delete elm.id;
    return elm;
})
const deleteAll= async ()=> {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Successful Deleted');
        process.exit();
    } catch (err) {
        console.log(err)
        process.exit();
    }
}
const creatAll= async ()=> {
    try {
        await Tour.create(tours);
        await User.create(users,{validateBeforeSave:false});
        await Review.create(reviews);
        console.log('Successful Created');
        process.exit();
    } catch (err) {
        console.log(err);
        process.exit();
    }
}

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connection to DB Successful'));

if (process.argv[2]==='--delete') {
    deleteAll();
} else if (process.argv[2]==='--import') {
    creatAll();
}
