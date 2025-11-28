const express = require('express');
const { body } = require('express-validator');
const { createEmployee , updateEmployee , deleteEmployee} = require('../controllers/employeeController');
const { employeeReportPdf } = require('../controllers/reportController');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @desc Create a new employee
 * @route POST /api/employees
 * @access Admin
 */
router.post(
  '/employees',
  authMiddleware, // OK to authenticate first, just ensure this calls next()
  [
    // Use the exact field names from your schema
    body('firstname')
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),

    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format'),

    body('position')
      .notEmpty().withMessage('Position is required'),

    body('department')
      .notEmpty().withMessage('Department is required'),

    // hireDate should be an ISO date — use isISO8601
    body('hireDate')
      .optional()
      .isISO8601().withMessage('hireDate must be a valid ISO 8601 date (e.g. 2025-11-25)'),

    // salary should be a number
    body('salary')
      .notEmpty().withMessage('Salary is required')
      .isNumeric().withMessage('Salary must be a number')
  ],
  createEmployee
);
router.post('/updatemployee',  authMiddleware, updateEmployee);

router.post('/deleteemployee',  authMiddleware , deleteEmployee);

router.get('/report', employeeReportPdf);

module.exports = router;
