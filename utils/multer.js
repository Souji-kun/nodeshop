const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        const baseName = path.parse(file.originalname).name.replace(/\\/g, '/');
        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    }
});

module.exports = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!file || !file.originalname) {
            cb(null, false);
            return;
        }

        const ext = path.extname(file.originalname).toLowerCase();
        if (!ext) {
            cb(null, false);
            return;
        }

        if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
            cb(new Error('Unsupported file type!'), false);
            return;
        }

        cb(null, true);
    }
});
