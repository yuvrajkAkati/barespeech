import express from "express"
const app = express();
app.use(express.json());

app.get("/health", (_, res) => {
  res.send("OK");
});

app.listen(3001, () => {
  console.log("Backend running on port 3001");
  console.log("asd")
});
