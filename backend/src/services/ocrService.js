import Tesseract from 'tesseract.js'
import fs from 'fs'
import path from 'path'

class OCRService {
    // Extract text from image using Tesseract
    async extractTextFromImage(imagePath) {
        try {
            console.log('Starting OCR processing for:', imagePath)

            const { data: { text } } = await Tesseract.recognize(
                imagePath,
                'eng',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
                        }
                    }
                }
            )

            return text
        } catch (error) {
            console.error('OCR error:', error)
            throw new Error('Failed to extract text from image')
        }
    }

    // Clean and preprocess OCR text
    cleanOCRText(rawText) {
        return rawText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n')
            .replace(/[^\w\s\d\$\.\,\-\:\(\)\/]/g, '') // Remove special characters except common ones
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim()
    }

    // Extract specific receipt information patterns
    extractReceiptPatterns(text) {
        const patterns = {
            // Amount patterns (look for total, subtotal, etc.)
            amounts: text.match(/(?:total|subtotal|amount)[\s\:\$]*(\d+\.?\d*)/gi) || [],

            // Date patterns
            dates: text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g) || [],

            // Merchant patterns (usually at the top)
            merchant: text.split('\n').slice(0, 3).join(' ').trim(),

            // Item patterns (lines with price at the end)
            items: text.match(/^.+\s+\$?\d+\.?\d*$/gm) || []
        }

        return patterns
    }
}

export default new OCRService()