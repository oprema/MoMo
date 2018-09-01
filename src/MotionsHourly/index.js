import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import styles from './index.css';

const LEGEND_LINE_PX = 215;
const MOVEMENT_WIDTH = 200;
const MOVEMENT_TOP = 150;
const MOVEMENT_BOTTOM = LEGEND_LINE_PX;

class MotionsHourly extends Component {

  constructor(props) {
    super(props);

    this.state = {
      hourly: null,
    };
  }

  getMotions() {
    if (!this.props.hourly) return [];

    return this.props.hourly.map((motion) => {
      const count = parseInt(motion.count, 10);
      const mDate = moment().set({'hour': motion.hour,
        'minute': 0, 'second': 0, 'milliscond': 0});

      return {
        mDate: mDate,
        count: count
      };
    });
  }

  prepareMotions() {
    let motions = [];

    this.getMotions().forEach((motion) => {
      if (motions.length < 7)
        motions.push(motion);
    });
    return this.getRollingHours(motions, MOVEMENT_WIDTH, MOVEMENT_TOP, MOVEMENT_BOTTOM);
  }

  getRollingHours(motions, xWidth, yTop, yBottom, min, max) {
    max = max == null ? -Infinity : max;
    min = min == null ? Infinity : min;

    motions.forEach((motion, index) => {
      let count = motion.count;
      if (min > count) min = count;
      if (max < count) max = count;
    });

    let spread = Math.max(max - min, 1);
    return motions.map((motion, index) => {
      const x = index * xWidth;
      const xPrev = (index === 0 ? motion.x : motions[index - 1].x);

      const y = Math.ceil(((motion.count - min) / spread) * (yTop - yBottom) + yBottom);
      const yPrev = (index === 0 ? y : motions[index - 1].y);

      const height = Math.max(Math.ceil(yBottom - y) - 1, 0);
      const nDate = (motions.length-1 === index) ? null : motions[index + 1].mDate;

      return Object.assign(motion, { x, xPrev, y, yPrev, height, nDate });
    });
  }

  render() {
    const motions = this.prepareMotions();
    const showLegendLine = true;

    if (!motions) return null;

    return (
      <svg className={[styles.MotionsHourly, this.props.className].join(' ')}
        viewBox="-40 0 1040 330"
        xmlns="http://www.w3.org/2000/svg"
      >

        {/* LEGEND */}
        <g className={styles.legend}>
          {showLegendLine &&
            <line
              id="bottom-line"
              x1="-20"
              x2="1020"
              y1={LEGEND_LINE_PX}
              y2={LEGEND_LINE_PX}
            />
          }
          {motions.map(({ x, y, mDate }, i) => {
            return <text
              key={i}
              x={x}
              y={LEGEND_LINE_PX + 60}
              textAnchor="middle"
            >
              {this.props.lng === 'en' ? mDate.format('h') : mDate.format('HH')+':00'}
              &nbsp;
              <tspan className={styles.small}>
                {this.props.lng === 'en' ? mDate.format('A') : ''}
              </tspan>
            </text>
          })}
          <text x='-60'
            y={LEGEND_LINE_PX + 110}
            textAnchor="left"
          >
            {process.env.REACT_APP_LOCATION_NAME || 'MoMo'}
          </text>
        </g>

        {/* MOTIONS */}
        <g className={styles.motions}>
          {motions.map(({ x, y, height, count, mDate, nDate }, i) => {
            const active = moment().format('H') >= mDate.format('H') &&
              moment().format('H') < nDate.format('H');
            return <g key={i}>
              <rect
                x={x}
                width={MOVEMENT_WIDTH}
                y={y}
                height={height}
                className={active ? styles.rectAtive : styles.rect}
              >
                <title
                  className={styles.title}>
                  {count} Motions
                </title>
              </rect>
            </g>
          })}
        </g>
      </svg>
    );
  }
}

MotionsHourly.defaultProps = {
  className: '',
  lng: 'de',
  hourly: []
};

MotionsHourly.propTypes = {
  className: PropTypes.string,
  lng: PropTypes.oneOf(['de', 'en']),
  hourly: PropTypes.arrayOf(PropTypes.object),
};

export default MotionsHourly;
