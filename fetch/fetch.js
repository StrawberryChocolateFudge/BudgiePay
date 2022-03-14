const axios = require("axios");

module.exports = { fetchfollowers };

async function fetchfollowers(subject) {
  return axios({
    url: `https://api.twitter.com/1.1/users/show.json?user_id=${subject}`,
    method: "get",
    headers: { Authorization: `Bearer ${process.env["BEARERTOKEN"]}` },
  });
}
