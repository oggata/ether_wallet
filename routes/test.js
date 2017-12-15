exports.test = function(req, res){
    if(req.session.passport.user) {
        console.log(req.session.passport.user.id);
    }else{
        console.log("failed get session");
        res.json({
            status:"logout",
            message:"failed get session"
        });
        return;
    }
    console.log("ok");
    res.json({
        status:"ok",
        message:"This is user api"
    });
};
