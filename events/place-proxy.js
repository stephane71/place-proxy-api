require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const apigClientFactory = require("aws-api-gateway-client").default;

const now = require("../utils/now");
const getPlaceDetails = require("../utils/getPlaceDetails");

const api = apigClientFactory.newClient({
  invokeUrl: `${process.env.BASE_API_URL}/place`,
  region: process.env.AWS_API_REGION,
  accessKey: process.env.ACCESS_KEY_ID,
  secretKey: process.env.SECRECT_ACCESS_KEY
});

module.exports.handler = async (event = {}, context, callback) => {
  now();
  console.log("[La Foulee] | start place");

  const { department, city } = event.pathParameters || {};

  if (!department) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "wrong request" })
    };
  }

  const slugPlace = city ? `${department}_${city}` : department;
  let res = {};

  /* LOOK in db Places */
  try {
    console.log("Looked for", slugPlace, "in Places DB");
    const args = [{ slug: slugPlace }, `/{slug}`, "GET", {}, {}];
    res = await api.invokeApi(...args);
  } catch (e) {
    if (e.response.status !== 404) {
      console.log(e);
      return {
        statusCode: 500
      };
    }
  }

  if (res.data)
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(res.data)
    };

  let details = {};

  /* LOOK in Google || Algolia */
  try {
    console.log(
      "Looked for",
      slugPlace,
      "in Google Maps || Algolia Places API"
    );
    details = await getPlaceDetails(slugPlace);
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
      body: JSON.stringify(e)
    };
  }
  if (!details) return { statusCode: 404 };

  details = { ...details, slug: slugPlace };
  /* INSERT in DB*/
  try {
    console.log("Insert", slugPlace, "in Places DB");
    const args = [{}, `/`, "POST", {}, details];
    res = await api.invokeApi(...args);
  } catch (e) {
    if (e.response.status !== 404) {
      console.log(e);
      // Find a way to send this problem
      // But do not return anythings
    }
  }

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(details)
  };
};
