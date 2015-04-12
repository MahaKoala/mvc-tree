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
    /*
      Workaround
      https://github.com/emberjs/data/issues/2982
    */
    var store = application.registry.lookup('store:main');
    Ember.run(function() {
      console.log('NODES');
      var model = store.all('node-technology');

      model.forEach(function(item) {
        console.log(item.toJSON());
        store.unloadRecord(item); // comment this line to see assertion failure
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

/*
  Destroy the application and start a new one.
*/
test('visiting / second time', function(assert) {
  visit('/');

  andThen(function() {
    assert.equal(currentPath(), 'index');
  });
});

