const bcrypt = require("bcryptjs");
const userService = require("../Services/userService");
const auth = require("../Middlewares/auth");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register = async (req, res) => {
  const { name, surname, email, password } = req.body;
  if (!(name && surname && email && password))
    return res
      .status("400")
      .send({ errMessage: "Please fill all required areas!" });

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  req.body.password = hashedPassword;

  await userService.register(req.body, (err, result) => {
    if (err) return res.status(400).send(err);
    return res.status(201).send(result);
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!(email && password))
    return res
      .status(400)
      .send({ errMessage: "Please fill all required areas!" });

  await userService.login(email, (err, result) => {
    if (err) return res.status(400).send(err);

    const hashedPassword = result.password;
    if (!bcrypt.compareSync(password, hashedPassword))
      return res
        .status(400)
        .send({ errMessage: "Your email/password is wrong!" });

    result.token = auth.generateToken(result._id.toString(), result.email);
    result.password = undefined;
    result.__v = undefined;

    return res
      .status(200)
      .send({ message: "User login successful!", user: result });
  });
};

const getUser = async (req, res) => {
  const userId = req.user.id;
  await userService.getUser(userId, (err, result) => {
    if (err) return res.status(404).send(err);

    result.password = undefined;
    result.__v = undefined;

    return res.status(200).send(result);
  });
};

const getUserWithMail = async(req,res) => {
  const {email} = req.body;
  await userService.getUserWithMail(email,(err,result)=>{
    if(err) return res.status(404).send(err);

    const dataTransferObject = {
      name: result.name,
      surname: result.surname,
      color: result.color,
      email : result.email
    };
    return res.status(200).send(dataTransferObject);
  })
}

const googleLogin = async (req, res) => {
  const { token } = req.body;
  if (!token)
    return res.status(400).send({ errMessage: "Token is required!" });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, given_name, family_name } = payload;

    await userService.login(email, async (err, result) => {
      if (err) {
        // User not found, create new user
        const crypto = require('crypto');
        const randomPassword = crypto.randomBytes(12).toString('hex') + "A1!";
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(randomPassword, salt);

        const newUserBody = {
          name: given_name || "User",
          surname: family_name || "Google",
          email: email,
          password: hashedPassword,
        };

        await userService.createGoogleUser(newUserBody, (regErr, regResult) => {
          if (regErr) return res.status(400).send(regErr);
          regResult.token = auth.generateToken(regResult._id.toString(), regResult.email);
          regResult.password = undefined;
          regResult.__v = undefined;
          return res.status(200).send({ message: "Google login successful!", user: regResult });
        });
      } else {
        // User exists, login
        result.token = auth.generateToken(result._id.toString(), result.email);
        result.password = undefined;
        result.__v = undefined;
        return res.status(200).send({ message: "Google login successful!", user: result });
      }
    });

  } catch (error) {
    return res.status(400).send({ errMessage: "Google token verification failed!", error: error.message });
  }
};

module.exports = {
  register,
  login,
  getUser,
  getUserWithMail,
  googleLogin,
};
