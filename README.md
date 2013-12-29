Photostrip
==========

A site that allows you to make a photostrip in your browser.

You can demo the site at: http://photostrip.s3-website-us-east-1.amazonaws.com/

## Build/Publish ##

You will need:

* An S3 bucket set to server a static website
* grunt - to lint, concat, and minify
* python/boto - to publish to your S3 bucket

Please note that you will need to setup your own json settings files as the S3 bucket's CORS only allows the demo's URL.

## Help/Todo ##
Fix up the drawing methods. They work, but could be made more efficient.