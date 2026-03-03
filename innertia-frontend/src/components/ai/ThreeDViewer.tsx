import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCcw, ZoomIn, ZoomOut, Box } from 'lucide-react';
import type { ThreeDSuggestion } from '../../services/aiNotesApi';

interface ThreeDViewerProps {
  suggestions: ThreeDSuggestion[];
}

export const ThreeDViewer: React.FC<ThreeDViewerProps> = ({ suggestions }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameIdRef = useRef<number>(0);
  const meshRef = useRef<THREE.Mesh | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || suggestions.length === 0) return;

    // Set up scene
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create mesh based on suggestion type
    const suggestion = suggestions[0];
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    try {
      switch (suggestion.type.toLowerCase()) {
        case 'molecule':
          // Create a simple molecule-like structure (sphere cluster)
          geometry = new THREE.IcosahedronGeometry(1, 1);
          material = new THREE.MeshPhongMaterial({
            color: 0x3b82f6,
            flatShading: true,
          });
          break;
        case 'network':
          // Create a torus knot for network visualization
          geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
          material = new THREE.MeshPhongMaterial({
            color: 0x8b5cf6,
            wireframe: true,
          });
          break;
        case 'dna':
          // Create a double helix visualization using torus
          geometry = new THREE.TorusGeometry(0.8, 0.2, 16, 100);
          material = new THREE.MeshPhongMaterial({
            color: 0x10b981,
          });
          break;
        default:
          // Default: cube
          geometry = new THREE.BoxGeometry(2, 2, 2);
          material = new THREE.MeshPhongMaterial({
            color: 0xf59e0b,
          });
      }

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      meshRef.current = mesh;

      setIsLoading(false);
    } catch (err) {
      setError('Failed to create 3D visualization');
      setIsLoading(false);
    }

    // Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      if (meshRef.current) {
        meshRef.current.rotation.x += 0.005;
        meshRef.current.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameIdRef.current);

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      if (meshRef.current) {
        meshRef.current.geometry.dispose();
        (meshRef.current.material as THREE.Material).dispose();
      }
    };
  }, [suggestions]);

  const handleReset = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 5);
      cameraRef.current.lookAt(0, 0, 0);
    }
    if (meshRef.current) {
      meshRef.current.rotation.set(0, 0, 0);
    }
  };

  const handleZoomIn = () => {
    if (cameraRef.current && cameraRef.current.position.z > 2) {
      cameraRef.current.position.z -= 0.5;
    }
  };

  const handleZoomOut = () => {
    if (cameraRef.current && cameraRef.current.position.z < 10) {
      cameraRef.current.position.z += 0.5;
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Box className="w-5 h-5" />
        3D Visualization
      </h3>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">{suggestions[0].type}</h4>
            <p className="text-sm text-gray-500">{suggestions[0].description}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div ref={containerRef} className="h-80 w-full relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreeDViewer;
