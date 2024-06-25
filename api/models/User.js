/**
 * User model for the MongoDB database.
 * @module models/User
 */

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * User schema definition.
 * @typedef {Object} UserSchema
 * @property {string} username - Username.
 * @property {string} password - Password.
 * @property {string} email - Email.
 */

/**
 * User schema.
 * @type {UserSchema}
 */
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
  }
});

/**
 * User model.
 * @type {mongoose.Model<UserSchema>}
 */
const UserModel = model('User', UserSchema);

export default UserModel;
