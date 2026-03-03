import React, { useState } from 'react';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import type { ImageResult } from '../../services/aiNotesApi';

interface ImageGalleryProps {
  images: ImageResult[];
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <ImageIcon className="w-5 h-5" />
        Image Gallery
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="group relative bg-gray-100 rounded-xl overflow-hidden cursor-pointer"
            onClick={() => setSelectedImage(image)}
          >
            <img
              src={image.url}
              alt={image.alt}
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm truncate">{image.alt}</p>
                <p className="text-gray-300 text-xs">by {image.photographer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] overflow-auto">
            <button
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage.url}
              alt={selectedImage.alt}
              className="w-full h-auto rounded-lg"
            />
            <div className="bg-white dark:bg-gray-900 p-4 rounded-b-lg">
              <p className="font-medium text-gray-900 dark:text-white">{selectedImage.alt}</p>
              <a
                href={selectedImage.photographer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1"
              >
                Photo by {selectedImage.photographer}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
