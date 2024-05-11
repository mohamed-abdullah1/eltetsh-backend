const asyncHandler = require("express-async-handler");
const Excel = require("exceljs");
const { ExcelResults } = require("../models/results.model");
const User = require("../models/users.model");
const uploadResults = asyncHandler(async (req, excelUrl) => {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.load(req.file.buffer);

  // Assuming the data is in the first worksheet
  const worksheet = workbook.getWorksheet(1);
  const headerRow = worksheet.getRow(1);

  // Initialize an array to store column titles
  const columnTitles = [];

  // Iterate over each cell in the header row
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    // Add cell value to the columnTitles array
    columnTitles.push(cell.value);
  });
  console.log("👉🔥 ", columnTitles);
  let results = [];
  worksheet.eachRow({}, function (row) {
    let mark, nationalId;
    row.eachCell({}, function (cell, colNumber) {
      if (colNumber === 1 && !columnTitles.includes(cell.value)) {
        //nationalId
        nationalId = cell.value;
      } else if (colNumber === 2 && !columnTitles.includes(cell.value)) {
        //mark
        mark = cell.value;
      }
      console.log("Cell " + colNumber + " = " + cell.value);
    });
    if (mark && nationalId) {
      results.push({
        mark,
        nationalId,
      });
    }
  });
  console.log("👉🔥 ", results);
  await ExcelResults.deleteMany({ excelFileId: excelUrl });
  const newResults = await Promise.all(
    results.map(async (result) => {
      const student = await User.findOne({ nationalId: result.nationalId });
      return {
        student: student._id,
        mark: result.mark,
        course: req.body.course,
        excelFileId: excelUrl,
      };
    })
  );
  ExcelResults.insertMany(newResults)
    .then((result) => {
      console.log("Documents inserted successfully:", result);
    })
    .catch((error) => {
      console.error("Error inserting documents:", error);
    });
});
module.exports = {
  uploadResults,
};
