const express = require("express");
const passport = require("passport");
const db = require("../db");
const web3 = require("../web3/web3");
const getWithdrawnAlready = web3.getWithdrawnAlready;
const router = express.Router();
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const { ensureLoggedIn } = require("connect-ensure-login");

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
        // If the user doesn't exists yet!
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
                  req.login(user, async function (err) {
                    if (err) {
                      return next(err);
                    }

                    const secret = speakeasy.generateSecret({ length: 20 });
                    db.run(
                      "INSERT INTO two_fa (secret,user_id,codesaved) VALUES (?,?,?)",
                      [secret.ascii, id, false],
                      function (err) {
                        if (err) {
                          return next(err);
                        }

                        res.redirect("/2fa");
                      }
                    );
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
              req.login(user, async function (err) {
                if (err) {
                  return next(err);
                }

                db.get(
                  "SELECT * from two_fa WHERE user_id = ?",
                  [user.id],
                  async function (err, row) {
                    if (err) {
                      return next(err);
                    }
                    if (row.codesaved) {
                      // if the user already claimed the tokens, redirect to /ONE
                      const withdrawn = await getWithdrawnAlready(
                        req.federatedUser.id
                      );
                      if (withdrawn) {
                        res.redirect("/one");
                      } else {
                        res.redirect("/airdrop");
                      }
                    } else {
                      res.redirect("/2fa");
                    }
                  }
                );
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

router.get("/2fa", ensureLoggedIn(), function (req, res, next) {
  db.get(
    "SELECT * from two_fa WHERE user_id = ?",
    [req.user.id],
    async function (err, row) {
      if (err) {
        return next(err);
      }
      if (row.codesaved) {
        // if the user already claimed the tokens, redirect to /ONE
        const withdrawn = await getWithdrawnAlready(row.subject);
        if (withdrawn) {
          res.redirect("/one");
        } else {
          res.redirect("/airdrop");
        }
      } else {
        const otpauth_url = speakeasy.otpauthURL({
          secret: row.secret,
          label: `Budgie Pay (${req.user.displayName})`,
          algorithm: "sha512",
        });
        QRCode.toDataURL(otpauth_url, function (err, image_data) {
          if (err) {
            return next(err);
          }
          res.render("qrcode", {
            user: req.user,
            qrcode: image_data,
          });
        });
      }
    }
  );
});

router.post("/2fa", function (req, res, next) {
  // IF the user say they got it and added the key to google auth,
  // then I set codesaved to true and the QR code will not show anymore
  db.run(
    "UPDATE two_fa SET codesaved = ? WHERE user_id = ?",
    [true, req.user.id],
    function (err) {
      if (err) {
        return next(err);
      }
      db.get(
        "SELECT * from federated_credentials WHERE user_id = ?",
        [req.user.id],
        async function (err, row) {
          if (err) {
            return next(err);
          }
          // if the user already claimed the tokens, redirect to /ONE
          const withdrawn = await getWithdrawnAlready(row.subject);
          if (withdrawn) {
            res.redirect("/one");
          } else {
            res.redirect("/airdrop");
          }
        }
      );
    }
  );
});

module.exports = router;
