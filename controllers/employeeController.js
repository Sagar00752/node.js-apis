const { validationResult } = require('express-validator');
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const { enqueueEmailJob } = require('../queues/mailQueue');
// const nodemailer = require("nodemailer");


/**
 * @desc    Create a new employee
 * @route   POST /api/employees
 * @access  Admin
 */
async function createEmployee(req, res) {
  try {
    console.log("Request Body:", req.body);

    // Validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({ field: err.param, message: err.msg }))
      });
    }

    const { employeeid, firstname, email, position, department, hireDate, salary } = req.body;

    // Check existing
    // const existingUser = await Employee.findOne({ email });
    // if (existingUser) {
    //   return res.status(409).json({ success: false, message: 'Email already registered' });
    // }

    const newUser = new Employee({
      employeeid,
      firstname,
      email,
      position,
      department,
      hireDate,
      salary
    });
    await newUser.save();

    // -------- enqueue welcome email job (non-blocking) ----------
    const emailJob = {
      type: 'welcome_email',
      to: newUser.email,
      subject: 'Welcome to Sagar Company',
      templateData: {
        firstname: newUser.firstname,
        employeeid: newUser.employeeid
      },
      createdAt: new Date().toISOString()
    };

    // best-effort enqueue (we don't block the response on sending)
    enqueueEmailJob(emailJob).catch(err => {
      console.warn('enqueueEmailJob failed (logged only):', err && err.message ? err.message : err);
    });
    // --------------------------------------------------------------

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        id: newUser._id,
        employeeid: newUser.employeeid,
        firstname: newUser.firstname,
        position: newUser.position,
        department: newUser.department,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error creating employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error — please try again later'
    });
  }
}

async function updateEmployee(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }

    const { employeeid, firstname, email, position, department, hireDate, salary } = req.body;

    // Find and update employee
    const updatedEmployee = await Employee.findOneAndUpdate(
      { employeeid },
      { $set: req.body},
      { new: true } // return updated document
    );

    if (!updatedEmployee) {
      return res.status(409).json({
        success: false,
        message: 'Employee not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: updatedEmployee
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
}

async function deleteEmployee(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }

    const { employeeid } = req.body;

    if (!employeeid) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required for deletion'
      });
    }

    // Find and delete employee
    const deletedEmployee = await Employee.findOneAndDelete({ employeeid });

    if (!deletedEmployee) {
      return res.status(409).json({
        success: false,
        message: 'Employee not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
      data: deletedEmployee
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
}



module.exports = {
  createEmployee,
  updateEmployee,
  deleteEmployee
};

