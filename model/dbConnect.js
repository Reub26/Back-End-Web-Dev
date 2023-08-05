// Admin num:     P2205711
// Name:          Reuben Goh
// Class:         DISM2A03

// function to start connections to sql database

var mysql = require('mysql2');

var dbConnect = {
  getConnection: function () {
    var conn = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "12345",
        database: "sp_games"
    });
    return conn;
  }
}
module.exports = dbConnect;