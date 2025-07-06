const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors(
    {
        origin: [
                    'http://localhost:3000',                
                    'https://tahwisa.vercel.app'
                ],
        credentials: true
    }
));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Tahwisa backend is running 🚀');
});

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const destinationRoutes = require('./routes/destinationRoutes');
app.use('/api/destinations', destinationRoutes);

const sessionRoutes = require('./routes/sessionRoutes');
app.use('/api/sessions', sessionRoutes);

const inscriptionRoutes = require('./routes/inscriptionRoutes');
app.use('/api/inscriptions', inscriptionRoutes);

const resultatSelectionRoutes = require('./routes/resultatSelectionRoutes');
app.use('/api/resultat-selections', resultatSelectionRoutes);

const periodeRoutes = require('./routes/periodeRoutes');
app.use('/api/periodes', periodeRoutes);

const employeeRoutes = require('./routes/employeeRoutes');
app.use('/api/employees', employeeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
