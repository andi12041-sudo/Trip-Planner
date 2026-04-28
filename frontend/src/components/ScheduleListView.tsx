import { useState, useRef, useEffect } from 'react';
import { Schedule } from '../types';
import { formatCost } from '../utils/dateUtils';
import styles from './ScheduleListView.module.css';

interface Props {
  schedules: Schedule[];
  onCardClick: (schedule: Schedule) => void;
  onCopy: (schedule: Schedule) => void;
  onMove: (schedule: Schedule) => void;
  onCopyToDate: (schedule: Schedule) => void;
  onAddClick: () => void;
}

export default function ScheduleListView({
  schedules,
  onCardClick,
  onCopy,
  onMove,
  onCopyToDate,
  onAddClick,
}: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {schedules.length === 0 ? (
          <div className={styles.empty}>
            <p>이 날짜에 일정이 없습니다.</p>
            <button className={styles.addBtnEmpty} onClick={onAddClick}>
              + 일정 추가
            </button>
          </div>
        ) : (
          schedules.map((s) => (
            <ScheduleCard
              key={s.id}
              schedule={s}
              onClick={() => onCardClick(s)}
              onCopy={() => onCopy(s)}
              onMove={() => onMove(s)}
              onCopyToDate={() => onCopyToDate(s)}
            />
          ))
        )}
      </div>

      {schedules.length > 0 && (
        <button className={styles.addBtn} onClick={onAddClick}>
          + 일정 추가
        </button>
      )}
    </div>
  );
}

interface CardProps {
  schedule: Schedule;
  onClick: () => void;
  onCopy: () => void;
  onMove: () => void;
  onCopyToDate: () => void;
}

function ScheduleCard({ schedule, onClick, onCopy, onMove, onCopyToDate }: CardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(true);
  };

  return (
    <div
      className={styles.card}
      onClick={onClick}
      onContextMenu={handleContextMenu}
    >
      <div className={styles.cardLeft}>
        {schedule.startTime && (
          <span className={styles.time}>
            {schedule.startTime}
            {schedule.endTime && ` ~ ${schedule.endTime}`}
          </span>
        )}
        <span className={styles.cardTitle}>{schedule.title}</span>
        {schedule.location && (
          <span className={styles.location}>📍 {schedule.location}</span>
        )}
      </div>
      <div className={styles.cardRight}>
        {schedule.cost !== undefined && (
          <span className={styles.cost}>{formatCost(schedule.cost)}</span>
        )}
        <div className={styles.menuWrapper} ref={menuRef}>
          <button
            className={styles.menuBtn}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            aria-label="더보기"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className={styles.menu}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onCopy();
                }}
              >
                복사 (같은 날짜)
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onCopyToDate();
                }}
              >
                다른 날짜로 복사
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onMove();
                }}
              >
                다른 날짜로 이동
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
