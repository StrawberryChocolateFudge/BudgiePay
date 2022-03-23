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

  const paymentContractAddress = main.dataset.paymentcontractaddress;
  const currency = main.dataset.currency;
  const twitterId = main.dataset.twitterid;

  const web3 = getWeb3();
  await requestAccounts();
  const address = await getAddress();
  const artifact = await (await fetch("/js/Payments.json")).text();
  const abi = JSON.parse(artifact).abi;

  const contract = new web3.eth.Contract(abi, paymentContractAddress);

  let recievedInterval;
  let sentInterval;
  const intervalTime = 1000;

  const PAGESIZE = 5;

  const queryParams = parseQueryString(window.location.search.slice(1));
  const recievedIds = await getRecievedIds(twitterId);
  const sentIds = await getSentIds(twitterId);
  const recievedTotalPages = getTotalPages(recievedIds, PAGESIZE);
  const sentTotalPages = getTotalPages(sentIds, PAGESIZE);

  recievedDetails.onclick = async function (e) {
    // The open property gets set after clicking, so I have to handle it the opposite way
    if (!recievedDetails.open) {
      const path = e.composedPath();
      if (path.includes(recievedSummary)) {
        renderTable(recievedIds, recievedContent, "recieved");
        recievedCount.innerHTML = ` (${recievedIds.length})`;
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
        sentCount.innerHTML = ` (${sentIds.length})`;
        renderTable(sentIds, sentContent, "sent");
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

      // getIdsForPage(type, ids);

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

  //TODO:
})();
function getIdsForPage(type, ids) {
  const totalPages = getTotalPages(ids.length);
  console.log(totalPages);
  if (type === "sent") {
  } else {
  }
}

const getTotalPages = (length, pageSize) => {
  if (length === 0) {
    return 1;
  }
  const divided = length / pageSize;
  const split = divided.toString().split(".");

  if (split[0] === 0) {
    return 1;
  }

  if (split[1] === undefined) {
    return parseInt(split[0]);
  }

  return parseInt(split[0]) + 1;
};

function parseQueryString(query, groupByName) {
  var parsed, hasOwn, pairs, pair, name, value;
  if (typeof query != "string") {
    throw "Invalid input";
  }
  parsed = {};
  hasOwn = parsed.hasOwnProperty;
  query = query.replace(/\+/g, " ");
  pairs = query.split(/[&;]/);

  for (var i = 0; i < pairs.length; i++) {
    pair = pairs[i].match(/^([^=]*)=?(.*)/);
    if (pair[1]) {
      try {
        name = decodeURIComponent(pair[1]);
        value = decodeURIComponent(pair[2]);
      } catch (e) {
        throw "Invaid %-encoded sequence";
      }

      if (!groupByName) {
        parsed[name] = value;
      } else if (hasOwn.call(parsed, name)) {
        parsed[name].push(value);
      } else {
        parsed[name] = [value];
      }
    }
  }
  return parsed;
}
