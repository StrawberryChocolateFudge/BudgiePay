function getWeb3() {
  if (window.ethereum === undefined) {
    window.open("https://metamask.io/", "_blank");
    return;
  }
  return new Web3(window.ethereum);
}

async function requestAccounts() {
  await window.ethereum.request({ method: "eth_requestAccounts" });
}

async function getAddress() {
  const web3 = new Web3(window.ethereum);
  const accounts = await web3.eth.getAccounts();
  return accounts[0];
}

async function switchToHarmony(type) {
  const chainName =
    type === "Mainnet" ? "Harmony Mainnet Shard 0" : "Harmony Testnet Shard 0";
  let chainId = type === "Mainnet" ? 1666600000 : 1666700000;

  const hexchainId = "0x" + Number(chainId).toString(16);
  const blockExplorerUrls =
    type === "Mainnet"
      ? ["https://explorer.harmony.one/#/"]
      : ["https://explorer.pops.one/#/"];

  const rpcUrls = getHarmonyRPCURLS(type);

  const switched = await switch_to_Chain(hexchainId);
  if (!switched) {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: "0x" + Number(chainId).toString(16),
          chainName,
          nativeCurrency: {
            name: "ONE",
            symbol: "ONE",
            decimals: 18,
          },
          rpcUrls,
          blockExplorerUrls,
        },
      ],
    });
  }
}

async function switch_to_Chain(chainId) {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
    return true;
  } catch (err) {
    return false;
  }
}

function getHarmonyRPCURLS(type) {
  if (type === "Mainnet") {
    return ["https://api.harmony.one"];
  } else if (type === "Testnet") {
    return ["https://api.s0.b.hmny.io"];
  }
}
