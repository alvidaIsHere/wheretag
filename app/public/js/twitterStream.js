$(document).ready(function () {
    createNewMap();
});

var heatmap;
var liveTweets;
var map;
var socket;
var mapOptions;
var myLiveChart;

function initialize() {
    //chart
    // var canvas = $("#sentimentChart");
    // var ctx = canvas.getContext('2d');
    var ctx = $("#sentimentChart");

    //instantiate chartData
    var startingData = {
        labels: ["Positive", "Negative"],
        datasets: [{
            label: '# of Votes',
            data: [1, 1],
            backgroundColor: [
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 99, 132, 0.2)'
            ],
            borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(255,99,132,1)'

            ],
            borderWidth: 1

        }]
    }
    // myLiveChart = new Chart(ctx).Pie(startingData, {animationSteps: 15});
    myLiveChart = new Chart(ctx,{
        type: 'pie',
        data: startingData,
        options: {
            animation:{
                animateRotate:false
        }}
    });


    //buttons
    var btn_default = document.getElementById("btn_default");
    btn_default.addEventListener("click", function () {
        startPopulateOutput()
    }, false);
    var btn_search = document.getElementById("btn_search");
    btn_search.addEventListener("click", function () {
        cleanExistingData();
        search();
    });
    var btn_stop = document.getElementById("btn_stop");
    btn_stop.addEventListener("click", function () {
        disconnectStreamAndSocket();
    });
}

function disconnectStreamAndSocket() {
    console.log("#######  start disconnect socket ");
    if (socket !== undefined) {
        socket.emit("disconnect-stream");
        console.log("#######  trying to disconnect stream "); //reached here
        socket.on("stream destroyed", function () {
            socket.disconnect();
            return;
        });
    } else {
        //alert("Stream has not started");
        //console.log("#######  socket undefined ");
    }
    return;
}

function search() {
    var searchTag = $('#tag').val();
    if (searchTag.trim() == '') {
        alert("please input search term");
        return;
    }

    if (io !== undefined) {

        console.log("#######  search for: " + searchTag);

        // Storage for WebSocket connections
        socket = io.connect('/');

        // Listens for a success response from the server to
        // say the connection was successful.
        socket.on("connected", function (r) {
            //Now that we are connected to the server let's tell
            //the server we are ready to start searching for tweets.
            var input = {
                "tag": searchTag
            };

            //Send out to web sockets channel.
            socket.emit('twitter-search', input);
        });

        // This listens on the "twitter-steam" channel and data is
        // received everytime a new tweet is receieved.
        socket.on('twitter-stream', function (data) {

            //Add tweet to the heat map array.
            var tweetLocation = new google.maps.LatLng(data.lng, data.lat);
            liveTweets.push(tweetLocation);

            //Flash a dot onto the map quickly
            var image = "css/small-dot-icon.png";
            var marker = new google.maps.Marker({
                position: tweetLocation,
                map: map,
                icon: image
            });
            setTimeout(function () {
                marker.setMap(null);
            }, 600);

            //Add tweet text into output window
            $('.texts').prepend('<li>' + data.message + '</li>');
            var count = $('#count').text();
            count++;
            $("#count").text(count);

            //Add sentiment
            var sentiment = data.sentiment;
            var positive = $('#positive').text();
            var negative = $('#negative').text();
            if (sentiment > 0) {
                positive++;
                $("#positive").text(positive);
                //update chart data
                myLiveChart.data.datasets[0].data[0] = positive;
            } else if (sentiment < 0) {
                negative++;
                $("#negative").text(negative);
                //update chart data
                myLiveChart.data.datasets[0].data[1] = negative;
            }
            myLiveChart.update();




        });


    }

}

function cleanExistingData() {
    //clear heatmap data
    if (typeof( liveTweets ) == 'object') liveTweets.clear();
    //Setup heat map and link to Twitter array we will append data to
    liveTweets = new google.maps.MVCArray();
    heatmap = new google.maps.visualization.HeatmapLayer({
        data: liveTweets,
        radius: 25
    });
    heatmap.setMap(map);

    // clean tweets
    $('.texts').empty();

    // clear count
    $("#count").text('0');
    $("#positive").text('0');
    $("#negative").text('0');

}
function createNewMap() {
    //Setup Google Map
    // var myLatlng = new google.maps.LatLng(17.7850,-12.4183);
    var myLatlng = new google.maps.LatLng(-0.023559, 37.906193); //kenya

    var light_grey_style = [{
        "featureType": "landscape",
        "stylers": [{"saturation": -100}, {"lightness": 65}, {"visibility": "on"}]
    }, {
        "featureType": "poi",
        "stylers": [{"saturation": -100}, {"lightness": 51}, {"visibility": "simplified"}]
    }, {
        "featureType": "road.highway",
        "stylers": [{"saturation": -100}, {"visibility": "simplified"}]
    }, {
        "featureType": "road.arterial",
        "stylers": [{"saturation": -100}, {"lightness": 30}, {"visibility": "on"}]
    }, {
        "featureType": "road.local",
        "stylers": [{"saturation": -100}, {"lightness": 40}, {"visibility": "on"}]
    }, {
        "featureType": "transit",
        "stylers": [{"saturation": -100}, {"visibility": "simplified"}]
    }, {"featureType": "administrative.province", "stylers": [{"visibility": "off"}]}, {
        "featureType": "water",
        "elementType": "labels",
        "stylers": [{"visibility": "on"}, {"lightness": -25}, {"saturation": -100}]
    }, {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{"hue": "#ffff00"}, {"lightness": -25}, {"saturation": -97}]
    }];
    myOptions = {
        zoom: 2,
        center: myLatlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        mapTypeControlOptions: {
            //style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.LEFT_BOTTOM
        },
        styles: light_grey_style
    };
    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

    //Setup heat map and link to Twitter array we will append data to
    liveTweets = new google.maps.MVCArray();
    heatmap = new google.maps.visualization.HeatmapLayer({
        data: liveTweets,
        radius: 25
    });
    heatmap.setMap(map);
}
function startPopulateOutput() {
    console.log("#######  start populating map");
    //start populating map
    if (io !== undefined) {
        // Storage for WebSocket connections
        socket = io.connect('/');

        // This listens on the "twitter-steam" channel and data is
        // received everytime a new tweet is receieved.
        socket.on('twitter-stream', function (data) {

            //Add tweet to the heat map array.
            var tweetLocation = new google.maps.LatLng(data.lng, data.lat);
            liveTweets.push(tweetLocation);

            //Flash a dot onto the map quickly
            var image = "css/small-dot-icon.png";
            var marker = new google.maps.Marker({
                position: tweetLocation,
                map: map,
                icon: image
            });
            setTimeout(function () {
                marker.setMap(null);
            }, 600);

            //Add tweet text into output window
            $('.texts').prepend('<li>' + data.message + '</li>');
            var count = $('#count').text();
            count++;
            $("#count").text(count);

        });

        // Listens for a success response from the server to
        // say the connection was successful.
        socket.on("connected", function (r) {

            //Now that we are connected to the server let's tell
            //the server we are ready to start receiving tweets.
            socket.emit("start tweets");
        });
    }
}



