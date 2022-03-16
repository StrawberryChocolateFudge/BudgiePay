const THEFOLLOWERTOKENADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const withdrawBttn = document.getElementById("withdrawButton");

if (withdrawBttn !== null) {
  withdrawBttn.onclick = async function () {
    const theFollowerTokenAddress =
      withdrawBttn.dataset.thefollowertokenaddress;
    const walletconnected = withdrawBttn.dataset.walletconnected;
    if (walletconnected === "false") {
      if (window.ethereum === undefined) {
        window.open("https://metamask.io/", "_blank");
        return;
      }
      await requestAccounts();
      await switchToBSC("Testnet");
      const address = await getAddress();
      window.location.href = window.location.href + "?address=" + address;
      // now refresh the page with the address
    } else {
      //Parse the address from the URL
      const address = window.location.search.split("?address=")[1];
      const signedargs = JSON.parse(withdrawBttn.dataset.signedargs);
      const signature = JSON.parse(withdrawBttn.dataset.signature);
      const artifact = await (await fetch("/js/thefollowertoken.json")).text();
      const abi = JSON.parse(artifact).abi;
      await mintFollowerToken(
        signedargs,
        signature,
        theFollowerTokenAddress,
        abi,
        address
      );
    }
  };
}

window.ethereum.on("accountsChanged", (accounts) => {
  // Handle the new accounts, or lack thereof.
  // "accounts" will always be an array, but it can be empty.
  window.location.href = window.location.origin + window.location.pathname;
});

ethereum.on("chainChanged", (chainId) => {
  // Handle the new chain.
  // Correctly handling chain changes can be complicated.
  // We recommend reloading the page unless you have good reason not to.
  window.location.reload();
});

async function requestAccounts() {
  await window.ethereum.request({ method: "eth_requestAccounts" });
}

async function getAddress() {
  const web3 = new Web3(window.ethereum);
  const accounts = await web3.eth.getAccounts();
  return accounts[0];
}

async function mintFollowerToken(
  signedargs,
  signature,
  contractaddress,
  abi,
  address
) {
  const web3 = new Web3(window.ethereum);
  const contract = new web3.eth.Contract(abi, contractaddress);
  function onError(error, receipt) {
    window.location.href = window.location.href;
  }
  function onReceipt(receipt) {
    window.location.href = window.location.href;
  }
  await contract.methods
    .mintFollowerToken(
      signature.v,
      signature.r,
      signature.s,
      signedargs.twitterid,
      signedargs.address,
      signedargs.followerscount
    )
    .send({ from: address })
    .on("error", onError)
    .on("receipt", onReceipt);
}

const addTokensToWallet = document.getElementById("add-tokens-to-wallet");

if (addTokensToWallet !== null) {
  addTokensToWallet.onclick = async function () {
    await watchAsset();
  };
}

async function watchAsset() {
  await window.ethereum
    .request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: THEFOLLOWERTOKENADDRESS,
          symbol: "TFT",
          decimals: 18,
        },
      },
    })
    .then((success) => {})
    .catch(console.error);
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
