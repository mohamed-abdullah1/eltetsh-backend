const jwt = require("jsonwebtoken");

const genJwt = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};
module.exports = genJwt;
