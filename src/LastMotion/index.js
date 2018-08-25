import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import MotionTimeout from '../MotionTimeout'
import MotionInfo from '../MotionInfo'

import styles from './index.css';

class LastMotion extends Component {

  constructor(props) {
    super(props);

    this.state = {
      percentage: 0,
      info: null,
    };

    moment.locale(this.props.lng);
    this.setInfo = this.setInfo.bind(this);
  }

  setInfo() {
    const { percentage, info } = this.getInfo();
    this.setState({
      percentage: percentage,
      info: info,
    });
  }

  componentDidMount() {
    setInterval(this.setInfo, 2500);
  }

  componentWillUnmount() {
    clearInterval(this.setInfo);
  }

  getTimeout(timeout) {
    const parts = timeout.split(':');
    let timeoutMins = 6 * 60; // 6h

    if (parts.length === 1) {
      timeoutMins = parseInt(parts[0], 10) * 60;
    } else if (parts.length === 2) {
      timeoutMins = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return timeoutMins;
  }

  getInfo() {
    const { date, time, timeout, active } = this.props.last;

    const currentDT = moment();
    const motionDT = moment(date + ' ' + time);
    const timeoutMins = this.getTimeout(timeout);
    const lastMotion = currentDT.diff(motionDT, 'minutes');
    const minsToTimeout = timeoutMins - lastMotion;
    const ratio = Math.round(minsToTimeout / timeoutMins * 100) / 100;
    const percentage = Math.ceil((1 - ratio) * 100);

    let last;
    let status = 'ok';

    if (active) {
      if (percentage < 100) {
        last = (Math.floor(lastMotion/60)).toString() + ' h '
          + (lastMotion%60).toString() + ' m';
      } else {
        last = '6+';
      }

    } else {
      status = 'zh'
    }

    if (percentage >= 80 && percentage < 100) {
      status = 'warn';
    }
    else if (percentage > 100) {
      status = 'err';
    }

    return {
      percentage: percentage,
      info: {
        last: last,
        status: status,
      }
    }
  }

  render() {
    if (!this.props.last) return null;
    const { percentage, info } = this.state;

    return (
      <div className={[styles.LastMotion, this.props.className].join(' ')}>
        <MotionTimeout
          className={styles.timeout}
          percentage={percentage.toString()}
        />
        &nbsp;
        <MotionInfo
          className={styles.last}
          lng={this.props.lng}
          info={info}
        />
      </div>
    );
  }
}

LastMotion.propTypes = {
  className: PropTypes.string,
  lng: PropTypes.oneOf(['en', 'de']),
  last: PropTypes.object,
};

LastMotion.defaultProps = {
  className: '',
  lng: 'de',
  last: null,
};

export default LastMotion;
