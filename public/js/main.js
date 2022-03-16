const withdrawBttn = document.getElementById("withdrawButton");

withdrawBttn.onclick = async function () {
  const theFollowerTokenAddress = withdrawBttn.dataset.thefollowertokenaddress;
  const walletconnected = withdrawBttn.dataset.walletconnected;
  if (walletconnected === "false") {
    if (window.ethereum === undefined) {
      window.open("https://metamask.io/", "_blank");
      return;
    }
    await requestAccounts();
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
