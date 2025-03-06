import React, { useState, useEffect } from 'react';
import { Camera, Upload, Download, FileDown } from 'lucide-react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const RarityBackgroundGenerator = () => {
  const [itemsData, setItemsData] = useState([
    { name: 'Item 1', background: 'legendary', image: null, disableBackground: false, imageScale: 80, price: 100 },
    { name: 'Item 2', background: 'legendary', image: null, disableBackground: false, imageScale: 80, price: 90 },
    { name: 'Item 3', background: 'rare', image: null, disableBackground: false, imageScale: 80, price: 70 },
    { name: 'Item 4', background: 'rare', image: null, disableBackground: false, imageScale: 80, price: 60 },
    { name: 'Item 5', background: 'uncommon', image: null, disableBackground: false, imageScale: 80, price: 40 },
    { name: 'Item 6', background: 'uncommon', image: null, disableBackground: false, imageScale: 80, price: 30 },
    { name: 'Item 7', background: 'uncommon', image: null, disableBackground: false, imageScale: 80, price: 25 },
    { name: 'Item 8', background: 'uncommon', image: null, disableBackground: false, imageScale: 80, price: 20 },
    { name: 'Item 9', background: 'uncommon', image: null, disableBackground: false, imageScale: 80, price: 18 },
    { name: 'Item 10', background: 'uncommon', image: null, disableBackground: false, imageScale: 80, price: 15 },
    { name: 'Item 11', background: 'common', image: null, disableBackground: false, imageScale: 80, price: 10 },
    { name: 'Item 12', background: 'common', image: null, disableBackground: false, imageScale: 80, price: 8 },
    { name: 'Item 13', background: 'common', image: null, disableBackground: false, imageScale: 80, price: 7 },
    { name: 'Item 14', background: 'common', image: null, disableBackground: false, imageScale: 80, price: 5 },
    { name: 'Item 15', background: 'common', image: null, disableBackground: false, imageScale: 80, price: 3 },
    { name: 'Item 16', background: 'uncommon', image: null, disableBackground: false, imageScale: 80, price: 12 },
    { name: 'Item 17', background: 'uncommon', image: null, disableBackground: false, imageScale: 80, price: 14 },
    { name: 'Item 18', background: 'uncommon', image: null, disableBackground: false, imageScale: 80, price: 16 },
    { name: 'Item 19', background: 'uncommon', image: null, disableBackground: false, imageScale: 80, price: 22 },
    { name: 'Item 20', background: 'uncommon', image: null, disableBackground: false, imageScale: 80, price: 24 },
  ]);

  const [bgRemovalSensitivity, setBgRemovalSensitivity] = useState(15);
  const [bgRemovalEnabled, setBgRemovalEnabled] = useState(true);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [backgrounds, setBackgrounds] = useState({
    legendary: { color: '#FFD700', backgroundImage: null, maxRarity: 0.1 },       // Gold
    exceedinglyRare: { color: '#FF0000', backgroundImage: null, maxRarity: 1 },   // Red
    rare: { color: '#FF69B4', backgroundImage: null, maxRarity: 3 },              // Pink
    uncommon: { color: '#9370DB', backgroundImage: null, maxRarity: 8 },          // Purple
    common: { color: '#4169E1', backgroundImage: null, maxRarity: 100 }           // Blue
  });
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [pulledBackground, setPulledBackground] = useState(null);
  const [globalDisableBackground, setGlobalDisableBackground] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const removeImageBackground = (imageData, sensitivity = 10) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0);
        
        // Get the image data
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        
        // Extract the potential card boundaries using edge detection
        let minX = canvas.width;
        let maxX = 0;
        let minY = canvas.height;
        let maxY = 0;
        
        // Edge detection threshold - adjust this if needed
        const edgeThreshold = 25;
        
        // Loop through pixels to find edges (rectangular card shape)
        for (let y = 1; y < canvas.height - 1; y++) {
          for (let x = 1; x < canvas.width - 1; x++) {
            const idx = (y * canvas.width + x) * 4;
            const nextRowIdx = ((y+1) * canvas.width + x) * 4;
            const nextColIdx = (y * canvas.width + (x+1)) * 4;
            
            // Calculate differences with neighboring pixels
            const diffX = Math.abs(data[idx] - data[nextColIdx]) + 
                        Math.abs(data[idx+1] - data[nextColIdx+1]) + 
                        Math.abs(data[idx+2] - data[nextColIdx+2]);
                        
            const diffY = Math.abs(data[idx] - data[nextRowIdx]) + 
                        Math.abs(data[idx+1] - data[nextRowIdx+1]) + 
                        Math.abs(data[idx+2] - data[nextRowIdx+2]);
            
            // If we detect a strong edge, update boundary
            if (diffX > edgeThreshold || diffY > edgeThreshold) {
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            }
          }
        }
        
        // Add padding to ensure we don't cut off any card edges
        const padding = Math.max(10, Math.min(canvas.width, canvas.height) * 0.02); // 2% of smaller dimension
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(canvas.width, maxX + padding);
        maxY = Math.min(canvas.height, maxY + padding);
        
        // Check if we detected a reasonable card area
        const detectedWidth = maxX - minX;
        const detectedHeight = maxY - minY;
        const isReasonableCard = 
          detectedWidth > canvas.width * 0.2 && 
          detectedHeight > canvas.height * 0.2 &&
          detectedWidth < canvas.width * 0.95 &&
          detectedHeight < canvas.height * 0.95;
        
        // If a proper card boundary was found, use it
        if (isReasonableCard) {
          // Make pixels outside the card boundary transparent
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const idx = (y * canvas.width + x) * 4;
              
              // If pixel is outside detected card boundaries, make it transparent
              if (x < minX || x > maxX || y < minY || y > maxY) {
                data[idx + 3] = 0; // Set alpha to 0
              }
            }
          }
        } else {
          // Fall back to standard background removal for non-card images
          // Sample the corners to identify likely background color
          const cornerSamples = [
            {x: 0, y: 0}, // top left
            {x: canvas.width - 1, y: 0}, // top right
            {x: 0, y: canvas.height - 1}, // bottom left
            {x: canvas.width - 1, y: canvas.height - 1} // bottom right
          ];
          
          // Find most common corner color
          const avgColor = {r: 0, g: 0, b: 0};
          cornerSamples.forEach(corner => {
            const idx = (corner.y * canvas.width + corner.x) * 4;
            avgColor.r += data[idx] / 4;
            avgColor.g += data[idx + 1] / 4;
            avgColor.b += data[idx + 2] / 4;
          });
          
          // Only process pixels similar to background color
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const colorDist = Math.sqrt(
              Math.pow(r - avgColor.r, 2) +
              Math.pow(g - avgColor.g, 2) +
              Math.pow(b - avgColor.b, 2)
            );
            
            if (colorDist < sensitivity) {
              data[i + 3] = 0; // Make pixel transparent
            }
          }
        }
        
        // Apply changes and return the result
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.src = imageData;
    });
  };

  const handleItemImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageResult = reader.result;
        
        // Process the image to remove background if enabled
        let processedImage = imageResult;
        if (bgRemovalEnabled) {
          processedImage = await removeImageBackground(imageResult, bgRemovalSensitivity);
        }
        
        // Create a new copy of the items array
        const newItemsData = [...itemsData];
        // Store the processed image in the state
        newItemsData[index].image = processedImage;
        setItemsData(newItemsData);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to load image from URL - simplified and reliable version
  const loadImageFromUrl = async (url, timeout = 20000) => {
    if (!url) return null;
    
    // Sanitize and validate URL
    let sanitizedUrl = url.trim();
    
    // Add protocol if missing
    if (!sanitizedUrl.toLowerCase().startsWith('http://') && !sanitizedUrl.toLowerCase().startsWith('https://')) {
      sanitizedUrl = 'https://' + sanitizedUrl;
    }
    
    // Replace spaces with %20
    sanitizedUrl = sanitizedUrl.replace(/ /g, '%20');
    
    console.log(`Loading image: ${sanitizedUrl}`);
    
    // Method 1: Direct image loading
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      const imageData = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          img.src = "";
          reject(new Error("Timeout"));
        }, timeout);
        
        img.onload = () => {
          clearTimeout(timeoutId);
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          try {
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
          } catch (e) {
            reject(new Error("Canvas error"));
          }
        };
        
        img.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error("Load error"));
        };
        
        img.src = sanitizedUrl;
      });
      
      // Apply background removal if enabled
      if (bgRemovalEnabled && imageData) {
        try {
          return await removeImageBackground(imageData, bgRemovalSensitivity);
        } catch (e) {
          console.warn("Background removal failed:", e);
          return imageData;
        }
      }
      
      return imageData;
    } catch (error) {
      console.warn(`Direct load failed: ${error.message}`);
      
      // Method 2: Google proxy for Cloud Storage URLs
      if (sanitizedUrl.includes('storage.googleapis.com')) {
        try {
          console.log("Trying Google Storage proxy");
          const proxyUrl = `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(sanitizedUrl)}`;
          
          const img = new Image();
          img.crossOrigin = "anonymous";
          
          const imageData = await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              img.src = "";
              reject(new Error("Google proxy timeout"));
            }, timeout);
            
            img.onload = () => {
              clearTimeout(timeoutId);
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              
              try {
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl);
              } catch (e) {
                reject(new Error("Canvas error with Google proxy"));
              }
            };
            
            img.onerror = () => {
              clearTimeout(timeoutId);
              reject(new Error("Google proxy load error"));
            };
            
            img.src = proxyUrl;
          });
          
          // Apply background removal if enabled
          if (bgRemovalEnabled && imageData) {
            try {
              return await removeImageBackground(imageData, bgRemovalSensitivity);
            } catch (e) {
              console.warn("Background removal failed with Google proxy:", e);
              return imageData;
            }
          }
          
          return imageData;
        } catch (googleProxyError) {
          console.warn(`Google proxy failed: ${googleProxyError.message}`);
        }
      }
      
      // Method 3: AllOrigins proxy as last resort
      try {
        console.log("Trying AllOrigins proxy");
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(sanitizedUrl)}`;
        
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        const imageData = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            img.src = "";
            reject(new Error("AllOrigins proxy timeout"));
          }, timeout);
          
          img.onload = () => {
            clearTimeout(timeoutId);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            try {
              const dataUrl = canvas.toDataURL('image/png');
              resolve(dataUrl);
            } catch (e) {
              reject(new Error("Canvas error with AllOrigins proxy"));
            }
          };
          
          img.onerror = () => {
            clearTimeout(timeoutId);
            reject(new Error("AllOrigins proxy load error"));
          };
          
          img.src = proxyUrl;
        });
        
        // Apply background removal if enabled
        if (bgRemovalEnabled && imageData) {
          try {
            return await removeImageBackground(imageData, bgRemovalSensitivity);
          } catch (e) {
            console.warn("Background removal failed with AllOrigins proxy:", e);
            return imageData;
          }
        }
        
        return imageData;
      } catch (proxyError) {
        console.warn(`AllOrigins proxy failed: ${proxyError.message}`);
        return null;
      }
    }
  };

  // Backup method for retry attempts
  const loadImageFromUrlBackupMethod = async (url) => {
    console.log(`Using backup method for: ${url}`);
    
    try {
      // Try the CORS Bridge method
      const proxyUrl = `https://cors.bridged.cc/${url}`;
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      const imageData = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          img.src = "";
          reject(new Error("Backup timeout"));
        }, 15000);
        
        img.onload = () => {
          clearTimeout(timeoutId);
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          try {
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
          } catch (e) {
            reject(new Error("Canvas error in backup"));
          }
        };
        
        img.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error("Backup load error"));
        };
        
        img.src = proxyUrl;
      });
      
      if (bgRemovalEnabled && imageData) {
        try {
          return await removeImageBackground(imageData, bgRemovalSensitivity);
        } catch (e) {
          return imageData;
        }
      }
      
      return imageData;
    } catch (error) {
      console.warn(`Backup method failed: ${error.message}`);
      return null;
    }
  };

  const handleBackgroundImageUpload = (e, tier) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageResult = reader.result;
        
        // Create a new copy of the backgrounds object
        const newBackgrounds = { ...backgrounds };
        // Store the background image in the state
        newBackgrounds[tier].backgroundImage = imageResult;
        setBackgrounds(newBackgrounds);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleItemChange = (index, field, value) => {
    setIsEditing(true);
    const newItemsData = [...itemsData];
    if (field === 'imageScale') {
      newItemsData[index][field] = parseInt(value, 10) || 80;
    } else if (field === 'price') {
      const price = parseFloat(value) || 0;
      newItemsData[index][field] = price;
      // Recalculate backgrounds based on price changes
      updateBackgroundsBasedOnPrice(newItemsData);
    } else {
      newItemsData[index][field] = value;
    }
    setItemsData(newItemsData);
  };
  
  // Function to determine background tier based on price percentage
  const determineTier = (pricePercentage) => {
    if (pricePercentage >= 10) return 'legendary';
    if (pricePercentage >= 5) return 'exceedinglyRare';
    if (pricePercentage >= 3) return 'rare';
    if (pricePercentage >= 1) return 'uncommon';
    return 'common';
  };
  
  // Function to update backgrounds based on price
  const updateBackgroundsBasedOnPrice = (items = itemsData) => {
    // Calculate total price
    const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    
    if (totalPrice <= 0) return; // Avoid division by zero
    
    const newItemsData = [...items];
    
    // Update background based on price percentage
    newItemsData.forEach((item, index) => {
      const pricePercentage = (parseFloat(item.price) || 0) / totalPrice * 100;
      newItemsData[index].background = determineTier(pricePercentage);
    });
    
    setItemsData(newItemsData);
  };
  
  // When input field loses focus, we're done editing
  const handleBlur = () => {
    setIsEditing(false);
  };

  const addItem = () => {
    const newItem = { 
      name: `Item ${itemsData.length + 1}`, 
      background: 'common', 
      image: null, 
      disableBackground: false, 
      imageScale: 80,
      price: 0
    };
    
    setItemsData([...itemsData, newItem]);
  };

  const removeItem = (index) => {
    const newItemsData = [...itemsData];
    newItemsData.splice(index, 1);
    setItemsData(newItemsData);
    
    // Update backgrounds after removing an item
    updateBackgroundsBasedOnPrice(newItemsData);
  };

  const toggleDisableBackground = (index) => {
    const newItemsData = [...itemsData];
    newItemsData[index].disableBackground = !newItemsData[index].disableBackground;
    setItemsData(newItemsData);
  };

  const pullRandomItem = () => {
    const itemsWithImages = itemsData.filter(item => item.image !== null);
    
    if (itemsWithImages.length === 0) {
      alert("Please upload at least one image for an item");
      return;
    }
    
    // Select random item
    const randomIndex = Math.floor(Math.random() * itemsWithImages.length);
    const selectedItem = itemsWithImages[randomIndex];
    
    setSelectedItem(selectedItem);
    setPulledBackground(backgrounds[selectedItem.background]);
  };
  
  const validateAtLeastOneImage = () => {
    return itemsData.some(item => item.image !== null);
  };
  
  const hasImagesToDownload = () => {
    return itemsData.some(item => item.image !== null);
  };
  
  // Function to download a CSV template
  const downloadCSVTemplate = () => {
    // Create template data
    const templateData = [
      {
        Name: "1986/87 Fleer Michael Jordan Rookie",
        ImageURL: "https://example.com/jordan.jpg",
        Price: 500000,
        Background: "legendary",
        DisableBackground: "No",
        ImageScale: 55
      },
      {
        Name: "1953 Topps Baseball #244 Willie Mays",
        ImageURL: "https://example.com/mays.jpg",
        Price: 175000,
        Background: "legendary",
        DisableBackground: "No",
        ImageScale: 55
      },
      {
        Name: "2018 Topps Aaron Judge Rookie Auto /25",
        ImageURL: "https://example.com/judge.jpg",
        Price: 35000,
        Background: "rare",
        DisableBackground: "No",
        ImageScale: 55
      }
    ];
    
    // Convert to CSV
    const csv = Papa.unparse(templateData);
    
    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'template.csv');
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvText = e.target.result;
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: async (result) => {
          console.log("CSV Parse Result:", result);
          
          // Find the appropriate column headers (case insensitive)
          const nameColumn = result.meta.fields.find(field => 
            field.toLowerCase().includes('name') || field.toLowerCase() === 'item'
          );
          
          const imageURLColumn = result.meta.fields.find(field => 
            field.toLowerCase().includes('image') || 
            field.toLowerCase().includes('url') || 
            field.toLowerCase().includes('pic')
          );
          
          const priceColumn = result.meta.fields.find(field =>
            field.toLowerCase().includes('price') ||
            field.toLowerCase().includes('value') ||
            field.toLowerCase().includes('cost')
          );
          
          const imageScaleColumn = result.meta.fields.find(field =>
            field.toLowerCase().includes('scale') ||
            field.toLowerCase().includes('size')
          );
          
          const backgroundColumn = result.meta.fields.find(field =>
            field.toLowerCase().includes('background') ||
            field.toLowerCase().includes('rarity') ||
            field.toLowerCase().includes('tier')
          );
          
          const disableBackgroundColumn = result.meta.fields.find(field =>
            field.toLowerCase().includes('disable')
          );
          
          if (!nameColumn) {
            alert("Could not find a 'Name' column in the CSV. Please use the template.");
            return;
          }
          
          // Extract and format the data
          const newItems = result.data.map(row => {
            // For price, handle potential currency symbols and formatting
            let price = 0;
            if (priceColumn) {
              const priceStr = row[priceColumn]?.toString() || "0";
              // Remove currency symbols, commas, and other non-numeric characters except for decimal points
              const cleanPrice = priceStr.replace(/[^0-9.-]/g, '');
              price = parseFloat(cleanPrice) || 0;
            }
            
            // For image scale, use the value from CSV or default to 80
            let imageScale = 80;
            if (imageScaleColumn && row[imageScaleColumn]) {
              imageScale = parseInt(row[imageScaleColumn], 10) || 80;
            }
            
            // For background, use the value from CSV or default to 'common'
            let background = 'common';
            if (backgroundColumn && row[backgroundColumn]) {
              const bgValue = row[backgroundColumn].toLowerCase().trim();
              if (bgValue.includes('legend')) background = 'legendary';
              else if (bgValue.includes('exceed') || (bgValue.includes('rare') && bgValue.includes('exceed'))) background = 'exceedinglyRare';
              else if (bgValue.includes('rare')) background = 'rare';
              else if (bgValue.includes('uncommon')) background = 'uncommon';
              else background = 'common';
            }
            
            // For disableBackground, check if it's 'yes', 'true', etc.
            let disableBackground = false;
            if (disableBackgroundColumn && row[disableBackgroundColumn]) {
              const disableValue = row[disableBackgroundColumn].toLowerCase().trim();
              disableBackground = disableValue === 'yes' || disableValue === 'true' || disableValue === '1';
            }
            
            // Process URL - clean up and normalize
            let imageURL = null;
            if (imageURLColumn && row[imageURLColumn]) {
              imageURL = row[imageURLColumn].trim();
              
              // Ensure URL has proper protocol
              if (imageURL && !imageURL.toLowerCase().startsWith('http://') && !imageURL.toLowerCase().startsWith('https://')) {
                imageURL = 'https://' + imageURL;
              }
              
              // Replace spaces with %20
              imageURL = imageURL.replace(/ /g, '%20');
            }
            
            return {
              name: row[nameColumn]?.trim() || "Unnamed Item",
              background,
              image: null, // Will be loaded from URL if available
              disableBackground,
              imageScale,
              price,
              imageURL,
              loadStatus: imageURL ? 'pending' : 'none' // Track loading status
            };
          });
          
          // Update backgrounds based on prices only if no background column was found
          if (!backgroundColumn) {
            // Calculate total price
            const totalPrice = newItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
            
            if (totalPrice > 0) {
              // Update background based on price percentage
              newItems.forEach((item, index) => {
                const pricePercentage = (parseFloat(item.price) || 0) / totalPrice * 100;
                newItems[index].background = determineTier(pricePercentage);
              });
            }
          }
          
          // Update the state with the new items (without images first)
          setItemsData(newItems);
          
          // If image URLs are provided, load them in small batches with delays
          const itemsWithValidURLs = newItems
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => 
              item.imageURL && 
              typeof item.imageURL === 'string' && 
              item.imageURL.trim() !== ''
            );
          
          if (itemsWithValidURLs.length > 0) {
            setIsLoadingImages(true);
            setLoadingProgress(0);
            
            const itemsWithImages = [...newItems];
            let loadedCount = 0;
            let successCount = 0;
            let failedCount = 0;
            let retryableItems = [];
            
            console.log(`Found ${itemsWithValidURLs.length} image URLs to process`);
            
            // Smaller batch size for better reliability
            const batchSize = 3;
            const totalBatches = Math.ceil(itemsWithValidURLs.length / batchSize);
            
            for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
              const startIdx = batchIndex * batchSize;
              const endIdx = Math.min(startIdx + batchSize, itemsWithValidURLs.length);
              const currentBatch = itemsWithValidURLs.slice(startIdx, endIdx);
              
              console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (${currentBatch.length} images)`);
              
              // Process images in the batch one by one with a delay between each
              for (const { item, index } of currentBatch) {
                try {
                  console.log(`Loading image ${loadedCount + 1}/${itemsWithValidURLs.length}: ${item.imageURL}`);
                  
                  // Set status to loading
                  itemsWithImages[index].loadStatus = 'loading';
                  setItemsData([...itemsWithImages]);
                  
                  // Try to load the image with extended timeout
                  const imageData = await loadImageFromUrl(item.imageURL, 30000); // 30 second timeout
                  
                  if (imageData) {
                    itemsWithImages[index].image = imageData;
                    itemsWithImages[index].loadStatus = 'success';
                    successCount++;
                    console.log(`Successfully loaded image: ${item.name}`);
                  } else {
                    itemsWithImages[index].loadStatus = 'failed';
                    failedCount++;
                    retryableItems.push({ item, index });
                    console.log(`Failed to load image: ${item.name}`);
                  }
                } catch (error) {
                  console.error(`Error loading image for ${item.name}:`, error);
                  itemsWithImages[index].loadStatus = 'failed';
                  failedCount++;
                  retryableItems.push({ item, index });
                }
                
                loadedCount++;
                setLoadingProgress(Math.floor((loadedCount / itemsWithValidURLs.length) * 100));
                
                // Update the state with loaded image
                setItemsData([...itemsWithImages]);
                
                // Add a delay between individual image loads (500ms)
                if (loadedCount < itemsWithValidURLs.length) {
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
              }
              
              // Add a larger delay between batches (1 second)
              if (batchIndex < totalBatches - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
            
            // Try one more time for all failed items using alternative methods
            if (retryableItems.length > 0) {
              console.log(`Retrying ${retryableItems.length} failed images with alternative methods...`);
              
              for (let i = 0; i < retryableItems.length; i++) {
                const { item, index } = retryableItems[i];
                
                try {
                  console.log(`Retry attempt for ${item.name}: ${item.imageURL}`);
                  itemsWithImages[index].loadStatus = 'retrying';
                  setItemsData([...itemsWithImages]);
                  
                  // Try loading with a different method specifically for retries
                  const imageData = await loadImageFromUrlBackupMethod(item.imageURL);
                  
                  if (imageData) {
                    itemsWithImages[index].image = imageData;
                    itemsWithImages[index].loadStatus = 'success';
                    successCount++;
                    failedCount--;
                    console.log(`Retry successful for: ${item.name}`);
                  } else {
                    itemsWithImages[index].loadStatus = 'failed';
                    console.log(`Retry failed for: ${item.name}`);
                  }
                } catch (error) {
                  console.error(`Retry error for ${item.name}:`, error);
                  itemsWithImages[index].loadStatus = 'failed';
                }
                
                setItemsData([...itemsWithImages]);
                
                // Add a delay between retries
                if (i < retryableItems.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 700));
                }
              }
            }
            
            // Final update
            setItemsData(itemsWithImages);
            setIsLoadingImages(false);
            
            alert(`Import complete! Successfully loaded ${successCount} out of ${itemsWithValidURLs.length} images. ${failedCount} images failed to load.`);
          } else {
            alert(`Successfully imported ${newItems.length} items from CSV! No image URLs found to load.`);
          }
        },
        error: (error) => {
          console.error("CSV Parse Error:", error);
          alert("Error parsing CSV file. Please check the format and try again.");
        }
      });
    };
    reader.readAsText(file);
  };

  const downloadSingleImage = (item, index, callback) => {
    // Create a canvas to combine the image with background and text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set standard canvas dimensions - now without text area
    const canvasWidth = 800;
    const canvasHeight = 800;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Load the item image
    const img = new Image();
    img.onload = () => {
      // Draw background if it's not disabled
      if (!globalDisableBackground && !item.disableBackground) {
        const background = backgrounds[item.background];
        
        // If there's a background image
        if (background.backgroundImage) {
          const bgImg = new Image();
          bgImg.onload = () => {
            // Fill the canvas with the background image
            ctx.drawImage(bgImg, 0, 0, canvasWidth, canvasHeight);
            
            // Calculate dimensions to center the item image on the background
            // Use the item's imageScale property for scaling
            const scale = Math.min(
              (canvasWidth * (item.imageScale / 100)) / img.width, 
              canvasHeight * (item.imageScale / 100) / img.height
            );
            
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const x = (canvasWidth - scaledWidth) / 2;
            const y = (canvasHeight - scaledHeight) / 2;
            
            // Draw the centered, scaled item image
            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
            
            // Download the canvas as an image
            finishDownload();
          };
          bgImg.src = background.backgroundImage;
        } else {
          // Fill with background color
          ctx.fillStyle = background.color;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          
          // Calculate dimensions to center the item image on the background
          // Use the item's imageScale property for scaling
          const scale = Math.min(
            (canvasWidth * (item.imageScale / 100)) / img.width, 
            canvasHeight * (item.imageScale / 100) / img.height
          );
          
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (canvasWidth - scaledWidth) / 2;
          const y = (canvasHeight - scaledHeight) / 2;
          
          // Draw the centered, scaled item image
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          
          // Download the canvas as an image
          finishDownload();
        }
      } else {
        // No background - fill with transparent/white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Calculate dimensions to center the item image
        // Use the item's imageScale property for scaling
        const scale = Math.min(
          (canvasWidth * (item.imageScale / 100)) / img.width, 
          canvasHeight * (item.imageScale / 100) / img.height
        );
        
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = (canvasWidth - scaledWidth) / 2;
        const y = (canvasHeight - scaledHeight) / 2;
        
        // Draw the centered, scaled item image
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        // Download the canvas as an image
        finishDownload();
      }
    };
    img.src = item.image;
    
    function finishDownload() {
      if (callback) {
        canvas.toBlob((blob) => {
          callback(blob);
        }, 'image/png');
      } else {
        const link = document.createElement('a');
        link.download = `${item.name.replace(/\s+/g, '_')}_${index}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }
  };

  const downloadAllImages = async () => {
    const zip = new JSZip();

    const imagePromises = itemsData.map((item, index) => {
      if (item.image) {
        return new Promise((resolve) => {
          downloadSingleImage(item, index, (blob) => {
            zip.file(`${item.name.replace(/\s+/g, '_')}_${index}.png`, blob);
            resolve();
          });
        });
      }
      return Promise.resolve();
    });

    await Promise.all(imagePromises);

    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, 'images.zip');
    });
  };

  const downloadResult = () => {
    if (selectedItem && pulledBackground) {
      downloadSingleImage(selectedItem, 'result');
    }
  };

  // Export current items as CSV
  const exportItemsAsCSV = () => {
    const csvData = itemsData.map(item => ({
      Name: item.name,
      ImageURL: item.imageURL || '',
      Price: item.price,
      Background: item.background,
      DisableBackground: item.disableBackground ? 'Yes' : 'No',
      ImageScale: item.imageScale
    }));
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'pull_box_items.csv');
  };

  return (
    <div className="flex flex-col p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Pull Box Rarity Background Generator</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Rarity Tiers</h2>
        <div className="flex justify-between items-center mb-4">
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(backgrounds).map(([tier, background]) => (
              <div key={tier} className="flex flex-col items-center">
                <div className="relative">
                  <div 
                    className="w-16 h-16 rounded-md mb-1 overflow-hidden" 
                    style={{ 
                      backgroundColor: background.color,
                      backgroundImage: background.backgroundImage ? `url(${background.backgroundImage})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  ></div>
                  <input
                    type="file"
                    accept="image/*"
                    id={`bg-upload-${tier}`}
                    onChange={(e) => handleBackgroundImageUpload(e, tier)}
                    className="hidden"
                  />
                  <label
                    htmlFor={`bg-upload-${tier}`}
                    className="absolute bottom-1 right-0 bg-blue-500 text-white p-1 rounded-full cursor-pointer text-xs"
                    title="Upload background image"
                  >
                    <Camera size={12} />
                  </label>
                </div>
                <span className="text-sm font-medium capitalize">{tier}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="globalDisableBackground"
              checked={globalDisableBackground}
              onChange={() => setGlobalDisableBackground(!globalDisableBackground)}
              className="mr-2"
            />
            <label htmlFor="globalDisableBackground" className="text-sm font-medium">
              Globally Disable Backgrounds
            </label>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Items in Pull Box</h2>
          <div className="flex space-x-2">
            <button 
              onClick={addItem} 
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Item
            </button>
            
            <div className="flex space-x-2">
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  id="csv-upload"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
                <label
                  htmlFor="csv-upload"
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer flex items-center"
                >
                  <Upload size={16} className="mr-1" /> Import CSV
                </label>
              </div>
              
              <button
                onClick={downloadCSVTemplate}
                className="px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 flex items-center"
              >
                <FileDown size={16} className="mr-1" /> Template
              </button>
              
              <button
                onClick={exportItemsAsCSV}
                className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 flex items-center"
              >
                <Download size={16} className="mr-1" /> Export CSV
              </button>
            </div>
            
            <div className="px-3 py-1 bg-purple-500 text-white rounded flex items-center">
              <div className="mr-2">
                <input
                  type="checkbox"
                  id="bg-removal-toggle"
                  checked={bgRemovalEnabled}
                  onChange={() => setBgRemovalEnabled(!bgRemovalEnabled)}
                  className="mr-1"
                />
                <label htmlFor="bg-removal-toggle" className="text-xs">
                  Background Removal
                </label>
              </div>
              {bgRemovalEnabled && (
                <div className="flex items-center">
                  <label htmlFor="sensitivity-slider" className="text-xs mr-1">
                    Sensitivity:
                  </label>
                  <input
                    type="range"
                    id="sensitivity-slider"
                    min="5"
                    max="50"
                    value={bgRemovalSensitivity}
                    onChange={(e) => setBgRemovalSensitivity(parseInt(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-xs ml-1">{bgRemovalSensitivity}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {isLoadingImages && (
          <div className="mb-4 bg-blue-100 p-3 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Loading images from URLs...</span>
              <span className="text-sm">{loadingProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <div className="mb-4 max-h-64 overflow-y-auto border rounded p-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Background</th>
                <th className="p-2 text-left">Price</th>
                <th className="p-2 text-left">Image</th>
                <th className="p-2 text-left">Scale %</th>
                <th className="p-2 text-left">Background</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {itemsData.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      onBlur={handleBlur}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="p-2">
                    <select 
                      value={item.background}
                      onChange={(e) => handleItemChange(index, 'background', e.target.value)}
                      onBlur={handleBlur}
                      className="w-full p-1 border rounded"
                    >
                      <option value="legendary">Legendary</option>
                      <option value="exceedinglyRare">Exceedingly Rare</option>
                      <option value="rare">Rare</option>
                      <option value="uncommon">Uncommon</option>
                      <option value="common">Common</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      onBlur={handleBlur}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center">
                      <input
                        type="file"
                        accept="image/*"
                        id={`image-upload-${index}`}
                        onChange={(e) => handleItemImageUpload(e, index)}
                        className="hidden"
                      />
                      <label
                        htmlFor={`image-upload-${index}`}
                        className="inline-block mr-2 cursor-pointer"
                      >
                        <div className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                          <Camera size={16} />
                        </div>
                      </label>
                      {item.image && (
                        <div className="w-12 h-12 rounded overflow-hidden relative flex items-center justify-center" 
                             style={{ 
                               backgroundColor: (!globalDisableBackground && !item.disableBackground) ? backgrounds[item.background].color : 'transparent',
                               backgroundImage: (!globalDisableBackground && !item.disableBackground && backgrounds[item.background].backgroundImage) ? 
                                 `url(${backgrounds[item.background].backgroundImage})` : 'none',
                               backgroundSize: 'cover',
                               backgroundPosition: 'center'
                             }}>
                          <img 
                            src={item.image} 
                            alt={`${item.name} thumbnail`}
                            className="max-w-full max-h-full object-contain"
                            style={{ maxWidth: `${item.imageScale}%`, maxHeight: `${item.imageScale}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={item.imageScale}
                      onChange={(e) => handleItemChange(index, 'imageScale', e.target.value)}
                      onBlur={handleBlur}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={item.disableBackground}
                        onChange={() => toggleDisableBackground(index)}
                        id={`disable-bg-${index}`}
                      />
                      <label htmlFor={`disable-bg-${index}`} className="ml-1 text-xs">
                        Disable
                      </label>
                    </div>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => removeItem(index)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-6 flex space-x-4">
        <button 
          onClick={pullRandomItem} 
          disabled={!validateAtLeastOneImage()}
          className={`px-4 py-2 rounded font-semibold ${
            validateAtLeastOneImage() 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Pull Random Item
        </button>
        
        <button 
          onClick={downloadAllImages} 
          disabled={!hasImagesToDownload()}
          className={`px-4 py-2 rounded font-semibold ${
            hasImagesToDownload() 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Download All Images
        </button>
        
        {selectedItem && pulledBackground && (
          <button 
            onClick={() => downloadResult()}
            className="px-4 py-2 rounded font-semibold bg-purple-500 text-white hover:bg-purple-600"
          >
            Download Result
          </button>
        )}
        
        {!validateAtLeastOneImage() && (
          <p className="text-sm text-red-500 mt-1">
            Please upload at least one image for an item
          </p>
        )}
      </div>

      {selectedItem && pulledBackground && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Result: {selectedItem.name}</h2>
          <div className="border rounded p-4 flex justify-center">
            <div 
              className="relative max-w-md overflow-hidden"
              style={{ 
                backgroundColor: (!globalDisableBackground && !selectedItem.disableBackground) ? pulledBackground.color : 'transparent',
                backgroundImage: (!globalDisableBackground && !selectedItem.disableBackground && pulledBackground.backgroundImage) ? 
                  `url(${pulledBackground.backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {selectedItem.image && (
                <div className="relative w-full h-64 flex items-center justify-center">
                  <img 
                    src={selectedItem.image} 
                    alt={`${selectedItem.name}`} 
                    className="max-w-full max-h-full object-contain"
                    style={{ maxWidth: `${selectedItem.imageScale}%`, maxHeight: `${selectedItem.imageScale}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-blue-50 p-4 rounded mb-6">
        <h3 className="text-lg font-semibold mb-2">CSV Import Instructions</h3>
        <p className="mb-2">The CSV should contain the following columns:</p>
        <ul className="list-disc pl-5 mb-3">
          <li><strong>Name:</strong> The name of your item</li>
          <li><strong>ImageURL:</strong> A URL to the image (optional)</li>
          <li><strong>Price:</strong> The price/value of the item</li>
        </ul>
        <p className="mb-2">When importing CSV data:</p>
        <ul className="list-disc pl-5">
          <li>Background tier is automatically determined based on price percentage</li>
          <li>Items with higher price values will get rarer backgrounds</li>
          <li>You can download a template CSV to see the correct format</li>
          <li>For best results with image URLs, use direct image links</li>
        </ul>
      </div>
    </div>
  );
};

export default RarityBackgroundGenerator;