import { Fragment } from 'react';
import { Schedule } from '../types';
import { formatDateWithDay, timeToMinutes, formatCost } from '../utils/dateUtils';
import styles from './ScheduleGridView.module.css';

const GRID_START = 6;   // 06:00
const GRID_END = 23;    // 23:00
const TOTAL_HOURS = GRID_END - GRID_START + 1; // 18
const HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => GRID_START + i);

interface Props {
  dates: string[];
  schedules: Schedule[];
  onCardClick: (schedule: Schedule) => void;
}

export default function ScheduleGridView({ dates, schedules, onCardClick }: Props) {
  const schedulesByDate = (date: string) =>
    schedules.filter((s) => s.date === date);

  // 그리드 높이 내에서 일정 위치 계산 (%)
  const calcTop = (time: string): number => {
    const mins = timeToMinutes(time) - GRID_START * 60;
    return (mins / (TOTAL_HOURS * 60)) * 100;
  };

  const calcHeight = (start: string, end: string): number => {
    const dur = timeToMinutes(end) - timeToMinutes(start);
    if (dur <= 0) return (30 / (TOTAL_HOURS * 60)) * 100; // 최소 30분 높이
    return (dur / (TOTAL_HOURS * 60)) * 100;
  };

  return (
    <div className={styles.wrapper}>
      {/* 헤더 행: 빈 셀 + 날짜 */}
      <div className={styles.grid} style={{ '--col-count': dates.length } as React.CSSProperties}>
        <div className={styles.timeHeader} />
        {dates.map((date) => (
          <div key={date} className={styles.dateHeader}>
            {formatDateWithDay(date)}
          </div>
        ))}

        {/* 시간 레이블 + 날짜별 컬럼 */}
        {HOURS.map((hour) => (
          <Fragment key={`row-${hour}`}>
            <div className={styles.timeLabel}>
              {String(hour).padStart(2, '0')}:00
            </div>
            {dates.map((date) => (
              <div key={`cell-${date}-${hour}`} className={styles.cell} />
            ))}
          </Fragment>
        ))}

        {/* 일정 카드 오버레이 (각 날짜 컬럼에 절대 위치) */}
        {dates.map((date, colIdx) => {
          const daySchedules = schedulesByDate(date);
          return daySchedules.map((s) => {
            if (!s.startTime) return null;
            const top = calcTop(s.startTime);
            const height = s.endTime ? calcHeight(s.startTime, s.endTime) : calcTop('00:30');
            return (
              <div
                key={s.id}
                className={styles.scheduleCard}
                style={{
                  top: `calc(${top}% + 32px)`,           // 32px = dateHeader 높이
                  height: `${height}%`,
                  left: `calc(48px + ${colIdx} * (100% - 48px) / ${dates.length} + 2px)`,
                  width: `calc((100% - 48px) / ${dates.length} - 4px)`,
                }}
                onClick={() => onCardClick(s)}
                title={s.title}
              >
                <span className={styles.cardTitle}>{s.title}</span>
                {s.cost !== undefined && (
                  <span className={styles.cardCost}>{formatCost(s.cost)}</span>
                )}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}
