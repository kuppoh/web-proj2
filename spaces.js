const AWS = require('aws-sdk');

require('dotenv').config();

// Set up the AWS SDK with DigitalOcean Spaces credentials
const spacesEndpoint = new AWS.Endpoint('https://web-project.sfo3.digitaloceanspaces.com');

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_ACCESS_KEY,  // Replace with your DigitalOcean Spaces access key
  secretAccessKey: process.env.DO_SECRET_KEY,  // Replace with your DigitalOcean Spaces secret key
  region: 'sf03', 
});

module.exports = s3;
