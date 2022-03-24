const ensureLoggedIn = require("connect-ensure-login").ensureLoggedIn;
const express = require("express");
const { fetchUserByHandle, fetchONEUSDPrice } = require("../fetch/fetch");
const router = express.Router();
const { signPayment, signRefund, signWithdraw } = require("../web3/sign");
const db = require("../db");
const Web3 = require("web3");
const ethUtil = require("ethereumjs-util");
const { getPaymentById, hashTwitterId } = require("../web3/web3");
const speakeasy = require("speakeasy");

const MAX500 = 500;

router.get("/", ensureLoggedIn(), async function (req, res, next) {
  res.render("one", {
    user: req.user,
    error: false,
    contractaddress: process.env["PAYMENTCONTRACTADDRESS"],
    currency: "one",
  });
});

router.post("/", ensureLoggedIn(), async function (req, res, next) {
  const { twitterHandle, amount, address, code } = req.body;

  const price = await fetchONEUSDPrice();
  const usdValue = amount * price;

  if (usdValue > MAX500) {
    return res.json({
      error: true,
      errorMessage: `${usdValue.toFixed(2)}$ value is over allowed limit!`,
    });
  }
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
      });
      if (!verified) {
        return res.json({ error: true, errorMessage: "Invalid Auth Code" });
      } else {
        const userReq = await fetchUserByHandle(twitterHandle);
        if (userReq === "Error Occured") {
          return res.json({ error: true, errorMessage: "Invalid Handle" });
        } else {
          const toTwitterId = userReq.data.data.id;

          db.get(
            "SELECT * from federated_credentials WHERE user_id = ?",
            [req.user.id],
            async function (error, row) {
              if (error) {
                return next(error);
              }
              const fromTwitterId = row.subject;
              if (fromTwitterId === toTwitterId) {
                return res.json({
                  error: true,
                  errorMessage: "You can't pay to yourself.",
                });
              } else {
                const sig = signPayment(
                  address,
                  fromTwitterId,
                  toTwitterId,
                  Web3.utils.toWei(amount),
                  process.env["CHAINID"],
                  process.env["PAYMENTCONTRACTADDRESS"],
                  process.env["PRIVATEKEY"]
                );
                res.json({
                  sig: {
                    v: ethUtil.bufferToHex(sig.v),
                    r: ethUtil.bufferToHex(sig.r),
                    s: ethUtil.bufferToHex(sig.s),
                  },
                  from: address,
                  fromTwitterId,
                  toTwitterId,
                  amount,
                });
              }
            }
          );
        }
      }
    }
  );
});

router.get("/history", ensureLoggedIn(), async function (req, res, next) {
  db.get(
    "SELECT * from federated_credentials WHERE user_id = ?",
    [req.user.id],
    async function (error, row) {
      if (error) {
        return next(error);
      }
      res.render("history", {
        user: req.user,
        twitterId: row.subject,
        paymentcontractaddress: process.env["PAYMENTCONTRACTADDRESS"],
        rpc: process.env["RPC"],
      });
    }
  );
});

router.get("/transaction", ensureLoggedIn(), async function (req, res, next) {
  const { tx } = req.query;
  const payment = await getPaymentById(tx);
  if (!payment.initialized) {
    res.render("transaction", {
      user: req.user,
      invalid: true,
    });
  } else {
    // Check if the user fetching this is the recepient or the sender
    db.get(
      "SELECT * from federated_credentials WHERE user_id = ?",
      [req.user.id],
      async function (error, row) {
        if (error) {
          return next(error);
        }
        const idHexhash = await hashTwitterId(row.subject);

        const fromTwitterId = payment.fromTwitterId;
        const toTwitterId = payment.toTwitterId;

        let withdraw = false;
        let refund = false;
        const finished = payment.claimed || payment.refunded;
        if (fromTwitterId === idHexhash) {
          if (!finished) {
            refund = true;
          }
        }
        if (toTwitterId === idHexhash) {
          if (!finished) {
            withdraw = true;
          }
        }

        const finishedMessage = payment.refunded
          ? "Payment Refunded"
          : payment.claimed
          ? "Payment Claimed"
          : "";
        res.render("transaction", {
          user: req.user,
          amount: Web3.utils.fromWei(payment.amount),
          currency: "ONE",
          refund,
          withdraw,
          finished,
          finishedMessage,
          invalid: false,
          chainid: process.env["CHAINID"],
          chain: "HARMONY",
          paymentcontractaddress: process.env["PAYMENTCONTRACTADDRESS"],
          id: tx,
          twitterid: row.subject,
        });
      }
    );
  }
});
router.post(
  "/transaction/refund",
  ensureLoggedIn(),
  async function (req, res, next) {
    const { address, id, code } = req.body;
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
        });
        if (!verified) {
          return res.json({ error: true, errorMessage: "Invalid Auth Code" });
        } else {
          db.get(
            "SELECT * from federated_credentials WHERE user_id = ?",
            [req.user.id],
            async function (error, row) {
              if (error) {
                next(error);
              }
              const payment = await getPaymentById(id);
              const idHexhash = await hashTwitterId(row2.subject);

              if (payment.fromTwitterId !== idHexhash) {
                return res.json({
                  error: true,
                  errorMessage: "Invalid Transaction",
                });
              }
              const sig = await signRefund(
                id,
                row.subject,
                address,
                process.env["CHAINID"],
                process.env["PAYMENTCONTRACTADDRESS"],
                process.env["PRIVATEKEY"]
              );
              res.json({
                sig: {
                  v: ethUtil.bufferToHex(sig.v),
                  r: ethUtil.bufferToHex(sig.r),
                  s: ethUtil.bufferToHex(sig.s),
                },
              });
            }
          );
        }
      }
    );
  }
);
router.post(
  "/transaction/withdraw",
  ensureLoggedIn(),
  async function (req, res, next) {
    const { address, id, code } = req.body;
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
        });
        if (!verified) {
          return res.json({ error: true, errorMessage: "Invalid Auth Code" });
        } else {
          db.get(
            "SELECT * from federated_credentials WHERE user_id = ?",
            [req.user.id],
            async function (error, row2) {
              if (error) {
                next(error);
              }
              const payment = await getPaymentById(id);
              const idHexhash = await hashTwitterId(row2.subject);

              if (payment.toTwitterId !== idHexhash) {
                return res.json({
                  error: true,
                  errorMessage: "Invalid Transaction",
                });
              }
              const sig = signWithdraw(
                id,
                row2.subject,
                address,
                process.env["CHAINID"],
                process.env["PAYMENTCONTRACTADDRESS"],
                process.env["PRIVATEKEY"]
              );
              res.json({
                sig: {
                  v: ethUtil.bufferToHex(sig.v),
                  r: ethUtil.bufferToHex(sig.r),
                  s: ethUtil.bufferToHex(sig.s),
                },
              });
            }
          );
        }
      }
    );
  }
);

module.exports = router;
