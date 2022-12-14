const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');

const { verifyToken, apiLimiter } = require('./middlewares');
const { Domain, Book, Category } = require('../models');

const router = express.Router();

router.use(async (req, res, next) => {
  const domain = await Domain.findOne({
    where: { host: url.parse(req.get('origin')).host },
  });
  if (domain) {
    cors({
      origin: req.get('origin'),
      credentials: true,
    })(req, res, next);
  } else {
    next();
  }
});

router.post('/token', apiLimiter, async (req, res) => {
  const { clientSecret } = req.body;
  try {
    const domain = await Domain.findOne({
      where: { clientSecret },
    });
    if (!domain) {
      return res.status(401).json({
        code: 401,
        message: '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요',
      });
    }
    const token = jwt.sign({
      id: Domain.host,
    }, process.env.JWT_SECRET, {
      expiresIn: '30m', // 30분
      issuer: 'hsbooks',
    });
    return res.json({
      code: 200,
      message: '토큰이 발급되었습니다',
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});

router.get('/test', verifyToken, apiLimiter, (req, res) => {
  res.json(req.decoded);
});

router.get('/books', apiLimiter, verifyToken, (req, res) => {
  Book.findAll()
    .then((books) => {
      console.log(books);
      res.json({
        code: 200,
        payload: books,
      });
    })
    .catch((error) => {
      console.error(error);
      return res.status(500).json({
        code: 500,
        message: '서버 에러',
      });
    });
});

router.get('/categories', apiLimiter, verifyToken, (req, res) => {
  Category.findAll()
    .then((categories) => {
      console.log(categories);
      res.json({
        code: 200,
        payload: categories,
      });
    })
    .catch((error) => {
      console.error(error);
      return res.status(500).json({
        code: 500,
        message: '서버 에러',
      });
    });
});

// router.get('/books/:category', verifyToken, apiLimiter, async (req, res) => {
//   try {
//     const category = await Category.findOne({ where: { id: req.params.category } });
//     if (!category) {
//       return res.status(404).json({
//         code: 404,
//         message: '검색 결과가 없습니다',
//       });
//     }
//     const books = await Book.findAll({ where: { category: category.id } });
//     return res.json({
//       code: 200,
//       payload: books,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       code: 500,
//       message: '서버 에러',
//     });
//   }
// });

module.exports = router;