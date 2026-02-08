import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * Generate a secure random token for email verification / password reset.
 */
export function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Send an email. Currently logs to console/winston in development.
 * For production, integrate with Azure Communication Services or SMTP.
 *
 * To enable real email, set:
 *   EMAIL_FROM, EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, EMAIL_SMTP_USER, EMAIL_SMTP_PASS
 * or use Azure Communication Services with AZURE_COMM_CONNECTION_STRING.
 */
export async function sendEmail({ to, subject, html }) {
    // In production with SMTP configured, use nodemailer
    if (process.env.EMAIL_SMTP_HOST) {
        // Lazy import nodemailer only when needed
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
            host: process.env.EMAIL_SMTP_HOST,
            port: parseInt(process.env.EMAIL_SMTP_PORT) || 587,
            secure: (process.env.EMAIL_SMTP_PORT || '587') === '465',
            auth: {
                user: process.env.EMAIL_SMTP_USER,
                pass: process.env.EMAIL_SMTP_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'noreply@broverse.app',
            to,
            subject,
            html
        });

        logger.info('Email sent via SMTP', { to, subject });
        return;
    }

    // Development fallback: log the email
    logger.info('Email (dev mode — not actually sent)', { to, subject, html });
}

/**
 * Send verification email with a link containing the token.
 */
export async function sendVerificationEmail(email, token) {
    const baseUrl = process.env.FRONTEND_URL || 'https://broverse.sentinelstratosstrategies.com';
    const link = `${baseUrl}/verify-email?token=${token}`;

    await sendEmail({
        to: email,
        subject: 'BroVerse — Verify Your Email',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e0e0e0; padding: 40px;">
                <h1 style="color: #c9a227;">Welcome to BroVerse</h1>
                <p>Click the link below to verify your email address:</p>
                <a href="${link}" style="display: inline-block; background: #c9a227; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Verify Email</a>
                <p style="color: #888; font-size: 12px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
            </div>
        `
    });
}

/**
 * Send password reset email with a link containing the token.
 */
export async function sendPasswordResetEmail(email, token) {
    const baseUrl = process.env.FRONTEND_URL || 'https://broverse.sentinelstratosstrategies.com';
    const link = `${baseUrl}/reset-password?token=${token}`;

    await sendEmail({
        to: email,
        subject: 'BroVerse — Reset Your Password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e0e0e0; padding: 40px;">
                <h1 style="color: #c9a227;">Password Reset</h1>
                <p>Click the link below to reset your password:</p>
                <a href="${link}" style="display: inline-block; background: #c9a227; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Reset Password</a>
                <p style="color: #888; font-size: 12px;">This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>
            </div>
        `
    });
}
