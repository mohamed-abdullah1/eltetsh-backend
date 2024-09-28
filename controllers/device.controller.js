const asyncHandler = require("express-async-handler");
const Device = require("../models/device.model");
const responseObject = require("../helpers/response.helper");
//@desc     add a device
//@route    POST /api/devices/create
//@access   Private ADMIN
const addDevice = asyncHandler(async (req, res) => {
  const { code, singlePrice, multiPrice } = req.body;
  //check all required fields
  if (!code || !singlePrice || !multiPrice) {
    res.status(400);
    throw new Error("Please complete all fields");
  }

  //add new device
  const newDevice = await Device.create({
    code,
    singlePrice,
    multiPrice,
  });
  //respond
  res.status(201).json(
    responseObject(true, "Device Created Successfully", {
      ...newDevice?._doc,
    })
  );
});

//@desc     Get all devices
//@route    POST /api/device/all
//@access   ADMIN , MANAGER
const getAllDevices = asyncHandler(async (req, res) => {
  const { filterByDepartment, filterByYear, filterByDay } = req.query;

  const { skip, limit } = req.pagination;
  //filter by date

  let query = {};

  // Check if there are search parameters in the query
  if (req.query.search !== undefined) {
    // If search query is not empty, modify the query object to include search criteria
    if (req.query.search !== "") {
      query = { $or: [{ code: { $regex: req.query.search, $options: "i" } }] };
    }
    // Otherwise, return all items without applying any search criteria
  }
  const filterObj =
    filterByDepartment && filterByYear
      ? { department: filterByDepartment, year: filterByYear }
      : filterByDepartment
      ? { department: filterByDepartment }
      : filterByYear
      ? { year: filterByYear }
      : {};
  const devices = await Device.find({ ...filterObj, ...query })
    .sort({ createdAt: -1 })
    // .populate("department")
    .skip(skip)
    .limit(limit);
  res.status(200).json(
    responseObject(true, "success", {
      count: devices.length,
      result: devices,
    })
  );
});
//@desc     Get one devices
//@route    POST /api/device/:id
//@access   ADMIN , MANAGER
const getDeviceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const device = await Device.findOne({
    _id: id,
  });

  res.status(200).json(responseObject(true, "success", device));
});

//@desc     Delete one device
//@route    DELETE /api/device/:id
//@access   ADMIN , MANAGER
const deleteDevice = asyncHandler(async (req, res) => {
  console.log(req.user.role);
  const deviceId = req.params.id;
  //check if the device exist or not
  const device = await Device.findOne({ _id: deviceId });
  const deviceExists = !!device;
  if (!deviceExists) {
    res.status(400);
    throw new Error("this device doesn't exist");
  }

  await Device.deleteOne({ _id: deviceId });
  res.status(200).json(
    responseObject(true, "Device Deleted Successfully", {
      deletedDevice: device,
    })
  );
});

//@desc     update one device
//@route    PUT /api/device/:id
//@access   ADMIN , MANAGER
const updateDevice = asyncHandler(async (req, res) => {
  const deviceId = req.params.id;
  const updateFields = req.body;

  // Update the device in the database
  const updatedDevice = await Device.findByIdAndUpdate(
    deviceId,
    {
      ...updateFields,
    },
    {
      new: true,
      runValidators: true,
    }
  ); // Set runValidators to true to run validation on update
  res
    .status(200)
    .json({ message: "updated successfully", data: updatedDevice });
});
module.exports = {
  addDevice,
  getAllDevices,
  getDeviceById,
  deleteDevice,
  updateDevice,
};
