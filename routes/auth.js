const express = require("express");
const passport = require("passport");
const db = require("../db");

const router = express.Router();

router.get("/login", function (req, res, next) {
  res.render("login");
});

router.get("/login/federated/twitter.com", passport.authenticate("twitter"));

router.get(
  "/oauth/callback/twitter.com",
  passport.authenticate("twitter", {
    assignProperty: "federatedUser",
    failureRedirect: "/login",
  }),
  function (req, res, next) {
    db.get(
      "SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?",
      ["https://twitter.com", req.federatedUser.id],
      function (err, row) {
        if (err) {
          return next(err);
        }
        console.log(req.federatedUser);
        if (!row) {
          db.run(
            "INSERT INTO users (name) VALUES (?)",
            [req.federatedUser.displayName],
            function (err) {
              if (err) {
                return next(err);
              }

              var id = this.lastID;
              db.run(
                "INSERT INTO federated_credentials (provider, subject, user_id) VALUES (?, ?, ?)",
                ["https://twitter.com", req.federatedUser.id, id],
                function (err) {
                  if (err) {
                    return next(err);
                  }
                  var user = {
                    id: id.toString(),
                    displayName: req.federatedUser.displayName,
                  };
                  req.login(user, function (err) {
                    if (err) {
                      return next(err);
                    }
                    res.redirect("/airdrop");
                  });
                }
              );
            }
          );
        } else {
          db.get(
            "SELECT rowid AS id, username, name FROM users WHERE rowid = ?",
            [row.user_id],
            function (err, row) {
              if (err) {
                return next(err);
              }
              // Handle undefined row.

              if (row === undefined) {
                return next(new Error("Ops, something happened."));
              }
              var user = {
                id: row.id.toString(),
                username: row.username,
                displayName: row.name,
              };
              req.login(user, function (err) {
                if (err) {
                  return next(err);
                }
                res.redirect("/airdrop");
              });
            }
          );
        }
      }
    );
  }
);

router.get("/logout", function (req, res, next) {
  req.logout();
  res.redirect("/");
});

module.exports = router;
