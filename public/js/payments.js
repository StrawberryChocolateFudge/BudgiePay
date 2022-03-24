(async function () {
  const payForm = document.getElementById("payForm");
  const errorSlot = document.getElementById("errorSlot");
  const chain = payForm.dataset.chain;
  const contractAddress = payForm.dataset.contractaddress;
  const currency = payForm.dataset.currency;

  if (window.ethereum === undefined) {
    window.open("https://metamask.io/", "_blank");
    return;
  }
  await requestAccounts();
  const address = await getAddress();
  const artifact = await (await fetch("/js/Payments.json")).text();
  const abi = JSON.parse(artifact).abi;
  const web3 = new Web3(window.ethereum);
  const contract = new web3.eth.Contract(abi, contractAddress);

  payForm.onsubmit = async (e) => {
    e.preventDefault();

    errorSlot.innerHTML = "";

    if (chain === "HARMONY") {
      // await switchToHarmony("Testnet");
    }

    let twitterHandle = document.getElementById("twitterHandle").value;

    if (twitterHandle.startsWith("@")) {
      twitterHandle = twitterHandle.slice(1);
    }

    const payamount = document.getElementById("payamount").value;
    const code = document.getElementById("2faCode").value;
    const body = JSON.stringify({
      twitterHandle,
      amount: payamount,
      address,
      code,
    });
    const res = await fetch("/one", {
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
    const { sig, amount, from, fromTwitterId, toTwitterId } = result;

    const onError = (err, receipt) => {
      errorSlot.innerHTML = `<p class="error text-align-center">An Error Occured While Sending The Transaction!</p>`;
    };
    const onReceipt = (receipt) => {
      const events = receipt.events;
      const Pay = events.Pay;
      const returnValues = Pay.returnValues;
      const tweet = composeTweet(
        twitterHandle,
        returnValues[0],
        amount,
        currency
      );
      const a = createNewAnchor(tweet);
      errorSlot.appendChild(a);
    };
    await payEth(
      sig.v,
      sig.r,
      sig.s,
      from,
      fromTwitterId,
      toTwitterId,
      amount,
      onError,
      onReceipt
    );
  };

  function composeTweet(twitterHandle, paymentId, amount, currency) {
    const txUri = encodeURI(
      `${location.origin}/${currency}/transaction?tx=${paymentId}`
    );

    const uri = `https://twitter.com/intent/tweet?text=Payment of ${amount} ${currency.toUpperCase()} with Budgie Pay to @${twitterHandle}&url=${txUri}`;
    const twitterText = encodeURI(uri);
    return twitterText;
  }

  function createNewAnchor(tweetURL) {
    const a = document.createElement("a");
    a.href = tweetURL;
    a.target = "_blank";
    a.rel = "noopener";
    a.text = "Payment Sent. Tweet about it!";
    a.classList.add("text-align-center");
    a.classList.add("marginBottom-20");
    return a;
  }

  async function payEth(
    v,
    r,
    s,
    from,
    fromTwitterId,
    toTwitterId,
    amount,
    onError,
    onReceipt
  ) {
    const value = web3.utils.toWei(amount);
    await contract.methods
      .payEth(v, r, s, from, fromTwitterId, toTwitterId, value)
      .send({ from, value })
      .on("error", onError)
      .on("receipt", onReceipt);
  }
})();
