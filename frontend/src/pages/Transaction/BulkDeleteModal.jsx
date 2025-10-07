import { useState } from 'react'
import { FaTrash, FaCalendarAlt, FaClock, FaCheckSquare } from 'react-icons/fa'

const BulkDeleteModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    selectedTransactions = [],
    totalTransactions 
}) => {
    const [deleteType, setDeleteType] = useState('selected')
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    })
    const [lastDays, setLastDays] = useState(7)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            const deleteData = {
                deleteType,
                transactionIds: selectedTransactions.map(t => t._id)
            }

            if (deleteType === 'dateRange') {
                deleteData.dateRange = dateRange
            } else if (deleteType === 'lastDays') {
                deleteData.lastDays = lastDays
            }

            await onConfirm(deleteData)
            onClose()
        } catch (error) {
            console.error('Error deleting transactions:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getDeleteCount = () => {
        switch (deleteType) {
            case 'selected':
                return selectedTransactions.length
            case 'dateRange':
                return 'transactions in date range'
            case 'lastDays':
                return `transactions from last ${lastDays} days`
            default:
                return 0
        }
    }

    const isDateRangeValid = () => {
        return dateRange.startDate && dateRange.endDate && 
               new Date(dateRange.startDate) <= new Date(dateRange.endDate)
    }

    const canSubmit = () => {
        if (deleteType === 'selected') {
            return selectedTransactions.length > 0
        } else if (deleteType === 'dateRange') {
            return isDateRangeValid()
        } else if (deleteType === 'lastDays') {
            return lastDays > 0 && lastDays <= 365
        }
        return false
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex items-center mb-4">
                    <FaTrash className="text-red-500 mr-2" />
                    <h2 className="text-xl font-bold text-gray-800">Delete Transactions</h2>
                </div>

                <div className="space-y-4">
                    {/* Delete Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delete Method
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="deleteType"
                                    value="selected"
                                    checked={deleteType === 'selected'}
                                    onChange={(e) => setDeleteType(e.target.value)}
                                    className="mr-2"
                                />
                                <FaCheckSquare className="mr-2 text-blue-500" />
                                <span>Selected Transactions ({selectedTransactions.length})</span>
                            </label>
                            
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="deleteType"
                                    value="dateRange"
                                    checked={deleteType === 'dateRange'}
                                    onChange={(e) => setDeleteType(e.target.value)}
                                    className="mr-2"
                                />
                                <FaCalendarAlt className="mr-2 text-green-500" />
                                <span>Date Range</span>
                            </label>
                            
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="deleteType"
                                    value="lastDays"
                                    checked={deleteType === 'lastDays'}
                                    onChange={(e) => setDeleteType(e.target.value)}
                                    className="mr-2"
                                />
                                <FaClock className="mr-2 text-orange-500" />
                                <span>Last Few Days</span>
                            </label>
                        </div>
                    </div>

                    {/* Date Range Inputs */}
                    {deleteType === 'dateRange' && (
                        <div className="border rounded p-3 bg-gray-50">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dateRange.startDate}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dateRange.endDate}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    />
                                </div>
                            </div>
                            {!isDateRangeValid() && dateRange.startDate && dateRange.endDate && (
                                <p className="text-red-500 text-xs mt-1">
                                    End date must be after start date
                                </p>
                            )}
                        </div>
                    )}

                    {/* Last Days Input */}
                    {deleteType === 'lastDays' && (
                        <div className="border rounded p-3 bg-gray-50">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Number of Days
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="365"
                                value={lastDays}
                                onChange={(e) => setLastDays(parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Enter number of days"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Delete transactions from the last {lastDays} days
                            </p>
                        </div>
                    )}

                    {/* Warning Message */}
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-red-800 text-sm">
                            <strong>Warning:</strong> This action will permanently delete{' '}
                            <span className="font-medium">{getDeleteCount()}</span>.
                            This action cannot be undone.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit() || isLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Deleting...
                            </>
                        ) : (
                            <>
                                <FaTrash className="mr-2" />
                                Delete
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default BulkDeleteModal