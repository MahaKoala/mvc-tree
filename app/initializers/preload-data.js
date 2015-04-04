import fixtureT from '../jsons/technologies';

export function initialize(container/*, application */) {
  var store = container.lookup('store:main');

  store.pushMany('node-technology', fixtureT);
}

export default {
  name: 'preload-data',
  after: ['ember-data', 'store'], 
  initialize: initialize 
};

