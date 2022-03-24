const express = require("express");
const ensureLoggedIn = require("connect-ensure-login").ensureLoggedIn;
const db = require("../db");
const ethUtil = require("ethereumjs-util");

const router = express.Router();

const web3 = require("../web3/web3");
const getWithdrawnAlready = web3.getWithdrawnAlready;
const { fetchfollowers } = require("../fetch/fetch");
const { signAirdrop } = require("../web3/sign");
const speakeasy = require("speakeasy");

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

        const buttonMessage = `Withdraw ${followerscount} tokens`;

        res.render("airdrop", {
          user: req.user,
          budgiecoinaddress: process.env["TOKENADDRESS"],
          withdrawn,
          followerscount,
          buttonMessage,
        });
      } catch (err) {
        return next(err);
      }
    }
  );
});

router.post("/", ensureLoggedIn(), async function (req, res, next) {
  const { address, code } = req.body;

  db.get(
    "SELECT * from two_fa WHERE user_id = ?",
    [req.user.id],
    async function (err, row) {
      if (err) {
        return next(err);
      }

      const verified = speakeasy.totp.verify({
        secret: row.secret,
        encoding: "ascii",
        token: code,
        window: 10,
      });

      if (!verified) {
        return res.json({ json: true, errorMessage: "Invalid Auth Code" });
      } else {
        db.get(
          "SELECT * FROM federated_credentials WHERE user_id = ?",
          [req.user.id],
          async function (err, row2) {
            if (err) {
              return next(err);
            }
            const withdrawn = await getWithdrawnAlready(row2.subject);
            const response = await fetchfollowers(row2.subject);
            let followerscount = response.data.followers_count;

            if (withdrawn) {
              return res.json({
                error: true,
                errorMessage: "Already withdrawn the Airdrop.",
              });
            } else {
              let signature = signAirdrop(
                row2.subject,
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
              const signedargs = {
                twitterid: row2.subject,
                followerscount,
                address,
              };
              return res.json({ signature, signedargs });
            }
          }
        );
      }
    }
  );
});

module.exports = router;
