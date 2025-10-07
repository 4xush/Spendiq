import React from "react";

const TipsSection = () => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">
      Tips for Better Results
    </h3>
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-gray-900 mb-2">For Receipts:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Ensure the receipt is well-lit and clear</li>
          <li>• Capture the entire receipt including totals</li>
          <li>• Avoid shadows and reflections</li>
          <li>• Keep the receipt flat and straight</li>
          <li>• Use JPEG, PNG, GIF, or WebP formats</li>
          <li>• Maximum file size: 5MB</li>
        </ul>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-2">For PDFs:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Use official bank or credit card statements</li>
          <li>• Ensure the PDF contains selectable text</li>
          <li>• One statement file at a time works best</li>
          <li>• Check that all transactions are visible</li>
          <li>• Maximum file size: 5MB</li>
        </ul>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-2">Troubleshooting:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• If processing fails, try a higher quality image</li>
          <li>• Avoid blurry or corrupted images</li>
          <li>• Check that text is clearly visible in the image</li>
          <li>• Try uploading from a different device if issues persist</li>
          <li>
            • If you see "AI service temporarily unavailable", wait a few
            minutes and try again
          </li>
          <li>• For rate limit errors, wait 30-60 seconds before retrying</li>
        </ul>
      </div>
    </div>
  </div>
);

export default TipsSection;
