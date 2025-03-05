

import React, { useState, useEffect } from 'react';
import { Camera, Upload } from 'lucide-react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const RarityBackgroundGenerator = () => {
  const [itemsData, setItemsData] = useState([
    { name: 'Item 1', rarity: 0.01, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 2', rarity: 0.01, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 3', rarity: 1.99, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 4', rarity: 1.99, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 5', rarity: 5, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 6', rarity: 5, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 7', rarity: 5, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 8', rarity: 5, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 9', rarity: 5, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 10', rarity: 5, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 11', rarity: 10, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 12', rarity: 10, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 13', rarity: 10, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 14', rarity: 10, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 15', rarity: 10, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 16', rarity: 4, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 17', rarity: 4, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 18', rarity: 4, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 19', rarity: 4, image: null, disableBackground: false, imageScale: 80 },
    { name: 'Item 20', rarity: 4, image: null, disableBackground: false, imageScale: 80 },
  ]);

  const [bgRemovalSensitivity, setBgRemovalSensitivity] = useState(15);
  const [bgRemovalEnabled, setBgRemovalEnabled] = useState(true);

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
  
  // Sort items by rarity (lowest to highest) but only when not actively editing
  useEffect(() => {
    if (!isEditing) {
      const sortedItems = [...itemsData].sort((a, b) => a.rarity - b.rarity);
      if (JSON.stringify(sortedItems) !== JSON.stringify(itemsData)) {
        setItemsData(sortedItems);
      }
    }
  }, [itemsData, isEditing]);

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
    newItemsData[index][field] = field === 'rarity' ? parseFloat(value) || 0 : 
                                field === 'imageScale' ? parseInt(value, 10) || 80 : value;
    setItemsData(newItemsData);
  };
  
  // When input field loses focus, we're done editing
  const handleBlur = () => {
    setIsEditing(false);
  };

  const addItem = () => {
    setIsEditing(false); // Ensure sorting happens after adding
    setItemsData([...itemsData, { name: `Item ${itemsData.length + 1}`, rarity: 1, image: null, disableBackground: false, imageScale: 80 }]);
  };

  const removeItem = (index) => {
    setIsEditing(false); // Ensure sorting happens after removing
    const newItemsData = [...itemsData];
    newItemsData.splice(index, 1);
    setItemsData(newItemsData);
  };

  const getRarityTier = (rarity) => {
    if (rarity <= backgrounds.legendary.maxRarity) return 'legendary';
    if (rarity <= backgrounds.exceedinglyRare.maxRarity) return 'exceedinglyRare';
    if (rarity <= backgrounds.rare.maxRarity) return 'rare';
    if (rarity <= backgrounds.uncommon.maxRarity) return 'uncommon';
    return 'common';
  };

  const toggleDisableBackground = (index) => {
    const newItemsData = [...itemsData];
    newItemsData[index].disableBackground = !newItemsData[index].disableBackground;
    setItemsData(newItemsData);
  };

  const pullRandomItem = () => {
    // Validate that percentages sum to 100
    const sum = itemsData.reduce((acc, item) => acc + item.rarity, 0);
    if (Math.abs(sum - 100) > 0.1) {
      alert(`Rarity percentages should sum to 100%. Current sum: ${sum.toFixed(2)}%`);
      return;
    }

    // Random pull logic
    const random = Math.random() * 100;
    let cumulativeProb = 0;
    
    for (const item of itemsData) {
      cumulativeProb += item.rarity;
      if (random <= cumulativeProb) {
        const rarityTier = getRarityTier(item.rarity);
        setSelectedItem(item);
        setPulledBackground(backgrounds[rarityTier]);
        return;
      }
    }
  };
  
  const validateAtLeastOneImage = () => {
    return itemsData.some(item => item.image !== null);
  };

  const validatePercentages = () => {
    const sum = itemsData.reduce((acc, item) => acc + item.rarity, 0);
    return Math.abs(sum - 100) <= 0.1;
  };
  
  const hasImagesToDownload = () => {
    return itemsData.some(item => item.image !== null);
  };
  
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvText = e.target.result;
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            console.log("CSV Parse Result:", result);
            
            // Find the appropriate column headers (case insensitive)
            const nameColumn = result.meta.fields.find(field => 
              field.toLowerCase().includes('item') || field.toLowerCase().includes('name')
            );
            
            const rarityColumn = result.meta.fields.find(field => 
              field.toLowerCase().includes('probability') || field.toLowerCase().includes('rarity')
            );
            
            if (nameColumn && rarityColumn) {
              // Extract and format the data
              const newItems = result.data.map(row => {
                // Parse rarity and convert to percentage if needed
                let rarity = parseFloat(row[rarityColumn]?.replace(/[^0-9.]/g, '')) || 0;
                
                // If the rarity is a small decimal (e.g., 0.003), it's likely a proportion rather than percentage
                if (rarity < 0.1) {
                  rarity = rarity * 100;
                }
                
                return {
                  name: row[nameColumn]?.trim() || "Unnamed Item",
                  rarity,
                  image: null,
                  disableBackground: false,
                  imageScale: 80
                };
              });
              
              // Update the state with the new items
              setItemsData(newItems);
              alert(`Successfully imported ${newItems.length} items from CSV!`);
            } else {
              alert("Could not find required columns in the CSV. Please ensure it contains an 'Item' or 'Name' column and a 'Probability' or 'Rarity' column.");
            }
          },
          error: (error) => {
            console.error("CSV Parse Error:", error);
            alert("Error parsing CSV file. Please check the format and try again.");
          }
        });
      };
      reader.readAsText(file);
    }
  };
  
  const downloadSingleImage = (item, index, callback) => {
    // Create a canvas to combine the image with background and text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set standard canvas dimensions - now without text area
    const canvasWidth = 800;
    const canvasHeight = 800; // No extra space for text banner
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Load the item image
    const img = new Image();
    img.onload = () => {
      // Draw background if it's not disabled
      if (!globalDisableBackground && !item.disableBackground) {
        const rarityTier = getRarityTier(item.rarity);
        const background = backgrounds[rarityTier];
        
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
        
        <div className="mb-2 text-sm text-right">
          Total: {itemsData.reduce((acc, item) => acc + item.rarity, 0).toFixed(2)}%
          {!validatePercentages() && 
            <span className="text-red-500 ml-2">(Should equal 100%)</span>
          }
        </div>
        
        <div className="mb-4 max-h-64 overflow-y-auto border rounded p-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Rarity %</th>
                <th className="p-2 text-left">Background</th>
                <th className="p-2 text-left">Image</th>
                <th className="p-2 text-left">Image Scale %</th>
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
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={item.rarity}
                      onChange={(e) => handleItemChange(index, 'rarity', e.target.value)}
                      onBlur={handleBlur}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center">
                      <div 
                        className="w-6 h-6 rounded mr-1" 
                        style={{ 
                          backgroundColor: backgrounds[getRarityTier(item.rarity)].color,
                          backgroundImage: backgrounds[getRarityTier(item.rarity)].backgroundImage ? 
                            `url(${backgrounds[getRarityTier(item.rarity)].backgroundImage})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      ></div>
                      <span className="capitalize">{getRarityTier(item.rarity)}</span>
                    </div>
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
                               backgroundColor: (!globalDisableBackground && !item.disableBackground) ? backgrounds[getRarityTier(item.rarity)].color : 'transparent',
                               backgroundImage: (!globalDisableBackground && !item.disableBackground && backgrounds[getRarityTier(item.rarity)].backgroundImage) ? 
                                 `url(${backgrounds[getRarityTier(item.rarity)].backgroundImage})` : 'none',
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
          disabled={!validateAtLeastOneImage() || !validatePercentages()}
          className={`px-4 py-2 rounded font-semibold ${
            validateAtLeastOneImage() && validatePercentages() 
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
    </div>
  );
};

export default RarityBackgroundGenerator;