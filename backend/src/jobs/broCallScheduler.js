import cron from 'node-cron';
import { prisma } from '../db.js';
import { scheduleWeeklyBroCalls, deliverDueBroCalls, markExpiredBroCalls } from '../services/broCallService.js';
import logger from '../utils/logger.js';

/**
 * Start all Bro Call cron jobs.
 * - Every minute: check for due calls and deliver via WebSocket
 * - Every 5 minutes: mark expired calls as missed
 * - Sunday at midnight: schedule new week of calls for all active roster users
 */
export function startBroCallScheduler() {
    // Every minute — deliver due Bro Calls
    cron.schedule('* * * * *', async () => {
        try {
            await deliverDueBroCalls();
        } catch (err) {
            logger.error('Bro Call delivery job failed', { error: err.message });
        }
    });

    // Every 5 minutes — mark expired calls as missed
    cron.schedule('*/5 * * * *', async () => {
        try {
            await markExpiredBroCalls();
        } catch (err) {
            logger.error('Bro Call expiry job failed', { error: err.message });
        }
    });

    // Sunday at midnight — schedule new week for all users with active rosters
    cron.schedule('0 0 * * 0', async () => {
        try {
            const activeRosters = await prisma.userRoster.findMany({
                where: { isActive: true, expiresAt: { gt: new Date() } },
                select: { userId: true }
            });

            const uniqueUserIds = [...new Set(activeRosters.map(r => r.userId))];

            let scheduled = 0;
            for (const userId of uniqueUserIds) {
                await scheduleWeeklyBroCalls(userId);
                scheduled++;
            }

            logger.info('Weekly Bro Calls scheduled', { usersCount: scheduled });
        } catch (err) {
            logger.error('Weekly Bro Call scheduling failed', { error: err.message });
        }
    });

    logger.info('Bro Call scheduler started');
}
