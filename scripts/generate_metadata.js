const fs = require('fs');
const path = require('path');

// Directory to save metadata files
const outputDir = path.join(__dirname, 'metadata');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Event details
const eventName = "Blockchain Unplugged";
const symbol = "BUPT";
const description = "A ticket for the Blockchain Unplugged event at Genesis Theater.";
const imageBaseUri = "https://images.pexels.com/photos/1749822/pexels-photo-1749822.jpeg"; // Replace with actual image base URI

// Generate metadata for 200 tickets
const totalTickets = 200;
for (let i = 1; i <= totalTickets; i++) {
  const seat = `A${i}`; // Example seat numbering
  const category = i <= 50 ? "VIP" : "General"; // First 50 tickets are VIP

  const metadata = {
    name: `${eventName} - Seat ${seat}`,
    symbol: symbol,
    description: description,
    image: `${imageBaseUri}${seat}.png`,
    attributes: [
      { trait_type: "Seat", value: seat },
      { trait_type: "Category", value: category }
    ],
    properties: {
      files: [
        {
          uri: `${imageBaseUri}${seat}.png`,
          type: "image/png"
        }
      ]
    }
  };

  // Save metadata to file
  const filePath = path.join(outputDir, `${seat}.json`);
  fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
  console.log(`Metadata generated for seat ${seat}: ${filePath}`);
}

console.log("Metadata generation complete.");