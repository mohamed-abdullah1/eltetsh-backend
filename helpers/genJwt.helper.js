const jwt = require("jsonwebtoken");

const genJwt = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};
module.exports = genJwt;
