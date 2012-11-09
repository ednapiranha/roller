# Roller

A micro micro mood blog.

## Installation instructions

Clone the repository

> git clone git://github.com/ednapiranha/roller.git

> curl http://npmjs.org/install.sh | sh

Install node by using brew or through the website http://nodejs.org/#download

> cd roller

> cp local.json-dist local.json

Create a bucket on Amazon S3 and get your key, secret and bucket name

Apply S3 info into local.json

> npm install

Run the site

> node app.js

## Tests

> make test