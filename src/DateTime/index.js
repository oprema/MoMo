import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import 'moment/locale/de';
import LngSwitch from '../LngSwitch';

import styles from './index.css';

class DateTime extends Component {

  constructor(props) {
    super(props);

    this.state = {
      momentTime: moment(),
      isHalfTick: false,
    };

    this.setTime = this.setTime.bind(this);
  }

  setTime() {
    this.setState({
      momentTime: moment(),
      isHalfTick: !this.state.isHalfTick
    });
  }

  componentDidMount() {
    setInterval(this.setTime, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.setTime);
  }

  getDateFormat() {
    switch (this.props.lng) {
      case 'de':
        return 'dddd, Do MMMM';
      default:
        return 'dddd, MMMM Do';
    }
  }

  render() {
    const { momentTime, isHalfTick } = this.state;
    const { lng, handler } = this.props;
    let seperatorClassNames = [styles.seperator];

    moment.locale(lng);
    if (isHalfTick) seperatorClassNames.push(styles.hide);

    return (
      <div className={[styles.DateTime, this.props.className].join(' ')}>
        <div className={styles.date}>
          <LngSwitch
            lng={lng}
            handler={handler}
          />
          <br />
          {momentTime.format(this.getDateFormat())}
        </div>
        <div className={styles.time}>
          {lng === 'de'
            ?
              momentTime.format('HH')
            :
              momentTime.format('h')
          }
          <span className={seperatorClassNames.join(' ')}>
            :
          </span>
          {momentTime.format('mm')}
          {lng !== 'de'
            ?
              <span className={styles.ampm}>
                {momentTime.format('A')}
              </span>
            :
              ''
          }
        </div>
      </div>
    );
  }
}

DateTime.defaultProps = {
  className: '',
  lng: 'de',
};

DateTime.propTypes = {
  className: PropTypes.string,
  lng: PropTypes.oneOf(['de', 'en']),
};

export default DateTime;
