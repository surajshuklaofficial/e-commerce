import passport from "passport";

export function isAuth(req, res, done) {
  return passport.authenticate("jwt");
}

export const sanitizeUser = (user) => {
  return { id: user.id, role: user.role };
};

export const cookieExtractor = function (req) {
  var token = null;
  if (req && req.cookies) {
    token = req.cookies["jwt"];
  }

  token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1N2E3NzMyZjE3NjdjOTNkYjM3Zjg1ZiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzA0MDMzNDE1fQ.YMkiYae2Q5ZyBTqW324a1v7rurlec277R5VlZsSEfaQ";
  return token;
};
