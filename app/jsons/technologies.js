export default [
  {
    id: 'ember',
    name: 'Ember',
    year: '2011',
    col: 3,
    row: 5,
    classNames: ['tech_sig']
  },
  {
    id: 'sproutcore',
    name: 'Sproutcore',
    year: '2007',
    col: 0,
    row: 2,
    classNames: ['tech_sig'],
    related: [{'id': 'ember', 'type': 'node-technology'}] 
  }
];
