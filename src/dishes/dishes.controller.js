const { type } = require("os");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// HELPERS

const bodyHasDishProperty = (req, res, next) => {
  const dish = req.body.data;
  if (dish) {
    return next();
  }
  next({
    status: 400,
    message: "request is missing body",
  });
};

const nameValidation = (req, res, next) => {
  const { name } = req.body.data;
  if (name && name.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a name",
  });
};

const descriptionValidation = (req, res, next) => {
  const { description } = req.body.data;
  if (description && description.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a description",
  });
};

function priceValidation(req, res, next) {
  const { price } = req.body.data;
  if (price && Number.isInteger(price) && price > 0) {
    return next();
  }
  let message = !price
    ? "Dish must include price"
    : "Dish must have a price that is an integer greater than 0";
  next({
    status: 400,
    message,
  });
}

const imageValidation = (req, res, next) => {
  const { image_url } = req.body.data;
  if (image_url && image_url.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a image_url",
  });
};

function dishExist(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

const idMatchDishBody = (req, res, next) => {
  const { id } = req.body.data;
  const { dishId } = req.params;
  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
};

// TODO: Implement the /dishes handlers needed to make the tests pass

// GET /dishes
function list(req, res) {
  res.json({ data: dishes });
}

// POST /dishes
function create(req, res) {
  const data = req.body.data;
  data["id"] = nextId();
  dishes.push(data);
  res.status(201).json({ data });
}

// URL === /dishes/:dishId

//GET /dishes/:dishId
function read(req, res) {
  const dish = res.locals.dish;
  res.json({ data: dish });
}

//PUT /dishes/:dishId
function update(req, res) {
  const data = req.body.data;
  const dish = res.locals.dish;
  const { id } = dish;
  data["id"] = id;
  const dishIndex = dishes.indexOf(dish);
  dishes[dishIndex] = data;
  res.json({ data });
}

module.exports = {
  list,
  create: [
    bodyHasDishProperty,
    nameValidation,
    descriptionValidation,
    imageValidation,
    priceValidation,
    create,
  ],
  read: [dishExist, read],
  update: [
    dishExist,
    bodyHasDishProperty,
    nameValidation,
    descriptionValidation,
    imageValidation,
    priceValidation,
    idMatchDishBody,
    update,
  ],
};
