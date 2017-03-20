'use strict';

var cors = require('cors');
var debug = require('debug')('express-sharp')
var etag = require('etag');
var express = require('express');
var https = require('https');
var sharp = require('sharp');
var url = require('url');
var expressValidator = require('express-validator');
var mime = require('mime');
var path = require('path')

module.exports = function(options) {
  var router = express.Router();
  router.use(expressValidator({
    customValidators: {
      isSharpFormat: function(value) {
        return sharp.format.hasOwnProperty(value);
      },
      isQuality: function(value) {
        return value >= 0 && value <= 100;
      },
      isUrlPathQuery: function(value) {
        if (!value) {
          return false;
        }
        var u =  url.parse(value);
        if (u.protocol || u.host || !u.path) {
          return false;
        }
        return true;
      },
    },
  }));

  var _cors = cors(options.cors || {});

  router.get('/?', _cors, function(req, res, next) {
    var format = req.query.format;
    var quality = parseInt(req.query.quality, 10);

    req.checkQuery('height').optional().isInt();
    req.checkQuery('width').optional().isInt();
    req.checkQuery('format').optional().isSharpFormat();
    req.checkQuery('quality').optional().isQuality();
    req.checkQuery('url').isUrlPathQuery();

    var errors = req.validationErrors();
    if (errors) {
      return res.status(400).json(errors);
    }

    if (process.env.BUCKETS && process.env.BUCKETS.split(",").indexOf(req.query.url.split("/")[0]) == -1) {
      return res.status(401).json({ error: "not authorized" });
    }

    var imageUrl = url.parse(req.query.url);
    imageUrl.host = options.baseHost;
    imageUrl.protocol = imageUrl.protocol || 'https';
    imageUrl = url.format(imageUrl);

    var transformer = sharp()
      .on('error', function sharpError(err) {
        res.status(500);
        next(new Error(err));
      });

    if (req.query.width) {
      var width = parseInt(req.query.width, 10);
      var height = parseInt(req.query.height, 10);

      transformer.resize(width, height, {
        kernel: sharp.kernel.cubic
      })
    }

    if (req.query.crop == "thumb" || req.query.crop == "crop" || req.query.crop == "fill") {
      transformer.crop(req.query.gravity);
    }

    if (req.query.crop == "limit") {
      transformer.max();
    }

    if (req.query.progressive) {
      transformer.progressive();
    }

    if (format) {
      transformer.toFormat(format);
    }

    if (quality) {
      transformer.quality(quality)
    }

    var etagBuffer = new Buffer([imageUrl, width, height, format, req.query.crop, quality]);
    res.setHeader('ETag', etag(etagBuffer, {weak: true}))
    if (req.fresh) {
      return res.sendStatus(304);
    }

    console.log('Requesting:', imageUrl);
    https
      .get(imageUrl, function getImage(result) {
        console.log('Requested %s. Status: %s', imageUrl, result.statusCode);
        if (result.statusCode >= 400) {
          return res.sendStatus(result.statusCode);
        }
        res.status(result.statusCode)
        res.type(format || mime.lookup(imageUrl));

        if (path.extname(imageUrl) == ".gif") {
          result.pipe(res);
        } else {
          result.pipe(transformer).pipe(res);
        }
      })
      .on('error', function(err) {
        next(new Error(err));
      });
  });

  return router;
};
