import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { pdfToPng } from 'pdf-to-png-converter'
import Tesseract from 'tesseract.js'

const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')

class PDFService {
    // Extract text from PDF file with OCR fallback
    async extractTextFromPDF(pdfPath) {
        try {
            
            // First, try to extract text directly from PDF
            const pdfBuffer = fs.readFileSync(pdfPath)
            let pdfData

            try {
                pdfData = await pdfParse(pdfBuffer)
            } catch (parseError) {
                return await this.extractTextWithOCR(pdfPath)
            }
            // Check if we got meaningful text (more than just whitespace and minimal content)
            const cleanText = pdfData.text.trim().replace(/\s+/g, ' ')
            const hasSelectableText = cleanText.length > 50 && /[a-zA-Z0-9]/.test(cleanText)

            if (hasSelectableText) {
                return {
                    text: pdfData.text,
                    pages: pdfData.numpages,
                    info: pdfData.info || {},
                    extractionMethod: 'direct'
                }
            }
            // Fallback to OCR if text extraction failed or returned minimal content
            const ocrText = await this.extractTextWithOCR(pdfPath)

            return {
                text: ocrText,
                pages: pdfData.numpages || 1,
                info: pdfData.info || {},
                extractionMethod: 'ocr'
            }

        } catch (error) {
            console.error(' PDF extraction error:', error)

            // If direct extraction failed, try OCR as last resort
            try {
                const ocrText = await this.extractTextWithOCR(pdfPath)
                return {
                    text: ocrText,
                    pages: 1,
                    info: {},
                    extractionMethod: 'ocr-fallback'
                }
            } catch (ocrError) {
                console.error(' OCR fallback also failed:', ocrError)
                throw new Error('Failed to extract text from PDF using both direct extraction and OCR')
            }
        }
    }

    // Extract text using OCR (for scanned PDFs) - PURE JAVASCRIPT, NO SYSTEM DEPENDENCIES
    async extractTextWithOCR(pdfPath) {
        const tempImagePaths = []

        try {
            // Convert PDF to PNG images using pdf-to-png-converter (pure JS, no system deps)
            const pngPages = await pdfToPng(pdfPath, {
                disableFontFace: false,
                useSystemFonts: false,
                viewportScale: 2.0, // Higher scale = better quality
                outputFolder: path.dirname(pdfPath),
                outputFileMask: `page`,
                strictPagesToProcess: false,
                verbosityLevel: 0
            })
            let combinedText = ''

            // Process each page with Tesseract.js OCR (pure JavaScript)
            for (let i = 0; i < pngPages.length; i++) {
                try {
                    const page = pngPages[i]
                    const imagePath = page.path

                    // Save temporary image file
                    if (!fs.existsSync(imagePath)) {
                        fs.writeFileSync(imagePath, page.content)
                    }
                    tempImagePaths.push(imagePath)

                    // Perform OCR using Tesseract.js
                    const { data: { text } } = await Tesseract.recognize(
                        imagePath,
                        'eng', // Language
                        {
                            logger: info => {
                                if (info.status === 'recognizing text') {
                                                                    }
                            }
                        }
                    )

                    combinedText += `\n--- Page ${i + 1} ---\n${text}\n`
                    
                } catch (pageError) {
                    console.error(`❌ Failed to process page ${i + 1}:`, pageError.message)
                    // Continue with next page
                }
            }

            // Clean up temporary files
            this.cleanupTempFiles(tempImagePaths)

            if (!combinedText.trim()) {
                throw new Error('No text could be extracted from any page')
            }
            return combinedText.trim()

        } catch (error) {
            // Ensure cleanup even on error
            this.cleanupTempFiles(tempImagePaths)
            console.error(' OCR extraction error:', error)
            throw new Error('Failed to extract text using OCR: ' + error.message)
        }
    }

    // Clean up temporary image files
    cleanupTempFiles(filePaths) {
        for (const filePath of filePaths) {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath)
                                    }
            } catch (error) {
                console.error(`⚠️ Failed to cleanup ${filePath}:`, error.message)
            }
        }
    }

    // Parse bank statement patterns
    parseBankStatement(pdfText) {
        const lines = pdfText.split('\n').map(line => line.trim()).filter(line => line.length > 0)

        const transactionPatterns = [
            // Common bank statement patterns (supports $, ₹, €, £)
            /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+(-?[$₹€£]?\s?\d+[,.]?\d*)/g,
            /(\d{1,2}-\d{1,2}-\d{2,4})\s+(.+?)\s+(-?[$₹€£]?\s?\d+[,.]?\d*)/g,
            /(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(-?[$₹€£]?\s?\d+[,.]?\d*)/g,
            // Indian date format DD/MM/YYYY
            /(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+([\d,]+\.?\d*)\s*(?:Dr|Cr)?/gi
        ]

        const transactions = []
        const seenTransactions = new Set()

        for (const pattern of transactionPatterns) {
            let match
            while ((match = pattern.exec(pdfText)) !== null) {
                const [, date, description, amount] = match

                // Clean up the data
                const cleanAmount = parseFloat(amount.replace(/[$,₹€£\s]/g, ''))
                const cleanDescription = description.trim()

                // Create unique key to avoid duplicates
                const transactionKey = `${date}-${cleanDescription}-${cleanAmount}`

                if (!isNaN(cleanAmount) && cleanDescription.length > 0 && !seenTransactions.has(transactionKey)) {
                    seenTransactions.add(transactionKey)
                    transactions.push({
                        date: this.parseDate(date),
                        description: cleanDescription,
                        amount: Math.abs(cleanAmount),
                        type: cleanAmount < 0 ? 'expense' : 'income'
                    })
                }
            }
        }

        return transactions
    }

    // Parse various date formats
    parseDate(dateString) {
        // Try different date formats
        const formats = [
            /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/, // MM/DD/YYYY or DD/MM/YYYY
            /(\d{1,2})-(\d{1,2})-(\d{2,4})/, // MM-DD-YYYY or DD-MM-YYYY
            /(\d{4})-(\d{2})-(\d{2})/ // YYYY-MM-DD
        ]

        for (let i = 0; i < formats.length; i++) {
            const format = formats[i]
            const match = dateString.match(format)
            if (match) {
                let [, part1, part2, part3] = match

                // Handle different formats
                if (i === 2) { // YYYY-MM-DD
                    return `${part1}-${part2.padStart(2, '0')}-${part3.padStart(2, '0')}`
                } else { // DD/MM/YYYY or MM-DD-YYYY
                    const year = part3.length === 2 ? `20${part3}` : part3
                    // Assume DD/MM/YYYY for Indian format
                    return `${year}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`
                }
            }
        }

        // Default to current date if parsing fails
        return new Date().toISOString().split('T')[0]
    }

    // Extract transaction tables from PDF
    extractTransactionTables(pdfText) {
        const lines = pdfText.split('\n')
        const tables = []
        let currentTable = []
        let inTable = false

        for (const line of lines) {
            // Detect table headers
            if (line.toLowerCase().includes('date') &&
                line.toLowerCase().includes('description') &&
                (line.toLowerCase().includes('amount') ||
                    line.toLowerCase().includes('debit') ||
                    line.toLowerCase().includes('credit') ||
                    line.toLowerCase().includes('withdrawal') ||
                    line.toLowerCase().includes('deposit'))) {
                inTable = true
                currentTable = []
                continue
            }

            // Detect end of table
            if (inTable && (line.toLowerCase().includes('total') ||
                line.toLowerCase().includes('balance') ||
                line.trim() === '')) {
                if (currentTable.length > 0) {
                    tables.push(currentTable)
                    currentTable = []
                }
                inTable = false
                continue
            }

            // Collect table rows
            if (inTable && line.trim().length > 0) {
                currentTable.push(line)
            }
        }

        // Add the last table if exists
        if (currentTable.length > 0) {
            tables.push(currentTable)
        }

        return tables
    }
}

export default new PDFService()
