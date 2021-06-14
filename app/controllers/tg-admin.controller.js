const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const User_detail = db.user_detail;
const Company_detail = db.company_detail;
const Company = db.company;
const Job = db.job;
const Log = db.log;
const Role = db.role;


exports.getAllJob = (req, res) => {
    let options = {
        populate: [{path: 'company', populate: { path: 'company_detail' }}, {path: 'driver', select: 'user_detail', populate: { path: 'user_detail' } }],
        page:req.query.page,
        limit:req.query.limit,
        sort:{ [req.query.sort_by]: [req.query.order] },
    };
    Job.paginate({'status': req.query.status}, options, function (err, result) {
        if (err) {
            res.status(500).send({message: err});
            return;
        }
        res.status(200).send(result)
    });
};

// 2 > 3 notify every ff in company
exports.jobPickUp = (req, res) => {
    Job.findOne({"_id" : req.params.job_id, "status" : 2})
        .populate("driver", '-password')
        .exec((err, job_callback) => {
            if (job_callback === null) {
                res.status(404).send({message: "no job found."});
                return;
            }
            if (err) {
                res.status(500).send({message: err});
                return;
            }
            job_callback.dockNumber = req.body.dockNumber;
            job_callback.pickupTimeHours = req.body.pickupTimeHours;
            job_callback.pickupTimeMinutes = req.body.pickupTimeMinutes;
            job_callback.status = 3;
            job_callback.save((err) => {
                if (err) {
                    res.status(500).send({message: err});
                    return;
                }
                const log = new Log({
                    action: "Select pick up time"
                });
                log.user.push(req.userId);
                log.job.push(job_callback._id);
                log.save(err => {
                    if (err) {
                        res.status(500).send({message: err});
                        return;
                    }
                    Role.findOne({ name: {$in: "freight-forwarder"}},(err, roles) => {
                            if (err) {
                                res.status(500).send({message: err});
                                return;
                            }
                            User.find({ 'tax_id' : job_callback.company[0], 'role' : roles._id }).exec((err,ff_users) => {
                                if (err) {
                                    res.status(500).send({message: err});
                                    return;
                                }
                                ff_users.forEach(function(ff_user,index){
                                    console.log(ff_user);
                                    ff_user.notification += 1;
                                    ff_user.save((err)=>{
                                        if (err) {
                                            res.status(500).send({message: err});
                                            return;
                                        }
                                    });
                                });
                                res.status(200).send({message: "Pick Up Successful"})
                            })
                        }
                    );
                });
            })
        });
}


exports.jobTgadminDetail = (req,res ) => {
    Job.findById({_id :req.params.job_id}).populate("driver", '-password').exec((err, job_callback) => {
        if (err) {
            res.status(500).send({message: err});
            return;
        }

        res.status(200).send(job_callback)
    });
}
//1 > 2 
exports.confirmPayment = (req, res) => {
    Job.findOne({_id: req.params.job_id, status: 1}).exec((err, job_callback) => {
        if (err) {
            res.status(500).send({message: err});
            return;
        }
        job_callback.status = 2;
        job_callback.save(err => {
            if (err) {
                res.status(500).send({message: err});
                return;
            }
            const log = new Log({
                action: "Confirm payment"
            });
            log.user.push(req.userId);
            log.job.push(job_callback._id);
            log.save(err => {
                if (err) {
                    res.status(500).send({message: err});
                    return;
                }
            });
            res.status(200).send({message: "Payment Successful"})
        })
    });
}