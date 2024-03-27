import TokenUtil from "../utility/token_util.mjs";

const checkTokenMiddleware = async (req, res, next) => {
  let token = req.headers["authorization"];

  let errorMessage;
  let tokenObject;

  const isTokenInCorrectForm = TokenUtil.checkTokenStructure(token);

  if (!isTokenInCorrectForm) {
    errorMessage = "Token missing in the Authorization header";
  } else {
    const decoded = TokenUtil.decodeTokenData(token);

    if (decoded) {
      tokenObject = await TokenUtil.getDataFromToken(token);

      if (!tokenObject) {
        errorMessage = "Malformed or unknown token in the header";
      }
    } else {
      errorMessage = "Malformed or unknown token in the header";
    }
  }

  if (errorMessage) {
    return res.status(401).json({
      success: false,
      data: {},
      message: errorMessage,
    });
  }
  next();
};

export default checkTokenMiddleware;
