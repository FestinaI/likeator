
const
    UserModel = require('../db-utils/user-schema'),
    bcrypt = require('bcryptjs'),
    auth = require('../middleware/auth');

module.exports.userSignUp = async function (req, res) {
    const hashedPassword = bcrypt.hashSync(req.body.password, 8);

    const userInfo = new UserModel({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
    });

    let user = await userInfo.save();
    const token = await auth.createToken(user._id);

    res.status(200).json({
        data : {
            email : user.email,
            token : token
        },
        auth: true
    });

}

module.exports.userLogin = async function (req, res) {
    const email = {
        email : req.body.email
    };

    await findUserByEmail(req, res, email, async function(user) {

        const token = await auth.createToken(user._id);

        res.status(200).json({
            message: "User is found!",
            data : {
                email : user.email,
                token : token
            },
            auth: true
        });
    });
}

module.exports.userUpdatePassword = async function (req, res) {
    const email = {
        email : req.body.email
    };
    const newPassword = req.body.newPassword;

    await findUserByEmail(req, res, email, async function(user) {
        const hashedNewPassword = bcrypt.hashSync(newPassword, 8);

        UserModel.update(
            { "_id": user._id },
            { "$set": { "password": hashedNewPassword } },
            function (err, user) {
                if (err)
                    res.status(500).json({
                        message: err,
                        auth: true
                    });

                res.status(200).json({
                    message: "Password updated!",
                    auth: true
                });
            }
        );
    });
}

findUserByEmail = async function(req, res, email, callback) {
    await UserModel.findOne(email, async function(err, user) {
        if(err)
            return res.status(500).json({
                message: err
            });

        if (user !== null) {
            if (bcrypt.compareSync(req.body.password, user.password)) {

                return callback(user);
            } else {
                res.status(400).json({
                    message: "Password incorrect!"
                });
            }

        } else {
            res.status(400).json({
                message: "Email not found!"
            });
        }
    });
}