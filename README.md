# Roller

A micro micro blog.

## Installation instructions

Clone the repository

> git clone git://github.com/ednapiranha/roller.git

> curl http://npmjs.org/install.sh | sh

Install node by using brew or through the website http://nodejs.org/#download

> cd roller

> cp local.json-dist local.json

## File Uploading Information

Roller uses Amazon s3 and as a result, uses [knox](https://github.com/LearnBoost/knox) and [knox-mpu](https://github.com/nathanoehlman/knox-mpu) for handling file uploads to that service.

If you choose to use another file uploading service and API (e.g. [Dropbox](http://dropbox.com)), just replace the knox libraries in package.json with a different module, update local.json with your API data and change the calls in lib/roller.js for the uploadFile function.

## S3 Configuration

Create a bucket on Amazon S3 and get your key, secret and bucket name

Apply S3 info into local.json

## Install Dependencies

> npm install

## Boot it up!

Run the site

> node app.js

## Tests

> make test