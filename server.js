// Admission num: P2205711
// Name:          Reuben Goh
// Class:         DISM2A03


// code to start running server

const app = require('./controller/app');

const port = 8081;

let server = app.listen(port, function () {
  console.log("Web App hosted http://localhost:%s", port);
});