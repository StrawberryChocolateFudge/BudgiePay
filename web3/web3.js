const Web3 = require("web3");
const { budgeCoinAbi, paymentsAbi } = require("./abi");
const { keccak256, bufferToHex } = require("ethereumjs-util");

let web3;

function getWeb3(rpc) {
  if (web3 === undefined) {
    web3 = new Web3(rpc);
  }
  return web3;
}

async function getBudgieCoinContract() {
  const rpc = process.env["RPC"];
  const tokenAddress = process.env["TOKENADDRESS"];
  const web3 = getWeb3(rpc);
  return await new web3.eth.Contract(budgeCoinAbi(), tokenAddress);
}

async function getWithdrawnAlready(twitterId) {
  const contract = await getBudgieCoinContract();
  return await contract.methods.getWithdrawnAlready(twitterId).call();
}

async function getPaymentContract() {
  const web3 = getWeb3(process.env["RPC"]);
  const paymentTokenAddress = process.env["PAYMENTCONTRACTADDRESS"];
  return await new web3.eth.Contract(paymentsAbi(), paymentTokenAddress);
}

async function getPaymentById(id) {
  const contract = await getPaymentContract();
  return await contract.methods.getPaymentById(id).call();
}

async function hashTwitterId(twitterId) {
  const buff = keccak256(Buffer.from(twitterId));
  return bufferToHex(buff);
}

module.exports = {
  getWithdrawnAlready,
  getPaymentById,
  hashTwitterId,
};
