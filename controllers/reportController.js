// controllers/employeePdfReport.js
const PDFDocument = require('pdfkit');
const moment = require('moment');
const Employee = require('../models/Employee');

async function employeeReportPdf(req, res) {
  try {
    const employees = await Employee.find().lean();

    // create a PDF document and stream to response
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // Set headers so browser downloads the file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="employee_report_${moment().format('YYYYMMDD_HHmm')}.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Title
    doc.fontSize(18).text('Employee Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Generated: ${moment().format('YYYY-MM-DD HH:mm')}`, { align: 'center' });
    doc.moveDown(1);

    // Table headers
    const tableTop = doc.y + 10;
    const leftMargin = doc.page.margins.left;
    const columnWidths = {
      id: 70,
      name: 120,
      email: 150,
      position: 90,
      dept: 80,
      hire: 70,
      salary: 60,
      status: 40
    };

    // Draw header background
    doc.rect(leftMargin - 2, tableTop - 4, Object.values(columnWidths).reduce((a, b) => a + b, 0) + 10, 20).fillOpacity(0.1).fill('#eeeeee').fillOpacity(1);

    doc.fillColor('black').fontSize(9);
    let x = leftMargin;
    const rowHeight = 18;

    // Helper to draw text in column
    const drawCell = (text, x, y, width) => {
      doc.text(String(text ?? ''), x + 2, y + 4, {
        width: width - 4,
        ellipsis: true
      });
    };

    // Headers
    drawCell('Emp ID', x, tableTop, columnWidths.id); x += columnWidths.id;
    drawCell('Name', x, tableTop, columnWidths.name); x += columnWidths.name;
    drawCell('Email', x, tableTop, columnWidths.email); x += columnWidths.email;
    drawCell('Position', x, tableTop, columnWidths.position); x += columnWidths.position;
    drawCell('Department', x, tableTop, columnWidths.dept); x += columnWidths.dept;
    drawCell('Hire Date', x, tableTop, columnWidths.hire); x += columnWidths.hire;
    drawCell('Salary', x, tableTop, columnWidths.salary); x += columnWidths.salary;
    drawCell('S', x, tableTop, columnWidths.status);

    // Move cursor to first row
    let y = tableTop + rowHeight;

    // Rows
    doc.fontSize(9);
    for (const emp of employees) {
      // Handle page break
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      x = leftMargin;
      drawCell(emp.employeeid ?? '', x, y, columnWidths.id); x += columnWidths.id;
      drawCell(emp.firstname ?? '', x, y, columnWidths.name); x += columnWidths.name;
      drawCell(emp.email ?? '', x, y, columnWidths.email); x += columnWidths.email;
      drawCell(emp.position ?? '', x, y, columnWidths.position); x += columnWidths.position;
      drawCell(emp.department ?? '', x, y, columnWidths.dept); x += columnWidths.dept;
      const hire = emp.hireDate ? moment(emp.hireDate).format('YYYY-MM-DD') : '';
      drawCell(hire, x, y, columnWidths.hire); x += columnWidths.hire;
      drawCell(emp.salary ?? '', x, y, columnWidths.salary); x += columnWidths.salary;
      drawCell(emp.status !== undefined ? (emp.status === 1 ? 'Active' : 'Inactive') : '', x, y, columnWidths.status);

      // Optional: draw a separation line
      doc.moveTo(leftMargin - 2, y + rowHeight - 2).lineTo(leftMargin - 2 + Object.values(columnWidths).reduce((a,b)=>a+b,0) + 10, y + rowHeight - 2).strokeOpacity(0.05).stroke();

      y += rowHeight;
    }

    doc.end();
    // response will close when stream ends
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
}

module.exports = {
  employeeReportPdf
};
