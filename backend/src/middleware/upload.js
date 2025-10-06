import multer from 'multer'
import { fileURLToPath } from 'url'
import { dirname, join, extname } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = join(__dirname, '../../uploads')

        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }

        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const extension = extname(file.originalname)
        cb(null, file.fieldname + '-' + uniqueSuffix + extension)
    }
})

// File filter
const fileFilter = (req, file, cb) => {
    console.log(`🔍 Validating file: ${file.originalname} (${file.mimetype})`)

    // Check file type
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf'
    ]

    if (!allowedTypes.includes(file.mimetype)) {
        console.log(`❌ Invalid file type: ${file.mimetype}`)
        return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF files are allowed.'), false)
    }

    // Additional validation for image files
    if (file.mimetype.startsWith('image/')) {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        const fileExtension = extname(file.originalname).toLowerCase()

        if (!allowedExtensions.includes(fileExtension)) {
            console.log(`❌ File extension mismatch: ${fileExtension} for ${file.mimetype}`)
            return cb(new Error('File extension does not match the file type.'), false)
        }
    }

    console.log(`✅ File validation passed`)
    cb(null, true)
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
        files: 1 // Only allow one file at a time
    }
})

export default upload