import Ember from 'ember';
import {
  module,
  test
} from 'qunit';
import startApp from 'mvctree/tests/helpers/start-app';

var application;

module('Acceptance: Index', {
  beforeEach: function() {
    application = startApp();
  },

  afterEach: function() {
    var store = application.registry.lookup('store:main');
    //var store = this.store(); 
    Ember.run(function() {
      console.log('NODES');
      var model = store.all('node-technology');
      model.forEach(function(item) {
        console.log(item.toJSON());
        store.unloadRecord(item);
      });

    });
    Ember.run(application, 'destroy');
  }
});

test('visiting / first time', function(assert) {
  visit('/');

  andThen(function() {
    assert.equal(currentPath(), 'index');
  });
});

test('visiting / second time', function(assert) {
  visit('/');

  andThen(function() {
    assert.equal(currentPath(), 'index');
  });
});
