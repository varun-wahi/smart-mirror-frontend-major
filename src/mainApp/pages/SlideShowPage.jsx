import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

const SlideshowPage = () => {
  const backupImages = [
    "images/image1.jpeg",
    "images/image2.jpeg",
    "images/image3.jpeg",
  ];

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
        const response = await axios.get("http://localhost:5020/api/cloudinary/images?folder=Slideshow");
        const cloudinaryUrls = response.data;

        if (cloudinaryUrls.length > 0) {
          setImages(cloudinaryUrls);
          setUsingBackup(false);
          localStorage.setItem("cloudinaryUrls", JSON.stringify(cloudinaryUrls));
        } else {
          throw new Error("No images found from backend.");
        }
      } else {
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

  useEffect(() => {
    fetchImages();
    window.addEventListener('online', fetchImages);
    window.addEventListener('offline', fetchImages);
    return () => {
      window.removeEventListener('online', fetchImages);
      window.removeEventListener('offline', fetchImages);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="h-screen w-screen bg-black text-white flex items-center justify-center overflow-hidden">
      {/* Status Indicator */}
      <div className="absolute top-4 right-4 flex items-center">
        <div className={`h-3 w-3 rounded-full mr-2 ${isOnline ? "bg-green-500" : "bg-red-500"}`}></div>
        <span>{isOnline ? "Online" : "Offline"}</span>
      </div>

      {/* Slideshow */}
      <div className="relative w-full h-full p-0 m-0">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : (
          <motion.img
  key={images[currentIndex]}
  src={images[currentIndex]}
  alt={`Slide ${currentIndex + 1}`}
  className="w-full h-full object-contain bg-black"
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
    </div>
  );
};

export default SlideshowPage;