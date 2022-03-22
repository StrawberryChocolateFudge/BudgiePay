(async function () {
  if (window.ethereum === undefined) {
    window.open("https://metamask.io/", "_blank");
    return;
  }
  await requestAccounts();
  const address = await getAddress();
  const main = document.getElementById("transaction-main");
  const paymentcontractaddress = main.dataset.paymentcontractaddress;
  const chainid = main.dataset.chainid;
  const chain = main.dataset.chain;
  if (chain === "HARMONY") {
    //TODO: switch to harmony network
  }

  const refundButton = document.getElementById("refund-button");

  refundButton.onclick = async function () {
    console.log("refund button clicked");
    console.log(paymentcontractaddress);
    console.log(chainid);
    const body = JSON.stringify({ address, id });

    const res = await fetch("/one/transaction/refund", {
      method: "POST",
      body,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const result = await res.json();
    console.log(result);
  };
})();
