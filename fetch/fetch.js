const axios = require("axios");

module.exports = {
  fetchfollowers,
  fetchTweets,
  fetchUserByHandle,
  fetchONEUSDPrice,
};

async function fetchfollowers(subject) {
  return axios({
    url: `https://api.twitter.com/1.1/users/show.json?user_id=${subject}`,
    method: "get",
    headers: { Authorization: `Bearer ${process.env["BEARERTOKEN"]}` },
  });
}

async function fetchTweets(subject) {
  return axios({
    url: `https://api.twitter.com/2/users/${subject}/tweets`,
    method: "get",
    headers: { Authorization: `Bearer ${process.env["BEARERTOKEN"]}` },
  });
}

async function fetchUserByHandle(handle) {
  let res;
  try {
    res = await axios({
      method: "get",
      url: `https://api.twitter.com/2/users/by/username/${handle}`,
      headers: { Authorization: `Bearer ${process.env["BEARERTOKEN"]}` },
    });
  } catch (err) {
    res = "Error Occured";
  }
  return res;
}

async function fetchONEUSDPrice() {
  let res;
  try {
    res = await axios({
      method: "get",
      url: "https://api.binance.com/api/v1/ticker/24hr?symbol=ONEUSDT",
    });
  } catch (err) {
    res = "Error Occured";
  }
  return res.data.lastPrice;
}
