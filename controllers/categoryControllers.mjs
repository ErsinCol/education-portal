import CategoryService from '../services/categoryService.mjs'

const createCategory = (req, res) => {
  CategoryService.insert(req.body)
    .then(category => {
      res.status(201).json({
        type: 'success',
        category
      })
    })
    .catch(err => {
      res.status(500).json({
        type: 'error',
        message: err
      })
    })
}

export default {
  createCategory
}
