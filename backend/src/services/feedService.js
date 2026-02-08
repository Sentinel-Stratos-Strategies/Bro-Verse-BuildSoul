import { prisma } from '../db.js';
import logger from '../utils/logger.js';

/**
 * BroVerse Feed Algorithm
 *
 * Scoring: score = (recency × 0.4) + (engagement × 0.25) + (relationship × 0.25) + (diversity × 0.1)
 *
 * - Recency: exponential decay over 72 hours
 * - Engagement: reactions + comments (normalized)
 * - Relationship: friends scored higher than strangers
 * - Diversity: penalize seeing too many posts from same author
 */

const RECENCY_WEIGHT = 0.4;
const ENGAGEMENT_WEIGHT = 0.25;
const RELATIONSHIP_WEIGHT = 0.25;
const DIVERSITY_WEIGHT = 0.1;

// Recency half-life in hours (posts lose half their recency score every 12 hours)
const RECENCY_HALF_LIFE_HOURS = 12;

/**
 * Calculate recency score (0-1) based on post age
 * Uses exponential decay with configurable half-life
 */
function recencyScore(createdAt) {
    const ageMs = Date.now() - new Date(createdAt).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    return Math.pow(0.5, ageHours / RECENCY_HALF_LIFE_HOURS);
}

/**
 * Calculate engagement score (0-1) normalized against max engagement in batch
 */
function engagementScore(reactionCount, commentCount, maxEngagement) {
    if (maxEngagement === 0) return 0;
    const raw = reactionCount + (commentCount * 2); // comments worth 2x reactions
    return Math.min(raw / maxEngagement, 1);
}

/**
 * Calculate relationship score (0-1)
 * 1.0 = friend, 0.3 = stranger, 0.0 = blocked
 */
function relationshipScore(authorId, friendIds, blockedIds) {
    if (blockedIds.has(authorId)) return 0;
    if (friendIds.has(authorId)) return 1.0;
    return 0.3;
}

/**
 * Calculate diversity penalty (0-1)
 * Penalizes seeing many posts from the same author in the feed
 */
function diversityScore(authorId, authorCounts) {
    const count = authorCounts.get(authorId) || 0;
    // First post = 1.0, second = 0.7, third = 0.5, etc.
    return 1 / (1 + count * 0.5);
}

/**
 * Get ranked feed for a user
 *
 * @param {string} userId - The requesting user's ID
 * @param {object} options - Pagination options
 * @param {string} options.cursor - Cursor for pagination (post ID)
 * @param {number} options.limit - Number of posts to return (default 20)
 * @returns {object} { posts, nextCursor, hasMore }
 */
export async function getRankedFeed(userId, { cursor, limit = 20 } = {}) {
    try {
        // 1. Get user's friends and blocked users
        const [friendRelations, blockedRelations] = await Promise.all([
            prisma.relationship.findMany({
                where: {
                    status: 'accepted',
                    OR: [
                        { requesterId: userId },
                        { addresseeId: userId }
                    ]
                },
                select: { requesterId: true, addresseeId: true }
            }),
            prisma.relationship.findMany({
                where: {
                    status: 'blocked',
                    OR: [
                        { requesterId: userId },
                        { addresseeId: userId }
                    ]
                },
                select: { requesterId: true, addresseeId: true }
            })
        ]);

        const friendIds = new Set();
        for (const rel of friendRelations) {
            friendIds.add(rel.requesterId === userId ? rel.addresseeId : rel.requesterId);
        }

        const blockedIds = new Set();
        for (const rel of blockedRelations) {
            blockedIds.add(rel.requesterId === userId ? rel.addresseeId : rel.requesterId);
        }

        // 2. Fetch candidate posts (larger pool than needed for ranking)
        const candidateLimit = Math.max(limit * 4, 100);

        const whereClause = {
            isDeleted: false,
            authorId: { notIn: [...blockedIds] },
            OR: [
                { visibility: 'public' },
                { visibility: 'friends', authorId: { in: [...friendIds] } },
                { authorId: userId } // Always see own posts
            ]
        };

        // Cursor-based pagination: only fetch posts older than cursor
        if (cursor) {
            const cursorPost = await prisma.post.findUnique({
                where: { id: cursor },
                select: { createdAt: true }
            });
            if (cursorPost) {
                whereClause.createdAt = { lt: cursorPost.createdAt };
            }
        }

        const posts = await prisma.post.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: candidateLimit,
            include: {
                author: { select: { id: true, displayName: true, tagline: true } },
                comments: {
                    include: {
                        author: { select: { id: true, displayName: true } }
                    }
                },
                reactions: true
            }
        });

        if (posts.length === 0) {
            return { posts: [], nextCursor: null, hasMore: false };
        }

        // 3. Calculate max engagement for normalization
        const maxEngagement = Math.max(
            1,
            ...posts.map(p => p.reactions.length + (p.comments.length * 2))
        );

        // 4. Score and rank posts
        const authorCounts = new Map();
        const scoredPosts = posts.map(post => {
            const rScore = recencyScore(post.createdAt);
            const eScore = engagementScore(post.reactions.length, post.comments.length, maxEngagement);
            const relScore = relationshipScore(post.authorId, friendIds, blockedIds);
            const divScore = diversityScore(post.authorId, authorCounts);

            // Track author appearances for diversity
            authorCounts.set(post.authorId, (authorCounts.get(post.authorId) || 0) + 1);

            const totalScore =
                (rScore * RECENCY_WEIGHT) +
                (eScore * ENGAGEMENT_WEIGHT) +
                (relScore * RELATIONSHIP_WEIGHT) +
                (divScore * DIVERSITY_WEIGHT);

            // Boost own posts slightly so users always see their content
            const finalScore = post.authorId === userId ? totalScore * 1.1 : totalScore;

            return { ...post, _feedScore: finalScore };
        });

        // Sort by score descending
        scoredPosts.sort((a, b) => b._feedScore - a._feedScore);

        // 5. Paginate results
        const result = scoredPosts.slice(0, limit);
        const hasMore = scoredPosts.length > limit;
        const nextCursor = result.length > 0 ? result[result.length - 1].id : null;

        // Strip internal score from response
        const cleanPosts = result.map(({ _feedScore, ...post }) => post);

        return { posts: cleanPosts, nextCursor, hasMore };
    } catch (error) {
        logger.error('Feed algorithm error', { error: error.message, userId });
        throw error;
    }
}

export default { getRankedFeed };
