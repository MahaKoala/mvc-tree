import Ember from 'ember';
import {
  module,
  test
} from 'qunit';
import startApp from 'mvc-tree/tests/helpers/start-app';

var application;

module('Acceptance: Index#hash', {
  beforeEach: function() {
    application = startApp();
  },

  afterEach: function() {
    // TODO: remove this workaround
    // https://github.com/givanse/mvc-tree/issues/2
/*
    var store = application.registry.lookup('store:main');
    Ember.run(function() {
      var arr1 = store.all('node-technology').toArray();
      var arr2 = store.all('node-dpattern').toArray();
      var arr3 = store.all('node-header').toArray();
      var arr4 = store.all('column').toArray();
      arr1.concat(arr2).concat(arr3).concat(arr4).forEach(function(record) {
        store.unloadRecord(record);
      });
    });
*/
    Ember.run(application, 'destroy');
  }
});

//TODO: avoid using run.later() by adding an async helper that will wait
// on a promise returned by the svg-g view.
// http://stackoverflow.com/questions/26498845

test('visiting /#pac', function(assert) {
  var $panel = find('#pac');
  assert.ok( ! $panel.isInView(), 'panel is not visible on screen');

  visit('/#pac');

  andThen(function() {
    assert.equal(currentPath(), 'index', 'current path');
    assert.equal(currentURL(), '/#pac', 'current URL');

    // TODO: enable this test
    // it has to wait for the scroll animation (view:svg-g-click) to finish
    // assert.ok( $panel.isInView(), 'panel is visible on screen');
  });
});
