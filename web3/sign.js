const ethUtil = require("ethereumjs-util");
const abi = require("ethereumjs-abi");

const chainId = 31337;

function sign(twitterId, followers, authorizedAddress) {
  const domainTypeHash = ethUtil.keccak256(
    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
  );
  const nameHash = ethUtil.keccak256("TheFollowerToken");
  const versionHash = ethUtil.keccak256("1");
  const eip712DomainHash = ethUtil.keccak256(
    abi.rawEncode(
      ["bytes32", "bytes32", "bytes32", "uint256", "address"],
      [
        domainTypeHash,
        nameHash,
        versionHash,
        chainId,
        process.env["CONTRACTADDRESS"],
      ]
    )
  );
  const structTypeHash = ethUtil.keccak256(
    "doc(string twitterId,uint256 followers,address authorizedAddress)"
  );
  const twitterIdHash = ethUtil.keccak256(twitterId);
  const followersHash = ethUtil.keccak256(
    abi.rawEncode(["uint256"], [followers])
  );
  const authorizedAddressHash = ethUtil.keccak256(
    abi.rawEncode(["address"], [authorizedAddress])
  );
  const hashStruct = ethUtil.keccak256(
    abi.rawEncode(
      ["bytes32", "bytes32", "bytes32", "bytes32"],
      [structTypeHash, twitterIdHash, followersHash, authorizedAddressHash]
    )
  );

  const concatedHash = ethUtil.keccak256(
    Buffer.concat([Buffer.from("1901", "hex"), eip712DomainHash, hashStruct])
  );
  const privateKeyBuff = Buffer.from(
    process.env["PRIVATEKEY"].split("0x")[1],
    "hex"
  );

  const address = ethUtil.privateToAddress(process.env["PRIVATEKEY"]);

  sig = ethUtil.ecsign(concatedHash, privateKeyBuff);

  return [sig, address];
}

module.exports = { sign };
