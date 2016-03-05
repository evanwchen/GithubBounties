const DateDiff = require('date-diff');
const Promise = require('bluebird');
var db = require('../db/database');

var Issues = function() {
  this._issues = [];
  this._lastUpdateDate = new Date('1/1/2015');
};

Issues.prototype.getIssues = function () {
  var self = this;
  var hoursSinceLastFetch = new DateDiff(new Date(), this._lastUpdateDate).hours();
  
  if (this._issues.length === 0 ||
   hoursSinceLastFetch > 1) {
    return db.raw(`select i.*
      , r.language
      , r.id as repo_id 
      from issues i 
      left join repos r on i.org_name=r.org_name and i.repo_name=r.name 
      order by created_at desc;`)
      .then((results) => {
        results[0].forEach((issue) => {
          issue.labels = JSON.parse(issue.labels);
        });
        this._issues = results[0];
        this._lastUpdateDate = new Date();
        return this._issues;
      })
      .catch(console.log);
  } else {
    return new Promise((resolve) => resolve(this._issues));
  }
};

Issues.prototype.getBounties = function () {
  return db.raw(`select b.*
    , r.language
    , r.id as repo_id 
    from bountyissues b 
    left join repos r on b.org_name=r.org_name and b.repo_name=r.name 
    where b.bounty_paid=false
    order by created_at desc;`)
    .then((results) => {
      return results[0];
    })
    .catch(console.log);
};

Issues.prototype.getUserIssues = function (user_id) {
  return db.raw(`select i.internal_id as internal_id
    , b.repo_name as repo_name
    , b.org_name as org_name
    , b.title as title
    , b.html_url as html_url
    , b.bounty_price as bounty_price
    , b.bitcoin_amount as bitcoin_amount
    from issuesUsers i, bountyIssues b
    where i.issue_id=b.id
    and i.user_id=${user_id}
    and b.bounty_paid=false;`)
    .then((results) => {
      return results[0];
    })
    .catch(console.log);
};

module.exports = Issues;