const algoliasearch = require("algoliasearch");

const DEFAULT_PARAMS_PLACE_SEARCH = {
  type: "city",
  language: "fr",
  countries: ["fr"],
  // countries: ["fr", "mq", "re", "nc"],
  hitsPerPage: 5
};

class AlgoliaPlaces {
  constructor() {
    this.places = algoliasearch.initPlaces(
      process.env.ALGOLIA_APPLICATION_ID,
      process.env.ALGOLIA_API_KEY
    );
  }

  getPredicitions(input) {
    return new Promise((resolve, reject) =>
      this.places.search(
        { ...DEFAULT_PARAMS_PLACE_SEARCH, query: input },
        (err, res) => {
          if (err) throw err;
          resolve(res.hits);
        }
      )
    );
  }
}

module.exports = AlgoliaPlaces;
