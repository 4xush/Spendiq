import Receipt from '../models/Receipt.js'
import Transaction from '../models/Transaction.js'
import ocrService from '../services/ocrService.js'
import pdfService from '../services/pdfService.js'
import GeminiService from '../services/geminiService.js'
import fs from 'fs'
import path from 'path'

// Create a lazy-loaded instance of GeminiService
let geminiServiceInstance = null
const getGeminiService = () => {
    if (!geminiServiceInstance) {
        geminiServiceInstance = new GeminiService()
    }
    return geminiServiceInstance
}

// Process receipt upload
export const processReceipt = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded'
            })
        }

        const userId = req.user._id
        const file = req.file

        // Create receipt record
        const receipt = new Receipt({
            userId,
            originalFilename: file.originalname,
            filename: file.filename,
            filepath: file.path,
            mimetype: file.mimetype,
            size: file.size,
            status: 'processing'
        })

        await receipt.save()

        // Process receipt asynchronously
        processReceiptAsync(receipt._id, file.path, userId)

        res.status(201).json({
            message: 'Receipt uploaded successfully. Processing in background.',
            receiptId: receipt._id,
            status: 'processing'
        })
    } catch (error) {
        console.error('Receipt upload error:', error)

        // Clean up uploaded file if there's an error
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path)
            } catch (unlinkError) {
                console.error('Failed to clean up file:', unlinkError)
            }
        }

        res.status(500).json({
            error: 'Failed to process receipt'
        })
    }
}

// Async receipt processing function with enhanced error handling
async function processReceiptAsync(receiptId, filePath, userId) {
    // Wrap in additional error protection
    const processWithErrorProtection = async () => {
        try {
            console.log(`🔄 Processing receipt ${receiptId} for user ${userId}`)

            // Extract text using OCR with timeout
            const rawText = await Promise.race([
                ocrService.extractTextFromImage(filePath),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Overall processing timeout')), 90000) // 90 second timeout
                )
            ])

            const cleanText = ocrService.cleanOCRText(rawText)

            console.log(`📝 OCR extracted ${cleanText.length} characters`)

            // Analyze with Gemini AI
            const extractedData = await getGeminiService().analyzeReceipt(cleanText)

            console.log(`🤖 Gemini analysis completed with confidence: ${extractedData.confidence}`)

            // Update receipt with extracted data
            const receipt = await Receipt.findByIdAndUpdate(
                receiptId,
                {
                    status: 'completed',
                    ocrText: cleanText,
                    extractedData
                },
                { new: true }
            )

            // Create transaction if data is confident enough
            if (extractedData.confidence > 0.7 && extractedData.amount) {
                const transaction = new Transaction({
                    userId,
                    type: 'expense',
                    amount: extractedData.amount,
                    category: extractedData.category || 'Other',
                    description: `${extractedData.merchant || 'Receipt'} - Auto-extracted`,
                    date: extractedData.date ? new Date(extractedData.date) : new Date(),
                    source: 'receipt',
                    receiptUrl: `/uploads/${receipt.filename}`,
                    metadata: {
                        confidence: extractedData.confidence,
                        originalText: cleanText,
                        merchant: extractedData.merchant,
                        items: extractedData.items || [],
                        receiptId: receiptId
                    }
                })

                await transaction.save()

                // Link transaction to receipt
                receipt.transactionId = transaction._id
                await receipt.save()

                console.log(`💰 Transaction created with ID: ${transaction._id}`)
            } else {
                console.log(`⚠️ Transaction not created - low confidence (${extractedData.confidence}) or missing amount`)
            }

            console.log(`✅ Receipt processing completed successfully`)

        } catch (error) {
            console.error('❌ Receipt processing error:', error.message)
            console.error('❌ Error type:', error.name)

            // Determine error type for better user feedback
            let userMessage = 'Failed to process receipt'

            // Safely get error message and ensure it's a string
            const errorMessage = (error && error.message) ? String(error.message) : ''
            const errorName = (error && error.name) ? String(error.name) : ''

            if (errorMessage.includes('OCR system configuration error') ||
                errorMessage.includes('configuration') ||
                errorMessage.includes('DataCloneError') ||
                errorMessage.includes('could not be cloned')) {
                userMessage = 'Image processing system error. Please try uploading the image again.'
            } else if (errorMessage.includes('corrupted') ||
                errorMessage.includes('unsupported format') ||
                errorMessage.includes('cannot be read') ||
                errorMessage.includes('Error attempting to read image') ||
                errorMessage.includes('Corrupt JPEG')) {
                userMessage = 'The uploaded image appears to be corrupted or damaged. Please try uploading a clear, high-quality image.'
            } else if (errorMessage.includes('Failed to analyze receipt with AI')) {
                userMessage = 'AI analysis failed. The receipt text may be unclear or incomplete.'
            } else if (errorMessage.includes('file does not exist')) {
                userMessage = 'Image file not found. Please try uploading again.'
            } else if (errorMessage.includes('too large')) {
                userMessage = errorMessage // Use the specific size error message
            } else if (errorMessage.includes('timeout')) {
                userMessage = 'Processing took too long. Please try with a smaller or clearer image.'
            } else if (errorMessage.includes('worker') || errorMessage.includes('Worker') ||
                errorName === 'DataCloneError') {
                userMessage = 'Image processing failed. The image may be corrupted or in an unsupported format.'
            }

            // Update receipt with error status
            try {
                await Receipt.findByIdAndUpdate(receiptId, {
                    status: 'failed',
                    error: {
                        message: userMessage,
                        timestamp: new Date(),
                        type: error.name || 'ProcessingError'
                    }
                })
                console.log(`📝 Receipt ${receiptId} marked as failed with error: ${userMessage}`)
            } catch (dbError) {
                console.error('❌ Failed to update receipt status in database:', dbError)
            }

            // Don't re-throw the error to prevent server crash
        }
    }

    // Execute with additional error protection
    try {
        await processWithErrorProtection()
    } catch (criticalError) {
        console.error('🚨 Critical error in receipt processing:', criticalError)

        // Last resort error handling
        try {
            await Receipt.findByIdAndUpdate(receiptId, {
                status: 'failed',
                error: {
                    message: 'System error occurred during processing. Please try again.',
                    timestamp: new Date(),
                    type: 'CriticalError'
                }
            })
        } catch (dbError) {
            console.error('❌ Failed to update receipt status:', dbError)
        }
    }
}// Process PDF bank statement
export const processPDF = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No PDF file uploaded'
            })
        }

        const userId = req.user._id
        const file = req.file

        console.log(`🔍 Validating file: ${file.originalname} (${file.mimetype})`)

        // Validate PDF file
        if (file.mimetype !== 'application/pdf') {
            fs.unlinkSync(file.path) // Clean up
            return res.status(400).json({
                error: 'File must be a PDF'
            })
        }

        console.log('✅ File validation passed')

        // Extract text from PDF
        console.log('📄 Starting PDF text extraction...')
        const pdfData = await pdfService.extractTextFromPDF(file.path)

        console.log(`📊 Extraction complete:`, {
            method: pdfData.extractionMethod,
            textLength: pdfData.text.length,
            pages: pdfData.pages
        })

        if (!pdfData.text || pdfData.text.trim().length < 10) {
            console.log('⚠️ Warning: Very little text extracted from PDF')
        }

        // Parse transactions using AI
        console.log('🤖 Analyzing bank statement with AI...')
        const extractedTransactions = await getGeminiService().analyzeBankStatement(pdfData.text)

        // Create transactions
        const createdTransactions = []
        for (const transactionData of extractedTransactions) {
            try {
                const transaction = new Transaction({
                    userId,
                    type: transactionData.type,
                    amount: transactionData.amount,
                    category: transactionData.category || 'Other',
                    description: transactionData.description,
                    date: new Date(transactionData.date),
                    source: 'pdf',
                    metadata: {
                        confidence: 0.8, // PDF parsing usually more reliable
                        originalText: transactionData.description
                    }
                })

                await transaction.save()
                createdTransactions.push(transaction)
            } catch (error) {
                console.error('Failed to create transaction:', error)
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(file.path)

        res.json({
            message: `Successfully processed PDF and created ${createdTransactions.length} transactions`,
            transactionsCreated: createdTransactions.length,
            transactions: createdTransactions
        })

    } catch (error) {
        console.error('PDF processing error:', error)

        // Clean up uploaded file
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path)
            } catch (unlinkError) {
                console.error('Failed to clean up file:', unlinkError)
            }
        }

        res.status(500).json({
            error: 'Failed to process PDF'
        })
    }
}

// Process image bank statement
export const processImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No image file uploaded'
            })
        }

        const userId = req.user._id
        const file = req.file

        console.log(`🔍 Validating image: ${file.originalname} (${file.mimetype})`)

        // Validate image file
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png']
        if (!allowedImageTypes.includes(file.mimetype)) {
            fs.unlinkSync(file.path) // Clean up
            return res.status(400).json({
                error: 'File must be a PNG, JPG, or JPEG image'
            })
        }

        console.log('✅ File validation passed')

        // Extract text from image using OCR
        console.log('📄 Starting image text extraction...')
        const extractedText = await ocrService.extractTextFromImage(file.path)

        console.log(`📊 Extraction complete:`, {
            method: 'ocr',
            textLength: extractedText.length
        })

        if (!extractedText || extractedText.trim().length < 10) {
            console.log('⚠️ Warning: Very little text extracted from image')
        }

        // Parse transactions using AI
        console.log('🤖 Analyzing bank statement image with AI...')
        const extractedTransactions = await getGeminiService().analyzeBankStatement(extractedText)

        // Create transactions
        const createdTransactions = []
        for (const transactionData of extractedTransactions) {
            try {
                const transaction = new Transaction({
                    userId,
                    type: transactionData.type,
                    amount: transactionData.amount,
                    category: transactionData.category || 'Other',
                    description: transactionData.description,
                    date: new Date(transactionData.date),
                    source: 'image',
                    metadata: {
                        confidence: 0.7, // Image OCR usually less reliable than PDF
                        originalText: transactionData.description
                    }
                })

                await transaction.save()
                createdTransactions.push(transaction)
            } catch (error) {
                console.error('Failed to create transaction:', error)
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(file.path)

        res.json({
            message: `Successfully processed image and created ${createdTransactions.length} transactions`,
            transactionsCreated: createdTransactions.length,
            transactions: createdTransactions
        })

    } catch (error) {
        console.error('Image processing error:', error)

        // Clean up uploaded file
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path)
            } catch (unlinkError) {
                console.error('Failed to clean up file:', unlinkError)
            }
        }

        res.status(500).json({
            error: 'Failed to process image'
        })
    }
}

// Get receipt processing status
export const getReceiptStatus = async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user._id

        const receipt = await Receipt.findOne({ _id: id, userId })
            .populate('transactionId')

        if (!receipt) {
            return res.status(404).json({
                error: 'Receipt not found'
            })
        }

        res.json({
            receipt: {
                id: receipt._id,
                originalFilename: receipt.originalFilename,
                status: receipt.status,
                extractedData: receipt.extractedData,
                transaction: receipt.transactionId,
                error: receipt.error,
                createdAt: receipt.createdAt
            }
        })
    } catch (error) {
        console.error('Get receipt status error:', error)
        res.status(500).json({
            error: 'Failed to get receipt status'
        })
    }
}

// Get user's processed receipts
export const getUserReceipts = async (req, res) => {
    try {
        const userId = req.user._id
        const { page = 1, limit = 20 } = req.query

        const receipts = await Receipt.find({ userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('transactionId', 'amount category description date')

        const total = await Receipt.countDocuments({ userId })

        res.json({
            receipts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        })
    } catch (error) {
        console.error('Get user receipts error:', error)
        res.status(500).json({
            error: 'Failed to get receipts'
        })
    }
}