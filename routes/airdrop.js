const express = require("express");
const ensureLoggedIn = require("connect-ensure-login").ensureLoggedIn;
const db = require("../db");

const router = express.Router();

const web3 = require("../web3/web3");
const getWithdrawnAlready = web3.getWithdrawnAlready;
const { fetchfollowers } = require("../fetch/fetch");
/* GET my account page. */
// This route shows account information of the logged in user.  The route is
// guarded by middleware that ensures a user is logged in.  If not, the web
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
        let followerscount;
        if (!withdrawn) {
          // fetch how much can be withdrawn and sign the message here
          // Then I will

          const response = await fetchfollowers(row.subject);
          followerscount = response.data.followers_count;
        }
        res.render("airdrop", { user: req.user, withdrawn, followerscount });
      } catch (err) {
        return next(err);
      }
    }
  );
});

module.exports = router;
