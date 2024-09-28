const asyncHandler = require("express-async-handler");
const Client = require("../models/client.model");
const responseObject = require("../helpers/response.helper");
//@desc     add a client
//@route    POST /api/courses/create
//@access   Private ADMIN
const addClient = asyncHandler(async (req, res) => {
  const { name, phoneNumber, email } = req.body;
  //check if the phone number
  const egyptianPhoneNumberRegex = /^01[0-25][0-9]{8}$/;

  // Validate phone number
  if (!egyptianPhoneNumberRegex.test(phoneNumber)) {
    res.status(400);
    throw new Error(
      "Invalid phone number format. It must be a valid Egyptian number."
    );
  }

  //check all required fields
  if (!name || !phoneNumber) {
    res.status(400);
    throw new Error("Please complete all fields");
  }
  //add new client
  const newClient = await Client.create({
    name,
    phoneNumber,
    email: email ? email : "",
  });
  //respond
  res.status(201).json(
    responseObject(true, "Client Created Successfully", {
      ...newClient?._doc,
    })
  );
});

//@desc     Get all clients
//@route    POST /api/client/all
//@access   ADMIN , MANAGER
const getAllClients = asyncHandler(async (req, res) => {
  const { skip, limit } = req.pagination;
  //filter by date

  let query = {};

  // Check if there are search parameters in the query
  if (req.query.search !== undefined) {
    // If search query is not empty, modify the query object to include search criteria
    if (req.query.search !== "") {
      query = {
        $or: [{ phoneNumber: { $regex: req.query.search, $options: "i" } }],
      };
    }
    // Otherwise, return all items without applying any search criteria
  }

  const clients = await Client.find({ ...query })
    .sort({ createdAt: -1 })
    // .populate("department")
    .skip(skip)
    .limit(limit);
  res.status(200).json(
    responseObject(true, "success", {
      count: clients.length,
      result: clients,
    })
  );
});
//@desc     Get one clients
//@route    POST /api/client/:id
//@access   ADMIN , MANAGER
const getClientById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const client = await Client.findOne({
    _id: id,
  });

  res.status(200).json(responseObject(true, "success", client));
});

//@desc     Delete one course
//@route    DELETE /api/client/:id
//@access   ADMIN , MANAGER
const deleteClient = asyncHandler(async (req, res) => {
  console.log(req.user.role);
  const clientId = req.params.id;
  //check if the course exist or not
  const client = await Client.findOne({ _id: clientId });
  const clientExists = !!client;
  if (!clientExists) {
    res.status(400);
    throw new Error("this client doesn't exist");
  }
  await Client.deleteOne({ _id: clientId });
  res.status(200).json(
    responseObject(true, "Client Deleted Successfully", {
      deletedClient: client,
    })
  );
});

//@desc     update one client
//@route    PUT /api/client/:id
//@access   ADMIN , MANAGER
const updateClient = asyncHandler(async (req, res) => {
  const clientId = req.params.id;
  const updateFields = req.body;

  // Update the client in the database
  const updatedClient = await Client.findByIdAndUpdate(
    clientId,
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
    .json({ message: "updated successfully", data: updatedClient });
});
module.exports = {
  addClient,
  getAllClients,
  getClientById,
  deleteClient,
  updateClient,
};
