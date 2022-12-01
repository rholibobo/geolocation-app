const express = require("express");
const app = express();
require("dotenv").config();
const port = 4002;
const fileUpload = require("express-fileupload");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const _ = require("lodash");
const ExifImage = require("exif").ExifImage;
const Coordinates = require("coordinate-parser");
const NodeGeocoder = require("node-geocoder");
var options = {
  provider: "google",
  httpAdapter: "https", // Default
  apiKey: process.env.API_KEY, // for Mapquest, OpenCage, Google Premier
  formatter: "json", // 'gpx', 'string', ...
};
const geocoder = NodeGeocoder(options);
// const fs = require('fs');
// const path = require('path');
// const imgModel = require('./schema');
// const Photo = imgModel.photoOp


// Middlewares
app.use(express.static("public"));
app.use("/public/uploads", express.static("./public/uploads"));
app.use("/public/uploads", express.static("./public/images"));
app.set("view engine", "ejs");


// enable files upload
app.use(
  fileUpload({
    createParentPath: true,
  })
);

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Express Verbs

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/file", (req, res) => {
  res.render("file")
  
});

app.post("/file", async (req, res) => {
 
  try {
    if (!req.files) {
      res.send({
        status: false,
        message: "No file uploaded",
      });
    } else {
      //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
      let avatar = req.files.sampleFile;

      //Use the mv() method to place the file in the upload directory (i.e. "uploads")
      avatar.mv("./public/uploads/" + avatar.name);
      let image = avatar.name;


      //send response
      // res.send({
      //   status: true,
      //   message: "File is uploaded",
      //   data: {
      //     name: avatar.name,
      //     mimetype: avatar.mimetype,
      //     size: avatar.size,
      //   },
      // });

      // ExifImage npm package use
      try {
        new ExifImage({ image: `public/uploads/${image}` }, function (
          error,
          exifData
          
        ) {
          if (error) console.log("Error: " + error.message);
          else console.log( ); // Do something with your data!
          try {
            let buffer;
            // buffer = exifData.exif.ExifVersion;
            // let bufferCheck = buffer.toString('utf8');
            // if(bufferCheck !== '0231'){
            //   buffer = '0231';
            // }else {
            //   console.log("bufferCheck is 0231")
            // }

            if (exifData.gps) {
              let toLat = exifData.gps.GPSLatitude.join(" ");
              let toLng = exifData.gps.GPSLongitude.join(" ");

              let position = new Coordinates(`${toLat} ${toLng}`);

              let latitude = position.getLatitude().toFixed(6);
              let longitude = position.getLongitude().toFixed(6);

              console.log(latitude);
              console.log(longitude);

              const text = {
                apikey: process.env.API_KEY,
              };
            
              // NODE-GEOCODER
              geocoder.reverse(
                { lat: latitude, lon: longitude },
                function (err, response) {
                  // console.log(response)
                  console.log(response[0].formattedAddress);

                  const photo = {imageName: `public/uploads/${image}` }
                  console.log(photo)
                  const pemAddress = { address: response[0].formattedAddress };

                  res.render("index", {
                    text: text,
                    pemAddress: pemAddress,
                    photo: photo
                  });
                }
              );

              
            }
          } catch (error) {
            // Error message if picture does not have gps data
            res.send("there is no exif gps data for this photo: ")
          }

          // console.log(toLat, toLng)
        });
      } catch (error) {
        console.log("Error: " + error.message);
      }
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

app.listen(port, () => {
  console.log(`listening at ${port}`);
});
