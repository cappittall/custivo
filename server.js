const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");

app.use(express.json());
app.use(express.static('custivo'));

// Serve the index file at the root endpoint
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "custivo/index.html"));
  });
// 

// Serve the GLTF files at the /gltf endpoint
app.get("/gltf", (req, res) => {
    console.log(req.query);
    const fileName = req.query.file;
    const filePath = path.join(__dirname, `custivo/arjs/resources/${fileName}/${fileName}.glb`);
    if (fs.existsSync(filePath)) {
        console.log(filePath, "file is here")
      res.sendFile(filePath);
    } else {
      res.status(404).send("File not found");
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

