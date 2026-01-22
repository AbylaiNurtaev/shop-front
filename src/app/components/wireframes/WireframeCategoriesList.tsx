export function WireframeCategoriesList() {
  return (
    <div className="max-w-md mx-auto h-screen bg-gray-100 flex flex-col">
      {/* Top Header */}
      <div className="bg-white border-b-2 border-gray-800 p-4">
        <div className="h-6 bg-gray-800 mb-3" style={{ width: '120px' }}></div>
        <div className="h-12 bg-gray-800"></div>
      </div>

      {/* Categories List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Category Card 1 - Expanded */}
        <div className="bg-white border-2 border-gray-800">
          {/* Parent Category */}
          <div className="flex items-center gap-3 p-4">
            <div className="h-8 w-8 border-2 border-gray-800"></div>
            <div className="h-5 bg-gray-800 flex-1" style={{ width: '100px' }}></div>
            <div className="h-6 bg-gray-200" style={{ width: '30px' }}></div>
            <div className="flex gap-1">
              <div className="h-8 w-8 border-2 border-gray-800"></div>
              <div className="h-8 w-8 border-2 border-gray-800"></div>
            </div>
          </div>

          {/* Child Categories */}
          <div className="border-t-2 border-gray-300 bg-gray-50">
            <div className="flex items-center gap-3 p-4 pl-16 border-b border-gray-300">
              <div className="h-4 bg-gray-800 flex-1" style={{ width: '80px' }}></div>
              <div className="flex gap-1">
                <div className="h-8 w-8 border-2 border-gray-800"></div>
                <div className="h-8 w-8 border-2 border-gray-800"></div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 pl-16">
              <div className="h-4 bg-gray-800 flex-1" style={{ width: '90px' }}></div>
              <div className="flex gap-1">
                <div className="h-8 w-8 border-2 border-gray-800"></div>
                <div className="h-8 w-8 border-2 border-gray-800"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Card 2 - Collapsed */}
        <div className="bg-white border-2 border-gray-800">
          <div className="flex items-center gap-3 p-4">
            <div className="h-8 w-8 border-2 border-gray-800"></div>
            <div className="h-5 bg-gray-800 flex-1" style={{ width: '120px' }}></div>
            <div className="h-6 bg-gray-200" style={{ width: '30px' }}></div>
            <div className="flex gap-1">
              <div className="h-8 w-8 border-2 border-gray-800"></div>
              <div className="h-8 w-8 border-2 border-gray-800"></div>
            </div>
          </div>
        </div>

        {/* Category Card 3 - No Children */}
        <div className="bg-white border-2 border-gray-800">
          <div className="flex items-center gap-3 p-4">
            <div className="h-8 w-8 border-2 border-gray-800"></div>
            <div className="h-5 bg-gray-800 flex-1" style={{ width: '140px' }}></div>
            <div className="flex gap-1">
              <div className="h-8 w-8 border-2 border-gray-800"></div>
              <div className="h-8 w-8 border-2 border-gray-800"></div>
            </div>
          </div>
        </div>

        {/* Category Card 4 - Collapsed */}
        <div className="bg-white border-2 border-gray-800">
          <div className="flex items-center gap-3 p-4">
            <div className="h-8 w-8 border-2 border-gray-800"></div>
            <div className="h-5 bg-gray-800 flex-1" style={{ width: '110px' }}></div>
            <div className="h-6 bg-gray-200" style={{ width: '30px' }}></div>
            <div className="flex gap-1">
              <div className="h-8 w-8 border-2 border-gray-800"></div>
              <div className="h-8 w-8 border-2 border-gray-800"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t-2 border-gray-800 p-2">
        <div className="grid grid-cols-4 gap-1">
          <div className="h-16 border-2 border-gray-400 flex flex-col items-center justify-center gap-1">
            <div className="h-6 w-6 bg-gray-400"></div>
            <div className="h-2 bg-gray-400" style={{ width: '40px' }}></div>
          </div>
          <div className="h-16 border-2 border-gray-400 flex flex-col items-center justify-center gap-1">
            <div className="h-6 w-6 bg-gray-400"></div>
            <div className="h-2 bg-gray-400" style={{ width: '40px' }}></div>
          </div>
          <div className="h-16 bg-gray-800 flex flex-col items-center justify-center gap-1">
            <div className="h-6 w-6 bg-white"></div>
            <div className="h-2 bg-white" style={{ width: '50px' }}></div>
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
