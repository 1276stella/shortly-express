var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  links: function() {
    return this.hasMany(Link);
  },
  initialize: function(){
    this.on('creating', function(model, attrs, options){
    });
  }
  // we could put hashPassword function here to get it out of shortly.js
  // we could put comparePassword func here to get it out of shortly.js  
});

module.exports = User;

