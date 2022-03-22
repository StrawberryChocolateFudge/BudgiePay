(async function init() {
  const main = document.getElementById("history");
  const recievedDetails = document.getElementById("recieved-details");
  const recievedContent = document.getElementById("recieved-details-content");
  const recievedSummary = document.getElementById("recieved-summary");
  const recievedCount = document.getElementById("recieved-count");

  const sentDetails = document.getElementById("sent-details");
  const sentContent = document.getElementById("sent-details-content");
  const sentSummary = document.getElementById("sent-summary");
  const sentCount = document.getElementById("sent-count");

  const web3 = getWeb3();
  await requestAccounts();
  const address = await getAddress();
  const artifact = await (await fetch("/js/Payments.json")).text();
  const abi = JSON.parse(artifact).abi;
  const paymentContractAddress = main.dataset.paymentcontractaddress;
  const currency = main.dataset.currency;
  const contract = new web3.eth.Contract(abi, paymentContractAddress);
  let recievedInterval;
  let sentInterval;
  const intervalTime = 1000;
  recievedDetails.onclick = async function (e) {
    // The open property gets set after clicking, so I have to handle it the opposite way
    if (!recievedDetails.open) {
      const path = e.composedPath();
      if (path.includes(recievedSummary)) {
        const twitterId = main.dataset.twitterid;
        const ids = await getRecievedIds(twitterId);
        renderTable(ids, recievedContent, "recieved");
        recievedCount.innerHTML = ` (${ids.length})`;
      }
    } else {
      const path = e.composedPath();
      if (!path.includes(recievedContent) && path.includes(recievedSummary)) {
        recievedCount.innerHTML = "";
        removeTable(recievedContent, "recieved");
      }
    }
  };

  sentDetails.onclick = async function (e) {
    if (!sentDetails.open) {
      const path = e.composedPath();
      if (path.includes(sentSummary)) {
        const twitterId = main.dataset.twitterid;
        const ids = await getSentIds(twitterId);
        sentCount.innerHTML = ` (${ids.length})`;
        renderTable(ids, sentContent, "sent");
      }
    } else {
      const path = e.composedPath();
      if (!path.includes(sentContent) && path.includes(sentSummary)) {
        sentCount.innerHTML = "";
        removeTable(sentContent, "sent");
      }
    }
  };

  function removeTable(to, type) {
    to.innerHTML = "";
    if (type === "sent") {
      clearInterval(sentInterval);
    } else {
      clearInterval(recievedInterval);
    }
  }

  async function renderTable(ids, to, type) {
    if (ids.length === 0) {
      const el = document.createElement("p");
      el.textContent = "Nothing to show.";
      if (to.childNodes.length === 0) {
        to.appendChild(el);
      }
    } else {
      to.innerHTML = "";
      const table = document.createElement("table");
      to.appendChild(table);
      const row = setUpRow();
      table.appendChild(row);
      let i = ids.length - 1;

      if (type === "sent") {
        sentInterval = setInterval(async () => {
          const id = ids[i];
          await intervalAction(i, id, table);
          if (i > 0) {
            i--;
          } else {
            clearInterval(sentInterval);
          }
        }, intervalTime);
      } else {
        recievedInterval = setInterval(async () => {
          const id = ids[i];
          await intervalAction(i, id, table);
          if (i > 0) {
            i--;
          } else {
            clearInterval(recievedInterval);
          }
        }, intervalTime);
      }
    }
  }

  async function intervalAction(i, id, table) {
    const payment = await getPaymentById(id);
    const row = document.createElement("tr");
    row.insertCell(0);
    row.insertCell(1);
    row.insertCell(2);
    row.insertCell(3);
    row.cells[0].textContent = i + 1;
    row.cells[1].textContent =
      Web3.utils.fromWei(payment.amount) + " " + currency;
    row.cells[2].textContent = handleBool(payment.claimed);
    row.cells[3].textContent = handleBool(payment.refunded);
    row.onclick = () => {
      onRowClick(payment.id);
    };

    table.appendChild(row);
  }

  function onRowClick(id) {
    window.location.href =
      window.location.origin +
      "/" +
      currency.toLowerCase() +
      "/transaction" +
      "?tx=" +
      id;
  }

  function setUpRow() {
    const row = document.createElement("tr");
    row.insertCell(0);
    row.insertCell(1);
    row.insertCell(2);
    row.insertCell(3);

    row.cells[0].textContent = "";
    row.cells[1].textContent = "SENT";
    row.cells[2].textContent = "CLAIMED";
    row.cells[3].textContent = "REFUNDED";
    return row;
  }

  function handleBool(b) {
    if (b) {
      return "YES";
    } else {
      return "NO";
    }
  }

  async function getSentIds(twitterId) {
    return await contract.methods
      .getPaymentIdsFrom(twitterId)
      .call({ from: address });
  }

  async function getRecievedIds(twitterId) {
    return await contract.methods
      .getPaymentIdsTo(twitterId)
      .call({ from: address });
  }

  async function getPaymentById(id) {
    return await contract.methods.getPaymentById(id).call({ from: address });
  }
})();
