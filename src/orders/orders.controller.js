const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

// HELPERS

function validateDeliver(req, res, next) {
  const { deliverTo } = req.body.data;
  if (deliverTo && deliverTo.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a deliverTo",
  });
}

function validateMobileNumber(req, res, next) {
  const { mobileNumber } = req.body.data;
  if (mobileNumber && mobileNumber.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a mobileNumber",
  });
}

function validateDishes(req, res, next) {
  const { dishes } = req.body.data;
  if (dishes && Array.isArray(dishes) && dishes.length > 0) {
    return next();
  }
  const message = dishes
    ? "Order must include a dish"
    : "Order must include at least one dish";
  next({
    status: 400,
    message,
  });
}

function orderExist(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: orderId,
  });
}

function validateDishQuantity(req, res, next) {
  const { dishes } = req.body.data;
  let errorResponse = {};
  dishes.forEach((dish, index) => {
    const { quantity } = dish;
    errorResponse = {
      status: 400,
      message: `Dish ${index} must have a quantity that is an integer greater than 0`,
    };
    if (!quantity) return next(errorResponse);
    if (!Number.isInteger(quantity)) return next(errorResponse);
    if (quantity < 1) return next(errorResponse);
  });
  next();
}

function validateOrderId(req, res, next) {
  const { orderId } = req.params;
  const { id } = req.body.data;
  if (id && orderId !== id) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  next();
}

function validateStatus(req, res, next) {
  const { status = null } = req.body.data;
  if (!status) {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
  if (status.length === 0) {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
  if (status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  if (status === "invalid") {
    return next({
      status: 400,
      message: "A status cannot be invalid",
    });
  }
  next();
}

function validatePending(req, res, next) {
  const { order } = res.locals;
  const { status } = order;
  if (status !== "pending") {
    return next({
      status: 400,
      message: "pending",
    });
  }
  next();
}

// GET /orders
function list(req, res) {
  res.json({ data: orders });
}

function create(req, res, next) {
  const data = req.body.data;
  data["id"] = nextId();
  orders.push(data);
  res.status(201).json({ data });
}

// GET /orders/:orderId
function read(req, res) {
  const order = res.locals.order;
  res.json({ data: order });
}

// PUT /order/:orderId
function update(req, res) {
  const data = req.body.data;
  const foundOrder = res.locals.order;
  const { id } = foundOrder;
  data["id"] = id;
  const orderIndex = orders.indexOf(foundOrder);
  orders[orderIndex] = data;
  res.json({ data: data });
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  const orderIndex = orders.indexOf(foundOrder);
  orders.splice(orderIndex, 1);
  res.status(204).json({ data: foundOrder });
}

module.exports = {
  list,
  create: [
    validateDeliver,
    validateMobileNumber,
    validateDishes,
    validateDishQuantity,
    create,
  ],
  read: [orderExist, read],
  update: [
    orderExist,
    validateDeliver,
    validateMobileNumber,
    validateDishes,
    validateDishQuantity,
    validateOrderId,
    validateStatus,
    update,
  ],
  delete: [orderExist, validatePending, destroy],
};
