//Setup web server and socket
var twitter = require('twitter'),
    express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    sentiment = require('sentiment');

var port = 3000;

//Setup twitter stream api

const twitterConsumerKey = 'k9vj43jysLuwBjoRz8kD6arbg';
const twitterConsumerSecret = '7Go3XKmOyEUrKUg6kuCtUMKMAA7smjml0X6dgvGFXIhUY2EFIG';
const twitterAccessTokenKey = '97582745-PBnQw98SHHQf94gz1kvJedG8lmMExweRO0CUKyo1x';
const twitterAccessTokenSecret = 'C7WRC5XKOInyOcq2zrfvR8RsI4qd3974gdPIPpDdOLKx3';

var twit = new twitter({
        consumer_key: twitterConsumerKey,
        consumer_secret: twitterConsumerSecret,
        access_token_key: twitterAccessTokenKey,
        access_token_secret: twitterAccessTokenSecret
    }),
    stream = null;

//Use the default port (for beanstalk) or default to 8081 locally
server.listen(process.env.PORT || port);

//Setup rotuing for app
app.use(express.static(__dirname + '/public'));

//twitter keywords
var keywords = ['javascript'];


//Create web sockets connection.
io.sockets.on('connection', function (socket) {

    socket.on("start tweets", function () {
        // clear any previous stream
        stream = null;

        //Connect to twitter stream passing in filter for entire world.
        twit.stream('statuses/filter', {'locations': '-180,-90,180,90', 'language': 'en'}, function (stream) {
            // twit.stream('statuses/filter', {'track': keywords.join(','), 'language': 'en'}, function (stream) {

            stream.on('data', function (data) {

                //listen to socket if there is disconnect request
                socket.on("disconnect-stream", function () {

                    stream.destroy();
                    socket.emit("stream destroyed");

                });

                var lat = null;
                var lng = null;


                // Does the JSON result have coordinates
                if (data.coordinates) {
                    if (data.coordinates !== null) {
                        //If so then build up some nice json and send out to web sockets
                        lat = data.coordinates.coordinates[0];
                        lng = data.coordinates.coordinates[1];
                        //sentiment analysis
                        var sentimentResult = sentiment(data.text);

                        var output = {
                            "lat": data.coordinates.coordinates[0],
                            "lng": data.coordinates.coordinates[1],
                            "message": data.text
                        };

                        socket.broadcast.emit("twitter-stream", output);

                        //Send out to web sockets channel.
                        socket.emit('twitter-stream', output);
                    }
                    else if (data.place) {
                        if (data.place.bounding_box === 'Polygon') {
                            // Calculate the center of the bounding box for the tweet
                            var coord, _i, _len;
                            var centerLat = 0;
                            var centerLng = 0;

                            for (_i = 0, _len = coords.length; _i < _len; _i++) {
                                coord = coords[_i];
                                centerLat += coord[0];
                                centerLng += coord[1];
                            }
                            centerLat = centerLat / coords.length;
                            centerLng = centerLng / coords.length;
                            lat = centerLat;
                            lng = centerLng;

                            //sentiment analysis
                            var sentimentResult = sentiment(data.text);

                            // Build json object and broadcast it
                            var output = {
                                "lat": lat,
                                "lng": lng,
                                "message": data.text,
                                "sentiment": sentimentResult.score,
                            };

                            //Send out to web sockets channel.
                            socket.emit('twitter-stream', output);
                        }
                    }
                }

                stream.on('limit', function (limitMessage) {
                    return console.log(limitMessage);
                });

                stream.on('warning', function (warning) {
                    return console.log(warning);
                });

                stream.on('disconnect', function (disconnectMessage) {
                    return console.log(disconnectMessage);
                });
            });
        });

    });

    socket.on("twitter-search", function (input) {

        //clear any previous stream
        stream = null;
        var searchTag = input.tag;
        if (searchTag == null || searchTag == "") {
            searchTag = "trump"; //placeholder
        }

        //Connect to twitter stream passing in filter for the search tag.
		twit.stream('statuses/filter', {'track': searchTag, 'language': 'en'}, function (stream) {
            console.log("#######  search socket connected to twitter stream :" + searchTag);

            stream.on('data', function (data) {

                //listen for stop streaming order
                socket.on("disconnect-stream", function () {

                    stream.destroy();
                    socket.emit("stream destroyed");

                });
                var lat = null;
                var lng = null;

                // Does the JSON result have coordinates
                if (data.coordinates) {
                    if (data.coordinates !== null) {
                        //If so then build up some nice json and send out to web sockets
                        lat = data.coordinates.coordinates[0];
                        lng = data.coordinates.coordinates[1];
                        var sentimentResult = sentiment(data.text);
                        var output = {
                            "lat": lat,
                            "lng": lng,
                            "message": data.text,
                            "sentiment": sentimentResult.score,
                        };

                        //Send out to web sockets channel.
                        socket.emit('twitter-stream', output);
                    }
                    else if (data.place) {
                        if (data.place.bounding_box === 'Polygon') {
                            // Calculate the center of the bounding box for the tweet
                            var coord, _i, _len;
                            var centerLat = 0;
                            var centerLng = 0;

                            for (_i = 0, _len = coords.length; _i < _len; _i++) {
                                coord = coords[_i];
                                centerLat += coord[0];
                                centerLng += coord[1];
                            }
                            centerLat = centerLat / coords.length;
                            centerLng = centerLng / coords.length;
                            lat = centerLat;
                            lng = centerLng;

                            var sentimentResult = sentiment(data.text);
                            var output = {
                                "lat": lat,
                                "lng": lng,
                                "message": data.text,
                                "sentiment": sentimentResult.score,
                            };
                            //Send out to web sockets channel.
                            //socket.broadcast.emit("twitter-stream", output);
                            socket.emit('twitter-stream', output);
                        }
                    }
                } else {
                    // Build json object and broadcast it
                    var sentimentResult = sentiment(data.text);
                    var output = {
                        "message": data.text,
                        "sentiment": sentimentResult.score,
                    };

                    //Send out to web sockets channel.
                    socket.emit('twitter-stream', output);
                }


                stream.on('limit', function (limitMessage) {
                    return console.log(limitMessage);
                });

                stream.on('warning', function (warning) {
                    return console.log(warning);
                });

                stream.on('disconnect', function (disconnectMessage) {
                    return console.log(disconnectMessage);
                });
            });
        });

    });
    // Emits signal to the client telling them that the
    // they are connected and can start receiving Tweets
    socket.emit("connected");
    console.log(`app listening at http://localhost : ${port}/`);

});

