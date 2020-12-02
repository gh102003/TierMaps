const Cov19API = require("@publichealthengland/uk-covid19").default;

let ltlaDataBack16 = null;
let ltlaDataBack9 = null;
let ltlaDataBack2 = null;

const getLtlaData = date => {
  const api = new Cov19API({
    filters: ["areaType=ltla", "date=" + date.toISOString().slice(0, 10), /*"areaName=Mid Suffolk"*/],
    structure: {
      "date": "date",
      "areaCode": "areaCode",
      // "areaName": "areaName",
      // "cumCasesBySpecimenDate": "cumCasesBySpecimenDate",
      "cumCasesBySpecimenDateRate": "cumCasesBySpecimenDateRate",
      "cumDeaths28DaysByDeathDateRate": "cumDeaths28DaysByDeathDateRate"
    }
  });

  return api.getJSON(); // a promise
};

const loadData = () => {
  if (ltlaDataBack16 && ltlaDataBack9 && ltlaDataBack2) return Promise.resolve();

  const back2 = new Date();
  const back9 = new Date();
  const back16 = new Date();
  back2.setDate(new Date().getDate() - 2);
  back9.setDate(new Date().getDate() - 9);
  back16.setDate(new Date().getDate() - 16);

  return Promise.all([
    getLtlaData(back2).then(data => ltlaDataBack2 = data.data),
    getLtlaData(back9).then(data => ltlaDataBack9 = data.data),
    getLtlaData(back16).then(data => ltlaDataBack16 = data.data)
  ]);
};

/**
 * Returns the rise in number of new cases in the the last 7 days (by specimen date), per 100k population
 * @param {string} ltlaCode 
 */
const getCaseRise = ltlaCode => {
  const covidDataBack9 = ltlaDataBack9.filter(data => data.areaCode === ltlaCode)[0];
  const covidDataBack2 = ltlaDataBack2.filter(data => data.areaCode === ltlaCode)[0];

  if (!covidDataBack2 || !covidDataBack9) {
    console.log(`Not enough Covid data for LTLA ${ltlaCode}`);
    return null;
  }
  return covidDataBack2.cumCasesBySpecimenDateRate - covidDataBack9.cumCasesBySpecimenDateRate;
};

/**
 * Returns the percentage change between the number of new cases (per 100k pop) in the past 7 days, and the 7 days before that
 */
const getCaseRisePercentageChange = ltlaCode => {
  const covidDataBack16 = ltlaDataBack16.filter(data => data.areaCode === ltlaCode)[0];
  const covidDataBack9 = ltlaDataBack9.filter(data => data.areaCode === ltlaCode)[0];
  const covidDataBack2 = ltlaDataBack2.filter(data => data.areaCode === ltlaCode)[0];

  if (!covidDataBack2 || !covidDataBack9 || !covidDataBack16) {
    console.log(`Not enough Covid data for LTLA ${ltlaCode}`);
    return null;
  }

  const week1Rise = covidDataBack9.cumCasesBySpecimenDateRate - covidDataBack16.cumCasesBySpecimenDateRate;
  const week2Rise = covidDataBack2.cumCasesBySpecimenDateRate - covidDataBack9.cumCasesBySpecimenDateRate;

  return (week2Rise - week1Rise) / week1Rise * 100;
}

/**
 * Returns the number of deaths (within 28 days of a postive test) in the the last 7 days (by specimen date), per 100k population
 * @param {string} ltlaCode 
 */
const getDeathRise = ltlaCode => {
  const covidDataBack9 = ltlaDataBack9.filter(data => data.areaCode === ltlaCode)[0];
  const covidDataBack2 = ltlaDataBack2.filter(data => data.areaCode === ltlaCode)[0];

  if (!covidDataBack2 || !covidDataBack9) {
    console.log(`Not enough Covid data for LTLA ${ltlaCode}`);
    return null;
  }
  return covidDataBack2.cumDeaths28DaysByDeathDateRate - covidDataBack9.cumDeaths28DaysByDeathDateRate;
};

module.exports = { ltlaDataBack2, ltlaDataBack9, loadData, getCaseRise, getDeathRise, getCaseRisePercentageChange };