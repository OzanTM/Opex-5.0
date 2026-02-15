import { PrismaClient } from '@prisma/client';
import Handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import config from '../config';
import { IEmailPayload } from '../types';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Email transporter configuration
let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter
 */
export const initializeEmailTransporter = (): void => {
  if (config.email.provider === 'sendgrid') {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: config.email.sendgridApiKey,
      },
    });
  } else {
    // Default SMTP configuration
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  logger.info('Email transporter initialized', { provider: config.email.provider });
};

/**
 * Send email
 */
export const sendEmail = async (payload: IEmailPayload): Promise<boolean> => {
  try {
    if (!transporter) {
      initializeEmailTransporter();
    }

    let htmlContent = payload.body;

    // If template code provided, render template
    if (payload.templateCode) {
      const template = await prisma.emailTemplate.findUnique({
        where: { code: payload.templateCode },
      });

      if (template) {
        const compiledTemplate = Handlebars.compile(template.body);
        htmlContent = compiledTemplate(payload.templateData || {});
      }
    }

    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.from}>`,
      to: payload.to,
      subject: payload.subject,
      html: htmlContent,
    };

    const info = await transporter!.sendMail(mailOptions);

    logger.info('Email sent', {
      to: payload.to,
      subject: payload.subject,
      messageId: info.messageId,
    });

    return true;
  } catch (error) {
    logger.error('Failed to send email', {
      to: payload.to,
      subject: payload.subject,
      error,
    });
    return false;
  }
};

import { emailQueue } from './queue.service';

/**
 * Queue email for later processing
 */
export const queueEmail = async (payload: IEmailPayload): Promise<void> => {
  try {
    await emailQueue.add('send-email', payload, {
      priority: payload.priority || 5,
    });

    logger.info('Email queued via Bull', {
      to: payload.to,
      subject: payload.subject,
    });
  } catch (error: any) {
    logger.error('Failed to queue email', { error: error.message });
    // Fallback: Try to send immediately if queue fails? 
    // For now, just log error. In production, we might want a DB fallback.
    throw error;
  }
};

/**
 * Process email queue (Deprecated - handled by worker)
 */
export const processEmailQueue = async (): Promise<void> => {
  logger.warn('processEmailQueue is deprecated. Use email.worker.ts instead.');
};

/**
 * Initialize default email templates
 */
export const initializeEmailTemplates = async (): Promise<void> => {
  const templates = [
    {
      code: 'SUGGESTION_SUBMITTED',
      name: 'Öneri Alindi',
      subject: 'Öneriniz Alindi - {{suggestionTitle}}',
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .info-box { background: #fff; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
            .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>OpEx 5.0</h1>
            </div>
            
            <p>Merhaba {{firstName}},</p>
            
            <p>Öneriniz bizlere ulasti. Tesekkür ederiz.</p>
            
            <div class="content">
              <div class="info-box">
                <p><strong>Fikri veren:</strong> {{fullName}}</p>
                <p><strong>Konu:</strong> {{suggestionTitle}}</p>
                <p><strong>Firma:</strong> {{companyName}}</p>
                <p><strong>Durum:</strong> Fikir Yönetim Komitesi onayinda</p>
              </div>
              
              <p>Aksiyon: Önerilerinize deger veriyor ve ödüllendiriyoruz.</p>
              
              <p>Önerileriniz Fikir Yönetim Komitesi tarafindan degerlendirilerek müdür onayina düsmektedir.</p>
              
              <p>Önerinizin durumunu OpEx 5.0 uygulamasinda yer alan süreç adimlari kismindan takip edebilirsiniz.</p>
              
              <p>Ilerleyen süreç adimlarinda E-Posta ile bilgilendirileceksiniz.</p>
            </div>
            
            <p style="text-align: center;">
              <a href="{{suggestionUrl}}" class="button">Öneriyi Görüntüle</a>
            </p>
            
            <div class="footer">
              <p>OpEx 5.0 Ekibi</p>
              <p>{{companyName}}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ['firstName', 'fullName', 'suggestionTitle', 'companyName', 'suggestionUrl'],
    },
    {
      code: 'SUGGESTION_COMMITTEE_APPROVED',
      name: 'Komite Onayi - Müdür Onayina',
      subject: 'Yeni Öneri Onayinizi Bekliyor - {{suggestionTitle}}',
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .info-box { background: #fff; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
            .button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
            .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>OpEx 5.0</h1>
            </div>
            
            <p>Merhaba {{approverName}},</p>
            
            <p>Öncelikle öneriniz için tesekkür ederiz.</p>
            
            <p>Öneriniz Fikir Yönetim Komitemiz tarafindan degerlendirilerek onaylanmistir.</p>
            
            <div class="content">
              <div class="info-box">
                <p><strong>Fikri veren:</strong> {{fullName}}</p>
                <p><strong>Konu:</strong> {{suggestionTitle}}</p>
                <p><strong>Firma:</strong> {{companyName}}</p>
                <p><strong>Durum:</strong> Ilgili Müdür Onayinda</p>
              </div>
              
              <p>Önerilerinize deger veriyor ve ödüllendiriyoruz.</p>
              
              <p>Önerileriniz Fikir Yönetim Komitesi tarafindan degerlendirilerek müdür onayina düsmüstür.</p>
            </div>
            
            <p style="text-align: center;">
              <a href="{{suggestionUrl}}" class="button">Öneriyi Incele ve Onayla</a>
            </p>
            
            <div class="footer">
              <p>OpEx 5.0 Ekibi</p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ['approverName', 'fullName', 'suggestionTitle', 'companyName', 'suggestionUrl'],
    },
    {
      code: 'SUGGESTION_REVISION_REQUESTED',
      name: 'Güncelleme Talebi',
      subject: 'Öneriniz Güncelleme Bekliyor - {{suggestionTitle}}',
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ffc107; color: #333; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .info-box { background: #fff; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
            .warning-box { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
            .button { display: inline-block; background: #ffc107; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
            .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>OpEx 5.0</h1>
            </div>
            
            <p>Merhaba {{firstName}},</p>
            
            <p>Öncelikle öneriniz için tesekkür ederiz.</p>
            
            <p>Öneriniz Fikir Yönetim Komitesi tarafindan degerlendirilmis olup, güncelleme talebi bulunmaktadir.</p>
            
            <div class="content">
              <div class="info-box">
                <p><strong>Fikri veren:</strong> {{fullName}}</p>
                <p><strong>Konu:</strong> {{suggestionTitle}}</p>
                <p><strong>Firma:</strong> {{companyName}}</p>
                <p><strong>Durum:</strong> Güncelleme Beklenmekte</p>
              </div>
              
              <div class="warning-box">
                <p><strong>Degerlendirme Açiklamasi:</strong></p>
                <p>{{revisionReason}}</p>
              </div>
              
              <p>Öneriniz için güncellemenizi en kisa sürede tamamlamanizi bekliyoruz.</p>
            </div>
            
            <p style="text-align: center;">
              <a href="{{suggestionUrl}}" class="button">Öneriyi Güncelle</a>
            </p>
            
            <div class="footer">
              <p>OpEx 5.0 Ekibi</p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ['firstName', 'fullName', 'suggestionTitle', 'companyName', 'revisionReason', 'suggestionUrl'],
    },
    {
      code: 'SUGGESTION_COMMITTEE_REJECTED',
      name: 'Komite Reddi',
      subject: 'Öneriniz Hakkinda - {{suggestionTitle}}',
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .info-box { background: #fff; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
            .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>OpEx 5.0</h1>
            </div>
            
            <p>Merhaba {{firstName}},</p>
            
            <p>Öncelikle öneriniz için tesekkür ederiz.</p>
            
            <p>Öneriniz Fikir Yönetim Komitesi tarafindan degerlendirilmis olup, reddedilmistir.</p>
            
            <div class="content">
              <div class="info-box">
                <p><strong>Fikri veren:</strong> {{fullName}}</p>
                <p><strong>Konu:</strong> {{suggestionTitle}}</p>
                <p><strong>Firma:</strong> {{companyName}}</p>
                <p><strong>Durum:</strong> Reddedildi</p>
              </div>
              
              <p><strong>Red Sebebi:</strong></p>
              <p>{{rejectionReason}}</p>
              
              <p>Yeni önerilerinizi bekliyoruz.</p>
            </div>
            
            <p style="text-align: center;">
              <a href="{{newSuggestionUrl}}" class="button">Yeni Öneri Ver</a>
            </p>
            
            <div class="footer">
              <p>OpEx 5.0 Ekibi</p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ['firstName', 'fullName', 'suggestionTitle', 'companyName', 'rejectionReason', 'newSuggestionUrl'],
    },
    {
      code: 'SUGGESTION_APPROVER_REJECTED',
      name: 'Müdür Reddi',
      subject: 'Öneriniz Hakkinda - {{suggestionTitle}}',
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .info-box { background: #fff; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
            .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>OpEx 5.0</h1>
            </div>
            
            <p>Merhaba {{firstName}},</p>
            
            <p>Öncelikle öneriniz için tesekkür ederiz.</p>
            
            <p>Öneriniz ilgili müdür tarafindan degerlendirilmis olup, reddedilmistir.</p>
            
            <div class="content">
              <div class="info-box">
                <p><strong>Fikri veren:</strong> {{fullName}}</p>
                <p><strong>Konu:</strong> {{suggestionTitle}}</p>
                <p><strong>Firma:</strong> {{companyName}}</p>
                <p><strong>Durum:</strong> Reddedildi, Fikir Yönetim Komitesi Onayinda</p>
              </div>
              
              <p><strong>Red Sebebi:</strong></p>
              <p>{{rejectionReason}}</p>
              
              <p>Ret sebebi Fikir Yönetim Komitesi tarafindan tekrar degerlendirilecek olup, sonuç isletilecektir.</p>
            </div>
            
            <p style="text-align: center;">
              <a href="{{suggestionUrl}}" class="button">Öneri Detayini Gör</a>
            </p>
            
            <div class="footer">
              <p>OpEx 5.0 Ekibi</p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ['firstName', 'fullName', 'suggestionTitle', 'companyName', 'rejectionReason', 'suggestionUrl'],
    },
    {
      code: 'SUGGESTION_FULLY_APPROVED',
      name: 'Tüm Onaylar Tamamlandi',
      subject: 'Harika Haber! Öneriniz Onaylandi - {{suggestionTitle}}',
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .info-box { background: #fff; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
            .success-box { background: #d4edda; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
            .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>OpEx 5.0</h1>
            </div>
            
            <p>Merhaba {{firstName}},</p>
            
            <div class="success-box">
              <h2 style="margin: 0; color: #155724;">Harika haber! Öneriniz tüm onay süreçlerini basariyla tamamladi.</h2>
            </div>
            
            <div class="content">
              <div class="info-box">
                <p><strong>Konu:</strong> {{suggestionTitle}}</p>
                <p><strong>Durum:</strong> Uygulamaya Alindi</p>
                <p><strong>Proje Lideri:</strong> {{projectLeaderName}}</p>
              </div>
              
              <p>Öneriniz artik uygulama asamasinda. Ilerleme hakkinda bilgilendirileceksiniz.</p>
              
              <p>Katkilariniz için tesekkür ederiz!</p>
            </div>
            
            <p style="text-align: center;">
              <a href="{{suggestionUrl}}" class="button">Öneriyi Görüntüle</a>
            </p>
            
            <div class="footer">
              <p>OpEx 5.0 Ekibi</p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ['firstName', 'suggestionTitle', 'projectLeaderName', 'suggestionUrl'],
    },
    {
      code: 'SUGGESTION_COMPLETED',
      name: 'Öneri Tamamlandi',
      subject: 'Tebrikler! Öneriniz Basariyla Tamamlandi - {{suggestionTitle}}',
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .info-box { background: #fff; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
            .success-box { background: #d4edda; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
            .button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
            .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>OpEx 5.0</h1>
            </div>
            
            <p>Merhaba {{firstName}},</p>
            
            <div class="success-box">
              <h2 style="margin: 0; color: #155724;">Tebrikler! Öneriniz basariyla tamamlandi.</h2>
            </div>
            
            <div class="content">
              <div class="info-box">
                <p><strong>Konu:</strong> {{suggestionTitle}}</p>
                <p><strong>Tamamlanma Tarihi:</strong> {{completionDate}}</p>
                <p><strong>Kazanç:</strong> {{savingsInfo}}</p>
              </div>
              
              <p>Sirketimize katkilari için tesekkür ederiz.</p>
              
              {{#if rewardInfo}}
              <p><strong>Ödül/Takdir Bilgileri:</strong> {{rewardInfo}}</p>
              {{/if}}
            </div>
            
            <p style="text-align: center;">
              <a href="{{suggestionUrl}}" class="button">Öneriyi Görüntüle</a>
            </p>
            
            <div class="footer">
              <p>OpEx 5.0 Ekibi</p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ['firstName', 'suggestionTitle', 'completionDate', 'savingsInfo', 'rewardInfo', 'suggestionUrl'],
    },
    {
      code: 'APPROVAL_REMINDER',
      name: 'Onay Hatirlatma',
      subject: 'Onayinizi Bekleyen {{pendingCount}} Adet Öneri Bulunmaktadir',
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #17a2b8; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .info-box { background: #fff; padding: 15px; border-left: 4px solid #17a2b8; margin: 15px 0; }
            .warning-box { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
            .button { display: inline-block; background: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
            .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>OpEx 5.0</h1>
            </div>
            
            <p>Merhaba {{approverName}},</p>
            
            <p>Onayinizi bekleyen <strong>{{pendingCount}}</strong> adet öneri bulunmaktadir.</p>
            
            <div class="content">
              <div class="warning-box">
                <p><strong>En eski bekleyen öneri:</strong></p>
                <p>{{oldestSuggestionTitle}} ({{waitingDays}} gündür bekliyor)</p>
              </div>
              
              <p>Lütfen önerileri degerlendirerek süreci ilerletiniz.</p>
            </div>
            
            <p style="text-align: center;">
              <a href="{{pendingApprovalsUrl}}" class="button">Bekleyen Önerileri Görüntüle</a>
            </p>
            
            <div class="footer">
              <p>OpEx 5.0 Ekibi</p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ['approverName', 'pendingCount', 'oldestSuggestionTitle', 'waitingDays', 'pendingApprovalsUrl'],
    },
    {
      code: 'PASSWORD_RESET',
      name: 'Sifre Sifirlama',
      subject: 'Sifre Sifirlama Talebi',
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
            .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>OpEx 5.0</h1>
            </div>
            
            <p>Merhaba {{firstName}} {{lastName}},</p>
            
            <p>Sifre sifirlama talebinde bulundunuz.</p>
            
            <div class="content">
              <p>Sifrenizi sifirlamak için asagidaki linke tiklayiniz:</p>
              
              <p style="text-align: center;">
                <a href="{{resetUrl}}" class="button">Sifremi Sifirla</a>
              </p>
              
              <p>Bu link {{expiresIn}} süreyle geçerlidir.</p>
              
              <p>Eger bu talebi siz yapmadiysaniz, bu e-postayi görmezden gelebilirsiniz.</p>
            </div>
            
            <div class="footer">
              <p>OpEx 5.0 Ekibi</p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ['firstName', 'lastName', 'resetUrl', 'expiresIn'],
    },
  ];

  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { code: template.code },
      update: {
        name: template.name,
        subject: template.subject,
        body: template.body,
        variables: JSON.stringify(template.variables),
      },
      create: {
        code: template.code,
        name: template.name,
        subject: template.subject,
        body: template.body,
        variables: JSON.stringify(template.variables),
      },
    });
  }

  logger.info('Email templates initialized', { count: templates.length });
};

export default {
  sendEmail,
  queueEmail,
  processEmailQueue,
  initializeEmailTransporter,
  initializeEmailTemplates,
};