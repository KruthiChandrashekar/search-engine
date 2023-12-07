// node --max-old-space-size=4096 inverted-index.js
const fs = require("fs");
const path = require("path");

const inputFolderPath = "./input-transform";
const outputFolderPath = "./inv-index";

// reads the file, splits based on whitespace and generates inverted index structure
const createInvertedIndex = (files) => {
  const invertedIndex = {};

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");
    const words = content.split(/\s+/);
    const relativeFilePath = path.relative(inputFolderPath, file);
    const filename = relativeFilePath.replace(/\..+$/, "");

    words.forEach((word, index) => {
      const firstLetter = word[0]?.toLowerCase();

      if (!invertedIndex[firstLetter]) {
        invertedIndex[firstLetter] = {};
      }

      if (!invertedIndex[firstLetter][word]) {
        invertedIndex[firstLetter][word] = {};
      }

      if (!invertedIndex[firstLetter][word][relativeFilePath]) {
        invertedIndex[firstLetter][word][relativeFilePath] = [];
      }
      invertedIndex[firstLetter][word][relativeFilePath].push(index + 1);
    });
  });

  return invertedIndex;
};

const getTxtFiles = (folderPath) => {
  const files = [];
  const items = fs.readdirSync(folderPath);

  items.forEach((item) => {
    const itemPath = path.join(folderPath, item);
    if (fs.statSync(itemPath).isDirectory()) {
      files.push(...getTxtFiles(itemPath));
    } else if (path.extname(itemPath) === ".txt") {
      files.push(itemPath);
    }
  });

  return files;
};

// letter based index files
const writeIndexFiles = (invertedIndex) => {
  for (let letter in invertedIndex) {
    const filePath = path.join(outputFolderPath, `${letter}.txt`);
    const data = [];

    for (let word in invertedIndex[letter]) {
      const occurrences = invertedIndex[letter][word];
      const occurrenceStrings = [];

      for (let filename in occurrences) {
        const positions = occurrences[filename].join(",");
        occurrenceStrings.push(
          `${filename}:${occurrences[filename].length}:${positions}`
        );
      }

      data.push(`${word}: ${occurrenceStrings.join("; ")}`);
    }

    fs.writeFileSync(filePath, data.join("\n"), "utf8");
  }
};

// To create the output file
const processFiles = () => {
  const txtFiles = getTxtFiles(inputFolderPath);

  const invertedIndex = createInvertedIndex(txtFiles);

  writeIndexFiles(invertedIndex);

  console.log(
    "Position-based inverted index and index files created successfully."
  );
};

processFiles();
