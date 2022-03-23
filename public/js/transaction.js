(async function () {
  const main = document.getElementById("transaction-main");
  const authCodeEl = document.getElementById("2fa-code");
  const errorSlot = document.getElementById("errorSlot");

  if (window.ethereum === undefined) {
    window.open("https://metamask.io/", "_blank");
    return;
  }
  await requestAccounts();
  let address = await getAddress();
  const artifact = await (await fetch("/js/Payments.json")).text();
  const abi = JSON.parse(artifact).abi;
  const web3 = new Web3(window.ethereum);
  const paymentcontractaddress = main.dataset.paymentcontractaddress;
  const contract = new web3.eth.Contract(abi, paymentcontractaddress);
  const onError = (err, receipt) => {
    errorSlot.innerHTML = `<p class="error text-align-center">An Error Occured While Sending The Transaction!</p>`;
  };
  const onReceipt = (receipt) => {
    window.location.href = window.location.href;
  };
  async function refund(v, r, s, id, fromTwitterId, from) {
    await contract.methods
      .refund(v, r, s, id, fromTwitterId, from)
      .send({ from })
      .on("error", onError)
      .on("receipt", onReceipt);
  }
  async function withdraw(v, r, s, id, toTwitterId, from) {
    await contract.methods
      .withdraw(v, r, s, id, toTwitterId, from)
      .send({ from })
      .on("error", onError)
      .on("receipt", onReceipt);
  }
  const chain = main.dataset.chain;
  const id = main.dataset.id;
  const twitterid = main.dataset.twitterid;
  if (chain === "HARMONY") {
    //TODO: switch to harmony network
  }

  const refundButton = document.getElementById("refund-button");
  const withdrawButton = document.getElementById("withdraw-button");
  if (refundButton !== null) {
    refundButton.onclick = async function () {
      const body = JSON.stringify({ address, id, code: authCodeEl.value });

      const res = await fetch("/one/transaction/refund", {
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
      const { sig } = result;

      await refund(sig.v, sig.r, sig.s, id, twitterid, address);
    };
  }
  if (withdrawButton !== null) {
    withdrawButton.onclick = async function () {
      const body = JSON.stringify({ address, id, code: authCodeEl.value });

      const res = await fetch("/one/transaction/withdraw", {
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
      const { sig } = result;
      await withdraw(sig.v, sig.r, sig.s, id, twitterid, address);
    };
  }
  window.ethereum.on("accountsChanged", (accounts) => {
    // Handle the new accounts, or lack thereof.
    // "accounts" will always be an array, but it can be empty.
    if (accounts.length > 0) {
      address = accounts[0];
    }
  });

  ethereum.on("chainChanged", (chainId) => {
    // Handle the new chain.
    // Correctly handling chain changes can be complicated.
    // We recommend reloading the page unless you have good reason not to.
    window.location.reload();
  });
})();
