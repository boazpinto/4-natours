const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException',err=>{
  console.log(err.name,err.message);
  console.log('UNCAUGHT EXEPTIONS!! ⛔ SHUTTING DOWN !!');
  process.exit(1);
})

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

//const DB=process.env.DATABASE_LOCAL
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connection to DB Successful'));

const port = process.env.PORT || 3000;
const server=app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});


process.on('unhandledRejection',err=>{
  console.log(err.name,err.message);
  console.log('UNHANDLED REJECTION!! ⛔ SHUTTING DOWN !!');
  server.close(()=>{
    process.exit(1);
  })
})
