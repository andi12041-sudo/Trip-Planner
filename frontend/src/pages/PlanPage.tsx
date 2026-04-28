import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import ScheduleListView from '../components/ScheduleListView';
import ScheduleGridView from '../components/ScheduleGridView';
import ScheduleModal from '../components/ScheduleModal';
import { Plan, Schedule, ViewMode, ModalMode } from '../types';
import { getPlan, getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../services/api';
import { getDateRange, formatDate, formatDateWithDay, formatCost } from '../utils/dateUtils';
import styles from './PlanPage.module.css';

interface Props {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
}

interface ModalState {
  open: boolean;
  mode: ModalMode;
  schedule?: Schedule;
}

interface DatePickerState {
  open: boolean;
  action: 'move' | 'copyToDate' | null;
  schedule?: Schedule;
}

export default function PlanPage({ isDark, setIsDark }: Props) {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'create' });
  const [datePicker, setDatePicker] = useState<DatePickerState>({ open: false, action: null });

  // 모바일(768px 이하)에서는 그리드 뷰 강제 해제
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setViewMode('list');
    };
    mq.addEventListener('change', handler);
    if (mq.matches) setViewMode('list');
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!planId) return;

    // StrictMode의 이중 실행 또는 planId 변경 시 이전 요청 무효화
    let cancelled = false;

    setLoading(true);
    Promise.all([getPlan(planId), getSchedules(planId)])
      .then(([planData, schedulesData]) => {
        if (cancelled) return;
        setPlan(planData);
        setSchedules(schedulesData);
        const range = getDateRange(planData.startDate, planData.endDate);
        setDates(range);
        setSelectedDate((prev) => (prev && range.includes(prev) ? prev : range[0]));
      })
      .catch((err) => {
        if (cancelled) return;
        alert(err instanceof Error ? err.message : '플랜을 불러올 수 없습니다.');
        navigate('/');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  // navigate는 React Router가 보장하는 안정적 참조이므로 의존성 배열에서 제외
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  // 현재 선택 날짜의 스케줄 (시간순 정렬)
  const todaySchedules = schedules
    .filter((s) => s.date === selectedDate)
    .sort((a, b) => {
      const at = a.startTime ?? '00:00';
      const bt = b.startTime ?? '00:00';
      return at < bt ? -1 : at > bt ? 1 : 0;
    });

  // 총 예산 계산
  const totalCost = schedules.reduce((sum, s) => sum + (s.cost ?? 0), 0);

  // URL 복사
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('URL 복사에 실패했습니다. 브라우저 주소창에서 직접 복사해주세요.');
    }
  };

  // ── 스케줄 CRUD ──────────────────────────────────────────

  const handleSaveSchedule = async (
    payload: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (!planId) return;
    const created = await createSchedule(planId, payload);
    setSchedules((prev) =>
      [...prev, created].sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        const at = a.startTime ?? '00:00';
        const bt = b.startTime ?? '00:00';
        return at < bt ? -1 : 1;
      }),
    );
  };

  const handleUpdateSchedule = async (
    scheduleId: string,
    payload: Partial<Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>>,
  ) => {
    if (!planId) return;
    const updated = await updateSchedule(planId, scheduleId, payload);
    setSchedules((prev) =>
      prev
        .map((s) => (s.id === scheduleId ? updated : s))
        .sort((a, b) => {
          if (a.date !== b.date) return a.date < b.date ? -1 : 1;
          const at = a.startTime ?? '00:00';
          const bt = b.startTime ?? '00:00';
          return at < bt ? -1 : 1;
        }),
    );
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!planId) return;
    await deleteSchedule(planId, scheduleId);
    setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
  };

  // ── 복사 / 이동 ──────────────────────────────────────────

  const handleCopySameDate = async (schedule: Schedule) => {
    if (!planId) return;
    try {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = schedule;
      void _id; void _c; void _u;
      const created = await createSchedule(planId, rest);
      setSchedules((prev) => [...prev, created]);
    } catch (err) {
      alert(err instanceof Error ? err.message : '복사 중 오류가 발생했습니다.');
    }
  };

  const handleMoveOrCopyToDate = (schedule: Schedule, action: 'move' | 'copyToDate') => {
    setDatePicker({ open: true, action, schedule });
  };

  const handleDatePickerSelect = async (targetDate: string) => {
    const { action, schedule } = datePicker;
    if (!planId || !schedule || !action) return;
    setDatePicker({ open: false, action: null });

    try {
      if (action === 'move') {
        await handleUpdateSchedule(schedule.id, { date: targetDate });
      } else {
        const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = schedule;
        void _id; void _c; void _u;
        const created = await createSchedule(planId, { ...rest, date: targetDate });
        setSchedules((prev) => [...prev, created]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  // plan이 아직 없을 때(최초 로딩)만 풀스크린으로 표시.
  // 이미 plan이 있는 상태에서의 배경 재조회는 모달을 닫지 않기 위해 무시한다.
  if (!plan) {
    return (
      <div className={styles.loadingScreen}>
        <p>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── 헤더 ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>
            ←
          </button>
          <div>
            <h1 className={styles.planName}>{plan.planName}</h1>
            <p className={styles.planMeta}>
              {plan.destination} &middot; {formatDate(plan.startDate)} ~ {formatDate(plan.endDate)}
            </p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button
            className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
            onClick={handleCopyUrl}
          >
            {copied ? '✓ 복사됨' : '🔗 URL 복사'}
          </button>
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
        </div>
      </header>

      <div className={styles.body}>
        {/* ── 사이드바 ── */}
        <aside className={styles.sidebar}>
          <div className={styles.dateList}>
            {dates.map((date, idx) => (
              <button
                key={date}
                className={`${styles.dateBtn} ${selectedDate === date ? styles.dateBtnActive : ''}`}
                onClick={() => setSelectedDate(date)}
              >
                <span className={styles.dayNum}>Day {idx + 1}</span>
                <span className={styles.dateStr}>{formatDateWithDay(date)}</span>
                <span className={styles.scheduleCount}>
                  {schedules.filter((s) => s.date === date).length}개
                </span>
              </button>
            ))}
          </div>

          {totalCost > 0 && (
            <div className={styles.budgetBox}>
              <span className={styles.budgetLabel}>총 예산</span>
              <span className={styles.budgetValue}>{formatCost(totalCost)}</span>
            </div>
          )}
        </aside>

        {/* ── 메인 콘텐츠 ── */}
        <main className={styles.content}>
          {/* 뷰 토글 + 날짜 제목 */}
          <div className={styles.contentHeader}>
            <h2 className={styles.contentTitle}>
              {viewMode === 'list' ? formatDateWithDay(selectedDate) : '전체 일정'}
            </h2>
            <div className={styles.viewToggle}>
              <button
                className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.toggleActive : ''}`}
                onClick={() => setViewMode('list')}
              >
                리스트
              </button>
              <button
                className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.toggleActive : ''} ${styles.gridOnlyDesktop}`}
                onClick={() => setViewMode('grid')}
              >
                그리드
              </button>
              {viewMode === 'list' && (
                <button
                  className={styles.addBtnHeader}
                  onClick={() =>
                    setModal({ open: true, mode: 'create' })
                  }
                >
                  + 추가
                </button>
              )}
            </div>
          </div>

          {/* 뷰 */}
          <div className={styles.viewArea}>
            {viewMode === 'list' ? (
              <ScheduleListView
                schedules={todaySchedules}
                onCardClick={(s) => setModal({ open: true, mode: 'view', schedule: s })}
                onCopy={handleCopySameDate}
                onMove={(s) => handleMoveOrCopyToDate(s, 'move')}
                onCopyToDate={(s) => handleMoveOrCopyToDate(s, 'copyToDate')}
                onAddClick={() => setModal({ open: true, mode: 'create' })}
              />
            ) : (
              <ScheduleGridView
                dates={dates}
                schedules={schedules}
                onCardClick={(s) => setModal({ open: true, mode: 'view', schedule: s })}
              />
            )}
          </div>
        </main>
      </div>

      {/* ── 스케줄 모달 ── */}
      {modal.open && planId && (
        <ScheduleModal
          mode={modal.mode}
          schedule={modal.schedule}
          selectedDate={selectedDate}
          dates={dates}
          planId={planId}
          onClose={() => setModal({ open: false, mode: 'create' })}
          onSave={handleSaveSchedule}
          onUpdate={handleUpdateSchedule}
          onDelete={handleDeleteSchedule}
        />
      )}

      {/* ── 날짜 선택 팝업 (이동/복사) ── */}
      {datePicker.open && (
        <div className={styles.overlay} onClick={() => setDatePicker({ open: false, action: null })}>
          <div
            className={styles.datePicker}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.datePickerHeader}>
              <h3>
                {datePicker.action === 'move' ? '이동할 날짜 선택' : '복사할 날짜 선택'}
              </h3>
              <button onClick={() => setDatePicker({ open: false, action: null })}>✕</button>
            </div>
            <div className={styles.datePickerList}>
              {dates.map((d) => (
                <button
                  key={d}
                  className={styles.datePickerBtn}
                  onClick={() => handleDatePickerSelect(d)}
                  disabled={d === datePicker.schedule?.date && datePicker.action === 'move'}
                >
                  {formatDate(d)}
                  {d === datePicker.schedule?.date && (
                    <span className={styles.currentBadge}> (현재)</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
