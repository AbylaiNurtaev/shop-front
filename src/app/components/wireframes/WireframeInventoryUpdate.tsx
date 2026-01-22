export function WireframeInventoryUpdate() {
  return (
    <div className="max-w-md mx-auto h-screen bg-white flex flex-col justify-center p-6">
      {/* Product Info */}
      <div className="mb-8 text-center">
        <div className="h-6 bg-gray-800 mx-auto mb-2" style={{ width: '180px' }}></div>
        <div className="h-3 bg-gray-400 mx-auto mb-1" style={{ width: '100px' }}></div>
        <div className="h-3 bg-gray-400 mx-auto" style={{ width: '140px' }}></div>
      </div>

      {/* Current Quantity Display */}
      <div className="bg-gray-100 border-2 border-gray-800 p-6 mb-6">
        <div className="h-3 bg-gray-400 mx-auto mb-3" style={{ width: '120px' }}></div>
        <div className="h-16 bg-gray-800 mx-auto mb-2" style={{ width: '140px' }}></div>
        <div className="h-2 bg-gray-400 mx-auto" style={{ width: '100px' }}></div>
      </div>

      {/* Quantity Adjustment */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-14 w-14 border-2 border-gray-800 flex-shrink-0"></div>
          <div className="flex-1 h-14 border-2 border-gray-800 bg-white"></div>
          <div className="h-14 w-14 border-2 border-gray-800 flex-shrink-0"></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="h-12 bg-gray-800"></div>
        <div className="h-12 border-2 border-gray-800 bg-white"></div>
      </div>
    </div>
  );
}
