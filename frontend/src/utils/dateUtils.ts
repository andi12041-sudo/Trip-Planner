// UTC 변환 없이 순수 문자열로 날짜를 처리한다.
// new Date(dateString)은 UTC로 파싱되어 하루가 밀리므로 절대 사용하지 않는다.

export function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export function formatDateShort(dateString: string): string {
  const [, month, day] = dateString.split('-').map(Number);
  return `${month}/${day}`;
}

export function formatDateWithDay(dateString: string): string {
  const day = getDayOfWeek(dateString);
  const [, month, d] = dateString.split('-').map(Number);
  return `${month}/${d} (${day})`;
}

// Tomohiko Sakamoto 알고리즘으로 요일 계산 (UTC 변환 없음)
export function getDayOfWeek(dateString: string): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const [y, m, d] = dateString.split('-').map(Number);
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const yr = m < 3 ? y - 1 : y;
  const dow =
    (yr + Math.floor(yr / 4) - Math.floor(yr / 100) + Math.floor(yr / 400) + t[m - 1] + d) % 7;
  return days[dow];
}

// startDate ~ endDate 사이의 날짜 배열 반환 (YYYY-MM-DD 문자열)
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let [y, m, d] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);

  while (true) {
    const current = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dates.push(current);
    if (y === ey && m === em && d === ed) break;

    d++;
    const maxDay = getDaysInMonth(y, m);
    if (d > maxDay) {
      d = 1;
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
    // 무한루프 방지: 현재 날짜가 종료 날짜를 넘으면 중단
    if (y > ey || (y === ey && m > em) || (y === ey && m === em && d > ed + 1)) break;
  }

  return dates;
}

function getDaysInMonth(year: number, month: number): number {
  const daysPerMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) return 29;
  return daysPerMonth[month];
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// HH:mm 시간을 분(minutes)으로 변환
export function timeToMinutes(time: string): number {
  const [h, min] = time.split(':').map(Number);
  return h * 60 + min;
}

// 오늘 날짜를 YYYY-MM-DD 문자열로 반환
export function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 비용을 한국 원화 형식으로 포맷
export function formatCost(cost: number): string {
  return `₩${cost.toLocaleString('ko-KR')}`;
}
