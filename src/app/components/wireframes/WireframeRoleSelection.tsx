export function WireframeRoleSelection() {
  return (
    <div className="max-w-md mx-auto h-screen bg-white p-6 flex flex-col justify-center">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="h-8 bg-gray-800 mx-auto mb-2" style={{ width: '180px' }}></div>
        <div className="h-4 bg-gray-400 mx-auto" style={{ width: '240px' }}></div>
      </div>

      {/* Store Owner Button */}
      <div className="mb-4">
        <div className="h-32 border-4 border-gray-800 bg-white flex flex-col items-center justify-center">
          <div className="h-12 w-12 bg-gray-800 mb-3"></div>
          <div className="h-5 bg-gray-800" style={{ width: '120px' }}></div>
          <div className="h-3 bg-gray-400 mt-2" style={{ width: '160px' }}></div>
        </div>
      </div>

      {/* Brand/Distributor Button */}
      <div className="mb-4">
        <div className="h-32 border-4 border-gray-800 bg-white flex flex-col items-center justify-center">
          <div className="h-12 w-12 bg-gray-800 mb-3"></div>
          <div className="h-5 bg-gray-800" style={{ width: '140px' }}></div>
          <div className="h-3 bg-gray-400 mt-2" style={{ width: '180px' }}></div>
        </div>
      </div>

      {/* Back Link */}
      <div className="text-center mt-6">
        <div className="h-3 bg-gray-400 mx-auto" style={{ width: '80px' }}></div>
      </div>
    </div>
  );
}
