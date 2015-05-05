import Ember from 'ember';

import {
  moduleForModel,
  test
} from 'ember-qunit';

moduleForModel('node-header', {
  // Specify the other units that are required for this test.
  needs: ['model:column']
});

test('it exists', function(assert) {
  var model = this.subject({ svgenv: Ember.Object.create() });
  // var store = this.store();
  assert.ok(!!model);
});
