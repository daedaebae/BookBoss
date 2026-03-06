import nodemailer from 'nodemailer';
import db from '../config/db';
import logger from '../utils/logger';
import path from 'path';
import fs from 'fs';

class EmailService {
    transporter: any;
    isConfigured: boolean;

    constructor() {
        this.transporter = null;
        this.isConfigured = false;
        this.initTransporter();
    }

    async initTransporter() {
        try {
            const [rows] = await db.promise().query('SELECT * FROM settings WHERE `key` IN ("smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_secure")');

            const config: any = {};
            (rows as any[]).forEach((row: any) => {
                config[row.key] = row.value;
            });

            if (config.smtp_host && config.smtp_user) {
                this.transporter = nodemailer.createTransport({
                    host: config.smtp_host,
                    port: parseInt(config.smtp_port) || 587,
                    secure: config.smtp_secure === 'true',
                    auth: {
                        user: config.smtp_user,
                        pass: config.smtp_pass
                    }
                });

                await this.transporter.verify();
                this.isConfigured = true;
                logger.info('SMTP Transporter successfully initialized');
            } else {
                this.isConfigured = false;
                logger.warn('SMTP settings incomplete. Email service disabled.');
            }
        } catch (error) {
            this.isConfigured = false;
            logger.error('Failed to initialize SMTP Transporter:', error);
        }
    }

    async sendTestEmail(toEmail: string, configOverride: any = null) {
        try {
            let transport = this.transporter;

            if (configOverride) {
                transport = nodemailer.createTransport({
                    host: configOverride.host,
                    port: parseInt(configOverride.port) || 587,
                    secure: configOverride.secure === 'true' || configOverride.secure === true,
                    auth: {
                        user: configOverride.user,
                        pass: configOverride.pass
                    }
                });
                await transport.verify();
            } else if (!this.isConfigured) {
                throw new Error("SMTP is not configured.");
            }

            const info = await transport.sendMail({
                from: '"BookBoss" <' + (configOverride ? configOverride.user : this.transporter.options.auth.user) + '>',
                to: toEmail,
                subject: "Test Email from BookBoss",
                text: "If you are reading this, your SMTP settings are working correctly.",
                html: "<b>If you are reading this, your SMTP settings are working correctly.</b>"
            });

            return info;
        } catch (error) {
            logger.error('Error sending test email:', error);
            throw error;
        }
    }

    async sendEbook(toEmail: string, bookTitle: string, filePath: string, filename: string) {
        try {
            // Hot reload settings just in case
            await this.initTransporter();

            if (!this.isConfigured) {
                throw new Error("SMTP is not configured. Please configure email settings in the admin panel.");
            }

            if (!fs.existsSync(filePath)) {
                throw new Error("Book file not found on the server.");
            }

            const info = await this.transporter.sendMail({
                from: '"BookBoss Virtual Library" <' + this.transporter.options.auth.user + '>',
                to: toEmail,
                subject: `BookBoss Delivery: ${bookTitle}`,
                text: `Attached is your requested copy of ${bookTitle}. Happy reading!\\n\\nSent via BookBoss.`,
                attachments: [
                    {
                        filename: filename,
                        path: filePath
                    }
                ]
            });

            logger.info(`Successfully sent ${bookTitle} to ${toEmail}. Message ID: ${info.messageId}`);
            return info;
        } catch (error) {
            logger.error(`Error sending ebook:`, error);
            throw error;
        }
    }
}

// Singleton instance
const emailService = new EmailService();

export default emailService;
