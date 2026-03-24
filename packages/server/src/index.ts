/** Server entry point. */
import express from 'express';

const app = express();
const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
