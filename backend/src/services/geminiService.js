import { GoogleGenerativeAI } from '@google/generative-ai'

class GeminiService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' })
    }

    // Analyze receipt text and extract transaction data
    async analyzeReceipt(ocrText) {
        try {
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

            try {
                const extractedData = JSON.parse(text)
                return extractedData
            } catch (parseError) {
                console.error('Failed to parse Gemini response:', parseError)
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
            console.error('Gemini API error:', error)
            throw new Error('Failed to analyze receipt with AI')
        }
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

        Bank statement text:
        ${pdfText}

        Only return the JSON array, no additional text.
      `

            const result = await this.model.generateContent(prompt)
            const response = await result.response
            const text = response.text()

            try {
                const transactions = JSON.parse(text)
                return Array.isArray(transactions) ? transactions : []
            } catch (parseError) {
                console.error('Failed to parse bank statement:', parseError)
                return []
            }
        } catch (error) {
            console.error('Gemini bank statement error:', error)
            throw new Error('Failed to analyze bank statement with AI')
        }
    }
}

export default new GeminiService()