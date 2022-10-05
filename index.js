require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
const urls = require("./urls.js");
const dns = require("dns");

// Basic Configuration
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});
app.post("/api/shorturl", (req, res) => {
  var regex = /^https?:\/\//; //need this format for res.redirect
  let url = req.body.url;
  console.log("ur; = ", url)
  if (regex.test(req.body.url)) {
    var tempDnsUrl = url.slice(url.indexOf("//") + 2); //need to remove http(s):// to pass to dns.lookup
    var slashIndex = tempDnsUrl.indexOf("/"); //need to remove anythng past .com, etc., for dns.lookup
    var dnsUrl = slashIndex < 0 ? tempDnsUrl : tempDnsUrl.slice(0, slashIndex);
    console.log("slashIndex: " + slashIndex);
    console.log("dnsUrl: " + dnsUrl);

    dns.lookup(dnsUrl, function (err, address, family) {
      //check for valid url
      if (err) {
        console.log(err);
        return res.json({error: 'invalid url'});
      } else if (address !== undefined) {
        console.log("address: " + address);
        try {
          let id = urls.addURl(req.body.url);
          console.log("short url = ", id);
          res.json({
            original_url: req.body.url,
            short_url: id,
          });
        } catch (err) {
          if (err.message === "URL already registered") {
            res.json({ error: "URL already shortened" });
          }
        }
      }
    }); //dns.lookup
  } else {
    res.json({error: 'invalid url'});
  }
});
app.get("/api/shorturl/:shorturl?", (req, res) => {
  try {
    if (!req.params.shorturl) {
      return res.json({ error: "No url provided" });
    }
    let sourceUrl = urls.getUrl(req.params.shorturl);
    console.log("source url ", sourceUrl);
    if (!sourceUrl) {
      res.json({ error: "Not found" });
    }
    return res.redirect(sourceUrl);
  } catch (err) {
    if (err.message === "Not found") {
      res.json({ error: "Not found" });
    }
  }
});
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
