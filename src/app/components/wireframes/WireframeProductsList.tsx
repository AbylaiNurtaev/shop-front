export function WireframeProductsList() {
  return (
    <div className="max-w-md mx-auto h-screen bg-gray-100 flex flex-col">
      {/* Top Header */}
      <div className="bg-white border-b-2 border-gray-800 p-4">
        <div className="h-6 bg-gray-800 mb-3" style={{ width: '100px' }}></div>
        <div className="h-12 bg-gray-800"></div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 border-b border-gray-300">
        <div className="h-12 border-2 border-gray-800 bg-white"></div>
      </div>

      {/* Product Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Product Card 1 */}
        <div className="bg-white border-2 border-gray-800 p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="h-5 bg-gray-800 mb-2" style={{ width: '160px' }}></div>
              <div className="h-3 bg-gray-400" style={{ width: '100px' }}></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-10 border-2 border-gray-800"></div>
              <div className="h-10 w-10 border-2 border-gray-800"></div>
            </div>
          </div>
          <div className="h-8 bg-gray-200 mb-3"></div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t-2 border-gray-300">
            <div>
              <div className="h-2 bg-gray-400 mb-1" style={{ width: '60px' }}></div>
              <div className="h-3 bg-gray-800" style={{ width: '80px' }}></div>
            </div>
            <div>
              <div className="h-2 bg-gray-400 mb-1" style={{ width: '40px' }}></div>
              <div className="h-3 bg-gray-800" style={{ width: '50px' }}></div>
            </div>
          </div>
        </div>

        {/* Product Card 2 */}
        <div className="bg-white border-2 border-gray-800 p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="h-5 bg-gray-800 mb-2" style={{ width: '140px' }}></div>
              <div className="h-3 bg-gray-400" style={{ width: '90px' }}></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-10 border-2 border-gray-800"></div>
              <div className="h-10 w-10 border-2 border-gray-800"></div>
            </div>
          </div>
          <div className="h-8 bg-gray-200 mb-3"></div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t-2 border-gray-300">
            <div>
              <div className="h-2 bg-gray-400 mb-1" style={{ width: '60px' }}></div>
              <div className="h-3 bg-gray-800" style={{ width: '80px' }}></div>
            </div>
            <div>
              <div className="h-2 bg-gray-400 mb-1" style={{ width: '40px' }}></div>
              <div className="h-3 bg-gray-800" style={{ width: '50px' }}></div>
            </div>
          </div>
        </div>

        {/* Product Card 3 */}
        <div className="bg-white border-2 border-gray-800 p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="h-5 bg-gray-800 mb-2" style={{ width: '180px' }}></div>
              <div className="h-3 bg-gray-400" style={{ width: '110px' }}></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-10 border-2 border-gray-800"></div>
              <div className="h-10 w-10 border-2 border-gray-800"></div>
            </div>
          </div>
          <div className="h-8 bg-gray-200 mb-3"></div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t-2 border-gray-300">
            <div>
              <div className="h-2 bg-gray-400 mb-1" style={{ width: '60px' }}></div>
              <div className="h-3 bg-gray-800" style={{ width: '80px' }}></div>
            </div>
            <div>
              <div className="h-2 bg-gray-400 mb-1" style={{ width: '40px' }}></div>
              <div className="h-3 bg-gray-800" style={{ width: '50px' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t-2 border-gray-800 p-2">
        <div className="grid grid-cols-4 gap-1">
          <div className="h-16 bg-gray-800 flex flex-col items-center justify-center gap-1">
            <div className="h-6 w-6 bg-white"></div>
            <div className="h-2 bg-white" style={{ width: '40px' }}></div>
          </div>
          <div className="h-16 border-2 border-gray-400 flex flex-col items-center justify-center gap-1">
            <div className="h-6 w-6 bg-gray-400"></div>
            <div className="h-2 bg-gray-400" style={{ width: '40px' }}></div>
          </div>
          <div className="h-16 border-2 border-gray-400 flex flex-col items-center justify-center gap-1">
            <div className="h-6 w-6 bg-gray-400"></div>
            <div className="h-2 bg-gray-400" style={{ width: '50px' }}></div>
          </div>
          <div className="h-16 border-2 border-gray-400 flex flex-col items-center justify-center gap-1">
            <div className="h-6 w-6 bg-gray-400"></div>
            <div className="h-2 bg-gray-400" style={{ width: '35px' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
