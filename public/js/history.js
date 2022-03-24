(async function init() {
  const queryParams = parseQueryString(window.location.search.slice(1));

  if (queryParams.sent < 0 || queryParams.received < 0) {
    location.href = location.origin + location.pathname + "?sent=0&received=0";
    return;
  }

  const main = document.getElementById("history");
  const receivedContent = document.getElementById("received-details-content");
  const receivedCount = document.getElementById("received-count");
  const receivedButtonsContainer = document.getElementById("received-buttons");
  const sentContent = document.getElementById("sent-details-content");
  const sentCount = document.getElementById("sent-count");
  const sentButtonsContainer = document.getElementById("sent-buttons");

  const paymentContractAddress = main.dataset.paymentcontractaddress;
  const currency = main.dataset.currency;
  const twitterId = main.dataset.twitterid;

  const web3 = getWeb3();
  await requestAccounts();
  const address = await getAddress();
  const artifact = await (await fetch("/js/Payments.json")).text();
  const abi = JSON.parse(artifact).abi;
  const contract = new web3.eth.Contract(abi, paymentContractAddress);

  const PAGESIZE = 5;

  const receivedIds = await getreceivedIds(twitterId);
  receivedIds.reverse();
  const sentIds = await getSentIds(twitterId);
  sentIds.reverse();
  const receivedTotalPages = getTotalPages(receivedIds.length, PAGESIZE);
  const sentTotalPages = getTotalPages(sentIds.length, PAGESIZE);
  if (
    queryParams.sent > sentTotalPages - 1 ||
    queryParams.received > receivedTotalPages - 1
  ) {
    location.href = location.origin + location.pathname + "?sent=0&received=0";
    return;
  }

  await renderTable(receivedIds, receivedContent, "received");
  renderButton(
    receivedTotalPages,
    queryParams.received,
    "received",
    receivedButtonsContainer
  );
  receivedCount.innerHTML = ` (${receivedIds.length})`;
  sentCount.innerHTML = ` (${sentIds.length})`;
  await renderTable(sentIds, sentContent, "sent");
  renderButton(sentTotalPages, queryParams.sent, "sent", sentButtonsContainer);

  function renderButton(totalPages, currentPages, type, to) {
    const aElements = { next: null, prev: null };
    if (totalPages > 1) {
      if (currentPages >= 0 && currentPages != totalPages - 1) {
        //render a next button
        const a = document.createElement("a");
        let params;
        if (type === "sent") {
          params = `?sent=${parseInt(queryParams.sent) + 1}&received=${
            queryParams.received
          }`;
        } else {
          params = `?sent=${queryParams.sent}&received=${
            parseInt(queryParams.received) + 1
          }`;
        }
        a.href = location.origin + location.pathname + params;
        a.textContent = "NEXT";
        aElements.next = a;
      }

      if (currentPages >= 1) {
        const a = document.createElement("a");
        let params;
        if (type === "sent") {
          params = `?sent=${parseInt(queryParams.sent) - 1}&received=${
            queryParams.received
          }`;
        } else {
          params = `?sent=${queryParams.sent}&received=${
            parseInt(queryParams.received) - 1
          }`;
        }
        a.href = location.origin + location.pathname + params;
        a.textContent = "PREV";
        aElements.prev = a;
      }
    }
    if (aElements.prev !== null) {
      to.appendChild(aElements.prev);
    }
    if (aElements.next !== null) {
      to.appendChild(aElements.next);
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
      const idsForPage = getIdsForPage(ids, PAGESIZE);
      if (type === "sent") {
        const sent = idsForPage[queryParams.sent];
        await fetchPage(sent, table);
      } else {
        const received = idsForPage[queryParams.received];
        await fetchPage(received, table);
      }
    }
  }

  async function fetchPage(ids, table) {
    const checkedIds = ids.slice();
    if (checkedIds.length !== 5) {
      for (let i = checkedIds.length; i < 5; i++) {
        checkedIds.push("0");
      }
    }
    const payments = await getPaymentsPaginated(
      checkedIds[0],
      checkedIds[1],
      checkedIds[2],
      checkedIds[3],
      checkedIds[4]
    );
    addRow(payments[0], table);
    addRow(payments[1], table);
    addRow(payments[2], table);
    addRow(payments[3], table);
    addRow(payments[4], table);
  }

  async function addRow(payment, table) {
    if (payment.initialized) {
      const row = document.createElement("tr");
      row.insertCell(0);
      row.insertCell(1);
      row.insertCell(2);
      row.insertCell(3);
      row.cells[0].textContent = payment.id;
      row.cells[1].textContent =
        Web3.utils.fromWei(payment.amount) + " " + currency;
      row.cells[2].textContent = handleBool(payment.claimed);
      row.cells[3].textContent = handleBool(payment.refunded);
      row.onclick = () => {
        onRowClick(payment.id);
      };

      table.appendChild(row);
    }
  }

  function onRowClick(id) {
    location.href =
      location.origin +
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

    row.cells[0].textContent = "ID";
    row.cells[1].textContent = "AMOUNT";
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

  async function getreceivedIds(twitterId) {
    return await contract.methods
      .getPaymentIdsTo(twitterId)
      .call({ from: address });
  }

  async function getPaymentById(id) {
    return await contract.methods.getPaymentById(id).call({ from: address });
  }
  async function getPaymentsPaginated(first, second, third, fourth, fifth) {
    return await contract.methods
      .getPaymentsPaginated(first, second, third, fourth, fifth)
      .call({ from: address });
  }
})();

function getIdsForPage(ids, pageSize) {
  const totalPages = getTotalPages(ids.length, pageSize);
  const pages = [];
  for (let i = 0; i < totalPages; i++) {
    const firstIndex = (i + 1) * pageSize - pageSize;
    const lastIndex = (i + 1) * pageSize;
    const content = [];
    for (let j = firstIndex; j < lastIndex; j++) {
      if (ids[j] !== undefined) {
        content.push(ids[j]);
      }
    }
    pages.push(content);
  }
  return pages;
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
