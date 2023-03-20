import Mongoose from 'mongoose';

export async function DBconnection() {
  const URL = process.env.MONGO_URI2;
  console.log(URL);
  Mongoose.set('strictQuery', false);
  try {
    const connection = Mongoose.connect(URL);
    const timelog = new Date();
    console.log(`SERVERLOG ${timelog} --> Connected to MongoDB.`);
    return connection;
  } catch (error) {
    const timelog = new Date();
    return console.log(`SERVERLOG ${timelog} --> Connection to MongoDB returned an error: ${error.message}`)
  }
}
