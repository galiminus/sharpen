var express = require('express');
var app = express();
var scale = require('./express-sharp');

var options = { baseHost: process.env.BASE_HOST || 's3.amazonaws.com' };
app.get('/', function (req, res) {
  res.json({ok:true})
});

app.use('/resize', scale(options));
app.use('/resize/:name', scale(options));

app.listen(parseInt(process.env.PORT || 3001));
