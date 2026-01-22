export function WireframeAddCategory() {
  return (
    <div className="max-w-md mx-auto h-screen bg-white flex flex-col">
      {/* Top Header */}
      <div className="bg-white border-b-2 border-gray-800 p-4 flex items-center justify-between">
        <div className="h-6 bg-gray-800" style={{ width: '140px' }}></div>
        <div className="h-8 w-8 border-2 border-gray-800"></div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Category Name */}
        <div>
          <div className="h-3 bg-gray-600 mb-2" style={{ width: '120px' }}></div>
          <div className="h-12 border-2 border-gray-800 bg-white"></div>
          <div className="h-2 bg-gray-400 mt-2" style={{ width: '140px' }}></div>
        </div>

        {/* Parent Category Selector */}
        <div>
          <div className="h-3 bg-gray-600 mb-2" style={{ width: '140px' }}></div>
          <div className="h-12 border-2 border-gray-800 bg-white"></div>
          <div className="h-2 bg-gray-400 mt-2" style={{ width: '200px' }}></div>
        </div>

        {/* Info Box */}
        <div className="bg-gray-100 border-2 border-gray-300 p-4">
          <div className="h-3 bg-gray-400 mb-2" style={{ width: '220px' }}></div>
          <div className="h-3 bg-gray-400" style={{ width: '180px' }}></div>
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
