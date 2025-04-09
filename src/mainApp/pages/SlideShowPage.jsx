import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

import axios from "axios"; // New: We'll use axios to fetch images

const SlideshowPage = () => {
  // Backup images
  const backupImages = [
    "images/image1.jpeg",
    "images/image2.jpeg",
    "images/image3.jpeg",
  ];

  // State variables
  const [images, setImages] = useState(backupImages);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [usingBackup, setUsingBackup] = useState(false);

  const fetchImages = async () => {
    setIsLoading(true);

    try {
      setIsOnline(navigator.onLine);

      if (navigator.onLine) {
        // Try fetching images from your backend
        const response = await axios.get("http://localhost:5020/api/cloudinary/images?folder=Slideshow"); // 👈 your backend endpoint
        // const cloudinaryUrls = response.data.images;
        const cloudinaryUrls = response.data; // it's just an array of image URLs
        console.log("Fetched images from API:", response.data);



        if (cloudinaryUrls.length > 0) {
          setImages(cloudinaryUrls);
          setUsingBackup(false);
          localStorage.setItem("cloudinaryUrls", JSON.stringify(cloudinaryUrls));
        } else {
          throw new Error("No images found from backend.");
        }
      } else {
        // Offline mode
        const cachedUrls = localStorage.getItem("cloudinaryUrls");

        if (cachedUrls) {
          setImages(JSON.parse(cachedUrls));
          setUsingBackup(false);
        } else {
          setImages(backupImages);
          setUsingBackup(true);
        }
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      setImages(backupImages);
      setUsingBackup(true);
    }

    setIsLoading(false);
  };

  // Load images
  useEffect(() => {
    fetchImages();

    // Setup online/offline event listeners
    window.addEventListener('online', fetchImages);
    window.addEventListener('offline', fetchImages);

    return () => {
      window.removeEventListener('online', fetchImages);
      window.removeEventListener('offline', fetchImages);
    };
  }, []);

  // Slideshow timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center">
      {/* Status Indicator */}
      <div className="absolute top-4 right-4 flex items-center">
        <div className={`h-3 w-3 rounded-full mr-2 ${isOnline ? "bg-green-500" : "bg-red-500"}`}></div>
        <span>{isOnline ? "Online" : "Offline"}</span>
      </div>

      {/* Slideshow */}
      <div className="relative w-3/4 h-3/4 max-w-4xl">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : (
          <motion.img
  key={images[currentIndex]} // 👈 important for transition when image changes
  src={images[currentIndex]}
  alt={`Slide ${currentIndex + 1}`}
  className="w-full h-full object-contain rounded-lg bg-black"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.8 }}
  onError={(e) => {
    if (!usingBackup) {
      e.target.src = backupImages[currentIndex % backupImages.length];
    }
  }}
/>

        )}
      </div>

      {/* Slide Indicator */}
      <div className="mt-4 text-lg">
        Slide {currentIndex + 1} of {images.length}
        {usingBackup && <span className="ml-2 text-yellow-400">(Using backup images)</span>}
      </div>

      {/* Navigation Dots */}
      <div className="mt-4 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            className={`h-3 w-3 rounded-full ${
              currentIndex === index ? "bg-white" : "bg-gray-500"
            }`}
            onClick={() => setCurrentIndex(index)}
          ></button>
        ))}
      </div>
    </div>
  );
};

export default SlideshowPage;
