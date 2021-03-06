import fixtureT from '../jsons/technologies';
import fixtureP from '../jsons/dpatterns';
import fixtureH from '../jsons/headers';
import fixtureC from '../jsons/columns';

export function initialize(container/*, application */) {
  var store = container.lookup('store:main');

  store.pushMany('column', fixtureC);

  store.pushMany('node-header', fixtureH);

  store.pushMany('node-technology', fixtureT);

  store.pushMany('node-dpattern', fixtureP);
}

export default {
  name: 'preload-data',
  after: ['ember-data', 'store'], 
  initialize: initialize 
};

