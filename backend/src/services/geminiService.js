import { GoogleGenerativeAI } from '@google/generative-ai'

class GeminiService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is not set')
        }
        console.log('🔧 Initializing Gemini service with API key:', process.env.GEMINI_API_KEY ? 'Key found ✅' : 'No key ❌')
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        // Use the latest stable Gemini model
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    }

    // Analyze receipt text and extract transaction data
    async analyzeReceipt(ocrText) {
        try {
            // console.log('🔍 Analyzing receipt with Gemini API...')
            // console.log('📝 OCR Text length:', ocrText?.length || 0)

            const prompt = `
        Analyze the following receipt text and extract transaction information.
        Return a JSON object with the following structure:
        {
          "amount": number,
          "merchant": "string",
          "date": "YYYY-MM-DD",
          "category": "string",
          "items": [
            {
              "name": "string",
              "quantity": number,
              "price": number
            }
          ],
          "confidence": number (0-1)
        }

        Use these expense categories: Food & Dining, Groceries, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Travel, Gas, Other

        Receipt text:
        ${ocrText}

        If the receipt is unclear or missing critical information, set confidence to a lower value.
        Only return the JSON object, no additional text.
      `

            const result = await this.model.generateContent(prompt)
            const response = await result.response
            const text = response.text()

            // console.log('✅ Gemini API response received')
            console.log('📄 Raw response:', text)

            try {
                // Clean up the response to extract JSON
                let cleanText = text.trim()

                // Remove markdown code blocks if present
                cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*$/g, '')

                const extractedData = JSON.parse(cleanText)
                // console.log('📊 Parsed transaction data:', JSON.stringify(extractedData, null, 2))
                return extractedData
            } catch (parseError) {
                console.error('❌ Failed to parse Gemini response:', parseError)
                console.error('📄 Raw response that failed to parse:', text)
                return {
                    amount: null,
                    merchant: null,
                    date: null,
                    category: 'Other',
                    items: [],
                    confidence: 0
                }
            }
        } catch (error) {
            console.error('❌ Gemini API error:', error.message)
            console.error('🔍 Full error details:', error)

            // Handle specific error types
            if (error.message && error.message.includes('503') && error.message.includes('overloaded')) {
                throw new Error('AI service temporarily unavailable. Please try again in a few minutes.')
            } else if (error.message && error.message.includes('429')) {
                throw new Error('AI service rate limit exceeded. Please try again later.')
            } else if (error.message && error.message.includes('quota')) {
                throw new Error('AI service quota exceeded. Please contact support.')
            } else {
                throw new Error('Failed to analyze receipt with AI. Please try again.')
            }
        }
    }

    // Enhanced receipt analysis with retry logic
    async analyzeReceiptWithRetry(imageBuffer) {
        return this.retryWithBackoff(async () => {
            return this.analyzeReceipt(imageBuffer)
        }, 3, 2000)
    }

    // Categorize transaction based on description
    async categorizeTransaction(description, amount) {
        try {
            const prompt = `
        Categorize this financial transaction into one of these categories:
        
        Income categories: Salary, Business, Investment, Gift, Other Income
        Expense categories: Food & Dining, Groceries, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Travel, Gas, Other
        
        Transaction: "${description}" - Amount: $${amount}
        
        Return only the category name, nothing else.
      `

            const result = await this.model.generateContent(prompt)
            const response = await result.response
            const category = response.text().trim()

            return category
        } catch (error) {
            console.error('Gemini categorization error:', error)
            return 'Other'
        }
    }

    // Generate financial insights
    async generateInsights(transactionData) {
        try {
            const prompt = `
        Analyze the following financial data and provide 3-5 actionable insights:
        
        ${JSON.stringify(transactionData, null, 2)}
        
        Focus on:
        - Spending patterns
        - Budget recommendations  
        - Savings opportunities
        - Category-wise analysis
        
        Return insights as a JSON array of strings:
        ["insight 1", "insight 2", "insight 3"]
      `

            const result = await this.model.generateContent(prompt)
            const response = await result.response
            const text = response.text()

            try {
                const insights = JSON.parse(text)
                return Array.isArray(insights) ? insights : []
            } catch (parseError) {
                console.error('Failed to parse insights:', parseError)
                return []
            }
        } catch (error) {
            console.error('Gemini insights error:', error)
            return []
        }
    }

    // Analyze PDF bank statement and extract transactions
    async analyzeBankStatement(pdfText) {
        try {
            // Check if we have meaningful text to analyze
            const cleanText = pdfText.trim()
            if (cleanText.length < 10) {
                console.log('⚠️ Warning: Very little text provided to AI for analysis')
                return []
            }

            console.log(`🤖 Analyzing ${cleanText.length} characters of bank statement text`)

            const prompt = `
        Analyze this bank statement text and extract all transactions.
        Return a JSON array of transactions with this structure:
        [
          {
            "date": "YYYY-MM-DD",
            "description": "string",
            "amount": number,
            "type": "income" or "expense",
            "category": "string"
          }
        ]

        Use these categories:
        Income: Salary, Business, Investment, Gift, Other Income
        Expense: Food & Dining, Groceries, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Travel, Gas, Other

        Important instructions:
        - Look for patterns like dates, amounts, and transaction descriptions
        - Identify debit/credit columns or negative/positive amounts
        - Convert amounts to positive numbers and use "type" to indicate income/expense
        - Be thorough in finding all transactions, even if formatting is inconsistent
        - If text quality is poor from OCR, make best effort to interpret

        Bank statement text:
        ${pdfText}

        Only return the JSON array, no additional text.
      `

            const result = await this.model.generateContent(prompt)
            const response = await result.response
            const text = response.text()

            try {
                // Extract JSON from markdown code blocks if present
                let jsonText = text.trim();

                // Remove markdown code blocks if they exist
                if (jsonText.startsWith('```json') && jsonText.endsWith('```')) {
                    jsonText = jsonText.slice(7, -3).trim(); // Remove ```json and ```
                } else if (jsonText.startsWith('```') && jsonText.endsWith('```')) {
                    jsonText = jsonText.slice(3, -3).trim(); // Remove generic ```
                }

                console.log('Extracted JSON text:', jsonText);

                const transactions = JSON.parse(jsonText)
                return Array.isArray(transactions) ? transactions : []
            } catch (parseError) {
                console.error('Failed to parse bank statement:', parseError)
                console.error('Raw response text:', text)
                return []
            }
        } catch (error) {
            console.error('Gemini bank statement error:', error)

            // Handle specific error types
            if (error.message && error.message.includes('503') && error.message.includes('overloaded')) {
                throw new Error('AI service temporarily unavailable. Please try again in a few minutes.')
            } else if (error.message && error.message.includes('429')) {
                throw new Error('AI service rate limit exceeded. Please try again later.')
            } else if (error.message && error.message.includes('quota')) {
                throw new Error('AI service quota exceeded. Please contact support.')
            } else {
                throw new Error('Failed to analyze bank statement with AI. Please try again.')
            }
        }
    }

    // Helper method to retry with exponential backoff
    async retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation()
            } catch (error) {
                // Don't retry for certain errors
                if (error.message && (
                    error.message.includes('quota') ||
                    error.message.includes('authentication') ||
                    error.message.includes('permission')
                )) {
                    throw error
                }

                // If this is the last attempt, throw the error
                if (attempt === maxRetries) {
                    throw error
                }

                // Check if it's a retryable error (503, 429, network issues)
                const isRetryable = error.message && (
                    error.message.includes('503') ||
                    error.message.includes('429') ||
                    error.message.includes('overloaded') ||
                    error.message.includes('network') ||
                    error.message.includes('timeout')
                )

                if (isRetryable) {
                    const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
                    console.log(`🔄 Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay due to: ${error.message}`)
                    await new Promise(resolve => setTimeout(resolve, delay))
                } else {
                    throw error
                }
            }
        }
    }

    // Enhanced bank statement analysis with retry logic
    async analyzeBankStatementWithRetry(pdfText) {
        return this.retryWithBackoff(async () => {
            return this.analyzeBankStatement(pdfText)
        }, 3, 2000)
    }
}

// Export the class instead of an instance to avoid early instantiation
export default GeminiService