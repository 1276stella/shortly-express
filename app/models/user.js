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
      var tempHash = bcrypt.hashSync(model.get('password'));
      // Todo: why asyn fails?
      // bcrypt.hash(model.get('password'), null, function(err, hash){
      //   if(err) throw err;
      //   console.log('hash: ', hash);
      //   // tempHash = hash;
      //   model.set('password', hash);
      // });
      model.set('password', tempHash);
    });
  }  
});

module.exports = User;