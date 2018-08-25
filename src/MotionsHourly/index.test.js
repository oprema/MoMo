import React from 'react';
import ReactDOM from 'react-dom';
import MovementsHourly from './index';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<MovementsHourly />, div);
});
