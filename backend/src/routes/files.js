import express from 'express'
import {
    processReceipt,
    processPDF,
    getReceiptStatus,
    getUserReceipts
} from '../controllers/fileController.js'
import auth from '../middleware/auth.js'
import upload from '../middleware/upload.js'

const router = express.Router()

// All file routes require authentication
router.use(auth)

// Receipt processing
router.post('/receipt', upload.single('receipt'), processReceipt)

// PDF bank statement processing
router.post('/pdf', upload.single('pdf'), processPDF)

// Get receipt processing status
router.get('/receipt/:id', getReceiptStatus)

// Get user's receipts
router.get('/receipts', getUserReceipts)

export default router