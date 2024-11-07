const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Handle Multer errors
    return res.status(400).json({ message: err.message, f: "f" });
  } else if (err) {
    // Handle other errors
    return res.status(400).json({ message: err.message, e: "e" });
  }
  next();
};

export default errorHandler;
