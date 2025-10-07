import Tesseract from 'tesseract.js'
import fs from 'fs'
import path from 'path'

class OCRService {
    constructor() {
        this.worker = null
    }

    // Initialize a worker with error handling
    async initializeWorker() {
        if (this.worker) {
            return this.worker
        }

        try {
            this.worker = await Tesseract.createWorker('eng')

            // Add error listeners to the worker
            if (this.worker.worker) {
                this.worker.worker.onerror = (error) => {
                    console.error('🚨 Tesseract Worker Error:', error)
                }

                this.worker.worker.onmessageerror = (error) => {
                    console.error('🚨 Tesseract Worker Message Error:', error)
                }
            }

            return this.worker
        } catch (error) {
            console.error(' Failed to initialize OCR worker:', error)
            throw new Error('Failed to initialize OCR system')
        }
    }

    // Cleanup worker
    async cleanup() {
        if (this.worker) {
            try {
                await this.worker.terminate()
                this.worker = null
            } catch (error) {
                console.error('Warning: Error terminating worker:', error)
            }
        }
    }

    // Extract text from image using Tesseract with robust error handling
    async extractTextFromImage(imagePath) {
        let worker = null

        try {
            // Check if file exists and is readable
            if (!fs.existsSync(imagePath)) {
                throw new Error('Image file does not exist')
            }

            // Check file size (avoid processing very large files)
            const stats = fs.statSync(imagePath)
            const fileSizeInMB = stats.size / (1024 * 1024)
            if (fileSizeInMB > 10) {
                throw new Error('Image file too large (max 10MB)')
            }

            // Check if file is too small (likely corrupted)
            if (stats.size < 100) {
                throw new Error('Image file appears to be corrupted (file too small)')
            }

            // Basic file format validation
            const extension = path.extname(imagePath).toLowerCase()
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
            if (!allowedExtensions.includes(extension)) {
                throw new Error('Unsupported image format')
            }
            // Create and properly initialize a fresh worker for each request
            worker = await Tesseract.createWorker()
            await worker.load()
            await worker.loadLanguage('eng')
            await worker.initialize('eng')
            // Test file readability
            try {
                const fileBuffer = fs.readFileSync(imagePath)
            } catch (readError) {
                console.error(' Cannot read file:', readError)
                throw new Error('Cannot read image file: ' + readError.message)
            }

            // Wrap the OCR operation in a Promise with timeout
            const ocrResult = await Promise.race([
                (async () => {
                    try {
                        const result = await worker.recognize(imagePath)
                        return result.data.text
                    } catch (recognizeError) {
                        console.error('🚨 OCR recognition error details:')
                        console.error('  - Error object:', recognizeError)
                        console.error('  - Error message:', recognizeError?.message)
                        console.error('  - Error name:', recognizeError?.name)
                        console.error('  - Error stack:', recognizeError?.stack)
                        console.error('  - Error toString:', recognizeError?.toString())

                        // Create a proper error with the information we have
                        const errorMsg = recognizeError?.message || recognizeError?.toString() || 'Unknown OCR error'
                        throw new Error(`OCR recognition failed: ${errorMsg}`)
                    }
                })(),

                // Timeout after 60 seconds
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('OCR processing timed out')), 60000)
                )
            ])
            return ocrResult

        } catch (error) {
            console.error(' OCR error:', error.message)
            console.error(' OCR error type:', error.name)
            console.error(' OCR error stack:', error.stack)

            // Safely get error message and ensure it's a string
            const errorMessage = (error && error.message) ? String(error.message) : ''
            const errorName = (error && error.name) ? String(error.name) : ''

            // Handle specific error types
            if (errorName === 'DataCloneError' ||
                errorMessage.includes('could not be cloned') ||
                errorMessage.includes('DataCloneError')) {
                throw new Error('OCR system configuration error. Please try uploading the image again.')
            }

            if (errorMessage.includes('read error') ||
                errorMessage.includes('bad data') ||
                errorMessage.includes('cannot be read') ||
                errorMessage.includes('Corrupt JPEG') ||
                errorMessage.includes('Error attempting to read image') ||
                errorMessage.includes('worker encountered an error') ||
                errorMessage.includes('worker message error') ||
                errorMessage.includes('extraneous bytes')) {
                throw new Error('The uploaded image is corrupted or in an unsupported format. Please try uploading a clear, high-quality image.')
            }

            if (errorMessage.includes('file does not exist')) {
                throw new Error('Image file not found. Please try uploading again.')
            }

            if (errorMessage.includes('too large')) {
                throw error // Pass through size error as-is
            }

            if (errorMessage.includes('too small') || errorMessage.includes('corrupted')) {
                throw error // Pass through corruption error as-is
            }

            if (errorMessage.includes('Unsupported image format')) {
                throw error // Pass through format error as-is
            }

            if (errorMessage.includes('timed out')) {
                throw new Error('OCR processing took too long. Please try with a smaller or clearer image.')
            }

            if (errorMessage.includes('initialize OCR system')) {
                throw error // Pass through initialization error as-is
            }

            if (errorMessage.includes('configuration')) {
                throw error // Pass through configuration errors as-is
            }

            // Generic OCR error
            throw new Error('Failed to extract text from image. Please ensure the image is clear and try again.')
        } finally {
            // Always cleanup the worker
            if (worker) {
                try {
                    await worker.terminate()
                } catch (cleanupError) {
                    console.error('Warning: Error cleaning up OCR worker:', cleanupError.message)
                }
            }
        }
    }    // Clean and preprocess OCR text
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