const Web3 = require("web3");
const abi = require("./abi");
module.exports = { getWithdrawnAlready };

function getWeb3() {
  return new Web3(process.env["RPC"]);
}

async function getContract() {
  const web3 = getWeb3();

  return await new web3.eth.Contract(abi(), process.env["CONTRACTADDRESS"]);
}

async function getWithdrawnAlready(twitterId) {
  const contract = await getContract();
  return await contract.methods.getWithdrawnAlready(twitterId).call();
}
