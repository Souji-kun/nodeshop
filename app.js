const express = require('express');
const app = express();
const cors = require('cors')
const path = require('path');


const items = require('./routes/item');
const users = require('./routes/user');
const orders = require('./routes/order');
const dashboard = require('./routes/dashboard')

// app.get('/', (req, res) => {
//     res.send('Hello from nodejs!')
// })
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, 'images')))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

app.use('/api/v1', items);
app.use('/api/v1', users);
app.use('/api/v1', orders);
app.use('/api/v1', dashboard);

app.use((error, req, res, next) => {
    if (error) {
        return res.status(error.status || 500).json({
            error: error.message || 'Internal server error'
        });
    }

    next();
});

module.exports = app
