import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { createPlan } from '../services/api';
import { getTodayString } from '../utils/dateUtils';
import styles from './HomePage.module.css';

interface Props {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
}

interface FormState {
  planName: string;
  destination: string;
  startDate: string;
  endDate: string;
}

export default function HomePage({ isDark, setIsDark }: Props) {
  const navigate = useNavigate();
  const today = getTodayString();

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    planName: '',
    destination: '',
    startDate: today,
    endDate: today,
  });

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.startDate > form.endDate) {
      alert('종료일은 시작일보다 같거나 이후여야 합니다.');
      return;
    }

    setLoading(true);
    try {
      const plan = await createPlan(form);
      navigate(`/plan/${plan.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '플랜 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.logo}>✈ 여행 플래너</h1>
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h2 className={styles.heroTitle}>함께 만드는 여행 일정</h2>
          <p className={styles.heroDesc}>
            URL 하나로 친구·가족과 실시간으로 일정을 공유하고 함께 편집하세요.
            <br />
            로그인 없이, 지금 바로 시작할 수 있습니다.
          </p>

          {!showForm ? (
            <button className={styles.startBtn} onClick={() => setShowForm(true)}>
              새 여행 플랜 만들기
            </button>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <h3 className={styles.formTitle}>새 여행 플랜</h3>

              <div className={styles.field}>
                <label className={styles.label}>
                  여행 이름 <span className={styles.required}>*</span>
                </label>
                <input
                  className={styles.input}
                  type="text"
                  value={form.planName}
                  onChange={(e) => handleChange('planName', e.target.value)}
                  placeholder="예: 제주도 가족여행"
                  required
                  autoFocus
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  목적지 <span className={styles.required}>*</span>
                </label>
                <input
                  className={styles.input}
                  type="text"
                  value={form.destination}
                  onChange={(e) => handleChange('destination', e.target.value)}
                  placeholder="예: 제주도"
                  required
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>
                    시작일 <span className={styles.required}>*</span>
                  </label>
                  <input
                    className={styles.input}
                    type="date"
                    value={form.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    종료일 <span className={styles.required}>*</span>
                  </label>
                  <input
                    className={styles.input}
                    type="date"
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? '생성 중...' : '플랜 생성하기'}
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowForm(false)}
                  disabled={loading}
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>

        <p className={styles.notice}>
          ⚠️ 공유 URL을 잃어버리면 복구할 수 없습니다. URL을 안전한 곳에 저장해두세요.
        </p>

        <section className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📅</div>
            <h3>날짜별 일정 관리</h3>
            <p>일정을 날짜별로 정리하고 리스트·그리드 뷰로 확인하세요.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔗</div>
            <h3>URL 공유</h3>
            <p>링크만 있으면 누구나 일정을 확인하고 편집할 수 있습니다.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💰</div>
            <h3>예산 관리</h3>
            <p>각 일정에 예상 비용을 입력해 총 여행 예산을 파악하세요.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
