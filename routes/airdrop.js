const express = require("express");
const ensureLoggedIn = require("connect-ensure-login").ensureLoggedIn;
const db = require("../db");
const ethUtil = require("ethereumjs-util");

const router = express.Router();

const web3 = require("../web3/web3");
const getWithdrawnAlready = web3.getWithdrawnAlready;
const { fetchfollowers, fetchTweets } = require("../fetch/fetch");
const { signAirdrop } = require("../web3/sign");

/* GET airdrop. */
// This route shows account information of the logged in user. They can claim their Airdrop
//  The route is guarded by middleware that ensures a user is logged in.  If not, the web
// browser will be redirected to `/login`.
router.get("/", ensureLoggedIn(), async function (req, res, next) {
  db.get(
    "SELECT * FROM federated_credentials WHERE user_id = ?",
    [req.user.id],
    async function (err, row) {
      if (err) {
        return next(err);
      }
      try {
        // Fetch the latest tweets of the user
        const tweets = await fetchTweets(row.subject);
        console.log("fetching tweets");
        console.log(tweets.data);
        //TODO: GET THE TWEETS AND DISPLAY THEM!!
        const withdrawn = await getWithdrawnAlready(row.subject);
        let followerscount;

        const response = await fetchfollowers(row.subject);
        followerscount = response.data.followers_count;

        let buttonMessage;
        let signature = "";
        let walletconnected = false;
        let address = "";
        if (req.query.address === undefined) {
          buttonMessage = `Connect your wallet!`;
        } else {
          address = req.query.address;
          buttonMessage = `Withdraw ${followerscount} tokens`;
          signature = signAirdrop(row.subject, followerscount, address);
          signature = {
            r: ethUtil.bufferToHex(signature[0].r),
            s: ethUtil.bufferToHex(signature[0].s),
            v: signature[0].v,
          };
          walletconnected = true;
        }
        res.render("airdrop", {
          user: req.user,
          thefollowertokenaddress: process.env["CONTRACTADDRESS"],
          withdrawn,
          followerscount,
          walletconnected,
          buttonMessage,
          signature: JSON.stringify(signature),
          signedargs: JSON.stringify({
            twitterid: row.subject,
            followerscount,
            address,
          }),
        });
      } catch (err) {
        return next(err);
      }
    }
  );
});

module.exports = router;
