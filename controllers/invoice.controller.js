const asyncHandler = require("express-async-handler");
const Invoice = require("../models/invoice.model");
const responseObject = require("../helpers/response.helper");
const ObjectId = require("mongoose").Types.ObjectId;
const Device = require("../models/device.model");
const calcTotalHours = require("../helpers/calculateTotalHours.helper");
const Appointment = require("../models/appointment.model");

//POST invoice/create
//add one appointment and one drinkFood
//PUT invoice/add-appointment
//add another appointment
//PUT invoice/end-appointment
//end time
//PUT invoice/add-drinkFood
//add new drink
//POST invoice/finish
//end last appointment
//calc total price to pay

//@desc     create a invoice
//@route    POST /api/invoice/create
//@access   Public
const createInvoice = asyncHandler(async (req, res) => {
  const {
    deviceId,
    clientId,
    type,
    startTime,
    endTime,
    singleOrMulti,
    drinkFoodId,
  } = req.body;

  //type can be 'start-end' || 'open'
  if (type === "start-end") {
    if (!endTime) {
      res.status(400);
      throw new Error("Please include the end time also");
    }
  }
  //check all required fields
  if (
    !deviceId ||
    !clientId ||
    !startTime ||
    !type ||
    !singleOrMulti ||
    !drinkFoodId
  ) {
    res.status(400);
    throw new Error("Please complete all fields");
  }

  //check if the device is available
  const device = await Device.findById(deviceId);

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
              ? device?.singlePrice
              : device?.multiPrice),
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
  //add new invoice
  const newInvoice = await Invoice.create({
    appointments: [newAppointment._id],
    drinksFoods: [drinkFoodId],
  });
  const invoice = await Invoice.findOne({ _id: newInvoice._id }).populate([
    "appointments",
    "drinksFoods",
  ]);
  //respond
  res.status(201).json(
    responseObject(true, "Invoice Created Successfully", {
      ...invoice?._doc,
    })
  );
});
//@desc     add a appointment to an invoice
//@route    POST /api/invoice/:invoiceId/add-appointment
//@access   Public
const addAppointment = asyncHandler(async (req, res) => {
  const invoiceId = req.params.invoiceId;
  //check if invoice exists or not
  const invoice = await Invoice.findOne({ _id: invoiceId });
  if (!invoice) {
    res.status(400);
    throw new Error("this invoice doesn't exist");
  }
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
  //update invoice
  const newInvoice = await Invoice.findByIdAndUpdate(
    { _id: invoiceId },
    { appointments: [...invoice.appointments, newAppointment?._doc?._id] },
    { new: true, runValidators: true }
  );
  //respond
  res.status(201).json(
    responseObject(true, "Appointment Booked Successfully", {
      ...newInvoice?._doc,
    })
  );
});
//@desc     add a drink to an invoice
//@route    PUT /api/invoice/:invoiceId/add-drinkFood
//@access   Public
const addDrinkFood = asyncHandler(async (req, res) => {
  const invoiceId = req.params.invoiceId;

  //check if invoice exists or not
  const invoice = await Invoice.findOne({ _id: invoiceId });
  if (!invoice) {
    res.status(400);
    throw new Error("this invoice doesn't exist");
  }
  if (invoice.status === "paid" || invoice.ended) {
    res.status(400);
    throw new Error("this invoice has been ended");
  }
  const { drinkFoodId } = req.body;
  if (!drinkFoodId) {
    res.status(400);
    throw new Error("Please include the drinkFoodId");
  }

  //update invoice
  const newInvoice = await Invoice.findByIdAndUpdate(
    { _id: invoiceId },
    { drinksFoods: [...invoice.drinksFoods, drinkFoodId] },
    { new: true, runValidators: true }
  );
  //respond
  res.status(201).json(
    responseObject(true, "Appointment Booked Successfully", {
      ...newInvoice?._doc,
    })
  );
});

//@desc     end appointment
//@route    PUT /api/invoice/:invoiceId/:appointmentId/endTime
//@access   ADMIN , MANAGER
const endAppointment = asyncHandler(async (req, res) => {
  //end Time and calc totalPrice
  const invoiceId = req.params.invoiceId;
  const appointmentId = req.params.appointmentId;
  const { endTime } = req.body;
  //check if invoice exists
  const invoice = await Invoice.findOne({ _id: invoiceId }).populate(
    "appointments"
  );
  if (!invoice) {
    res.status(400);
    throw new Error("this invoice doesn't exist");
  }
  const appointment = invoice?.appointments?.find((a) =>
    new ObjectId(appointmentId).equals(a._id)
  );

  if (!!appointment?.ended) {
    res.status(400);
    throw new Error("this appointment is already ended");
  }
  const device = await Device.findOne({ _id: appointment.deviceId });
  // Update the appointment in the database
  const _updatedAppointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    {
      ended: true,
      endTime,
      totalPrice:
        calcTotalHours(appointment.startTime, endTime) *
        (appointment.singleOrMulti == "single"
          ? device.singlePrice
          : device.multiPrice),
    },
    {
      new: true,
      runValidators: true,
    }
  ); // Set runValidators to true to run validation on update
  const _updatedDevice = await Device.findOneAndUpdate(
    { _id: appointment.deviceId },
    { status: "available" }
  );
  const newInvoice = await Invoice.findOne({ _id: invoiceId }).populate([
    "appointments",
    "appointments.clientId",
    "appointments.deviceId",
  ]);

  res.status(200).json({ message: "updated successfully", data: newInvoice });
});

//@desc     end invoice
//@route    PUT /api/invoice/:id/endInvoice
//@access   ADMIN , MANAGER
const endInvoice = asyncHandler(async (req, res) => {
  const { endTime } = req.body;
  const invoiceId = req.params.id;
  const invoice = await Invoice.findOne({ _id: invoiceId }).populate([
    "appointments",
    "drinksFoods",
  ]);

  invoice.appointments.forEach(async (a) => {
    const device = await Device.findOne({ _id: a.deviceId });

    Device.findOneAndUpdate({ _id: a.deviceId }, { status: "available" });
    console.log("🔥✨ ", a);

    if (!a.ended) {
      const _updatedAppointment = await Appointment.findByIdAndUpdate(
        a?._id,
        a?.type === "open"
          ? {
              ended: true,
              endTime,
              totalPrice:
                calcTotalHours(a.startTime, endTime) *
                (a.singleOrMulti == "single"
                  ? device?.singlePrice
                  : device?.multiPrice),
            }
          : {
              ended: true,
              totalPrice:
                calcTotalHours(a.startTime, endTime) *
                (a.singleOrMulti == "single"
                  ? device?.singlePrice
                  : device?.multiPrice),
            },
        {
          new: true,
          runValidators: true,
        }
      );
    }
  });

  const updatedInvoice = await Invoice.findOne({ _id: invoiceId }).populate([
    "appointments",
    "drinksFoods",
  ]);
  console.log("🔥✨ ", {
    updatedInvoice,
    x: updatedInvoice?.appointments.map((a) => a.totalPrice),
  });

  // Update the invoice in the database
  const _updatedInvoice = await Invoice.findByIdAndUpdate(
    invoiceId,
    {
      ended: true,
      status: "paid",
      totalPrice:
        updatedInvoice?.appointments
          .map((a) => a.totalPrice)
          .reduce((a, b) => a + b, 0) +
        updatedInvoice?.drinksFoods
          ?.map((a) => a.price)
          .reduce((a, b) => a + b, 0),
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate(["appointments", "drinksFoods"]); // Set runValidators to true to run validation on update
  res
    .status(200)
    .json({ message: "updated successfully", data: _updatedInvoice });
});

//@desc     Get all invoices
//@route    POST /api/invoice/all
//@access   ADMIN , MANAGER
const getAllInvoices = asyncHandler(async (req, res) => {
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
  const invoices = await Invoice.find({
    // ...filterObj
    // ,
    ...query,
  })
    .sort({ createdAt: -1 })
    .populate([
      "appointments",
      "drinksFoods",
      {
        path: "appointments",
        populate: { path: "clientId" },
      },
      {
        path: "appointments",
        populate: { path: "deviceId" },
      },
    ])
    .skip(skip)
    .limit(limit);
  res.status(200).json(
    responseObject(true, "success", {
      count: invoices.length,
      result: invoices,
    })
  );
});
//@desc     Get one invoices
//@route    POST /api/invoice/:id
//@access   ADMIN , MANAGER
const getInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invoice = await Invoice.findOne({
    _id: id,
  });

  res.status(200).json(responseObject(true, "success", invoice));
});

//@desc     Delete one course
//@route    DELETE /api/invoice/:id
//@access   ADMIN , MANAGER
const deleteInvoice = asyncHandler(async (req, res) => {
  console.log(req.user.role);
  const invoiceId = req.params.id;
  //check if the course exist or not
  const invoice = await Invoice.findOne({ _id: invoiceId });
  const invoiceExists = !!invoice;
  if (!invoiceExists) {
    res.status(400);
    throw new Error("this invoice doesn't exist");
  }

  await Invoice.deleteOne({ _id: invoiceId });
  res.status(200).json(
    responseObject(true, "Invoice Deleted Successfully", {
      deletedInvoice: invoice,
    })
  );
});

module.exports = {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  deleteInvoice,
  endInvoice,
  endAppointment,
  addAppointment,
  addDrinkFood,
};
