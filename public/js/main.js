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

async function switchToBSC(type) {
  const hexchainId = "0x" + Number(97).toString(16);
  const switched = await switch_to_Chain(hexchainId);
  const chainName = type === "Mainnet" ? "BSC" : "BSC testnet";
  const rpcUrls = ["https://data-seed-prebsc-1-s1.binance.org:8545"];
  const blockExplorerUrls = ["https://explorer.binance.org/smart-testnet"];
  if (!switched) {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: hexchainId,
          chainName,
          nativeCurrency: {
            name: "BNB",
            symbol: "BNB",
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
