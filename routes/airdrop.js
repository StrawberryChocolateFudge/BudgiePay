const express = require("express");
const ensureLoggedIn = require("connect-ensure-login").ensureLoggedIn;
const db = require("../db");
const ethUtil = require("ethereumjs-util");

const router = express.Router();

const web3 = require("../web3/web3");
const getWithdrawnAlready = web3.getWithdrawnAlready;
const { fetchfollowers } = require("../fetch/fetch");
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
        const withdrawn = await getWithdrawnAlready(row.subject);
        const response = await fetchfollowers(row.subject);
        let followerscount = response.data.followers_count;

        let buttonMessage;
        let signature = "";
        let walletconnected = false;
        let address = "";
        if (req.query.address === undefined) {
          buttonMessage = `Connect your wallet!`;
        } else {
          address = req.query.address;
          buttonMessage = `Withdraw ${followerscount} tokens`;
          signature = signAirdrop(
            row.subject,
            followerscount,
            address,
            process.env["CHAINID"],
            process.env["TOKENADDRESS"],
            process.env["PRIVATEKEY"]
          );
          signature = {
            r: ethUtil.bufferToHex(signature.r),
            s: ethUtil.bufferToHex(signature.s),
            v: signature.v,
          };
          walletconnected = true;
        }
        res.render("airdrop", {
          user: req.user,
          budgiecoinaddress: process.env["TOKENADDRESS"],
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
