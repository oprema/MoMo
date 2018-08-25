import React, { Component } from 'react';
import PropTypes from 'prop-types';
import i18n from './i18n';

import styles from './index.css';

class MotionInfo extends Component {

  getColorStyle(color) {
    switch (color) {
      case 'warn':
        return styles.warn;
      case 'err':
        return styles.err;
      default:
        return styles.ok;
    }
  }

  getLast(last, lng) {
    if (last === '6+') {
      return i18n.t('m6', { lng });
    } else {
      const h = i18n.t('h', { lng });
      const m = i18n.t('m', { lng });

      last = last.replace('h', h);
      last = last.replace('m', m);
      if (lng === 'en') {
        last += ' ' + i18n.t('ago', { lng });
      }
      return last;
    }
  }

  render() {
    if (!this.props.info) return null;

    const { status, last } = this.props.info;
    const lng = this.props.lng;

    console.log('Info props:', this.props);
    return (
      <div className={[styles.MotionInfo, this.props.className].join(' ')}>
        <ul>
          <li>{i18n.t('hello', { lng })} {this.getLast(last, lng)}</li>
          <li>{i18n.t('state', { lng })}
            &nbsp;
            <span className={[styles.status, this.getColorStyle(status)].join(' ')}>
              {i18n.t(status, { lng })}
            </span>
          </li>
        </ul>
      </div>
    );
  }
}

MotionInfo.propTypes = {
  className: PropTypes.string,
  lng: PropTypes.oneOf(['en', 'de']),
  info: PropTypes.object
};

MotionInfo.defaultProps = {
  className: '',
  lng: 'de',
  info: null
};

export default MotionInfo;