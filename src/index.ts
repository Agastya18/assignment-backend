import express from 'express';
import bodyParser from 'body-parser';
import contactRoute from './routes/contactRoute';
const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 8000;

app.use('/',contactRoute);



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});