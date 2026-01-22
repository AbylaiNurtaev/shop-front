import { useState } from 'react';
import { WireframeLogin } from './WireframeLogin';
import { WireframeRoleSelection } from './WireframeRoleSelection';
import { WireframeProductsList } from './WireframeProductsList';
import { WireframeProductEdit } from './WireframeProductEdit';
import { WireframeInventoryOverview } from './WireframeInventoryOverview';
import { WireframeInventoryUpdate } from './WireframeInventoryUpdate';
import { WireframeCategoriesList } from './WireframeCategoriesList';
import { WireframeAddCategory } from './WireframeAddCategory';

const wireframes = [
  { id: 'login', name: '1. Login', component: WireframeLogin },
  { id: 'role-selection', name: '2. Role Selection', component: WireframeRoleSelection },
  { id: 'products-list', name: '3. Products List', component: WireframeProductsList },
  { id: 'product-edit', name: '4. Product Edit', component: WireframeProductEdit },
  { id: 'inventory-overview', name: '5. Inventory Overview', component: WireframeInventoryOverview },
  { id: 'inventory-update', name: '6. Inventory Update', component: WireframeInventoryUpdate },
  { id: 'categories-list', name: '7. Categories List', component: WireframeCategoriesList },
  { id: 'add-category', name: '8. Add Category', component: WireframeAddCategory },
];

export function WireframeViewer() {
  const [selectedWireframe, setSelectedWireframe] = useState(wireframes[0]);

  const CurrentWireframe = selectedWireframe.component;

  return (
    <div className="min-h-screen bg-gray-200 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r-2 border-gray-800 p-4 overflow-y-auto">
        <div className="mb-6">
          <div className="h-6 bg-gray-800 mb-2" style={{ width: '180px' }}></div>
          <div className="h-3 bg-gray-400" style={{ width: '150px' }}></div>
        </div>
        
        <nav className="space-y-2">
          {wireframes.map((wireframe) => (
            <button
              key={wireframe.id}
              onClick={() => setSelectedWireframe(wireframe)}
              className={`w-full text-left px-3 py-2 text-sm border-2 transition-colors ${
                selectedWireframe.id === wireframe.id
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-800 border-gray-800 hover:bg-gray-100'
              }`}
            >
              {wireframe.name}
            </button>
          ))}
        </nav>

        <div className="mt-8 p-3 bg-gray-100 border-2 border-gray-300">
          <div className="h-3 bg-gray-600 mb-2" style={{ width: '80px' }}></div>
          <div className="h-2 bg-gray-400 mb-1" style={{ width: '120px' }}></div>
          <div className="h-2 bg-gray-400 mb-1" style={{ width: '100px' }}></div>
          <div className="h-2 bg-gray-400" style={{ width: '140px' }}></div>
        </div>
      </div>

      {/* Main Wireframe Display */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white shadow-2xl" style={{ width: '375px', height: '812px' }}>
          <CurrentWireframe />
        </div>
      </div>

      {/* Info Panel */}
      <div className="w-80 bg-white border-l-2 border-gray-800 p-6 overflow-y-auto">
        <div className="mb-6">
          <div className="h-5 bg-gray-800 mb-3" style={{ width: '140px' }}></div>
          <div className="h-4 bg-gray-600 mb-2" style={{ width: '200px' }}></div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="h-3 bg-gray-600 mb-2" style={{ width: '80px' }}></div>
            <div className="h-3 bg-gray-400 mb-1" style={{ width: '220px' }}></div>
            <div className="h-3 bg-gray-400 mb-1" style={{ width: '200px' }}></div>
            <div className="h-3 bg-gray-400" style={{ width: '180px' }}></div>
          </div>

          <div>
            <div className="h-3 bg-gray-600 mb-2" style={{ width: '100px' }}></div>
            <div className="h-3 bg-gray-400 mb-1" style={{ width: '240px' }}></div>
            <div className="h-3 bg-gray-400" style={{ width: '200px' }}></div>
          </div>

          <div>
            <div className="h-3 bg-gray-600 mb-2" style={{ width: '90px' }}></div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 border-2 border-gray-800 bg-gray-800 flex-shrink-0 mt-0.5"></div>
                <div className="h-3 bg-gray-400 flex-1" style={{ width: '160px' }}></div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 border-2 border-gray-800 bg-gray-800 flex-shrink-0 mt-0.5"></div>
                <div className="h-3 bg-gray-400 flex-1" style={{ width: '180px' }}></div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 border-2 border-gray-800 bg-gray-800 flex-shrink-0 mt-0.5"></div>
                <div className="h-3 bg-gray-400 flex-1" style={{ width: '140px' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}