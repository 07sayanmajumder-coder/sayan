const handleSearch = async () => {
  try {
    const trainNumber = "12301";
const journeyDate = "2026-11-20";

const response = await fetch(
  `http://localhost:5000/api/trains/${trainNumber}/live?date=${journeyDate}`
);

const result = await response.json();

console.log(result);
  } catch (error) {
    console.error("Train status error:", error);
  }
};