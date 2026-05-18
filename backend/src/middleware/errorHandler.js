const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'MulterError') {
    const errorMsg = err.code === 'LIMIT_FILE_SIZE'
      ? 'Image size exceeds the 5MB limit. Please upload a smaller image!'
      : `File upload error: ${err.message}`;
    return res.status(400).json({ error: errorMsg });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

module.exports = errorHandler;
