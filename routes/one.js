const ensureLoggedIn = require("connect-ensure-login").ensureLoggedIn;
const express = require("express");
const { fetchUserByHandle } = require("../fetch/fetch");
const router = express.Router();
const { signPayment, signRefund } = require("../web3/sign");
const db = require("../db");
const Web3 = require("web3");
const ethUtil = require("ethereumjs-util");
const { getPaymentById, hashTwitterId } = require("../web3/web3");

router.get("/", ensureLoggedIn(), async function (req, res, next) {
  res.render("one", {
    user: req.user,
    error: false,
    contractaddress: process.env["PAYMENTCONTRACTADDRESS"],
  });
});

router.post("/", ensureLoggedIn(), async function (req, res, next) {
  const { twitterHandle, amount, address } = req.body;
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
        const idHashBuff = await hashTwitterId(row.subject);
        const idHexhash = ethUtil.bufferToHex(idHashBuff);

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
          userid: req.user.id,
        });
      }
    );
  }
});

router.post(
  "/transaction/refund",
  ensureLoggedIn(),
  async function (req, res, next) {
    const { address, id } = req.body;

    db.get(
      "SELECT * from federated_credentials WHERE user_id = ?",
      [req.user.id],
      async function (error, row) {
        if (error) {
          next(error);
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
);

router.post(
  "/transaction/withdraw",
  ensureLoggedIn(),
  async function (req, res, next) {
    const { address, id } = req.body;

    db.get(
      "SELECT * from federated_credentials WHERE user_id = ?",
      [req.user.id],
      async function (error, row) {
        if (error) {
          next(error);
        }
      }
    );
    // TODO: sign the withdraw transaction
  }
);

module.exports = router;
