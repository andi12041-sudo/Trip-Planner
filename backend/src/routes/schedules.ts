import { Router, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../config/firebase';
import { Schedule } from '../types';

const router = Router({ mergeParams: true });

// GET /api/plans/:planId/schedules — 스케줄 전체 조회 (날짜·시간순 정렬)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;

    const planDoc = await db.collection('plans').doc(planId).get();
    if (!planDoc.exists) {
      return res.status(404).json({ error: '플랜을 찾을 수 없습니다.' });
    }

    const snapshot = await db
      .collection('plans')
      .doc(planId)
      .collection('schedules')
      .get();

    const schedules: Schedule[] = snapshot.docs.map((doc) => doc.data() as Schedule);

    // 날짜 문자열 비교 → 날짜 오름차순, 같은 날짜면 시작 시간 오름차순
    schedules.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      const aTime = a.startTime ?? '00:00';
      const bTime = b.startTime ?? '00:00';
      return aTime < bTime ? -1 : aTime > bTime ? 1 : 0;
    });

    return res.json(schedules);
  } catch (error) {
    console.error('스케줄 조회 오류:', error);
    return res.status(500).json({ error: '스케줄 조회 중 오류가 발생했습니다.' });
  }
});

// POST /api/plans/:planId/schedules — 스케줄 추가
router.post('/', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const { title, date, startTime, endTime, location, description, memo, cost } =
      req.body as Partial<Schedule>;

    if (!title || !date) {
      return res.status(400).json({ error: '필수 필드가 누락되었습니다. (title, date)' });
    }

    const planDoc = await db.collection('plans').doc(planId).get();
    if (!planDoc.exists) {
      return res.status(404).json({ error: '플랜을 찾을 수 없습니다.' });
    }

    const scheduleId = nanoid(10);
    const now = new Date().toISOString();
    const schedule: Schedule = {
      id: scheduleId,
      title,
      date,
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(location !== undefined && { location }),
      ...(description !== undefined && { description }),
      ...(memo !== undefined && { memo }),
      ...(cost !== undefined && { cost: Number(cost) }),
      createdAt: now,
      updatedAt: now,
    };

    await db
      .collection('plans')
      .doc(planId)
      .collection('schedules')
      .doc(scheduleId)
      .set(schedule);

    return res.status(201).json(schedule);
  } catch (error) {
    console.error('스케줄 추가 오류:', error);
    return res.status(500).json({ error: '스케줄 추가 중 오류가 발생했습니다.' });
  }
});

// PUT /api/plans/:planId/schedules/:scheduleId — 스케줄 수정
router.put('/:scheduleId', async (req: Request, res: Response) => {
  try {
    const { planId, scheduleId } = req.params;

    const docRef = db
      .collection('plans')
      .doc(planId)
      .collection('schedules')
      .doc(scheduleId);

    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: '스케줄을 찾을 수 없습니다.' });
    }

    const { title, date, startTime, endTime, location, description, memo, cost } =
      req.body as Partial<Schedule>;

    const updates: Partial<Schedule> & { updatedAt: string } = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title;
    if (date !== undefined) updates.date = date;
    if (startTime !== undefined) updates.startTime = startTime;
    if (endTime !== undefined) updates.endTime = endTime;
    if (location !== undefined) updates.location = location;
    if (description !== undefined) updates.description = description;
    if (memo !== undefined) updates.memo = memo;
    if (cost !== undefined) updates.cost = Number(cost);

    await docRef.update(updates);

    const updated = await docRef.get();
    return res.json(updated.data() as Schedule);
  } catch (error) {
    console.error('스케줄 수정 오류:', error);
    return res.status(500).json({ error: '스케줄 수정 중 오류가 발생했습니다.' });
  }
});

// DELETE /api/plans/:planId/schedules/:scheduleId — 스케줄 삭제
router.delete('/:scheduleId', async (req: Request, res: Response) => {
  try {
    const { planId, scheduleId } = req.params;

    const docRef = db
      .collection('plans')
      .doc(planId)
      .collection('schedules')
      .doc(scheduleId);

    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: '스케줄을 찾을 수 없습니다.' });
    }

    await docRef.delete();
    return res.json({ message: '스케줄이 삭제되었습니다.' });
  } catch (error) {
    console.error('스케줄 삭제 오류:', error);
    return res.status(500).json({ error: '스케줄 삭제 중 오류가 발생했습니다.' });
  }
});

export default router;
