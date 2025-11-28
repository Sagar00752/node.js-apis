const { model, Schema } = require('mongoose');

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,        
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {                     
    type: String,
    enum: ['admin', 'manager', 'user'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  token: { type: String, default: null },            // store current active JWT (or a hash)
  tokenExpires: { type: Date, default: null }        // when token was issued to expire (optional)
}, { collection: 'users' });  

module.exports = model('User', userSchema);
