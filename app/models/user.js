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
      var ourModel = model;
      bcrypt.hash(model.get('password'), null, null, function(err, hash){
        if(err){ throw err };
        console.log('model ', model);
        console.log('password before: ', model.get('password'));
        console.log('hash: ', hash);
        ourModel.set('password', hash);
        console.log('password after', model.get('password'));
      });
    });
  }  
});

module.exports = User;



/*

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








  initialize: function(){
    this.on('creating', function(model, attrs, options){
      // var ourModel = model;
      bcrypt.hash(model.get('password'), null, function(err, hash){
        if(err){ throw err };
        console.log('model ', model);
        console.log('this ', this);
        console.log('hash: ', hash);
        model.set('password', hash);
      });
    });
*/