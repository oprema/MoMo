import React, { Component } from 'react';
import PropTypes from 'prop-types';

import styles from './index.css';

import de from '../pngs/de.png';
import en from '../pngs/en.png';

class LngSwitch extends Component {

  render() {
    const { lng, handler } = this.props;
    const de_disabled = (lng === 'de' ? 'disabled' : '');
    const en_disabled = (lng === 'en' ? 'disabled' : '');

    return (
      <div className={styles.lng}>
        <input type='image' className={styles.flag}
          src={de} alt='German' disabled={de_disabled}
          onClick={() => handler('de')} />
        <input type='image' className={styles.flag}
          src={en} alt='English' disabled={en_disabled}
          onClick={() => handler('en')} />
      </div>
    );
  }
}

LngSwitch.defaultProps = {
  className: '',
  lng: 'de',
  handler: null
};

LngSwitch.propTypes = {
  className: PropTypes.string,
  lng: PropTypes.oneOf(['de', 'en']),
  handler: PropTypes.func
};

export default LngSwitch;
