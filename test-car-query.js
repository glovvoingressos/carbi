const { CarQuery } = require('car-query');
const carQuery = new CarQuery();
carQuery.getYears().then(years => console.log(years)).catch(console.error);
