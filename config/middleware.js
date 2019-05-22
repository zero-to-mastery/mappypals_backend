const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
    const authHeader = req.get('Authorization');

    if (!authHeader) {
        return res.status(401).json({ error: 'Not authenticated.' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;

    try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }

    if (!decodedToken) {
        return res.status(401).json({ error: 'Not authenticated.' });
    }

    req.userId = decodedToken.userId;

    next();
};

module.exports = { isAuthenticated };
