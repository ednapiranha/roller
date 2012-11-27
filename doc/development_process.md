# Creating Roller

## The Idea

I wanted to make a basic micro blog which allowed users to post images and text with a single global feed. Then I thought about creating Roller as a demo of a micro blog using [node](http://nodejs.org), [express](http://expressjs.com/) and [redis](http://redis.io).

## Building Blocks for Microblog Functionality

We will need the following functionality to run a basic microblog:

* Add a post
* Delete a post
* Like a post
* Unlike a post

But some of this functionality has rules:

* Delete a post
    * Only the author (the person who created the post) can delete
    * If a post is deleted, then any likes that were saved with the post should also be deleted
* Like a post
    * If a post is liked, then it must be added to the person's "Liked" feed
* Unlike a post
    * If a post is unliked, then it must be removed from the person's "Liked" feed

So we need to build additional logic that abides by these rules. Since redis is not like a relational database, we need to have different keys for these various pieces:

* A set for all the liked posts by a user, so we can quickly use it to check whether a post has been liked
* A list of all the liked posts by a user, ordered from most recent to oldest for the user's liked feed
* An incrementation counter for every new post that is added to generate a unique ID
* A list of all add posts by all users, ordered from most recent to oldest for the global feed
* A hash for the actual post containing the core metadata

## File Uploading with Amazon S3

To allow for file uploading as a post option, I've decided to use [S3](http://aws.amazon.com/s3/) as a source for hosting the files. You are free to use another service and replace the appropriate values and code in local.json and in roller.js.

## Creating the Interface
Since status updates are limited to photos/images and text, we want to keep the interface as minimal as possible. As a result, I decided to keep the background and default colours to a dark gray and black theme and only bring in a high contrast when an icon or post is hovered over.

## The Final Product
You can easily set this app up either locally or on your own server or test out the beta version at [http://roller.noodletalk.org](http://roller.noodletalk.org)
