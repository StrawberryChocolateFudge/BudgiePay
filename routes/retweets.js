const express = require("express");
const router = express.Router();

/* GET retweets page. */
router.get("/", function (req, res, next) {
  res.render("retweets", { user: req.user });
});

module.exports = router;
