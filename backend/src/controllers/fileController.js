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

// Async receipt processing function
async function processReceiptAsync(receiptId, filePath, userId) {
    try {
        // Extract text using OCR
        const rawText = await ocrService.extractTextFromImage(filePath)
        const cleanText = ocrService.cleanOCRText(rawText)

        // Analyze with Gemini AI
        const extractedData = await getGeminiService().analyzeReceipt(cleanText)

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
                    merchant: extractedData.merchant
                }
            })

            await transaction.save()

            // Link transaction to receipt
            receipt.transactionId = transaction._id
            await receipt.save()
        }

    } catch (error) {
        console.error('Receipt processing error:', error)

        // Update receipt with error status
        await Receipt.findByIdAndUpdate(receiptId, {
            status: 'failed',
            error: {
                message: error.message,
                details: error.stack
            }
        })
    }
}

// Process PDF bank statement
export const processPDF = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No PDF file uploaded'
            })
        }

        const userId = req.user._id
        const file = req.file

        // Validate PDF file
        if (file.mimetype !== 'application/pdf') {
            fs.unlinkSync(file.path) // Clean up
            return res.status(400).json({
                error: 'File must be a PDF'
            })
        }

        // Extract text from PDF
        const pdfData = await pdfService.extractTextFromPDF(file.path)

        // Parse transactions using AI
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