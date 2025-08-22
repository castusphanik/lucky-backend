"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatters = exports.createPaginationSubtitle = exports.ExcelExporter = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
class ExcelExporter {
    constructor() {
        this.workbook = new exceljs_1.default.Workbook();
    }
    async generateWorkbook(config) {
        this.worksheet = this.workbook.addWorksheet(config.sheetName);
        let currentRow = 1;
        // Add title if provided
        if (config.title) {
            currentRow = this.addTitle(config.title, currentRow, config.titleStyle);
        }
        // Add subtitle if provided
        if (config.subtitle) {
            currentRow = this.addSubtitle(config.subtitle, currentRow);
        }
        // Add empty row for spacing
        if (config.title || config.subtitle) {
            this.worksheet.addRow([]);
            currentRow++;
        }
        // Add headers and data
        this.addHeaders(config.columns, currentRow);
        this.addData(config.columns, config.data, currentRow + 1);
        // Apply styling
        this.applyBorders(currentRow);
        return this.workbook;
    }
    async writeToBuffer() {
        const arrayBuffer = await this.workbook.xlsx.writeBuffer();
        return Buffer.from(arrayBuffer); // 👈 This line fixes the TS error
    }
    addTitle(title, row, titleStyle) {
        const titleCell = this.worksheet.getCell(`A${row}`);
        titleCell.value = title;
        // Default title styling
        titleCell.font = { bold: true, size: 14, ...titleStyle?.font };
        titleCell.alignment = { horizontal: "center", ...titleStyle?.alignment };
        titleCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4472C4" },
            ...titleStyle?.fill,
        };
        // Merge title across all columns
        const lastCol = String.fromCharCode(64 + this.getColumnCount());
        this.worksheet.mergeCells(`A${row}:${lastCol}${row}`);
        return row + 1;
    }
    addSubtitle(subtitle, row) {
        const subtitleCell = this.worksheet.getCell(`A${row}`);
        subtitleCell.value = subtitle;
        subtitleCell.font = { italic: true };
        subtitleCell.alignment = { horizontal: "center" };
        // Merge subtitle across all columns
        const lastCol = String.fromCharCode(64 + this.getColumnCount());
        this.worksheet.mergeCells(`A${row}:${lastCol}${row}`);
        return row + 1;
    }
    addHeaders(columns, row) {
        const headerRow = this.worksheet.getRow(row);
        columns.forEach((col, index) => {
            const cell = headerRow.getCell(index + 1);
            cell.value = col.header;
            // Set column width
            if (col.width) {
                this.worksheet.getColumn(index + 1).width = col.width;
            }
        });
        // Style header row
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
        };
    }
    addData(columns, data, startRow) {
        data.forEach((item, rowIndex) => {
            const row = this.worksheet.getRow(startRow + rowIndex);
            columns.forEach((col, colIndex) => {
                let value = item[col.key];
                // Apply formatter if provided
                if (col.formatter) {
                    value = col.formatter(value);
                }
                // Handle null/undefined values
                if (value === null || value === undefined) {
                    value = "N/A";
                }
                row.getCell(colIndex + 1).value = value;
            });
        });
    }
    applyBorders(startRow) {
        this.worksheet.eachRow((row, rowNumber) => {
            if (rowNumber >= startRow) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                });
            }
        });
    }
    getColumnCount() {
        return this.worksheet.columns?.length || 20;
    }
    async writeToResponse(res, filename) {
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
        await this.workbook.xlsx.write(res);
        res.end();
    }
}
exports.ExcelExporter = ExcelExporter;
// Utility function for pagination info
const createPaginationSubtitle = (page, perPage, skip, total) => {
    const totalPages = Math.ceil(total / perPage);
    const endRecord = Math.min(skip + perPage, total);
    return `Page ${page} of ${totalPages} | Records ${skip + 1}-${endRecord} of ${total} | Date: ${new Date().toLocaleString()}`;
};
exports.createPaginationSubtitle = createPaginationSubtitle;
// Common formatters
exports.formatters = {
    date: (value) => (value ? new Date(value).toLocaleString() : "N/A"),
    boolean: (value) => (value ? "Yes" : "No"),
    currency: (value) => (value ? `$${value.toFixed(2)}` : "N/A"),
    serialNumber: (index, skip = 0) => skip + index + 1,
};
