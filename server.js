require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
const DB_URI = process.env.MONGO_URI;
const mongoose = require('mongoose');
const URL_VALID = /^https?:\/\/[^ "]+$/;
const ENCODE_CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ123456789_-'
const ENCODE_BASE = ENCODE_CHARS.length;

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: true }));

// connect to mongoDB atlas and set up schema and model
mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlPairSchema = new mongoose.Schema({
  original_url: {
    type: String, 
    required: true
  },
  short_url: {
    type: String, 
    required: true
  }
});

let urlPair = mongoose.model('UrlPair', urlPairSchema);

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

function isUrlValid(url) {
  return URL_VALID.test(url);
}

function encodeNum(num) {
  let x = Number(num);
  let numArr = [];
  if (x === 0) {
    numArr = [0];
  }
  while (x > 0) {
    numArr.unshift(x % ENCODE_BASE);
    x = Math.floor(x / ENCODE_BASE);
  }
  return numArr.map(i => ENCODE_CHARS[i]).join("");
}

// route to receive long form URL
// returns following JSON object if success
// { original_url : 'https://freeCodeCamp.org', short_url : 1}
// and following if invalid long form URL
// { error: 'invalid url' }
app.post('/api/shorturl', function(req, res) {
  if(!isUrlValid(req.body.url)) {
    res.json({ error: "invalid url" });
    return;
  }
  urlPair.findOne({ original_url: req.body.url }, function(err, urlObj) {
    if (err) {
      console.log(err, ":", data);
    } else {
      if (urlObj === null) {
        urlPair.countDocuments({}, function(err, count) {
          if (err) {
            console.log(err, ":", data);
          } else {
            urlObj = {
              original_url: req.body.url,
              short_url: encodeNum(count)
            };
            let newUrl = new urlPair(urlObj);
            newUrl.save(function(err, doc) {
              if (err) {
                console.log(err, ":", doc);
              } else {
                res.json(urlObj);
              }
            })
          }
        })
      } else {
        res.json(urlObj);
      }
    }
  });
});

// route to serve long form URL from short form URL
app.get('/api/shorturl/:url', function(req, res) {
  urlPair.findOne({ short_url: req.params.url }, function(err, url) {
    if (err) {
      console.log(err, ":", url);
    } else {
      res.redirect(url.original_url);
    }
  })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
