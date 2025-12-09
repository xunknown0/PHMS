const fs = require("fs");
const https = require("https");
const app = require("./app"); // or "./app" depending on your entry

const options = {
  key:  fs.readFileSync("localhost-key.pem"),
  cert: fs.readFileSync("localhost-cert.pem")
};

https.createServer(options, app).listen(4000, () => {
  console.log("HTTPS running at https://localhost:4000/owners");
});
