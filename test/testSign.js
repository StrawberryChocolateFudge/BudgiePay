const { sign } = require("../web3/sign");
const ethUtil = require("ethereumjs-util");
require("dotenv").config();

(function test1() {
  console.log("Testing signing");
  const [sig, address] = sign(
    "1234567891234",
    "12",
    "0xDF16399E6F10bbC1C07C88c6c70116182FA2e118"
  );

  console.log("r: ", ethUtil.bufferToHex(sig.r));
  console.log("s: ", ethUtil.bufferToHex(sig.s));
  console.log("v: ", sig.v);
  console.log("Public key: ", ethUtil.bufferToHex(address));
})();

(function test1() {
  console.log(
    "Testing signing with different address to match the smart contract tests"
  );
  const [sig, address] = sign(
    "1234567891212121",
    "1000000000",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
  );

  console.log("r: ", ethUtil.bufferToHex(sig.r));
  console.log("s: ", ethUtil.bufferToHex(sig.s));
  console.log("v: ", sig.v);
  console.log("Public key: ", ethUtil.bufferToHex(address));
})();
