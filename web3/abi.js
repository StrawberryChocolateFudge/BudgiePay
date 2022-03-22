const budgeCoin = require("../public/js/BudgieCoin.json");
const payments = require("../public/js/Payments.json");
module.exports = { budgeCoinAbi, paymentsAbi };

function budgeCoinAbi() {
  return budgeCoin.abi;
}

function paymentsAbi() {
  return payments.abi;
}
