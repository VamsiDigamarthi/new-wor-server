export const ensureUserRole = (req, res, next) => {
  const { user } = req;
  if (user.role !== "user") {
    return res.status(403).json({
      message: "You can't access this feature because you are not a user.",
    });
  }
  // If user role is captain, call next() to pass control to the next middleware or route handler
  next();
};
