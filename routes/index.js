const express = require('express');
const router = express.Router();
const fs = require('fs');
const userModel = require('../models/user');
const resultUtil = require('../utils/result');
const timeUtil = require('../utils/time');
const md5 = require('md5-node');

router.get('/', function (req, res, next) {
  console.log(req.session)
  res.render('layout', {
    pagename: 'blog',
    title: 'Conrad的博客'
  });
});

router.get('/login', function (req, res, next) {
  res.render('layout', {
    pagename: 'login',
    title: '登录'
  });
});

router.get('/register', function (req, res, next) {
  res.render('layout', {
    pagename: 'register',
    title: '注册'
  });
});

router.get('/about', function (req, res, next) {
  res.render('layout', {
    pagename: 'about',
    title: '关于Conrad'
  });
});

/**
 * 执行登录
 */
router.post('/doLogin', function (req, res, next) {
  userModel.find({
    email: req.body.email
  }, (err, data) => {
    if (err) throw err;
    if (data.length !== 0) { // 查询数据库存在邮箱
      if (data.length > 1) { // 如果查询数据库结果有多个
        resultUtil.code = 0;
        resultUtil.msg = "账号异常,请联系管理员";
        res.send(resultUtil);
        return false;
      } else if (data[0].password !== md5(req.body.password)) { // 输入密码不正确
        resultUtil.code = 0;
        resultUtil.msg = "密码错误";
        res.send(resultUtil);
        return false;
      } else {
        let logInfo = '';
        let nowTime = timeUtil();
        resultUtil.msg = "登录成功";
        resultUtil.data = {
          isLogin: true
        }
        res.send(resultUtil);
        // 登陆成功 添加到session
        req.session.username = data[0].username;
        console.log(req.session)
        // 添加记录到日志文件 login.log
        logInfo = 'user: ' + data[0].username + ' logged in at ' + nowTime + '\n';
        fs.writeFile('./logs/login.log', logInfo, {
          flag: 'a'
        }, function (err) {
          if (err) throw err;
          console.log('user ' + data[0].username + ' logged in at ' + nowTime);
        });
      }
    } else { // 查询数据库未找到邮箱
      resultUtil.code = 0;
      resultUtil.msg = "邮箱不存在";
      res.send(resultUtil)
    }
  })
})

/**
 * 执行注册
 */
router.post('/doRegister', function (req, res, next) {
  let userData = Object.assign({}, req.body); // 浅克隆前端传过来的数据进行操作
  let logInfo = '';
  userData.createTime = timeUtil(); // 创建时间-当前的时间
  userData.password = md5(userData.password); // 密码进行md5加密
  userModel.create(userData, (err, data) => {
    if (err) throw err;
    resultUtil.msg = "注册成功";
    res.send(resultUtil);
    // 添加记录到日志文件 register.log
    logInfo = 'user: ' + userData.username + ' registered at ' + userData.createTime + '\n';
    fs.writeFile('./logs/register.log', logInfo, {
      flag: 'a'
    }, function (err) {
      if (err) throw err;
      console.log('user ' + userData.username + ' registered at ' + userData.createTime);
    });
  })
})

/**
 * 判断是否注册
 */
router.post('/isUser', function (req, res, next) {
  userModel.find({
    email: req.body.email
  }, (err, data) => {
    if (err) throw err;
    if (data.length === 0) { // 邮箱未注册
      resultUtil.msg = "邮箱未注册,添加数据";
      res.send(resultUtil)
    } else { // 邮箱已被注册
      resultUtil.code = 0;
      resultUtil.msg = "邮箱已被注册";
      res.send(resultUtil)
    }
  })
})

module.exports = router;