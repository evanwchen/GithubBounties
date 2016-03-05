var db = require('../db/database');

var Users = function() {

};

Users.prototype.saveCCPaymentId = function (custId, githubId) {
  return db('users')
  .where({github_id: githubId})
  .update({stripe_cust_id: custId})
};

// check if user exists
Users.prototype.doesUserExist = function (githubId) {
  return db('users')
  .where({github_id: githubId})
};

Users.prototype.saveBankRecipientId = function (recipientName, recipientType, recipientId, recipientEmail, githubId) {
  return db('users')
  .where({github_id: githubId})
  .update({
  	stripe_recipient_name: recipientName,
  	stripe_recipient_type: recipientType,
  	stripe_recipient_id: recipientId,
  	stripe_recipient_email: recipientEmail
  })
};

Users.prototype.createUser = function (customer) {
  return db('users').insert({
    github_id: customer.id,
    github_username: customer.username,
    github_name: customer.name,
    github_email: customer.email
  })
};

Users.prototype.addToQueue = function (issue_id, user_id) {
  return db('issuesUsers').insert({
    issue_id: issue_id, /* github_id */
    user_id: user_id /* github user id */
  })
};

module.exports = Users;
