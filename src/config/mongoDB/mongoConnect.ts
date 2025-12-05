import mongoose from 'mongoose';

const DBUSER = 'bunProject';
const DBPASS = 'bunServerProject';
const DBNAME = 'buncluster';

mongoose.set('strictQuery', true);
async function connectDBMongo() {
  mongoose
    .connect(
      `mongodb+srv://${DBUSER}:${DBPASS}@${DBNAME}.ctaafug.mongodb.net/`,
      {}
    )
    .then(() => {
      console.log(`Connected to ${DBNAME} database`);
    })
    .catch((err) => console.log(err));
}

async function disconnectDBMongo() {
  mongoose.disconnect().then(() => checkMongoDBStatus());
}

const checkMongoDBStatus = () => {
  //achicar if's
  let state: number = mongoose.connection.readyState;
  if (state === 1) {
    console.log('Connection to MongoDB is ready.');
  }
  if (state === 2) {
    console.log('Connection to MongoDB is in process.');
  }
  if (state === 0) {
    console.log('There is no connection.');
    connectDBMongo();
  }
  if (state === 3) {
    console.log('Disconnecting the MongoDB connection.');
  }
  if (state === 99) {
    console.log('Connection to MongoDB is uninitialized.');
  }
};

export { connectDBMongo, checkMongoDBStatus, disconnectDBMongo };
