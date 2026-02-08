/**
 * Badge Seed Data for BroVerse
 *
 * Run: node seeds/badges.js
 *
 * Categories:
 * - social: Friend/community related
 * - engagement: Posting and interaction
 * - growth: Personal development milestones
 * - streak: Consistency achievements
 * - special: Rare/seasonal
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const badges = [
    // Social
    {
        name: 'First Bro',
        description: 'Made your first friend on BroVerse',
        iconUrl: '/badges/first-bro.svg',
        category: 'social',
        criteria: { type: 'friend_count', threshold: 1 }
    },
    {
        name: 'Squad Up',
        description: 'Built a crew of 5 friends',
        iconUrl: '/badges/squad-up.svg',
        category: 'social',
        criteria: { type: 'friend_count', threshold: 5 }
    },
    {
        name: 'Brotherhood',
        description: 'Connected with 25 brothers',
        iconUrl: '/badges/brotherhood.svg',
        category: 'social',
        criteria: { type: 'friend_count', threshold: 25 }
    },
    {
        name: 'Messenger',
        description: 'Sent your first direct message',
        iconUrl: '/badges/messenger.svg',
        category: 'social',
        criteria: { type: 'dm_count', threshold: 1 }
    },

    // Engagement
    {
        name: 'First Word',
        description: 'Created your first post on the Board',
        iconUrl: '/badges/first-word.svg',
        category: 'engagement',
        criteria: { type: 'post_count', threshold: 1 }
    },
    {
        name: 'Voice of the Verse',
        description: 'Shared 10 posts with the community',
        iconUrl: '/badges/voice.svg',
        category: 'engagement',
        criteria: { type: 'post_count', threshold: 10 }
    },
    {
        name: 'Orator',
        description: 'Posted 50 times — your voice carries weight',
        iconUrl: '/badges/orator.svg',
        category: 'engagement',
        criteria: { type: 'post_count', threshold: 50 }
    },
    {
        name: 'Supporter',
        description: 'Left your first comment on a brother\'s post',
        iconUrl: '/badges/supporter.svg',
        category: 'engagement',
        criteria: { type: 'comment_count', threshold: 1 }
    },
    {
        name: 'Encourager',
        description: 'Reacted to 20 posts — keep lifting others up',
        iconUrl: '/badges/encourager.svg',
        category: 'engagement',
        criteria: { type: 'reaction_count', threshold: 20 }
    },

    // Growth
    {
        name: 'First Session',
        description: 'Completed your first AI conversation',
        iconUrl: '/badges/first-session.svg',
        category: 'growth',
        criteria: { type: 'thread_count', threshold: 1 }
    },
    {
        name: 'Deep Diver',
        description: 'Had 10 AI conversations — you\'re doing the work',
        iconUrl: '/badges/deep-diver.svg',
        category: 'growth',
        criteria: { type: 'thread_count', threshold: 10 }
    },
    {
        name: 'Roster Locked',
        description: 'Committed to your first 30-day roster',
        iconUrl: '/badges/roster-locked.svg',
        category: 'growth',
        criteria: { type: 'roster_count', threshold: 1 }
    },
    {
        name: 'Challenge Accepted',
        description: 'Completed your first challenge',
        iconUrl: '/badges/challenge.svg',
        category: 'growth',
        criteria: { type: 'challenge_complete', threshold: 1 }
    },
    {
        name: 'Warrior',
        description: 'Completed 10 challenges — forged in discipline',
        iconUrl: '/badges/warrior.svg',
        category: 'growth',
        criteria: { type: 'challenge_complete', threshold: 10 }
    },

    // Streak
    {
        name: 'Showing Up',
        description: 'Logged in 3 days in a row',
        iconUrl: '/badges/showing-up.svg',
        category: 'streak',
        criteria: { type: 'login_streak', threshold: 3 }
    },
    {
        name: 'Consistent',
        description: '7-day login streak — building the habit',
        iconUrl: '/badges/consistent.svg',
        category: 'streak',
        criteria: { type: 'login_streak', threshold: 7 }
    },
    {
        name: 'Ironclad',
        description: '30-day streak — nothing breaks your discipline',
        iconUrl: '/badges/ironclad.svg',
        category: 'streak',
        criteria: { type: 'login_streak', threshold: 30 }
    },

    // Special
    {
        name: 'Early Adopter',
        description: 'Joined BroVerse in its first month',
        iconUrl: '/badges/early-adopter.svg',
        category: 'special',
        criteria: { type: 'early_adopter', threshold: 1 }
    },
    {
        name: 'Bro Call Answered',
        description: 'Responded to your first Bro Call',
        iconUrl: '/badges/bro-call.svg',
        category: 'special',
        criteria: { type: 'brocall_answered', threshold: 1 }
    },
    {
        name: 'Sentinel\'s Circle',
        description: 'A special honor from The Sentinel himself',
        iconUrl: '/badges/sentinel.svg',
        category: 'special',
        criteria: { type: 'manual_award', threshold: 1 }
    }
];

async function seed() {
    console.log('🏅 Seeding badges...');

    for (const badge of badges) {
        await prisma.badge.upsert({
            where: { name: badge.name },
            update: {
                description: badge.description,
                iconUrl: badge.iconUrl,
                category: badge.category,
                criteria: badge.criteria
            },
            create: badge
        });
        console.log(`  ✓ ${badge.name}`);
    }

    console.log(`\n✅ Seeded ${badges.length} badges`);
}

seed()
    .catch((e) => {
        console.error('Badge seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
