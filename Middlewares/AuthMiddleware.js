import "dotenv/config";
import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  let jwtToken;
  const authHeader = req.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    res.status(401).json({ message: "Invalid JWT Token" });
  } else {
    jwt.verify(
      jwtToken,
      process.env.JWT_TOKEN_SECRET,
      async (error, payload) => {
        if (error) {
          res.status(401).json({ message: "Invalid JWT Token" });
        } else {
          req.mobile = payload.mobile;
          next();
        }
      }
    );
  }
};
