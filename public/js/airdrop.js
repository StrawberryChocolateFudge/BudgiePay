(async function () {
  const withdrawBttn = document.getElementById("withdrawButton");
  const errorSlot = document.getElementById("errorSlot");

  if (window.ethereum === undefined) {
    window.open("https://metamask.io/", "_blank");
    return;
  }
  await requestAccounts();
  const artifact = await (await fetch("/js/BudgieCoin.json")).text();
  const abi = JSON.parse(artifact).abi;
  const address = await getAddress();
  await switchToHarmony("Testnet");

  const twoFaEl = document.getElementById("2fa-code");

  if (withdrawBttn !== null) {
    withdrawBttn.onclick = async function (e) {
      const budgiecoinaddress = withdrawBttn.dataset.budgiecoinaddress;

      errorSlot.innerHTML = "";
      e.preventDefault();
      const body = JSON.stringify({ address, code: twoFaEl.value });
      const res = await fetch("/airdrop", {
        method: "POST",
        body,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      const result = await res.json();
      if (result.error) {
        errorSlot.innerHTML = `<p class="error text-align-center">${result.errorMessage}</p>`;
        return;
      }
      const { signature, signedargs } = result;

      await mintbudgiecoin(
        signedargs,
        signature,
        budgiecoinaddress,
        abi,
        address
      );
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
})();
