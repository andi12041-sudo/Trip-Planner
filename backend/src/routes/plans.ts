import { Router, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../config/firebase';
import { Plan } from '../types';

const router = Router();

// POST /api/plans — 새 플랜 생성
router.post('/', async (req: Request, res: Response) => {
  try {
    const { planName, destination, startDate, endDate } = req.body as Partial<Plan>;

    if (!planName || !destination || !startDate || !endDate) {
      return res.status(400).json({ error: '필수 필드가 누락되었습니다. (planName, destination, startDate, endDate)' });
    }

    const planId = nanoid(8);
    const plan: Plan = {
      id: planId,
      planName,
      destination,
      startDate,
      endDate,
      createdAt: new Date().toISOString(),
    };

    await db.collection('plans').doc(planId).set(plan);

    return res.status(201).json(plan);
  } catch (error) {
    console.error('플랜 생성 오류:', error);
    return res.status(500).json({ error: '플랜 생성 중 오류가 발생했습니다.' });
  }
});

// GET /api/plans/:planId — 플랜 조회
router.get('/:planId', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const doc = await db.collection('plans').doc(planId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: '플랜을 찾을 수 없습니다.' });
    }

    return res.json(doc.data() as Plan);
  } catch (error) {
    console.error('플랜 조회 오류:', error);
    return res.status(500).json({ error: '플랜 조회 중 오류가 발생했습니다.' });
  }
});

// PUT /api/plans/:planId — 플랜 수정
router.put('/:planId', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const { planName, destination, startDate, endDate } = req.body as Partial<Plan>;

    const docRef = db.collection('plans').doc(planId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: '플랜을 찾을 수 없습니다.' });
    }

    const updates: Partial<Plan> = {};
    if (planName !== undefined) updates.planName = planName;
    if (destination !== undefined) updates.destination = destination;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;

    await docRef.update(updates);

    const updated = await docRef.get();
    return res.json(updated.data() as Plan);
  } catch (error) {
    console.error('플랜 수정 오류:', error);
    return res.status(500).json({ error: '플랜 수정 중 오류가 발생했습니다.' });
  }
});

// DELETE /api/plans/:planId — 플랜 삭제 (서브컬렉션 포함)
router.delete('/:planId', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const docRef = db.collection('plans').doc(planId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: '플랜을 찾을 수 없습니다.' });
    }

    const schedulesRef = docRef.collection('schedules');
    const schedules = await schedulesRef.get();
    const batch = db.batch();
    schedules.forEach((s) => batch.delete(s.ref));
    batch.delete(docRef);
    await batch.commit();

    return res.json({ message: '플랜이 삭제되었습니다.' });
  } catch (error) {
    console.error('플랜 삭제 오류:', error);
    return res.status(500).json({ error: '플랜 삭제 중 오류가 발생했습니다.' });
  }
});

export default router;
