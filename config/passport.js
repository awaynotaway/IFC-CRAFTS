console.log(
    "CLIENT ID:",
    process.env.GOOGLE_CLIENT_ID
);

console.log(
    "CLIENT SECRET:",
    process.env.GOOGLE_CLIENT_SECRET
);

console.log(JSON.stringify(process.env.GOOGLE_CLIENT_ID));

const passport =
require("passport");

const GoogleStrategy =
require("passport-google-oauth20").Strategy;

passport.use(
new GoogleStrategy(
{
    clientID:
        process.env.GOOGLE_CLIENT_ID,

    clientSecret:
        process.env.GOOGLE_CLIENT_SECRET,

    callbackURL:
        "/api/auth/google/callback"
},
(
    accessToken,
    refreshToken,
    profile,
    done
) => {

    return done(
        null,
        profile
    );

}
)
);

module.exports =
passport;