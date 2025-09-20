const fetch = require("node-fetch"); 
const Employee = require("../models/employee");
const Payroll = require("../models/payroll");
const Contract = require("../models/contract");
const Transaction = require("../models/transaction");
const Project = require("../models/project");

async function fetchMongoContext(role, topic) {
  try {
    if (role === "hr") {
      if (topic === "employees") {
        const count = await Employee.countDocuments();
        return `HR Database: There are currently ${count} employees in the system.`;
      }
      if (topic === "payroll") {
        const payrolls = await Payroll.find().limit(5);
        return `Payroll sample: ${JSON.stringify(payrolls, null, 2)}`;
      }
    }

    if (role === "legal") {
      const contracts = await Contract.find().limit(3);
      return `Legal contracts sample: ${JSON.stringify(contracts, null, 2)}`;
    }

    if (role === "finance") {
      const tx = await Transaction.find().limit(5);
      return `Recent transactions: ${JSON.stringify(tx, null, 2)}`;
    }

    if (role === "engineer") {
      const projects = await Project.find().limit(3);
      return `Engineering projects sample: ${JSON.stringify(projects, null, 2)}`;
    }

    return "No database context found for this role/topic.";
  } catch (err) {
    console.error("Mongo fetch error:", err);
    return "Error fetching database context.";
  }
}

async function queryOllama(message, role, topic) {
  const mongoContext = await fetchMongoContext(role, topic);

  const finalPrompt = `
You are DocSphereAI. 
User role: ${role}
Topic: ${topic}

Database context: 
${mongoContext}

User question: ${message}
Answer clearly using the above context when relevant.
`;

  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "docsphereai:latest",
      prompt: finalPrompt,
      stream: false,
    }),
  });

  const data = await res.json();
  return data.response || "⚠️ AI did not respond.";
}

module.exports = { queryOllama };
