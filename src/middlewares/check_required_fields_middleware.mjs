const checkRequiredFieldsMiddleware =
  (requiredFields, optionalFields) => (req, res, next) => {
    const missingFields = requiredFields.filter(
      (field) => !(field in req.body || field in req.query)
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        data: {},
        message: `Missing the required fields: ${missingFields.join(", ")}`,
      });
    }

    if (optionalFields) {
      const missingOptionalFields = optionalFields.filter(
        (field) => !(field in req.body)
      );

      if (missingOptionalFields.length == optionalFields.length) {
        return res.status(400).json({
          success: false,
          data: {},
          message: `Missing atleast one of the fields: ${missingOptionalFields.join(
            ", "
          )}`,
        });
      }
    }

    next();
  };

export default checkRequiredFieldsMiddleware;
