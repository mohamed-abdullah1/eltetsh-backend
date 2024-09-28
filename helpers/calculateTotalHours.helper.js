const calcTotalHours = (start, end) => {
  const startTime = new Date(start);
  const endTime = new Date(end);

  // Calculate the difference in milliseconds
  const differenceInMs = endTime - startTime;

  // Convert milliseconds to hours (1 hour = 60 * 60 * 1000 milliseconds)
  const totalHours = differenceInMs / (1000 * 60 * 60);

  console.log(totalHours); // Output: 1.2 hours
  return totalHours;
};
module.exports = calcTotalHours;
