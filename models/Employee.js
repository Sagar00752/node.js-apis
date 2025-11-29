const { model, Schema } = require('mongoose');

const employeeSchema = new Schema({
employeeid: {
  type: String,
  required: true,
  unique: true,
  trim: true,
  match: /^[A-Za-z0-9-_]+$/ // allow letters, numbers, hyphen, underscore
},
  firstname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  salary: {
    type: Number,
    required: true
  },
  status: {
  type: Number,
  default: 0 
}
}, { collection: 'employees' });

module.exports = model('Employee', employeeSchema);