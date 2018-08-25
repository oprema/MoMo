import React from 'react';
import ReactDOM from 'react-dom';
import LastMotion from './index';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<LastMotion />, div);
});
