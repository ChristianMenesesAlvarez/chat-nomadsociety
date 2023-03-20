import Mongoose from 'mongoose';

export async function DBconnection() {
  const URL = process.env.MONGO_URI2;
  Mongoose.set('strictQuery', false);
  try {
    const connection = Mongoose.connect("mongodb+srv://admin:admin@testdb.is3yx9o.mongodb.net/?retryWrites=true&w=majority");
    const timelog = new Date();
    console.log(`SERVERLOG ${timelog} --> Connected to MongoDB.`);
    return connection;
  } catch (error) {
    const timelog = new Date();
    return console.log(`SERVERLOG ${timelog} --> Connection to MongoDB returned an error: ${error.message}`)
  }
}
