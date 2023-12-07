const fs = require("fs");
const natural = require("natural");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const occurances = {};
const pos = {};
const scoreCounts = {};
const shortestDistances = {};
let finalScores = {};

// Reads data from query and parse the index files to gather informtion
const readFromIndex = (queryTerms) => {
  queryTerms.forEach((term) => {
    const fileName = term[0].toLowerCase() + ".txt";
    const filePath = `./inv-index/${fileName}`;

    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      const lines = data.split("\n");

      lines.forEach((line) => {
        const [word, documents] = line.split(": ");

        if (word === term) {
          const documentsList = documents.split("; ");

          occurances[term] = {};
          pos[term] = {};

          documentsList.forEach((doc) => {
            const [path, occ, positions] = doc.split(":");

            occurances[term][path] = +occ;
            pos[term][path] = [];

            positions.split(",").forEach((a) => pos[term][path].push(+a));
          });
        }
      });
    }
  });
};

//calculates score based on occurance
const calculateScoreCounts = (queryTerms) => {
  queryTerms.forEach((term) => {
    Object.keys(occurances[term]).forEach((doc) => {
      if (!scoreCounts[doc]) {
        scoreCounts[doc] = 0;
      }

      scoreCounts[doc] += occurances[term][doc];
    });
  });
};

// measure of proximity for relevance ranking
const calculateShortestDistances = (queryTerms) => {
  for (let i = 0; i < queryTerms.length - 1; i++) {
    const term = queryTerms[i];
    const nextTerm = queryTerms[i + 1];

    Object.keys(pos[term]).forEach((doc) => {
      if (!pos[term][doc] || !pos[nextTerm][doc]) {
      } else {
        for (let i = 0; i < pos[term][doc].length; i++) {
          let localShortest = Infinity;

          for (let j = 0; j < pos[nextTerm][doc].length; j++) {
            const distance = Math.abs(
              pos[term][doc][i] - pos[nextTerm][doc][j]
            );

            localShortest = Math.min(localShortest, distance);
          }

          if (!shortestDistances[doc]) shortestDistances[doc] = localShortest;
          else shortestDistances[doc] = shortestDistances[doc] + localShortest;
        }
      }

      if (
        shortestDistances[doc] != Infinity &&
        shortestDistances[doc] != undefined
      ) {
        shortestDistances[doc] = 1 / shortestDistances[doc];
      } else {
        delete shortestDistances[doc];
      }
    });
  }
};

// combines score and relevance and sorts
const findResults = () => {
  Object.keys(scoreCounts).forEach((doc) => {
    if (scoreCounts[doc] && shortestDistances[doc])
      finalScores[doc] = scoreCounts[doc] + shortestDistances[doc];
  });

  finalScores = Object.entries(finalScores)
    .sort(([, a], [, b]) => b - a)
    .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});

  const sliced = Object.fromEntries(Object.entries(finalScores).slice(0, 10));
  console.log(sliced);
};

readline.question(`What's the query?\n `, (query) => {
  const processedQuery = natural.PorterStemmer.tokenizeAndStem(
    query.toLowerCase()
  );

  console.log(processedQuery);
  readFromIndex(processedQuery);
  calculateScoreCounts(processedQuery);
  calculateShortestDistances(processedQuery);
  findResults();

  readline.close();
});
