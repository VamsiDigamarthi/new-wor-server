export const ensureDeveloperRole = (req, res, next) => {
  const { user } = req;
  if (user.role !== "developer") {
    return res.status(403).json({
      message: "You can't access this feature because you are not a Developer.",
    });
  }
  // If user role is captain, call next() to pass control to the next middleware or route handler
  next();
};
