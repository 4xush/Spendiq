// import pdf from 'pdf-parse'
import fs from 'fs'

class PDFService {
    // Extract text from PDF file - using simplified approach for now
    async extractTextFromPDF(pdfPath) {
        try {
            // For now, we'll return a placeholder response
            // In production, you would use a proper PDF parsing library
            return {
                text: "This is a placeholder for PDF text extraction. Please implement with a stable PDF library.",
                pages: 1,
                info: {}
            }
        } catch (error) {
            console.error('PDF extraction error:', error)
            throw new Error('Failed to extract text from PDF')
        }
    }

    // Parse bank statement patterns
    parsebankStatement(pdfText) {
        const lines = pdfText.split('\n').map(line => line.trim()).filter(line => line.length > 0)

        const transactionPatterns = [
            // Common bank statement patterns
            /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+(-?\$?\d+\.?\d*)/g,
            /(\d{1,2}-\d{1,2}-\d{2,4})\s+(.+?)\s+(-?\$?\d+\.?\d*)/g,
            /(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(-?\$?\d+\.?\d*)/g
        ]

        const transactions = []

        for (const pattern of transactionPatterns) {
            let match
            while ((match = pattern.exec(pdfText)) !== null) {
                const [, date, description, amount] = match

                // Clean up the data
                const cleanAmount = parseFloat(amount.replace(/[$,]/g, ''))
                const cleanDescription = description.trim()

                if (!isNaN(cleanAmount) && cleanDescription.length > 0) {
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
            /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/, // MM/DD/YYYY or MM/DD/YY
            /(\d{1,2})-(\d{1,2})-(\d{2,4})/, // MM-DD-YYYY or MM-DD-YY
            /(\d{4})-(\d{2})-(\d{2})/ // YYYY-MM-DD
        ]

        for (const format of formats) {
            const match = dateString.match(format)
            if (match) {
                let [, part1, part2, part3] = match

                // Handle different formats
                if (format === formats[2]) { // YYYY-MM-DD
                    return `${part1}-${part2.padStart(2, '0')}-${part3.padStart(2, '0')}`
                } else { // MM/DD/YYYY or MM-DD-YYYY
                    const year = part3.length === 2 ? `20${part3}` : part3
                    return `${year}-${part1.padStart(2, '0')}-${part2.padStart(2, '0')}`
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
                (line.toLowerCase().includes('amount') || line.toLowerCase().includes('debit') || line.toLowerCase().includes('credit'))) {
                inTable = true
                currentTable = []
                continue
            }

            // Detect end of table
            if (inTable && (line.includes('Total') || line.includes('Balance') || line.trim() === '')) {
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