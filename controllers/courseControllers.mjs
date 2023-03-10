import authService from '../services/authService.mjs'
import categoryService from '../services/categoryService.mjs'
import courseService from '../services/courseServices.mjs'

const createCourse = (req, res) => {
  const course = {
    name: req.body.name,
    description: req.body.description,
    category: req.body.category,
    user: req.session.userID
  }
  courseService.insert(course)
    .then(course => {
      if (!course) {
        return res.status(500).json({
          type: 'error',
          message: 'Not created course'
        })
      }
      req.flash('success', `${course.name} course has been created succesfully...`)
      res.status(200).redirect('/courses')
    })
    .catch(err => {
      req.flash('error', `${course.name} course not created, something wrong... is error : ${err}`)
      res.status(500).redirect('/courses')
    })
}

const getAllCourse = (req, res) => {
  const categorySlug = req.query.categories
  const search = req.query.search

  const filter = {}

  const fetchCategories = () => categoryService.list()
  const fetchCourse = () => courseService.listByQuery(filter).populate('user')

  let fecthData

  if (categorySlug) {
    fecthData = categoryService.findWhere({ slug: categorySlug }).then(returnedCat => {
      filter.category = returnedCat._id
      return Promise.all([fetchCategories(), fetchCourse()])
    })
  } else if (search) {
    filter.name = search
    fecthData = Promise.all([fetchCategories(), fetchCourse()])
  } else if (!categorySlug && !search) {
    filter.name = '',
    filter.category = null
    fecthData = Promise.all([fetchCategories(), fetchCourse()])
  }

  fecthData
    .then(([categories, courses]) => {
      res.status(200).render('courses', {
        page_name: 'courses',
        categories,
        courses
      })
    })
    .catch(err => {
      res.status(500).json({ type: 'error', message: err })
    })
}

const getCourse = (req, res) => {
  Promise.all([
    authService.findWhere({ _id: req.session.userID }),
    categoryService.list(),
    courseService.findWhere({ slug: req.params.slug }).populate('user')
  ])
    .then(([sessionUser, categories, course]) => {
      if (!course) {
        return res.status(404).json({
          type: 'error',
          message: 'not found course'
        })
      }
      res.status(200).render('course', {
        page_name: 'courses',
        sessionUser,
        course,
        categories
      })
    })
    .catch(err => {
      res.status(500).json({
        type: 'error',
        message: err
      })
    })
}

const enrollCourse = (req, res) => {
  authService.findWhere({ _id: req.session.userID })
    .then(user => {
      user.courses.push({ _id: req.body.courseID })
      return authService.updateWhere(req.session.userID, user)
    }).then(() => {
      res.status(200).redirect('/users/dashboard')
    })
    .catch((err) => {
      res.status(500).json({ type: 'error', message: err })
    })
}

const releaseCourse = (req, res) => {
  authService.findWhere({ _id: req.session.userID })
    .then(user => {
      user.courses.pull({ _id: req.body.courseID })
      return authService.updateWhere(req.session.userID, user)
    }).then(() => {
      res.status(200).redirect('/users/dashboard')
    })
    .catch((err) => {
      res.status(500).json({ type: 'error', message: err })
    })
}

const deleteCourse = (req, res) => {
  courseService.deleteWhere({ slug: req.params.slug })
    .then(deletedCourse => {
      req.flash('error', `${deletedCourse.name} has been removed successfully`)
      res.status(200).redirect('/users/dashboard')
    })
    .catch(err => {
      res.status(500).json({ type: 'error', message: err })
    })
}

export default {
  createCourse,
  getAllCourse,
  getCourse,
  enrollCourse,
  releaseCourse,
  deleteCourse
}
