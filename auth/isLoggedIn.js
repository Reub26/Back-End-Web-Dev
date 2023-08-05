const jwt = require("jsonwebtoken");
const secretKey = require("../config");

let check = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (authHeader === null || authHeader === undefined || !authHeader.startsWith("Bearer ")) {
    res.status(403).send({ error: "Bearer Token not supplied/found" });
    return;
  }
  const token = authHeader.split("Bearer ")[1];

  jwt.verify(token, secretKey, { algorithms: ["HS256"] }, (err, result) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        res.status(401).send({ error: "Token Expired, please login again" });
        return;
      }

      else {
        res.status(401).send({ error: "Unauthorized" });
        return;
      }
    }

    req.credentials = result;
    next();
  });
}

module.exports = check;