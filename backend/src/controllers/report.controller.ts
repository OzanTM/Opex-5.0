/**
 * OpEx 5.0 - Report Controller
 * Handles reporting endpoints
 */

import { Request, Response, NextFunction } from 'express';
import * as reportService from '../services/report.service';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../utils/logger';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

// ============================================
// DASHBOARD
// ============================================

/**
 * Get dashboard statistics
 * GET /api/v1/reports/dashboard
 */
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
        const stats = await reportService.getDashboardStats(companyId);
        return sendSuccess(res, stats, 'Dashboard istatistikleri');
    } catch (error) {
        logger.error('Get dashboard stats error:', error);
        return sendError(res, 'Dashboard istatistikleri getirilirken hata olustu', 500);
    }
};

// ============================================
// SUGGESTION REPORTS
// ============================================

/**
 * Get suggestion statistics
 * GET /api/v1/reports/suggestions
 */
export const getSuggestionStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dateRange = {
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        };

        const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
        const departmentId = req.query.departmentId
            ? parseInt(req.query.departmentId as string)
            : undefined;

        const stats = await reportService.getSuggestionStats(dateRange, companyId, departmentId);
        return sendSuccess(res, stats, 'Öneri istatistikleri');
    } catch (error) {
        logger.error('Get suggestion stats error:', error);
        return sendError(res, 'Öneri istatistikleri getirilirken hata olustu', 500);
    }
};

/**
 * Get top performers
 * GET /api/v1/reports/top-performers
 */
export const getTopPerformers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const dateRange = {
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        };
        const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;

        const performers = await reportService.getTopPerformers(limit, dateRange, companyId);
        return sendSuccess(res, performers, 'En basarili kullanicilar');
    } catch (error) {
        logger.error('Get top performers error:', error);
        return sendError(res, 'En basarili kullanicilar getirilirken hata olustu', 500);
    }
};

// ============================================
// PROJECT REPORTS
// ============================================

/**
 * Get project statistics
 * GET /api/v1/reports/projects
 */
export const getProjectStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dateRange = {
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        };

        const stats = await reportService.getProjectStats(dateRange);
        return sendSuccess(res, stats, 'Proje istatistikleri');
    } catch (error) {
        logger.error('Get project stats error:', error);
        return sendError(res, 'Proje istatistikleri getirilirken hata olustu', 500);
    }
};

// ============================================
// FINANCIAL REPORTS
// ============================================

/**
 * Get financial summary
 * GET /api/v1/reports/financial
 */
export const getFinancialSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dateRange = {
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        };
        const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;

        const summary = await reportService.getFinancialSummary(dateRange, companyId);
        return sendSuccess(res, summary, 'Finansal özet');
    } catch (error) {
        logger.error('Get financial summary error:', error);
        return sendError(res, 'Finansal özet getirilirken hata olustu', 500);
    }
};

// ============================================
// APPROVAL REPORTS
// ============================================

/**
 * Get approval statistics
 * GET /api/v1/reports/approvals
 */
export const getApprovalStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dateRange = {
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        };
        const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;

        const stats = await reportService.getApprovalStats(dateRange, companyId);
        return sendSuccess(res, stats, 'Onay istatistikleri');
    } catch (error) {
        logger.error('Get approval stats error:', error);
        return sendError(res, 'Onay istatistikleri getirilirken hata olustu', 500);
    }
};

// ============================================
// EXPORT
// ============================================

const buildDateRangeFromQuery = (query: Request['query']) => ({
    startDate: query.startDate ? new Date(query.startDate as string) : undefined,
    endDate: query.endDate ? new Date(query.endDate as string) : undefined,
});

const getFileSafeTimestamp = (): string => new Date().toISOString().replace(/[:.]/g, '-');

const mapSuggestionRows = (suggestions: any[]) =>
    suggestions.map((item) => ({
        'Referans No': item.referenceNumber,
        'Baslik': item.title,
        Durum: item.status,
        Kategori: item.category || '',
        Calisan: `${item.user?.firstName || ''} ${item.user?.lastName || ''}`.trim(),
        'Sicil No': item.user?.employeeId || '',
        Sirket: item.company?.name || '',
        Departman: item.department?.name || '',
        'Tahmini Maliyet': item.estimatedCost ?? '',
        'Tahmini Kazanc': item.estimatedSavings ?? '',
        'Olusturma Tarihi': item.createdAt ? new Date(item.createdAt).toISOString() : '',
    }));

const mapProjectRows = (projects: any[]) =>
    projects.map((item) => ({
        Proje: item.name,
        Durum: item.status,
        Ilerleme: `${item.progress ?? 0}%`,
        Lider: `${item.projectLeader?.firstName || ''} ${item.projectLeader?.lastName || ''}`.trim(),
        'Lider Sicil No': item.projectLeader?.employeeId || '',
        'Bagli Oneri Ref': item.suggestion?.referenceNumber || '',
        'Bagli Oneri Baslik': item.suggestion?.title || '',
        Sirket: item.suggestion?.company?.name || '',
        'Gercek Maliyet': item.actualCost ?? '',
        'Gercek Kazanc': item.actualSavings ?? '',
        'Baslangic Tarihi': item.startDate ? new Date(item.startDate).toISOString() : '',
        'Tahmini Bitis': item.estimatedEndDate ? new Date(item.estimatedEndDate).toISOString() : '',
        'Gercek Bitis': item.actualEndDate ? new Date(item.actualEndDate).toISOString() : '',
    }));

const addPdfSection = (doc: PDFKit.PDFDocument, title: string, rows: Record<string, any>[]) => {
    doc.moveDown().fontSize(13).text(title, { underline: true });
    doc.moveDown(0.5).fontSize(10).text(`Toplam: ${rows.length}`);

    rows.forEach((row, idx) => {
        doc.moveDown(0.3).fontSize(10).text(`${idx + 1}.`);
        Object.entries(row).forEach(([key, value]) => {
            doc.fontSize(9).text(`- ${key}: ${value ?? ''}`, { indent: 12 });
        });
    });
};

/**
 * Export report data as Excel file
 * GET /api/v1/reports/export/excel
 */
export const exportExcel = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dateRange = buildDateRangeFromQuery(req.query);
        const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
        const status = req.query.status as string | undefined;

        const [suggestions, projects] = await Promise.all([
            reportService.getSuggestionsForExport(dateRange, companyId, status),
            reportService.getProjectsForExport(dateRange, status),
        ]);

        const suggestionRows = mapSuggestionRows(suggestions);
        const projectRows = mapProjectRows(projects);
        const workbook = new ExcelJS.Workbook();
        const suggestionSheet = workbook.addWorksheet('Oneriler');
        const projectSheet = workbook.addWorksheet('Projeler');

        if (suggestionRows.length > 0) {
            suggestionSheet.columns = Object.keys(suggestionRows[0]).map((key) => ({
                header: key,
                key,
                width: 24,
            }));
            suggestionRows.forEach((row) => suggestionSheet.addRow(row));
        } else {
            suggestionSheet.addRow(['Kayit bulunamadi']);
        }

        if (projectRows.length > 0) {
            projectSheet.columns = Object.keys(projectRows[0]).map((key) => ({
                header: key,
                key,
                width: 24,
            }));
            projectRows.forEach((row) => projectSheet.addRow(row));
        } else {
            projectSheet.addRow(['Kayit bulunamadi']);
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = `opex-rapor-${getFileSafeTimestamp()}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        return res.send(Buffer.from(buffer));
    } catch (error) {
        logger.error('Export excel error:', error);
        return sendError(res, 'Excel dosyasi olusturulurken hata olustu', 500);
    }
};

/**
 * Export report data as PDF file
 * GET /api/v1/reports/export/pdf
 */
export const exportPdf = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dateRange = buildDateRangeFromQuery(req.query);
        const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
        const status = req.query.status as string | undefined;

        const [suggestions, projects] = await Promise.all([
            reportService.getSuggestionsForExport(dateRange, companyId, status),
            reportService.getProjectsForExport(dateRange, status),
        ]);

        const suggestionRows = mapSuggestionRows(suggestions);
        const projectRows = mapProjectRows(projects);
        const fileName = `opex-rapor-${getFileSafeTimestamp()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        doc.pipe(res);

        doc.fontSize(16).text('OpEx 5.0 Rapor Disa Aktarim');
        doc.moveDown(0.5).fontSize(10).text(`Uretilme Tarihi: ${new Date().toISOString()}`);
        addPdfSection(doc, 'Oneriler', suggestionRows);
        addPdfSection(doc, 'Projeler', projectRows);
        doc.end();
        return;
    } catch (error) {
        logger.error('Export pdf error:', error);
        return sendError(res, 'PDF dosyasi olusturulurken hata olustu', 500);
    }
};

/**
 * Export suggestions
 * GET /api/v1/reports/export/suggestions
 */
export const exportSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dateRange = buildDateRangeFromQuery(req.query);
        const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
        const status = req.query.status as string;

        const suggestions = await reportService.getSuggestionsForExport(dateRange, companyId, status);
        res.setHeader('Deprecation', 'true');
        res.setHeader('Sunset', 'Wed, 31 Dec 2026 23:59:59 GMT');
        res.setHeader('Link', '</api/v1/reports/export/excel>; rel="successor-version"');
        return sendSuccess(res, suggestions, 'Öneri verileri');
    } catch (error) {
        logger.error('Export suggestions error:', error);
        return sendError(res, 'Öneri verileri disa aktarilirken hata olustu', 500);
    }
};

/**
 * Export projects
 * GET /api/v1/reports/export/projects
 */
export const exportProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dateRange = buildDateRangeFromQuery(req.query);
        const status = req.query.status as string;

        const projects = await reportService.getProjectsForExport(dateRange, status);
        res.setHeader('Deprecation', 'true');
        res.setHeader('Sunset', 'Wed, 31 Dec 2026 23:59:59 GMT');
        res.setHeader('Link', '</api/v1/reports/export/pdf>; rel="successor-version"');
        return sendSuccess(res, projects, 'Proje verileri');
    } catch (error) {
        logger.error('Export projects error:', error);
        return sendError(res, 'Proje verileri disa aktarilirken hata olustu', 500);
    }
};
