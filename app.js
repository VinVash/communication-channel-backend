const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config();
const URI = process.env.URI;

const connectWithRetry = (uris, options, maxAttempts = 5) => {
  connectWithRetry.timeout = connectWithRetry.timeout || 0;
  return mongoose.connect(uris, options, (err) => {
    if (err)
      if (connectWithRetry.timeout <= (maxAttempts - 1) * 5000) {
        console.error(
          `Failed to connect to mongo on startup - retrying in ${
            (connectWithRetry.timeout += 5000) / 1000
          } sec`,
          connectWithRetry.previousError != "" + err
            ? `\n${(connectWithRetry.previousError = err)}`
            : ""
        );
        setTimeout(connectWithRetry, connectWithRetry.timeout, uris, options);
      } else process.exit(1);
    else console.log("Connected to MongoDB successfully!");
  });
};

connectWithRetry(URI, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

var app = express();
// remove this part after testing. this is for testing chatrooms only
const publicDirectory = path.join(__dirname, "public");
app.use(helmet());
app.use(cors());
app.disable('etag');
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(publicDirectory));

app.use("/api", require("./routes/api"));
app.use("/api", require("./routes/admin/auth"));
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/chat"));
app.use("/api", require("./routes/info"))

app.use((err, req, res, next) => {
  console.error(err);
  res.status(422).send({ success: false, error: err.message });
});

module.exports = app;
