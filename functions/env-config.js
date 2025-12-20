exports.handler = async (event, context) => {
  const apiKey = process.env.API_KEY || "";
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/javascript",
      "Access-Control-Allow-Origin": "*"
    },
    body: `window.process = { env: { API_KEY: '${apiKey}' } };`,
  };
};
