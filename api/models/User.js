import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    min: 4,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['admin', 'author', 'user'],
    default: 'user'
  },
  isAuthorized: {
    type: Boolean,
    default: false
  }
});

const UserModel = model('User', UserSchema);

export default UserModel;