const moment = require("moment");

module.exports = function() {
  console.log(
    moment()
      .utc()
      .format("YYYY-MM-DD HH:mm:ss")
  );
};
