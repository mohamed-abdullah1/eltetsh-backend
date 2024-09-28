const responseObject = (success, message, data) => {
  return {
    success,
    message,
    data,
  };
};
module.exports = responseObject;
