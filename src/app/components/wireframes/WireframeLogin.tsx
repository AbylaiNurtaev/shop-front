export function WireframeLogin() {
  return (
    <div className="max-w-md mx-auto h-screen bg-white p-6 flex flex-col justify-center">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="h-8 bg-gray-800 mx-auto mb-2" style={{ width: '120px' }}></div>
        <div className="h-4 bg-gray-400 mx-auto" style={{ width: '200px' }}></div>
      </div>

      {/* Email Input */}
      <div className="mb-4">
        <div className="h-3 bg-gray-600 mb-2" style={{ width: '80px' }}></div>
        <div className="h-12 border-2 border-gray-800 bg-white"></div>
      </div>

      {/* Password Input */}
      <div className="mb-8">
        <div className="h-3 bg-gray-600 mb-2" style={{ width: '80px' }}></div>
        <div className="h-12 border-2 border-gray-800 bg-white"></div>
      </div>

      {/* Login Button */}
      <div className="mb-4">
        <div className="h-12 bg-gray-800 flex items-center justify-center">
          <div className="h-4 bg-white" style={{ width: '60px' }}></div>
        </div>
      </div>

      {/* Secondary Links */}
      <div className="text-center space-y-2">
        <div className="h-3 bg-gray-400 mx-auto" style={{ width: '140px' }}></div>
        <div className="h-3 bg-gray-400 mx-auto" style={{ width: '100px' }}></div>
      </div>
    </div>
  );
}
