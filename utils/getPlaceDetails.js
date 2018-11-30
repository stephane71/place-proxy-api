const slug = require("slug");

const GoogleMaps = require("../utils/GoogleMaps");
const AlgoliaPlaces = require("../utils/AlgoliaPlaces");

const googleMapsClient = new GoogleMaps();
const algoliaPlacesClient = new AlgoliaPlaces();

const DEFAULT_PLACE = {
  name: null,
  location: null,
  postCode: null,
  isCity: true
};

async function getFromGoogleMaps(input, { department, city }) {
  const compareWith = city ? city : department;
  input = city ? `${city}, ${department}` : input;

  googleMapsClient.initSession();
  const predictions = await googleMapsClient.getPredicitons(input, {
    isRegion: !city
  });

  let predictionsMatch = predictions.filter(({ terms, description }) => {
    const match = terms.filter(({ value }) => {
      console.log(value);
      return slug(value, { lower: true }) === compareWith;
    });
    return match.length;
  });

  if (!predictionsMatch.length && city) {
    console.log(
      "getPlaceDetails | No predictions found in direct match, we run an approximation with the description",
      city
    );
    predictionsMatch = predictions.filter(({ description }) =>
      slug(description, { lower: true }).includes(city)
    );
  }

  if (!predictionsMatch.length) {
    console.log("No predictions match in Google Maps Places for", input);
    console.log(predictions);
    return null;
  }

  console.log("Find in GoogleMaps Places", input);
  const place = await googleMapsClient.getDetails(predictionsMatch[0].place_id);
  const postCode = place.address_components.find(({ types }) =>
    types.includes("postal_code")
  );

  return {
    ...DEFAULT_PLACE,
    name: place.name,
    location: place.location,
    isCity: !!city,
    postCode: postCode ? postCode.short_name : null
  };
}

async function getFromAlgoliaPlaces(input, { department, city }) {
  const predictions = await algoliaPlacesClient.getPredicitions(
    `${city}, ${department}`
  );

  const predictionsMatch = predictions.filter(({ locale_names, county }) => {
    const matchDepartment = county.filter(
      name => slug(name, { lower: true }) === department
    );
    return matchDepartment.length;
  });

  if (!predictionsMatch.length) {
    console.log("No predictions match in Algolia Places for", input);
    console.log(predictions);
    return null;
  }

  console.log("Find in Algolia Places", input);
  const place = predictionsMatch[0];

  return {
    ...DEFAULT_PLACE,
    name: place.locale_names[0],
    location: place._geoloc,
    postCode: place.postcode[0],
    isCity: true
  };
}

module.exports = async function getPlaceDetails(input) {
  const [department, city] = input.split("_");

  if (city) {
    const place = await getFromAlgoliaPlaces(input, { department, city });
    return place ? place : getFromGoogleMaps(input, { department, city });
  }

  return getFromGoogleMaps(input, { department, city });
};
