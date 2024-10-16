const asyncHandler = require("express-async-handler");
const Appointment = require("../models/appointment.model");
const responseObject = require("../helpers/response.helper");

const Device = require("../models/device.model");
const calcTotalHours = require("../helpers/calculateTotalHours.helper");
//@desc     book a appointment
//@route    POST /api/appointment/book
//@access   Public
const bookAppointment = asyncHandler(async (req, res) => {
  const { deviceId, clientId, type, startTime, endTime, singleOrMulti } =
    req.body;
  //      "endTime":"2024-09-28T17:21:19.921Z",

  //type can be 'start-end' || 'open'
  if (type === "start-end") {
    if (!endTime) {
      res.status(400);
      throw new Error("Please include the end time also");
    }
  }
  //check all required fields
  if (!deviceId || !clientId || !startTime || !type || !singleOrMulti) {
    res.status(400);
    throw new Error("Please complete all fields");
  }

  //check if the device is available
  const device = await Device.findById(deviceId);
  console.log("🔥✨ ", { device });

  if (device.status !== "available") {
    res.status(400);
    throw new Error("Device is not available");
  }
  //if type == 'start-end' calcTotalPrice

  const insertedData =
    type === "start-end"
      ? {
          deviceId,
          clientId,
          startTime,
          endTime,
          type,
          totalPrice:
            calcTotalHours(startTime, endTime) *
            (singleOrMulti == "single"
              ? device.singlePrice
              : device.multiPrice),
          singleOrMulti,
        }
      : {
          deviceId,
          clientId,
          startTime,
          type,
          singleOrMulti,
        };
  //add new appointment
  const newAppointment = await Appointment.create(insertedData);
  //make the device unavailable
  await Device.findByIdAndUpdate(deviceId, {
    status: "busy",
  });
  //respond
  res.status(201).json(
    responseObject(true, "Appointment Booked Successfully", {
      ...newAppointment?._doc,
    })
  );
});

//@desc     end appointment
//@route    PUT /api/appointment/:id/endTime
//@access   ADMIN , MANAGER
const endAppointment = asyncHandler(async (req, res) => {
  //end Time and calc totalPrice
  const appointmentId = req.params.id;
  const { endTime } = req.body;
  const appointment = await Appointment.findOne({ _id: appointmentId });
  const device = await Appointment.findOne({ _id: appointment.deviceId });
  // Update the appointment in the database
  const updatedAppointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    {
      endTime,
      totalPrice:
        calcTotalHours(appointment.startTime, endTime) *
        (singleOrMulti == "single" ? device.singlePrice : device.multiPrice),
    },
    {
      new: true,
      runValidators: true,
    }
  ); // Set runValidators to true to run validation on update
  res
    .status(200)
    .json({ message: "updated successfully", data: updatedAppointment });
});

//@desc     Get all appointments
//@route    POST /api/appointment/all
//@access   ADMIN , MANAGER
const getAllAppointments = asyncHandler(async (req, res) => {
  // const { filterByDepartment, filterByYear, filterByDay } = req.query;

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
  // const filterObj =
  //   filterByDepartment && filterByYear
  //     ? { department: filterByDepartment, year: filterByYear }
  //     : filterByDepartment
  //     ? { department: filterByDepartment }
  //     : filterByYear
  //     ? { year: filterByYear }
  //     : {};
  const appointments = await Appointment.find({
    // ...filterObj
    // ,
    ...query,
  })
    .sort({ createdAt: -1 })
    .populate(["deviceId", "clientId"])
    .skip(skip)
    .limit(limit);
  res.status(200).json(
    responseObject(true, "success", {
      count: appointments.length,
      result: appointments,
    })
  );
});
//@desc     Get one appointments
//@route    POST /api/appointment/:id
//@access   ADMIN , MANAGER
const getAppointmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const appointment = await Appointment.findOne({
    _id: id,
  });

  res.status(200).json(responseObject(true, "success", appointment));
});

//@desc     Delete one course
//@route    DELETE /api/appointment/:id
//@access   ADMIN , MANAGER
const deleteAppointment = asyncHandler(async (req, res) => {
  console.log(req.user.role);
  const appointmentId = req.params.id;
  //check if the course exist or not
  const appointment = await Appointment.findOne({ _id: appointmentId });
  const appointmentExists = !!appointment;
  if (!appointmentExists) {
    res.status(400);
    throw new Error("this appointment doesn't exist");
  }

  await Appointment.deleteOne({ _id: appointmentId });
  res.status(200).json(
    responseObject(true, "Appointment Deleted Successfully", {
      deletedAppointment: appointment,
    })
  );
});

module.exports = {
  bookAppointment,
  getAllAppointments,
  getAppointmentById,
  deleteAppointment,
  endAppointment,
};
