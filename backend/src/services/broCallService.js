import { prisma } from '../db.js';
import { sendToUser } from './websocketService.js';
import logger from '../utils/logger.js';

// Pool of Bro Call messages — these will come from the persona prompts eventually
const BRO_CALL_MESSAGES = [
    "Yo, you good today? Just checking in.",
    "Hey king, when's the last time you did something just for you?",
    "Quick check — did you drink water today?",
    "Remember: progress isn't always visible. Keep going.",
    "What's one win you had today? Even a small one counts.",
    "You've been quiet. Everything alright?",
    "Just wanted to remind you — you're doing better than you think.",
    "Accountability check: did you do that thing you said you'd do?",
    "The fact that you're still here, still trying — that's strength.",
    "Take a breath. You earned it.",
    "What would the best version of you do right now?",
    "Don't forget to eat something real today.",
    "You're not behind. You're on your own timeline.",
    "Real talk — have you moved your body today?",
    "Comfort zone is comfortable but it's not where growth lives.",
    "One step at a time. That's all it takes.",
    "Your energy matters. Protect it today.",
    "Hey — just a reminder that asking for help is strength, not weakness.",
    "What are you grateful for today? Name one thing.",
    "You don't need to be perfect. You need to be present."
];

/**
 * Generate a week's schedule of Bro Calls for a user.
 * 3 calls per week, between 7 AM and 10 PM user's local time.
 */
export async function scheduleWeeklyBroCalls(userId) {
    // Get user's roster to assign personas
    const roster = await prisma.userRoster.findFirst({
        where: { userId, isActive: true, expiresAt: { gt: new Date() } }
    });

    if (!roster || roster.personaSlugs.length === 0) {
        logger.info('No active roster for Bro Call scheduling', { userId });
        return [];
    }

    const now = new Date();
    const calls = [];

    for (let i = 0; i < 3; i++) {
        // Random day within next 7 days
        const dayOffset = Math.floor(Math.random() * 7) + 1;
        const callDate = new Date(now);
        callDate.setDate(callDate.getDate() + dayOffset);

        // Random hour between 7 AM and 10 PM
        const hour = 7 + Math.floor(Math.random() * 15);
        const minute = Math.floor(Math.random() * 60);
        callDate.setHours(hour, minute, 0, 0);

        // Random persona from roster
        const personaSlug = roster.personaSlugs[
            Math.floor(Math.random() * roster.personaSlugs.length)
        ];

        // Random message
        const message = BRO_CALL_MESSAGES[
            Math.floor(Math.random() * BRO_CALL_MESSAGES.length)
        ];

        calls.push({
            userId,
            personaSlug,
            message,
            scheduledAt: callDate,
            status: 'scheduled'
        });
    }

    // Batch create
    const created = await prisma.broCall.createMany({ data: calls });
    logger.info('Bro Calls scheduled', { userId, count: created.count });

    return calls;
}

/**
 * Check for due Bro Calls and deliver them via WebSocket.
 * Called by the cron job every minute.
 */
export async function deliverDueBroCalls() {
    const now = new Date();
    const windowMs = 60 * 1000; // 1-minute window
    const windowStart = new Date(now.getTime() - windowMs);

    const dueCalls = await prisma.broCall.findMany({
        where: {
            status: 'scheduled',
            scheduledAt: {
                gte: windowStart,
                lte: now
            }
        }
    });

    for (const call of dueCalls) {
        sendToUser(call.userId, {
            type: 'bro_call',
            call: {
                id: call.id,
                personaSlug: call.personaSlug,
                message: call.message,
                mediaUrl: call.mediaUrl,
                mediaType: call.mediaType
            }
        });

        logger.info('Bro Call delivered via WebSocket', {
            callId: call.id,
            userId: call.userId,
            persona: call.personaSlug
        });
    }

    return dueCalls.length;
}

/**
 * Check for expired (missed) Bro Calls and mark them.
 * Calls that are past the 10-minute delivery window get marked as missed.
 */
export async function markExpiredBroCalls() {
    const expiredBefore = new Date(Date.now() - 10 * 60 * 1000);

    const result = await prisma.broCall.updateMany({
        where: {
            status: 'scheduled',
            scheduledAt: { lt: expiredBefore }
        },
        data: { status: 'missed' }
    });

    if (result.count > 0) {
        logger.info('Expired Bro Calls marked as missed', { count: result.count });
    }
}
