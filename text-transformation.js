const fs = require("fs");
const fsp = require("fs").promises;
const natural = require("natural");
const path = require("path");
const unzipper = require("unzipper");

const inputFolder = "./input-files"; // Replace with the path to your input folder
const outputUnzipFolder = "./input-transform"; // Replace with the path to the folder where unzipped files will be stored
const outputProcessedFolder = "./input-transform"; // Replace with the path to the folder where processed text files will be stored

const processFiles = async (directory) => {
  const files = await fsp.readdir(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const stats = await fsp.stat(filePath);

    if (stats.isDirectory()) {
      await processFiles(filePath); // Calling directories recursively
    } else if (file.endsWith(".zip")) {
      const outputDirectory = path.join(
        outputUnzipFolder,
        path.relative(inputFolder, directory)
      );
      await fsp.mkdir(outputDirectory, { recursive: true });

      await fs
        .createReadStream(filePath)
        .pipe(unzipper.Extract({ path: outputDirectory }))
        .promise();

      // Processing text files
      const textFiles = await fsp.readdir(outputDirectory);
      for (const textFile of textFiles) {
        if (textFile.endsWith(".txt")) {
          const textFilePath = path.join(outputDirectory, textFile);
          const processedText = processTextFile(textFilePath);

          // Saving the processed text to a different location
          const outputProcessedFilePath = path.join(
            outputProcessedFolder,
            path.relative(inputFolder, textFilePath)
          );
          await fsp.mkdir(path.dirname(outputProcessedFilePath), {
            recursive: true,
          });
          await fsp.writeFile(outputProcessedFilePath, processedText);
        }
      }
    }
  }
};

processFiles(inputFolder)
  .then(() => {
    console.log("Processing completed.");
  })
  .catch((error) => {
    console.error("Error:", error);
  });

const processTextFile = (inputFile) => {
  const inputText = fs.readFileSync(inputFile, "utf-8");

  return natural.PorterStemmer.tokenizeAndStem(inputText).join(" ");
};
