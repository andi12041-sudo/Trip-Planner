import { useState, useEffect, useRef } from 'react';
import { Schedule, ModalMode } from '../types';
import { formatDate } from '../utils/dateUtils';
import { formatCost } from '../utils/dateUtils';
import styles from './ScheduleModal.module.css';

interface Props {
  mode: ModalMode;
  schedule?: Schedule;
  selectedDate: string;
  dates: string[];
  planId: string;
  onClose: () => void;
  onSave: (payload: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdate: (scheduleId: string, payload: Partial<Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  onDelete: (scheduleId: string) => Promise<void>;
}

interface FormState {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  memo: string;
  cost: string;
}

export default function ScheduleModal({
  mode: initialMode,
  schedule,
  selectedDate,
  dates,
  onClose,
  onSave,
  onUpdate,
  onDelete,
}: Props) {
  const [mode, setMode] = useState<ModalMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    title: schedule?.title ?? '',
    date: schedule?.date ?? selectedDate,
    startTime: schedule?.startTime ?? '',
    endTime: schedule?.endTime ?? '',
    location: schedule?.location ?? '',
    description: schedule?.description ?? '',
    memo: schedule?.memo ?? '',
    cost: schedule?.cost !== undefined ? String(schedule.cost) : '',
  });

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode !== 'view') firstInputRef.current?.focus();
  }, [mode]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    date: form.date,
    ...(form.startTime && { startTime: form.startTime }),
    ...(form.endTime && { endTime: form.endTime }),
    ...(form.location.trim() && { location: form.location.trim() }),
    ...(form.description.trim() && { description: form.description.trim() }),
    ...(form.memo.trim() && { memo: form.memo.trim() }),
    ...(form.cost !== '' && { cost: Number(form.cost) }),
  });

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'create') {
        await onSave(buildPayload());
      } else if (mode === 'edit' && schedule) {
        await onUpdate(schedule.id, buildPayload());
      }
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!schedule) return;
    if (!window.confirm('이 일정을 삭제할까요?')) return;
    setLoading(true);
    try {
      await onDelete(schedule.id);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h2 className={styles.title}>
            {mode === 'create' ? '새 일정 추가' : mode === 'edit' ? '일정 수정' : '일정 상세'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); void handleSave(); }} className={styles.form}>
          {/* 제목 */}
          <div className={styles.field}>
            <label className={styles.label}>
              제목 <span className={styles.required}>*</span>
            </label>
            {isReadOnly ? (
              <p className={styles.value}>{schedule?.title}</p>
            ) : (
              <input
                ref={firstInputRef}
                className={styles.input}
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="일정 제목"
                required
              />
            )}
          </div>

          {/* 날짜 */}
          <div className={styles.field}>
            <label className={styles.label}>
              날짜 <span className={styles.required}>*</span>
            </label>
            {isReadOnly ? (
              <p className={styles.value}>{formatDate(schedule?.date ?? '')}</p>
            ) : (
              <select
                className={styles.input}
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
              >
                {dates.map((d) => (
                  <option key={d} value={d}>
                    {formatDate(d)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 시간 */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>시작 시간</label>
              {isReadOnly ? (
                <p className={styles.value}>{schedule?.startTime ?? '-'}</p>
              ) : (
                <input
                  className={styles.input}
                  type="time"
                  value={form.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                />
              )}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>종료 시간</label>
              {isReadOnly ? (
                <p className={styles.value}>{schedule?.endTime ?? '-'}</p>
              ) : (
                <input
                  className={styles.input}
                  type="time"
                  value={form.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                />
              )}
            </div>
          </div>

          {/* 위치 */}
          <div className={styles.field}>
            <label className={styles.label}>위치/주소</label>
            {isReadOnly ? (
              <p className={styles.value}>{schedule?.location ?? '-'}</p>
            ) : (
              <input
                className={styles.input}
                type="text"
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="위치 또는 주소"
              />
            )}
          </div>

          {/* 예상 비용 */}
          <div className={styles.field}>
            <label className={styles.label}>예상 비용 (원)</label>
            {isReadOnly ? (
              <p className={styles.value}>
                {schedule?.cost !== undefined ? formatCost(schedule.cost) : '-'}
              </p>
            ) : (
              <input
                className={styles.input}
                type="number"
                min="0"
                value={form.cost}
                onChange={(e) => handleChange('cost', e.target.value)}
                placeholder="0"
              />
            )}
          </div>

          {/* 설명 */}
          <div className={styles.field}>
            <label className={styles.label}>설명</label>
            {isReadOnly ? (
              <p className={styles.value}>{schedule?.description ?? '-'}</p>
            ) : (
              <textarea
                className={styles.textarea}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="일정에 대한 설명"
                rows={3}
              />
            )}
          </div>

          {/* 메모 */}
          <div className={styles.field}>
            <label className={styles.label}>메모</label>
            {isReadOnly ? (
              <p className={styles.value}>{schedule?.memo ?? '-'}</p>
            ) : (
              <textarea
                className={styles.textarea}
                value={form.memo}
                onChange={(e) => handleChange('memo', e.target.value)}
                placeholder="개인 메모"
                rows={2}
              />
            )}
          </div>

          {/* 버튼 영역 */}
          <div className={styles.actions}>
            {mode === 'view' ? (
              <>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => setMode('edit')}
                >
                  수정
                </button>
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={handleDelete}
                  disabled={loading}
                >
                  삭제
                </button>
                <button type="button" className={styles.btnSecondary} onClick={onClose}>
                  닫기
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? '저장 중...' : '저장'}
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={onClose}
                  disabled={loading}
                >
                  취소
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
