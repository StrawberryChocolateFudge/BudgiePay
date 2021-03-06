# DEV:

```bash
$ npm start
```

Navigate to [`http://localhost:3000`](http://localhost:3000).

# Deployment

This is deployed on a Hetzner server with nginx using pm2

nginx was installed

certificates were installed with

    sudo snap install --classic certbot

    sudo ln -s /snap/bin/certbot /usr/bin/certbot

    sudo certbot --nginx

This autoconfigure the ssl certificate

uses PM2

    npm install -g pm2

    pm2 startup systemd

switch to another user, not root

    pm2 start bin/www -i max

Use MC to change the permissions of db.sqlite

## NETWORK SETTINGS

When deploying to new networks, the CHAINID needs to be set.

## Overview

This example illustrates how to use [Passport](https://www.passportjs.org) and
the [`passport-twitter`](https://www.passportjs.org/packages/passport-twitter/)
strategy within an [Express](https://expressjs.com) application to sign users in
with [Twitter](https://twitter.com).

The example builds upon the scaffolding created by [Express generator](https://expressjs.com/en/starter/generator.html),
and uses [EJS](https://ejs.co) as a view engine and plain CSS for styling. This
scaffolding was generated by executing:

```
$ express --view ejs express-4.x-twitter-example
```

The example uses [SQLite](https://www.sqlite.org) for storing user accounts.
SQLite is a lightweight database that works well for development, including this
example.

Added to the scaffolding are files which add authentication to the application.

- [`boot/db.js`](boot/db.js)

  This file initializes the database by creating the tables used to store user
  accounts and credentials.

- [`boot/auth.js`](boot/auth.js)

  This file initializes Passport. It configures the Twitter strategy and
  supplies the serialization functions used for session management.

- [`routes/auth.js`](routes/auth.js)

  This file defines the routes used for authentication. In particular, there
  are three routes used to authenticate with Twitter:

  - `GET /login`

    This route renders a page that prompts the user to sign in with Twitter.

  - `GET /login/federated/twitter.com`

    This route begins the authentication sequence by redirecting the user to
    Twitter.

  - `POST /oauth/callback/twitter.com`

    This route completes the authentication sequence when Twitter redirects the
    user back to the application. When a new user signs in, a user account is
    automatically created and their Twitter account is linked. When an existing
    user returns, they are signed in to their linked account.
