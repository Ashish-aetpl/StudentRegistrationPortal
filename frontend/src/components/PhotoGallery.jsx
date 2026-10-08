import React, { useState } from 'react';
import poster1 from '../images/poster1.webp';

// Add more images to src/images/ and list them here
const galleryPhotos = [
  { id: 1, img: poster1, alt: 'Special Campaign poster' },
  { id: 2, img: poster1, alt: 'Special Campaign poster' },
  { id: 3, img: poster1, alt: 'Special Campaign poster' },
  { id: 4, img: poster1, alt: 'Special Campaign poster' },
  { id: 5, img: poster1, alt: 'Special Campaign poster' },
  { id: 6, img: poster1, alt: 'Special Campaign poster' }
];

const PhotoGallery = () => {
  return (
    <section className="container py-4">
      <h1 className="section-heading">Photo Gallery</h1>
      <div className="row g-3">
        {galleryPhotos.map((item) => (
          <GalleryCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
};

const GalleryCard = ({ item }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="col-12 col-sm-6 col-lg-4">
      <div className="gallery-card">
        {imgError ? (
          <div className="gallery-fallback">Image not available</div>
        ) : (
          <img src={item.img} alt={item.alt} loading="lazy" onError={() => setImgError(true)} />
        )}
      </div>
    </div>
  );
};

export default PhotoGallery;
