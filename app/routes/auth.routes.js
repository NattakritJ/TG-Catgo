module.exports = function(app) {
  var router = require("express").Router();
  const { verifySignUp, authJwt } = require("../middlewares");
  const authController = require("../controllers/auth.controller");

  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  router.get("/companydetail_ifexist/:taxid", authController.getcompanydetail_ifexist);

  router.post("/checktaxid", authController.checktaxid);

  router.post(
    "/signup",
    [verifySignUp.checkDuplicateUsernameOrEmail],
    authController.signup
  );

  router.get(
      "/verify/:token",
      authController.verifyEmail
  );

  router.post("/signin",
      authController.signIn
  );

  router.get("/forgot/:email",
      authController.generateForgotPwdLink
  );

  router.get("/reset/:token",
      authController.resetPwd
  );

  router.post("/reset",
      authController.resetPwd
  );

  app.use('/apis/auth', router);
};
