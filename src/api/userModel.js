import Mongoose from 'mongoose';

const userSchema = new Mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    default: 'client',
  },
});

const user = Mongoose.connection.model('user', userSchema, 'users');

export default user;