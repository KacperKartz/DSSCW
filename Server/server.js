const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;


app.use(express.static(path.join(__dirname, "../Client/dist")));


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../Client/dist", "index.html"));
});

app.get("/blog", (req, res) => {
    res.sendFile(path.join(__dirname, "../Client/dist", "blog.html"));
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
