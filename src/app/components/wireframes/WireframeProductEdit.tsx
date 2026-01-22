export function WireframeProductEdit() {
  return (
    <div className="max-w-md mx-auto h-screen bg-white flex flex-col">
      {/* Top Header */}
      <div className="bg-white border-b-2 border-gray-800 p-4 flex items-center justify-between">
        <div className="h-6 bg-gray-800" style={{ width: '140px' }}></div>
        <div className="h-8 w-8 border-2 border-gray-800"></div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Product Name */}
        <div>
          <div className="h-3 bg-gray-600 mb-2" style={{ width: '100px' }}></div>
          <div className="h-12 border-2 border-gray-800 bg-white"></div>
        </div>

        {/* Category */}
        <div>
          <div className="h-3 bg-gray-600 mb-2" style={{ width: '80px' }}></div>
          <div className="h-12 border-2 border-gray-800 bg-white"></div>
        </div>

        {/* SKU */}
        <div>
          <div className="h-3 bg-gray-600 mb-2" style={{ width: '60px' }}></div>
          <div className="flex gap-2">
            <div className="flex-1 h-12 border-2 border-gray-800 bg-white"></div>
            <div className="h-12 w-12 border-2 border-gray-800 bg-white"></div>
          </div>
          <div className="h-2 bg-gray-400 mt-2" style={{ width: '140px' }}></div>
        </div>

        {/* Quantity and Units */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="h-3 bg-gray-600 mb-2" style={{ width: '70px' }}></div>
            <div className="h-12 border-2 border-gray-800 bg-white"></div>
          </div>
          <div>
            <div className="h-3 bg-gray-600 mb-2" style={{ width: '60px' }}></div>
            <div className="h-12 border-2 border-gray-800 bg-white"></div>
          </div>
        </div>

        {/* Weight and Volume */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="h-3 bg-gray-600 mb-2" style={{ width: '40px' }}></div>
            <div className="h-12 border-2 border-gray-800 bg-white"></div>
          </div>
          <div>
            <div className="h-3 bg-gray-600 mb-2" style={{ width: '50px' }}></div>
            <div className="h-12 border-2 border-gray-800 bg-white"></div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="bg-white border-t-2 border-gray-800 p-4">
        <div className="flex gap-3">
          <div className="flex-1 h-12 border-2 border-gray-800 bg-white"></div>
          <div className="flex-1 h-12 bg-gray-800"></div>
        </div>
      </div>
    </div>
  );
}
