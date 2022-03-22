const payForm = document.getElementById("payForm");
const errorSlot = document.getElementById("errorSlot");

payForm.onsubmit = async (e) => {
  e.preventDefault();
  const chain = payForm.dataset.chain;
  const contractAddress = payForm.dataset.contractaddress;
  errorSlot.innerHTML = "";
  if (window.ethereum === undefined) {
    window.open("https://metamask.io/", "_blank");
    return;
  }
  await requestAccounts();

  if (chain === "HARMONY") {
    // await switchToHarmony("Testnet");
  }

  const address = await getAddress();
  let twitterHandle = document.getElementById("twitterHandle").value;

  if (twitterHandle.startsWith("@")) {
    twitterHandle = twitterHandle.slice(1);
  }

  const payamount = document.getElementById("payamount").value;
  const body = JSON.stringify({ twitterHandle, amount: payamount, address });
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
  }
  const { sig, amount, from, fromTwitterId, toTwitterId } = result;

  const onError = (err, receipt) => {
    errorSlot.innerHTML = `<p class="error text-align-center">An Error Occured While Sending The Transaction!</p>`;
  };
  const onReceipt = (receipt) => {
    errorSlot.innerHTML = `<p class="text-align-center">Payment Sent!</p>`;
  };
  await payEth(
    contractAddress,
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

async function payEth(
  contractAddress,
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
  const artifact = await (await fetch("/js/Payments.json")).text();
  const abi = JSON.parse(artifact).abi;
  const web3 = new Web3(window.ethereum);
  const contract = new web3.eth.Contract(abi, contractAddress);
  const value = web3.utils.toWei(amount);
  await contract.methods
    .payEth(v, r, s, from, fromTwitterId, toTwitterId, value)
    .send({ from, value })
    .on("error", onError)
    .on("receipt", onReceipt);
}
