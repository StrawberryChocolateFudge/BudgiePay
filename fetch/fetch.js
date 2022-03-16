const axios = require("axios");

module.exports = { fetchfollowers, fetchTweets };

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
