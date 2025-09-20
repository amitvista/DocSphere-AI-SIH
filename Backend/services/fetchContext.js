// Backend/services/fetchContext.js
const Employee = require('../models/employee');
const Contract = require('../models/contract');
const Budget = require('../models/budget');
// etc.

async function fetchContext(query, role) {
  if (role === 'hr') {
    return {
      employees: await Employee.find({}).limit(5),
      payroll: await Payroll.find({}).limit(5),
    };
  }
  if (role === 'legal') {
    return { contracts: await Contract.find({}).limit(5) };
  }
  // … repeat for other roles
  if (role === 'admin') {
    return {
      employees: await Employee.find({}).limit(5),
      contracts: await Contract.find({}).limit(5),
      budgets: await Budget.find({}).limit(5),
    };
  }
}
