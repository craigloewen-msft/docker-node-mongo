const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const redis = require("redis");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));

// Connect to MongoDB
mongoose
  .connect(
    'mongodb://mongo:27017/docker-node-mongo',
    { useNewUrlParser: true }
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const Item = require('./models/Item');

// Connect to REdis too 

var client = redis.createClient('6379', 'redis');

client.on("error", function (err) {
  console.log("Error " + err);
});

// Start loading in 100s of items to the database

var countValue = 1;

var addItemFunction = function () {
  var someItem = new Item({ name: "genericItem" + countValue });
  if (countValue > 500) {
    console.log("Finished adding in tons of items")
  } else {
    someItem.save();
  }
  countValue++;
}

Item.countDocuments(function (e, totalItems) {
  if (totalItems < 10) {
    for (let i = 0; i < 10; i++) {
      console.log("Adding item");
      addItemFunction();
    }
  }
});

app.get('/', (req, res) => {
  client.incr('counter', function (err, counter) {
    if (err) return next(err);
    // Choose some random items to show
    Item.countDocuments(function (e, totalItems) {
      Item.find().sort({ _id: -1 })
        // Item.findById()
        .then(items => res.render('index', { items, counter, totalItems }))
        .catch(err => res.status(404).json({ msg: 'No items found' }));
    });
  })
});

app.post('/item/add', (req, res) => {
  const newItem = new Item({
    name: req.body.name
  });

  newItem.save().then(item => res.redirect('/'));
});

const port = 3000;

app.listen(port, () => console.log('Server running...'));
