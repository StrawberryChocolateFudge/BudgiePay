const withdrawBttn = document.getElementById("withdrawButton");

if (withdrawBttn !== null) {
  withdrawBttn.onclick = async function () {
    const budgiecoinaddress = withdrawBttn.dataset.budgiecoinaddress;
    const walletconnected = withdrawBttn.dataset.walletconnected;
    if (walletconnected === "false") {
      if (window.ethereum === undefined) {
        window.open("https://metamask.io/", "_blank");
        return;
      }
      await requestAccounts();
      // await switchToBSC("Testnet");
      const address = await getAddress();
      window.location.href = window.location.href + "?address=" + address;
      // now refresh the page with the address
    } else {
      //Parse the address from the URL
      const address = window.location.search.split("?address=")[1];
      const signedargs = JSON.parse(withdrawBttn.dataset.signedargs);
      const signature = JSON.parse(withdrawBttn.dataset.signature);
      const artifact = await (await fetch("/js/BudgieCoin.json")).text();
      const abi = JSON.parse(artifact).abi;

      await mintbudgiecoin(
        signedargs,
        signature,
        budgiecoinaddress,
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

async function verifySignature(
  signedargs,
  signature,
  contractaddress,
  abi,
  address
) {
  const web3 = new Web3(window.ethereum);
  const contract = new web3.eth.Contract(abi, contractaddress);
  const res = await contract.methods
    .verifySignature(
      signature.v,
      signature.r,
      signature.s,
      signedargs.twitterid,
      signedargs.followerscount,
      signedargs.address
    )
    .call({ from: address });
  return res;
}

async function mintbudgiecoin(
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
    .mintBudgieCoin(
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
    const budgiecoinaddress = addTokensToWallet.dataset.budgiecoinaddress;
    await watchAsset(budgiecoinaddress);
  };
}

async function watchAsset(budgiecoinaddress) {
  await window.ethereum
    .request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: budgiecoinaddress,
          symbol: "BGC",
          decimals: 18,
        },
      },
    })
    .then((success) => {})
    .catch(console.error);
}
