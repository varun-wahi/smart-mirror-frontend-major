import React, { useState, useEffect } from "react";

const SlideshowPage = () => {
  const images = [
    "images/image1.jpeg",
    "images/image2.jpeg",
    "images/image3.jpeg", // Add your image paths here
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [images.length]);

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center">

      {/* Slideshow */}
      <div className="relative w-3/4 h-3/4 max-w-4xl">
        <img
          src={images[currentIndex]}
          alt={`Slide ${currentIndex + 1}`}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>

      {/* Slide Indicator */}
      <div className="mt-4 text-lg">
        Slide {currentIndex + 1} of {images.length}
      </div>
    </div>
  );
};

export default SlideshowPage;