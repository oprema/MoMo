import React, { Component } from 'react';
import moment from 'moment';

import DateTime from '../DateTime';
import MotionsHourly from '../MotionsHourly';
import LastMotion from '../LastMotion';
import API from '../api';
import motionStub from './stubs/motions';

import styles from './index.css';

const IS_DEV = false; // process.env.NODE_ENV !== 'production';

const ONE_MINUTE = 1000 * 60;
const FIVE_MINUTES = 5 * ONE_MINUTE;

const API_HOST = process.env.REACT_APP_MOTION_REMOTE_SERVER || window.location.hostname;
const API_URL = 'http://' + API_HOST + ':' + process.env.REACT_APP_MOTION_PORT + '/pir/api/v1'
class App extends Component {

  constructor(props) {
    super(props);

    this.setLastMotion = this.setLastMotion.bind(this);
    this.setHourlyMotions = this.setHourlyMotions.bind(this);
    this.i18nHandler = this.i18nHandler.bind(this)

    this.state = {
      hourly: null,
      last: null,
      lng: this.getLng()
    };

    // create the API
    this.myAPI = new API({ url: API_URL });
    this.myAPI.createEntities([{ name: 'last' }, { name: 'hourly' }]);

    console.log("Server", API_URL);
    console.log('Environment:', process.env.NODE_ENV);
  }

  componentDidMount() {
    setInterval(this.setLastMotion, ONE_MINUTE);
    setInterval(this.setHourlyMotions, FIVE_MINUTES);

    this.setLastMotion();
    this.setHourlyMotions();
  }

  componentWillUnmount() {
    clearInterval(this.setLastMotion);
    clearInterval(this.setHourlyMotions);
  }

  getCookie(name) {
    const cookies = document.cookie.split(';');
    const cookie = cookies.filter(c => c.trim().startsWith(name))[0];
    return cookie ? cookie.trim().substring(name.length + 1) : null;
  }

  setCookie(name, value) {
    let date = new Date();
    date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
  }

  setLastMotion() {
    if (IS_DEV) {
      this.setState({
        last: motionStub.last
      });
    } else {
      this.myAPI.endpoints.last.getAll().then(({ data }) => {
        console.log('API data last:', data);

        this.setState({
          last: data
        });
      });
    }
  }

  setHourlyMotions() {
    if (IS_DEV) {
      this.setState({
        hourly: motionStub.hourly
      });
    } else {
      this.myAPI.endpoints.hourly.getAll().then(({ data }) => {
        console.log('API data hourly:', data);

        this.setState({
          hourly: data
        });
      });
    }
  }

  getLng() {
    const lng = this.getCookie('x-motion-i18n') || 'de';
    console.log('Cookie i18n-lng:', lng);
    return lng;
  }

  i18nHandler(lng) {
    console.log('Set cookie (i18n-lng):', lng);
    this.setCookie('x-motion-i18n', lng);

    this.setState({
      lng: lng
    });
  }

  getBackgroundClassName() {
    const isWeekend = moment().day() === 0 || moment().day() === 6;
    const isAlarm = false;

    switch (true) {
      case isWeekend: return styles.weekend;
      case isAlarm: return styles.alarm;
      default: return styles.default;
    }
  }

  render() {
    const appClassNames = [styles.App, this.getBackgroundClassName()];
    const { hourly, last, lng } = this.state;

    return (
      <div className={appClassNames.join(' ')}>
        <div className={styles.container}>
          <DateTime
            className={styles.DateTime}
            lng={lng}
            handler={this.i18nHandler}
          />
          <LastMotion
            className={styles.LastMotion}
            lng={lng}
            last={last}
          />
          <MotionsHourly
            className={styles.MotionsHourly}
            lng={lng}
            hourly={hourly}
          />
        </div>
      </div>
    );
  }
}

export default App;
