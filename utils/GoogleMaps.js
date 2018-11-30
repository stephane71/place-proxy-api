const uuidv4 = require("uuid/v4");

const googleMapsClient = require("@google/maps").createClient({
  key: process.env.GOOGLE_MAPS_API_KEY,
  Promise: Promise
});

const GM_PLACES_DETAILS_FIELDS = [
  "address_component",
  "alt_id",
  "formatted_address",
  "geometry",
  "icon",
  "id",
  "name",
  "photo",
  "place_id",
  "scope",
  "type",
  "url",
  "utc_offset",
  "vicinity"
];
const REQ_PREDICTIONS_OK = "OK";
const REQ_PLACE_OK = "OK";

class GoogleMaps {
  constructor() {
    this.sessionToken = null;
  }

  initSession() {
    this.sessionToken = uuidv4();
  }

  getPredicitons(input, { isRegions } = { isRegions: true }) {
    let params = {
      input,
      language: "fr",
      sessiontoken: this.sessionToken
    };

    params = isRegions ? { ...params, types: "(regions)" } : params;
    // params = isGlobal ? params : { ...params, components: { country: "fr" } };

    return googleMapsClient
      .placesAutoComplete(params)
      .asPromise()
      .then(data =>
        data.json.status === REQ_PREDICTIONS_OK ? data.json.predictions : []
      );
  }

  getDetails(place_id) {
    return googleMapsClient
      .place({
        placeid: place_id,
        fields: GM_PLACES_DETAILS_FIELDS,
        sessiontoken: this.sessionToken
      })
      .asPromise()
      .then(data =>
        data.json.status === REQ_PLACE_OK
          ? data.json.result
          : Promise.reject(data.json)
      )
      .then(data => {
        const { geometry, ...rest } = data;
        return {
          location: { lat: geometry.location.lat, lng: geometry.location.lng },
          geometry,
          ...rest
        };
      });
  }
}

module.exports = GoogleMaps;
