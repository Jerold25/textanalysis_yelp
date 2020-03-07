//file will have all our js code. we can create objects for the different concerns.

var APIUtil = new function() {

    var domain = "http://localhost"; //substitute with our domain
    var URL = {
        "HELLOWORLD" : domain+"/hello"
    };

    this.makeInitialCall = function() {
        //sample ajax call code
        return $.ajax({
            beforeSend : function()
            {
                console.log("beforeSend");
                // processLogs();
                console.log("logs");
                console.log(logs);
            },
            url :URL.ADDLOGS,
            type : "POST",
            data : JSON.stringify(logs),
            contentType: "application/json; charset=utf-8",
            dataType   : "json",
            success:function(response, status, xhr)
            {
                console.log("success");
                console.log(response);
            },
            error: function(request,status,errorThrown) {
                console.log("failure");
                console.log(response);
            }
        });
    }
};

var SentimentBarChart = new function() { 
    this.renderBarChart = function(data) {
        console.log(data);
        var margin = {top: 20, right: 30, bottom: 40, left: 30},
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;
        
        $("#stackedchart").empty();
        var x = d3v3.scale.linear()
            .range([0, width]);

        var y = d3v3.scale.ordinal()
            .rangeRoundBands([0, height], 0.1);

        var xAxis = d3v3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3v3.svg.axis()
            .scale(y)
            .orient("left")
            .tickSize(0)
            .tickPadding(6);

        var svg = d3v3.select("#stackedchart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        x.domain(d3v3.extent(data, function(d) { return d.value; })).nice();
        y.domain(data.map(function(d) { return d.name; }));
        
        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", function(d) { return "bar bar--" + (d.value < 0 ? "negative" : "positive"); })
            .attr("x", function(d) { return x(Math.min(0, d.value)); })
            .attr("y", function(d) { return y(d.name); })
            .attr("width", function(d) { return Math.abs(x(d.value) - x(0)); })
            .attr("height", y.rangeBand());
      
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
      
        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + x(0) + ",0)")
            .call(yAxis);
    };
};

var Map = new function() {
    this.renderMap = function() {
        console.log("rendering map,...")
        var map = L.map('map',{
        }).setView([33.4255, -111.9400], 18); //16

        L.tileLayer('http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
            minZoom:0,
            maxZoom:22,
            maxNativeZoom:18
          }).addTo(map);    

        // var layer = new L.StamenTileLayer("toner");
        // map.addLayer(layer);

        var gl = L.mapboxGL({
            accessToken: 'no-token',
            style: 'https://raw.githubusercontent.com/osm2vectortiles/mapbox-gl-styles/master/styles/bright-v9-cdn.json'
        }).addTo(map);

        var geojson;

        var geojsonMarkerOptions = function(feature) {
            // console.log(feature);
            var stars = feature.properties.stars;
            var reviewRange = stars > 0.9 ? parseInt(feature.properties.stars % 5) : 6 ;
            var starsToRadius = {
                0: 18,
                1: 15,
                2: 10,
                3: 8,
                4: 6,
                6: 4
            }
            return { 
                radius: starsToRadius[reviewRange],
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }
        };

        function onEachFeature(feature, layer) {
            // console.log(feature);
            layer.on({
              mouseover: mouseOverFeature,
              mouseout: mouseOutFeature,
              click: onClickFeature
            });
            var popupContent =  '<div class="popup">'
                                +'<p>' + feature.properties.name + '</p>'
                                +'<p>' + feature.properties.stars + '</p>'
                                +'</div>' 
            layer.bindPopup(popupContent);
        }

        function mouseOverFeature(e) {
            this.openPopup();
        }

        function mouseOutFeature(e) {
            this.closePopup();
        }

        function onClickFeature(e) {
            console.log(e.target.feature);
            //TODO - code shold make ajax call with business id and render that
            var businessId = e.target.feature.properties.business_id;
            console.log("business_id: " + businessId);
            // Liveliness.renderLiveliness(livelinessData);
            // Evolution.renderRatingsEvolution(ratingsEvolution);            
            // SentimentBarChart.renderBarChart(sentimentBarData);
            // WordCloud.renderWordCloud(foodItemsData);

            // Liveliness.renderLiveliness(fullData["liveliness"]);
            // Evolution.renderRatingsEvolution(fullData["rating-trend"]);
            // WordCloud.renderWordCloud({count: fullData["word-cloud-data"]["count"], sample_title: fullData["word-cloud-data"]["sample_title"]}, fullData["word-cloud-data"]["word_reviews"]);

            $.ajax({
                beforeSend : function()
                {
                    console.log("beforeSend");
                    $("#reviewsList").html("Relevant comments.");
                },
                url :"http://ec2-18-208-167-146.compute-1.amazonaws.com:5000/all-details",
                type : "GET",
                data : {
                    "business-id": businessId 
                },
                contentType: "application/json; charset=utf-8",
                dataType   : "json",
                success:function(response, status, xhr)
                {
                    console.log("success");
                    console.log(response);
                    Liveliness.renderLiveliness(response["liveliness"]);
                    Evolution.renderValueEvolution(response["ratingTrend"], "#metric-modal", "Ratings");
                    Evolution.renderValueEvolution(response["sentimentTrend"], "#sentimentEvolution", "Sentiment score");
                    WordCloud.renderWordCloud({count: response["wordCloudData"]["count"], sample_title: response["wordCloudData"]["sample_title"]}, response["wordCloudData"]["word_reviews"]);
                    console.log("trwendss");
                    console.log(evolutionData["trends"]);
                    // EvolutionVisualization.renderEvolution(evolutionData["trends"]);
                    EvolutionVisualization.renderEvolution(response["combinedTrends"]);
                },
                error: function(request,status,errorThrown) {
                    console.log("failure");
                    console.log(response);
                }
            });
        }

        geojson = L.geoJson(restaurants, {
            pointToLayer: function(feature, latlng) { //convert points to circle, with radius based on ratings and food colour for restaurants based on keys 'RestaurantsPriceRange2' and 'RestaurantsGoodForGroups'            
                var stars = feature.properties.stars;
                var reviewRange = stars > 0.9 ? parseInt(feature.properties.stars % 5) : 6 ;
                var starsToRadius = {
                    0: 18,
                    1: 15,
                    2: 10,
                    3: 8,
                    4: 6,
                    6: 4
                }

                var constOtherRadius = 8;

                function findIfRestaurant(props) {            
                    // console.log(props);                    
                    if(props.hasOwnProperty("attributes") && props["attributes"]) {
                        // console.log(props["attributes"].hasOwnProperty("RestaurantsPriceRange2") || props["attributes"].hasOwnProperty("RestaurantsGoodForGroups"));
                        return props["attributes"].hasOwnProperty("RestaurantsPriceRange2") || props["attributes"].hasOwnProperty("RestaurantsGoodForGroups");
                    }
                    else {
                        return false;
                    }
                };

                var isRestaurant = findIfRestaurant(feature.properties);
                //TODO change colour. change size a little less.
                if(!isRestaurant) {
                    return L.circleMarker(latlng, { 
                        // radius: starsToRadius[reviewRange],
                        radius: constOtherRadius,
                        fillColor: "#c1caf9",
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                }                
                else {
                    return L.marker(latlng, {
                        icon: L.divIcon({
                            className: 'restaurant-icon restaurantSize-'+reviewRange,
                        })
                      });
                }                
            },
            onEachFeature: onEachFeature
        }).addTo(map);

        
    };
};

var Liveliness = new function() {
    this.renderLiveliness = function(ldata) {
        console.log("rendering liveliness,...");
        // console.log(ldata);

        var margin = { top: 50, right: 0, bottom: 100, left: 30 },
        //   width = 960 - margin.left - margin.right,
        width = 696 - margin.left - margin.right,
        //   height = 430 - margin.top - margin.bottom,
        height = 400 - margin.top - margin.bottom,
          gridSize = Math.floor(width / 24),
          legendElementWidth = gridSize*2,
          buckets = 9,
          colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"], // alternatively colorbrewer.YlGnBu[9]
          days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
          times = ["3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12p", "1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12a", "1p", "2p"];
        
        $("#liveliness").empty();
        var svg = d3v3.select("#liveliness").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var dayLabels = svg.selectAll(".dayLabel")
            .data(days)
            .enter().append("text")
                .text(function (d) { return d; })
                .attr("x", 0)
                .attr("y", function (d, i) { return i * gridSize; })
                .style("text-anchor", "end")
                .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
                .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

        var timeLabels = svg.selectAll(".timeLabel")
            .data(times)
            .enter().append("text")
                .text(function(d) { return d; })
                .attr("x", function(d, i) { return i * gridSize; })
                .attr("y", 0)
                .style("text-anchor", "middle")
                .attr("transform", "translate(" + gridSize / 2 + ", -6)")
                .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

        var heatmapChart = function(ldata) {

            var colorScale = d3v3.scale.quantile()
                .domain([0, buckets - 1, d3v3.max(ldata, function (d) { return d.value; })])
                .range(colors);

            var cards = svg.selectAll(".hour")
                .data(ldata, function(d) {return d.day+':'+d.hour;});

            cards.append("title");

            cards.enter().append("rect")
                .attr("x", function(d) { return (d.hour) * gridSize; })
                .attr("y", function(d) { return (d.day) * gridSize; })
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("class", "hour bordered")
                .attr("width", gridSize)
                .attr("height", gridSize)
                .style("fill", colors[0]);

            cards.transition().duration(1000)
                .style("fill", function(d) { return colorScale(d.value); });

            cards.select("title").text(function(d) { return d.value; });
            
            cards.exit().remove();

            var legend = svg.selectAll(".legend")
                .data([0].concat(colorScale.quantiles()), function(d) { return d; });

            legend.enter().append("g")
                .attr("class", "legend");

            legend.append("rect")
                .attr("x", function(d, i) { return legendElementWidth * i; })
                .attr("y", height)
                .attr("width", legendElementWidth)
                .attr("height", gridSize / 2)
                .style("fill", function(d, i) { return colors[i]; });

            legend.append("text")
                .attr("class", "mono")
                .text(function(d) { return ">= " + Math.round(d); })
                .attr("x", function(d, i) { return legendElementWidth * i; })
                .attr("y", height + gridSize);

            legend.exit().remove();
        };

      heatmapChart(ldata);
      
    //   var datasetpicker = d3v3.select("#dataset-picker").selectAll(".dataset-button")
    //     .data(datasets);

    //   datasetpicker.enter()
    //     .append("input")
    //     .attr("value", function(d){ return "Dataset " + d })
    //     .attr("type", "button")
    //     .attr("class", "dataset-button")
    //     .on("click", function(d) {
    //       heatmapChart(d);
    //     });

    };
};

var Evolution = new function() {
    this.renderValueEvolution = function(dataset, container, yAxisText) {
        //TODO take from rawData and then comment metricCount, months, name and transformRawData's last two dataset.forEach
        var metricName   = "views";
    //     var metricCount  = [1, 3, 1, 2, 1, 1, 1, 1, 2, 2, 3, 1, 2, 1, 4, 3, 2, 1, 1, 1, 1, 1, 4, 2, 1, 2, 8, 2, 1, 4, 2, 4, 1, 3, 1, 2, 1, 1, 3, 1, 1, 5, 1, 1, 4];
    //     var metricMonths = ["2018-06", "2013-04", "2015-11", "2012-10", "2014-09", "2014-02", "2016-02", "2016-04", "2016-06", "2014-12", "2013-07", "2017-01", "2015-10", "2012-12", "2013-05", "2018-04", "2015-06", "2017-03", "2014-08",
    //                 "2017-07", "2013-02", "2012-07", "2016-03", "2017-06", "2018-07", "2014-10", "2013-01", "2013-10", "2017-11", "2014-05", "2012-11", "2015-01", "2018-03", "2015-12", "2015-08", "2016-08", "2014-11", "2014-01",
    //                 "2013-06", "2012-08", "2015-09", "2016-07", "2013-03", "2012-09", "2016-05"];

    //     /*
    //     * ========================================================================
    //     *  Prepare data
    //     * ========================================================================
    //     */

    //    var dataset = [];
    //    for(var i=0; i<metricCount.length; i++){
    //        var obj = {count: metricCount[i], month: metricMonths[i]};
    //        dataset.push(obj);
    //    }
       

        // console.log("dataSet");
        // console.log(dataset);
        // format month as a date
        dataset.forEach(function(d) {
            d.month = d3v3.time.format("%Y-%m").parse(d.date);
        });

        // sort dataset by month
        dataset.sort(function(x, y){
            return d3v3.ascending(x.month, y.month);
        });

        /*
        * ========================================================================
        *  sizing
        * ========================================================================
        */

        /* === Focus chart === */

        var optwidth        = 600;
        var optheight       = 370;

        var margin	= {top: 20, right: 30, bottom: 100, left: 20},
        width	= optwidth - margin.left - margin.right,
        height	= optheight - margin.top - margin.bottom;

        /* === Context chart === */

        //timeline change
        var timelineMargin = {top: 20, right: 30, bottom: 100, left: 20},
        timelineHeight = 56,
        timelineWidth = 558;

        var margin_context = {top: 320, right: 30, bottom: 20, left: 20},
        height_context = optheight - margin_context.top - margin_context.bottom;

        /*
        * ========================================================================
        *  x and y coordinates
        * ========================================================================
        */

        // the date range of available data:
        var dataXrange = d3v3.extent(dataset, function(d) { return d.month; });
        var dataYrange = [0, d3v3.max(dataset, function(d) { return d.count; })];

        // maximum date range allowed to display
        var mindate = dataXrange[0],  // use the range of the data
            maxdate = dataXrange[1];

        var DateFormat	  =  d3v3.time.format("%b %Y");

        var dynamicDateFormat = timeFormat([
            [d3v3.time.format("%Y"), function() { return true; }],// <-- how to display when Jan 1 YYYY
            [d3v3.time.format("%b %Y"), function(d) { return d.getMonth(); }],
            [function(){return "";}, function(d) { return d.getDate() != 1; }]
        ]);

        // var dynamicDateFormat =  timeFormat([
        //     [d3.time.format("%Y"), function() { return true; }],
        //     [d3.time.format("%b"), function(d) { return d.getMonth(); }],
        //     [function(){return "";}, function(d) { return d.getDate() != 1; }]
        // ]);

        /* === Focus Chart === */

        var x = d3v3.time.scale()
            .range([0, (width)])
            .domain(dataXrange);

        var y = d3v3.scale.linear()
            .range([height, 0])
            .domain(dataYrange);

        var xAxis = d3v3.svg.axis()
            .scale(x)
            .orient("bottom")
                .tickSize(-(height))
            .ticks(customTickFunction)
            .tickFormat(dynamicDateFormat);

        var yAxis = d3v3.svg.axis()
            .scale(y)
            .ticks(4)
            .tickSize(-(width))
            .orient("right");

        /* === Context Chart === */

        var x2 = d3v3.time.scale()
            .range([0, width])
            .domain([mindate, maxdate]);

        var y2 = d3v3.scale.linear()
            .range([height_context, 0])
            .domain(y.domain());

        var xAxis_context = d3v3.svg.axis()
            .scale(x2)
            .orient("bottom")
            .ticks(customTickFunction)
            .tickFormat(dynamicDateFormat);

        /*
        * ========================================================================
        *  Plotted line and area variables
        * ========================================================================
        */

        /* === Focus Chart === */

        var line = d3v3.svg.line()
            .x(function(d) { return x(d.month); })
            .y(function(d) { return y(d.count); });

        var area = d3v3.svg.area()
        .x(function(d) { return x(d.month); })
        .y0((height))
        .y1(function(d) { return y(d.count); });

        /* === Context Chart === */

        var area_context = d3v3.svg.area()
            .x(function(d) { return x2(d.month); })
            .y0((height_context))
            .y1(function(d) { return y2(d.count); });

        var line_context = d3v3.svg.line()
            .x(function(d) { return x2(d.month); })
            .y(function(d) { return y2(d.count); });

        /*
        * ========================================================================
        *  Variables for brushing and zooming behaviour
        * ========================================================================
        */

        var brush = d3v3.svg.brush()
            .x(x2)
            .on("brush", brushed)
            .on("brushend", brushend);

        var zoom = d3v3.behavior.zoom()
            .on("zoom", draw)
            .on("zoomend", brushend);

        /*
        * ========================================================================
        *  Define the SVG area ("vis") and append all the layers
        * ========================================================================
        */

        // === the main components === //
        $(container).empty();
        var vis = d3v3.select(container).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("class", "metric-chart"); // CB -- "line-chart" -- CB //
        
        // timelinechange
        // var timeline = d3v3.select("#timeline").append("svg")
        //     .attr("width", width + margin.left + margin.right)
        //     .attr("height", timelineHeight + margin.top + margin.bottom)
        //     .attr("class", "metric-chart");

        vis.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

        // timelinechange
        // timeline.append("defs").append("clipPath")
        //     .attr("id", "clip")
        //     .append("rect")
        //     .attr("width", width)
        //     .attr("height", height);
            // clipPath is used to keep line and area from moving outside of plot area when user zooms/scrolls/brushes

        // timelinechange use this instead of code after this.
        // var context = timeline.append("g")
        //     .attr("class", "context");
        var context = vis.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + margin_context.left + "," + margin_context.top + ")");

        var focus = vis.append("g")
            .attr("class", "focus")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var rect = vis.append("svg:rect")
            .attr("class", "pane")
            .attr("width", width)
            .attr("height", height)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(zoom)
            .call(draw);

        // === current date range text & zoom buttons === //

        var display_range_group = vis.append("g")
            .attr("id", "buttons_group")
            .attr("transform", "translate(" + 0 + ","+ 0 +")");

        var expl_text = display_range_group.append("text")
            .text("Showing data from: ")
            .style("text-anchor", "start")
            .attr("transform", "translate(" + 0 + ","+ 10 +")");

        display_range_group.append("text")
            .attr("id", "displayDates")
            .text(DateFormat(dataXrange[0]) + " - " + DateFormat(dataXrange[1]))
            .style("text-anchor", "start")
            .attr("transform", "translate(" + 82 + ","+ 10 +")");

        var expl_text = display_range_group.append("text")
            .text("Zoom to: ")
            .style("text-anchor", "start")
            .attr("transform", "translate(" + 180 + ","+ 10 +")");

        // === the zooming/scaling buttons === //

        var button_width = 40;
        var button_height = 14;

        // don't show year button if < 1 year of data
        var dateRange  = dataXrange[1] - dataXrange[0],
            ms_in_year = 31540000000;

        if (dateRange < ms_in_year)   {
            var button_data =["month","data"];
        } else {
            var button_data =["year","month","data"];
        };

        var button = display_range_group.selectAll("g")
            .data(button_data)
            .enter().append("g")
            .attr("class", "scale_button")
            .attr("transform", function(d, i) { return "translate(" + (220 + i*button_width + i*10) + ",0)"; })
            .on("click", scaleDate);

        button.append("rect")
            .attr("width", button_width)
            .attr("height", button_height)
            .attr("rx", 1)
            .attr("ry", 1);

        button.append("text")
            .attr("dy", (button_height/2 + 3))
            .attr("dx", button_width/2)
            .style("text-anchor", "middle")
            .text(function(d) { return d; });

        /* === focus chart === */

        focus.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .attr("transform", "translate(" + (width) + ", 0)");

        focus.append("path")
            .datum(dataset)
            .attr("class", "area")
            .attr("d", area);

        focus.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        focus.append("path")
            .datum(dataset)
            .attr("class", "line")
            .attr("d", line);

        /* === context chart === */

        context.append("path")
            .datum(dataset)
            .attr("class", "area")
            .attr("d", area_context);

        context.append("path")
            .datum(dataset)
            .attr("class", "line")
            .attr("d", line_context);

        context.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height_context + ")")
            .call(xAxis_context);

        /* === brush (part of context chart)  === */

        var brushg = context.append("g")
            .attr("class", "x brush")
            .call(brush);

        brushg.selectAll(".extent")
        .attr("y", -6)
        .attr("height", height_context + 8);
        // .extent is the actual window/rectangle showing what's in focus

        brushg.selectAll(".resize")
            .append("rect")
            .attr("class", "handle")
            .attr("transform", "translate(0," +  -3 + ")")
            .attr('rx', 2)
            .attr('ry', 2)
            .attr("height", height_context + 6)
            .attr("width", 3);

        brushg.selectAll(".resize")
            .append("rect")
            .attr("class", "handle-mini")
            .attr("transform", "translate(-2,8)")
            .attr('rx', 3)
            .attr('ry', 3)
            .attr("height", (height_context/2))
            .attr("width", 7);
            // .resize are the handles on either size
            // of the 'window' (each is made of a set of rectangles)

        /* === y axis title === */

        vis.append("text")
            .attr("class", "y axis title")
            // .text("Monthly " + this.metricName)
            .text(yAxisText)
            .attr("x", (-(height/2)))
            .attr("y", 0)
            .attr("dy", "1em")
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle");

        // allows zooming before any brush action
        zoom.x(x);

        /*
        * ========================================================================
        *  Functions
        * ========================================================================
        */

        // === tick/date formatting functions ===
        // from: https://stackoverflow.com/questions/20010864/d3-axis-labels-become-too-fine-grained-when-zoomed-in

        function timeFormat(formats) {
        return function(date) {
            var i = formats.length - 1, f = formats[i];
            while (!f[1](date)) f = formats[--i];
            return f[0](date);
        };
        };

        function customTickFunction(t0, t1, dt)  {
            var labelSize = 42; //
            var maxTotalLabels = Math.floor(width / labelSize);

            function step(date, offset)
            {
                date.setMonth(date.getMonth() + offset);
            }

            var time = d3v3.time.month.ceil(t0), times = [], monthFactors = [1,3,4,12];

            while (time < t1) times.push(new Date(+time)), step(time, 1);
            var timesCopy = times;
            var i;
            for(i=0 ; times.length > maxTotalLabels ; i++)
                times = timesCopy.filter(function(d){
                    return (d.getMonth()) % monthFactors[i] == 0;
                });

            return times;
        };

        // === brush and zoom functions ===

        function brushed() {

            x.domain(brush.empty() ? x2.domain() : brush.extent());
            focus.select(".area").attr("d", area);
            focus.select(".line").attr("d", line);
            focus.select(".x.axis").call(xAxis);
            // Reset zoom scale's domain
            zoom.x(x);
            updateDisplayDates();
            setYdomain();

        };

        function draw() {
            setYdomain();
            focus.select(".area").attr("d", area);
            focus.select(".line").attr("d", line);
            focus.select(".x.axis").call(xAxis);
            //focus.select(".y.axis").call(yAxis);
            // Force changing brush range
            brush.extent(x.domain());
            vis.select(".brush").call(brush);
            // and update the text showing range of dates.
            updateDisplayDates();
        };

        function brushend() {
        // when brush stops moving:

            // check whether chart was scrolled out of bounds and fix,
            var b = brush.extent();
            var out_of_bounds = brush.extent().some(function(e) { return e < mindate | e > maxdate; });
            if (out_of_bounds){ b = moveInBounds(b) };

        };

        function updateDisplayDates() {

            var b = brush.extent();
            // update the text that shows the range of displayed dates
            var localBrushDateStart = (brush.empty()) ? DateFormat(dataXrange[0]) : DateFormat(b[0]),
                localBrushDateEnd   = (brush.empty()) ? DateFormat(dataXrange[1]) : DateFormat(b[1]);

            // Update start and end dates in upper right-hand corner
            d3v3.select("#displayDates")
                .text(localBrushDateStart == localBrushDateEnd ? localBrushDateStart : localBrushDateStart + " - " + localBrushDateEnd);
        };

        function moveInBounds(b) {
        // move back to boundaries if user pans outside min and max date.

            var ms_in_year = 31536000000,
                brush_start_new,
                brush_end_new;

            if       (b[0] < mindate)   { brush_start_new = mindate; }
            else if  (b[0] > maxdate)   { brush_start_new = new Date(maxdate.getTime() - ms_in_year); }
            else                        { brush_start_new = b[0]; };

            if       (b[1] > maxdate)   { brush_end_new = maxdate; }
            else if  (b[1] < mindate)   { brush_end_new = new Date(mindate.getTime() + ms_in_year); }
            else                        { brush_end_new = b[1]; };

            brush.extent([brush_start_new, brush_end_new]);

            brush(d3v3.select(".brush").transition());
            brushed();
            draw();

            return(brush.extent())
        };

        function setYdomain(){
        // this function dynamically changes the y-axis to fit the data in focus

            // get the min and max date in focus
            var xleft = new Date(x.domain()[0]);
            var xright = new Date(x.domain()[1]);

            // a function that finds the nearest point to the right of a point
            var bisectDate = d3v3.bisector(function(d) { return d.month; }).right;

            // get the y value of the line at the left edge of view port:
            var iL = bisectDate(dataset, xleft);

            if (dataset[iL] !== undefined && dataset[iL-1] !== undefined) {

                var left_dateBefore = dataset[iL-1].month,
                    left_dateAfter = dataset[iL].month;

                var intfun = d3v3.interpolateNumber(dataset[iL-1].count, dataset[iL].count);
                var yleft = intfun((xleft-left_dateBefore)/(left_dateAfter-left_dateBefore));
            } else {
                var yleft = 0;
            }

            // get the x value of the line at the right edge of view port:
            var iR = bisectDate(dataset, xright);

            if (dataset[iR] !== undefined && dataset[iR-1] !== undefined) {

                var right_dateBefore = dataset[iR-1].month,
                    right_dateAfter = dataset[iR].month;

                var intfun = d3v3.interpolateNumber(dataset[iR-1].count, dataset[iR].count);
                var yright = intfun((xright-right_dateBefore)/(right_dateAfter-right_dateBefore));
            } else {
                var yright = 0;
            }

            // get the y values of all the actual data points that are in view
            var dataSubset = dataset.filter(function(d){ return d.month >= xleft && d.month <= xright; });
            var countSubset = [];
            dataSubset.map(function(d) {countSubset.push(d.count);});

            // add the edge values of the line to the array of counts in view, get the max y;
            countSubset.push(yleft);
            countSubset.push(yright);
            var ymax_new = d3v3.max(countSubset);

            if(ymax_new == 0){
                ymax_new = dataYrange[1];
            }

            // reset and redraw the yaxis
            y.domain([0, ymax_new*1.05]);
            focus.select(".y.axis").call(yAxis);

        };

        function scaleDate(d,i) {
        // action for buttons that scale focus to certain time interval

            var b = brush.extent(),
                interval_ms,
                brush_end_new,
                brush_start_new;

            if      (d == "year")   { interval_ms = 31536000000}
            else if (d == "month")  { interval_ms = 2592000000 };

            if ( d == "year" | d == "month" )  {

                if((maxdate.getTime() - b[1].getTime()) < interval_ms){
                // if brush is too far to the right that increasing the right-hand brush boundary would make the chart go out of bounds....
                    brush_start_new = new Date(maxdate.getTime() - interval_ms); // ...then decrease the left-hand brush boundary...
                    brush_end_new = maxdate; //...and set the right-hand brush boundary to the maxiumum limit.
                } else {
                // otherwise, increase the right-hand brush boundary.
                    brush_start_new = b[0];
                    brush_end_new = new Date(b[0].getTime() + interval_ms);
                };

            } else if ( d == "data")  {
                brush_start_new = dataXrange[0];
                brush_end_new = dataXrange[1]
            } else {
                brush_start_new = b[0];
                brush_end_new = b[1];
            };

            brush.extent([brush_start_new, brush_end_new]);

            // now draw the brush to match our extent
            brush(d3v3.select(".brush").transition());
            // now fire the brushstart, brushmove, and brushend events
            brush.event(d3v3.select(".brush").transition());
        };
    };
};

var WordCloud = new function() {    
    this.renderWordCloud = function(foodItemsData, reviews) {        
        this.reviews = reviews;

        $("#cloud-container").on('click', "text", function(){
            console.log($(this).text());
            var key = $(this).text();
            // console.log(reviews);
            // console.log(reviews[key]);

            function getLi(text, date, stars) {
                var imgEle = "<img class='reviewImagae border' src='images/comment.png'/>";    
                var dateSpan = "<span>" + date + "</span>";
                var star = "⭐";
                var starsSpan = "<span>" + star.repeat(parseInt(stars)) + "</span>";
                var textSpan = "<span>" + text + "</span>";
                return "<li class='border'>" + imgEle + "   | " + starsSpan + " |   " + textSpan + "</li>";
            }

            function highlight(text, val) {               
                var innerHTML = text;
                var index = innerHTML.indexOf(val);
                if (index >= 0) { 
                 innerHTML = innerHTML.substring(0,index) + "<span class='highlight'>" + innerHTML.substring(index,index+text.length) + "</span>" + innerHTML.substring(index + text.length);
                 return innerHTML;
                }
                return text;
            }

            var reviewsText = "";
            console.log("reviews");
            console.log(key);
            console.log(reviews);            
            for(var i=0; i<reviews[key].length; i++) {
                // console.log(reviews[key][i]);
                var obj = reviews[key][i];
                // console.log(highlight(obj["text"], key));
                // console.log(obj);
                // console.log(obj["text"].replace(key,"<span>"+key+"</span>"));
                var re = new RegExp(key, 'g');                
                reviewsText += getLi(obj["text"].replace(re, "<span class='highlight'>"+key+"</span>"), obj["date"], obj["stars"]);
            }
            console.log("reviewsText");
            // console.log(reviewsText);
            $("#reviewsList").html(reviewsText);
        });

        function WordCloud(options) {
            $(options.container).empty();
            var margin = {top: 70, right: 100, bottom: 0, left: 100},
                     w = 1200 - margin.left - margin.right,
                     h = 400 - margin.top - margin.bottom;
          
            // create the svg
            var svg = d3v5.select(options.container).append("svg")
                        .attr('height', h + margin.top + margin.bottom)
                        .attr('width', w + margin.left + margin.right)
          
            // set the ranges for the scales
            var xScale = d3v5.scaleLinear().range([10, 100]);
          
            var focus = svg.append('g')
                           .attr("transform", "translate(" + [w/2, h/2+margin.top] + ")")
          
            // var colorMap = ['red', '#a38b07', "blue","yellow"];
            var colorMap = ["#48A36D",  "#56AE7C",  "#64B98C", "#72C39B", "#80CEAA", "#80CCB3", "#7FC9BD", "#7FC7C6", "#7EC4CF", "#7FBBCF", "#7FB1CF", "#80A8CE", "#809ECE", "#8897CE", "#8F90CD", "#9788CD", "#9E81CC", "#AA81C5", "#B681BE", "#C280B7", "#CE80B0", "#D3779F", "#D76D8F", "#DC647E", "#E05A6D", "#E16167", "#E26962", "#E2705C", "#E37756", "#E38457", "#E39158", "#E29D58", "#E2AA59", "#E0B15B", "#DFB95C", "#DDC05E", "#DBC75F", "#E3CF6D", "#EAD67C", "#F2DE8A"];
          
            // seeded random number generator
            var arng = new alea('hello.');
          
            var data;
            
            function renderStuff(d) { 
                // if (error) throw error;
              data = d;
              var word_entries = d3v5.entries(data['count']);
              xScale.domain(d3v5.extent(word_entries, function(d) {return d.value;}));
          
              makeCloud();
          
              function makeCloud() {
                d3.layout.cloud().size([w, h])
                         .timeInterval(20)
                         .words(word_entries)
                         .fontSize(function(d) { return xScale(+d.value); })
                         .text(function(d) { return d.key; })
                         .font("Impact")
                         .random(arng)
                         .on("end", function(output) {
                           // sometimes the word cloud can't fit all the words- then redraw
                           // https://github.com/jasondavies/d3-cloud/issues/36
                           if (word_entries.length !== output.length) {
                             console.log("not all words included- recreating");
                             makeCloud();
                             return undefined;
                           } else { draw(output); }
                         })
                         .start();
              }
          
              d3.layout.cloud().stop();
            };
            renderStuff(options.data);
          
            function draw(words) {
              focus.selectAll("text")
                   .data(words)
                   .enter().append("text")
                   .style("font-size", function(d) { return xScale(d.value) + "px"; })
                   .style("font-family", "Impact")
                   .style("fill", function(d, i) { return colorMap[~~(arng() *colorMap.length)]; })
                   .attr("text-anchor", "middle")
                   .attr("transform", function(d) {
                     return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                   })
                   .text(function(d) { return d.key; })
                   .on('mouseover', handleMouseOver)
                   .on('mouseout', handleMouseOut);
            }
          
            function handleMouseOver(d) {
              var group = focus.append('g')
                               .attr('id', 'story-titles');
               var base = d.y - d.size;
          
              group.selectAll('text')
                   .data(data['sample_title'][d.key])
                   .enter().append('text')
                   .attr('x', d.x)
                   .attr('y', function(title, i) {
                     return (base - i*14);
                   })
                   .attr('text-anchor', 'middle')
                   .text(function(title) { return title; });
          
              var bbox = group.node().getBBox();
              var bboxPadding = 5;
          
              // place a white background to see text more clearly
              var rect = group.insert('rect', ':first-child')
                            .attr('x', bbox.x)
                            .attr('y', bbox.y)
                            .attr('width', bbox.width + bboxPadding)
                            .attr('height', bbox.height + bboxPadding)
                            .attr('rx', 10)
                            .attr('ry', 10)
                            .attr('class', 'label-background-strong');
            }
          
            function handleMouseOut(d) {
                d3v5.select('#story-titles').remove();
            }
          }
          console.log("renderWordCloud");
          console.log(foodItemsData);
          WordCloud({
            container: '#cloud-container',
            data: foodItemsData
          });
    };
    
}

var EvolutionVisualization = new function() {
    this.renderEvolution = function(data) {
        $("#evolutionComparison").empty();
        console.log("evolution");
        console.log(data);
        var margin = {top: 20, right: 200, bottom: 100, left: 50},
            margin2 = { top: 430, right: 10, bottom: 20, left: 40 },
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom,
            height2 = 500 - margin2.top - margin2.bottom;

        var parseDate = d3v3.time.format("%Y%m%d").parse;
        var bisectDate = d3v3.bisector(function(d) { return d.date; }).left;

        var xScale = d3v3.time.scale()
            .range([0, width]),

            xScale2 = d3v3.time.scale()
            .range([0, width]); // Duplicate xScale for brushing ref later

        var yScale = d3v3.scale.linear()
            .range([height, 0]);

        // 40 Custom DDV colors 
        // var color = d3v3.scale.ordinal().range(["#48A36D",  "#56AE7C",  "#64B98C", "#72C39B", "#80CEAA", "#80CCB3", "#7FC9BD", "#7FC7C6", "#7EC4CF", "#7FBBCF", "#7FB1CF", "#80A8CE", "#809ECE", "#8897CE", "#8F90CD", "#9788CD", "#9E81CC", "#AA81C5", "#B681BE", "#C280B7", "#CE80B0", "#D3779F", "#D76D8F", "#DC647E", "#E05A6D", "#E16167", "#E26962", "#E2705C", "#E37756", "#E38457", "#E39158", "#E29D58", "#E2AA59", "#E0B15B", "#DFB95C", "#DDC05E", "#DBC75F", "#E3CF6D", "#EAD67C", "#F2DE8A"]);  
        var color = d3v3.scale.ordinal().range(["red", "green", "blue"]);  

        var xAxis = d3v3.svg.axis()
            .scale(xScale)
            .orient("bottom"),

            xAxis2 = d3v3.svg.axis() // xAxis for brush slider
            .scale(xScale2)
            .orient("bottom");    

        var yAxis = d3v3.svg.axis()
            .scale(yScale)
            .orient("left");  

        var line = d3v3.svg.line()
            .interpolate("basis")
            .x(function(d) { return xScale(d.date); })
            .y(function(d) { return yScale(d.rating); })
            .defined(function(d) { return d.rating; });  // Hiding line value defaults of 0 for missing data

        var maxY; // Defined later to update yAxis        
        var svg = d3v3.select("#evolutionComparison").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom) //height + margin.top + margin.bottom
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Create invisible rect for mouse tracking
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)                                    
            .attr("x", 0) 
            .attr("y", 0)
            .attr("id", "mouse-tracker")
            .style("fill", "white"); 

        //for slider part-----------------------------------------------------------------------------------
        
        var context = svg.append("g") // Brushing context box container
            .attr("transform", "translate(" + 0 + "," + 410 + ")")
            .attr("class", "context");

        //append clip path for lines plotted, hiding those part out of bounds
        svg.append("defs")
        .append("clipPath") 
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height); 

        //end slider part----------------------------------------------------------------------------------- 

        // d3.tsv("data.tsv", function(error, data) { 
            console.log("data[0]");
            console.log(data[0]);
        color.domain(d3v3.keys(data[0]).filter(function(key) { // Set the domain of the color ordinal scale to be all the csv headers except "date", matching a color to an issue
            return key !== "date"; 
        }));
        

        console.log("dataaa");
        console.log(data);
        data.forEach(function(d) { // Make every date in the csv data a javascript date object format
            // d.date = parseDate(d.date+"");
            d.date = moment.unix(d.date)._d
        });
        
        console.log("cdcd");
        console.log(color);
        var categories = color.domain().map(function(name) { // Nest the data into an array of objects with new keys

            return {
            name: name, // "name": the csv headers except date
            values: data.map(function(d) { // "values": which has an array of the dates and ratings
                return {
                date: d.date, 
                rating: +(d[name]),
                };
            }),
            // visible: (name === "Unemployment" ? true : false) // "visible": all false except for economy which is true.
            visible: true
            };
        });

        console.log("categories");
        console.log(categories);

        xScale.domain(d3v3.extent(data, function(d) { return d.date; })); // extent = highest and lowest points, domain is data, range is bouding box

        yScale.domain([0, 5
            //d3.max(categories, function(c) { return d3.max(c.values, function(v) { return v.rating; }); })
        ]);

        xScale2.domain(xScale.domain()); // Setting a duplicate xdomain for brushing reference later
        
        //for slider part-----------------------------------------------------------------------------------

        var brush = d3v3.svg.brush()//for slider bar at the bottom
            .x(xScale2) 
            .on("brush", brushed);

        context.append("g") // Create brushing xAxis
            .attr("class", "x axis1")
            .attr("transform", "translate(0," + height2 + ")")
            .call(xAxis2);

        var contextArea = d3v3.svg.area() // Set attributes for area chart in brushing context graph
            .interpolate("monotone")
            .x(function(d) { return xScale2(d.date); }) // x is scaled to xScale2
            .y0(height2) // Bottom line begins at height2 (area chart not inverted) 
            .y1(0); // Top line of area, 0 (area chart not inverted)

        //plot the rect as the bar at the bottom
        context.append("path") // Path is created using svg.area details
            .attr("class", "area")
            .attr("d", contextArea(categories[0].values)) // pass first categories data .values to area path generator 
            .attr("fill", "#F1F1F2");
            
        //append the brush for the selection of subsection  
        context.append("g")
            .attr("class", "x brush")
            .call(brush)
            .selectAll("rect")
            .attr("height", height2) // Make brush rects same height 
            .attr("fill", "#E6E7E8");  
        //end slider part-----------------------------------------------------------------------------------

        // draw line graph
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("x", -10)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Correlation between ratings and sentiment.");

        var issue = svg.selectAll(".issue")
            .data(categories) // Select nested data and append to new svg group elements
            .enter().append("g")
            .attr("class", "issue");   

        issue.append("path")
            .attr("class", "line")
            .style("pointer-events", "none") // Stop line interferring with cursor
            .attr("id", function(d) {
                return "line-" + d.name.replace(" ", "").replace("/", ""); // Give line id of line-(insert issue name, with any spaces replaced with no spaces)
            })
            .attr("d", function(d) { 
                return d.visible ? line(d.values) : null; // If array key "visible" = true then draw line, if not then don't 
            })
            .attr("clip-path", "url(#clip)")//use clip path to make irrelevant part invisible
            .style("stroke", function(d) { return color(d.name); });

        // draw legend
        var legendSpace = 450 / categories.length; // 450/number of issues (ex. 40)    

        issue.append("rect")
            .attr("width", 10)
            .attr("height", 10)                                    
            .attr("x", width + (margin.right/3) - 15) 
            .attr("y", function (d, i) { return (legendSpace)+i*(legendSpace) - 8; })  // spacing
            .attr("fill",function(d) {
                return d.visible ? color(d.name) : "#F1F1F2"; // If array key "visible" = true then color rect, if not then make it grey 
            })
            .attr("class", "legend-box")

            .on("click", function(d){ // On click make d.visible 
                d.visible = !d.visible; // If array key for this data selection is "visible" = true then make it false, if false then make it true

                maxY = findMaxY(categories); // Find max Y rating value categories data with "visible"; true
                yScale.domain([0,maxY]); // Redefine yAxis domain based on highest y value of categories data with "visible"; true
                svg.select(".y.axis")
                .transition()
                .call(yAxis);   

                issue.select("path")
                .transition()
                .attr("d", function(d){
                    return d.visible ? line(d.values) : null; // If d.visible is true then draw line for this d selection
                })

                issue.select("rect")
                .transition()
                .attr("fill", function(d) {
                return d.visible ? color(d.name) : "#F1F1F2";
                });
            })

            .on("mouseover", function(d){

                d3v3.select(this)
                .transition()
                .attr("fill", function(d) { return color(d.name); });

                d3v3.select("#line-" + d.name.replace(" ", "").replace("/", ""))
                .transition()
                .style("stroke-width", 2.5);  
            })

            .on("mouseout", function(d){

                d3v3.select(this)
                .transition()
                .attr("fill", function(d) {
                return d.visible ? color(d.name) : "#F1F1F2";});

                d3v3.select("#line-" + d.name.replace(" ", "").replace("/", ""))
                .transition()
                .style("stroke-width", 1.5);
            })
            
        issue.append("text")
            .attr("x", width + (margin.right/3)) 
            .attr("y", function (d, i) { return (legendSpace)+i*(legendSpace); })  // (return (11.25/2 =) 5.625) + i * (5.625) 
            .text(function(d) { return d.name; }); 

        // Hover line 
        var hoverLineGroup = svg.append("g") 
                    .attr("class", "hover-line");

        var hoverLine = hoverLineGroup // Create line with basic attributes
                .append("line")
                    .attr("id", "hover-line")
                    .attr("x1", 10).attr("x2", 10) 
                    .attr("y1", 0).attr("y2", height + 10)
                    .style("pointer-events", "none") // Stop line interferring with cursor
                    .style("opacity", 1e-6); // Set opacity to zero 

        var hoverDate = hoverLineGroup
                .append('text')
                    .attr("class", "hover-text")
                    .attr("y", height - (height-40)) // hover date text position
                    .attr("x", width - 150) // hover date text position
                    .style("fill", "#E6E7E8");

        var columnNames = d3v3.keys(data[0]) //grab the key values from your first data row
                                            //these are the same as your column names
                        .slice(1); //remove the first column name (`date`);

        var focus = issue.select("g") // create group elements to house tooltip text
            .data(columnNames) // bind each column name date to each g element
            .enter().append("g") //create one <g> for each columnName
            .attr("class", "focus"); 

        focus.append("text") // http://stackoverflow.com/questions/22064083/d3-js-multi-series-chart-with-y-value-tracking
                .attr("class", "tooltip")
                .attr("x", width + 20) // position tooltips  
                .attr("y", function (d, i) { return (legendSpace)+i*(legendSpace); }); // (return (11.25/2 =) 5.625) + i * (5.625) // position tooltips       

        // Add mouseover events for hover line.
        d3v3.select("#mouse-tracker") // select chart plot background rect #mouse-tracker
        .on("mousemove", mousemove) // on mousemove activate mousemove function defined below
        .on("mouseout", function() {
            hoverDate
                .text(null) // on mouseout remove text for hover date

            d3v3.select("#hover-line")
                .style("opacity", 1e-6); // On mouse out making line invisible
        });

        function mousemove() { 
            var mouse_x = d3v3.mouse(this)[0]; // Finding mouse x position on rect
            var graph_x = xScale.invert(mouse_x); // 

            //var mouse_y = d3.mouse(this)[1]; // Finding mouse y position on rect
            //var graph_y = yScale.invert(mouse_y);
            //console.log(graph_x);
            
            var format = d3v3.time.format('%b %Y'); // Format hover date text to show three letter month and full year
            
            hoverDate.text(format(graph_x)); // scale mouse position to xScale date and format it to show month and year
            
            d3v3.select("#hover-line") // select hover-line and changing attributes to mouse position
                .attr("x1", mouse_x) 
                .attr("x2", mouse_x)
                .style("opacity", 1); // Making line visible

            // Legend tooltips // http://www.d3noob.org/2014/07/my-favourite-tooltip-method-for-line.html

            var x0 = xScale.invert(d3v3.mouse(this)[0]), /* d3.mouse(this)[0] returns the x position on the screen of the mouse. xScale.invert function is reversing the process that we use to map the domain (date) to range (position on screen). So it takes the position on the screen and converts it into an equivalent date! */
            i = bisectDate(data, x0, 1), // use our bisectDate function that we declared earlier to find the index of our data array that is close to the mouse cursor
            /*It takes our data array and the date corresponding to the position of or mouse cursor and returns the index number of the data array which has a date that is higher than the cursor position.*/
            d0 = data[i - 1],
            d1 = data[i],
            /*d0 is the combination of date and rating that is in the data array at the index to the left of the cursor and d1 is the combination of date and close that is in the data array at the index to the right of the cursor. In other words we now have two variables that know the value and date above and below the date that corresponds to the position of the cursor.*/
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;
            /*The final line in this segment declares a new array d that is represents the date and close combination that is closest to the cursor. It is using the magic JavaScript short hand for an if statement that is essentially saying if the distance between the mouse cursor and the date and close combination on the left is greater than the distance between the mouse cursor and the date and close combination on the right then d is an array of the date and close on the right of the cursor (d1). Otherwise d is an array of the date and close on the left of the cursor (d0).*/

            //d is now the data row for the date closest to the mouse position

            focus.select("text").text(function(columnName){
                //because you didn't explictly set any data on the <text>
                //elements, each one inherits the data from the focus <g>

                return (d[columnName]);
            });
        }; 

        //for brusher of the slider bar at the bottom
        function brushed() {

            xScale.domain(brush.empty() ? xScale2.domain() : brush.extent()); // If brush is empty then reset the Xscale domain to default, if not then make it the brush extent 

            svg.select(".x.axis") // replot xAxis with transition when brush used
                .transition()
                .call(xAxis);

            maxY = findMaxY(categories); // Find max Y rating value categories data with "visible"; true
            yScale.domain([0,maxY]); // Redefine yAxis domain based on highest y value of categories data with "visible"; true
            
            svg.select(".y.axis") // Redraw yAxis
            .transition()
            .call(yAxis);   

            issue.select("path") // Redraw lines based on brush xAxis scale and domain
            .transition()
            .attr("d", function(d){
                return d.visible ? line(d.values) : null; // If d.visible is true then draw line for this d selection
            });
            
        };      

        // }); // End Data callback function
        
        function findMaxY(data){  // Define function "findMaxY"
        // console.log(data);
            var maxYValues = data.map(function(d) { 
            if (d.visible){
                return d3v3.max(d.values, function(value) { // Return max rating value
                return value.rating; })
            }
            });
            return d3v3.max(maxYValues);
        }
    }
};

var VisualizationPage = new function() {
    
    this.renderPage = function() {
        //call API here using API util
        console.log("rendering page,..")
        
        // var initialPageResponse = APIUtil.makeInitialCall();
        // $.when(initialPageResponse).done(function(data) {
        //     console.log("data from response: " + data);
        //     //d3 code to render map
        //     this.registerEvents();
        // });

        //this code should be inside the when after the API call is made. TODO. not sure now.
        Map.renderMap();
    };

    this.registerEvents = function() {
        console.log("registering events for the page,..");
        //will have all our page event handlers like click,..
    }
};