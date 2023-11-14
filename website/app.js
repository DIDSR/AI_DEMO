////////////////////////////////     GENERATE DATA & FIGURES     ////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////

const nnData =  JSON.parse(nnBoundary)
var nnCounter = 0
var intervalID

// Create SVG Canvas
var train_svg = d3.select("#training_chart")
var test_svg = d3.select("#testing_chart")


// Create dragPoint object for single point dragging
var dragPoint = d3.drag()
    .on("start", dragstarted)
    .on("drag", draggedPoint)
    .on("end", updateMu)

// create dragPoint object for mu pointer
var dragMu = d3.drag()
    .on("start", dragstarted)
    .on("drag", draggedMu)
    .on("end", dragended)


// set bounds of all generated data
const xDataRange = [0,1000]
const yDataRange = [0,650]
const xPad = 20
const yPad = 10

// empty var for holding decision boundary array and metrics
var decisionBoundary = null
var metrics = null

// empty vars for holding data distributions
var covTrue  = null
var covFalse  = null
var muTrue = null
var muFalse = null

var posTrainData, negTrainData, posTestData, negTestData, posTrainMuGroup, negTrainMuGroup, posTestMuGroup
var negTestMuGroup, posTrainGroup, negTrainGroup, posTestGroup, negTestGroup, trainMu,testMu
var nnTrain = nnData.TrainData
var nnTest = nnData.TestData
var nnTrainGroup, nnTestGroup
var NNdecisionBoundary



// get current dims of both charts
let train_dims = d3.select('#left_chart').node().getBoundingClientRect()
let test_dims = d3.select('#right_chart').node().getBoundingClientRect()

// get requested data sizes
let body = {
    'TrainPosSlider' : d3.select('#TrainPosRange').text(),
    'TestPosSlider' : d3.select('#TestPosRange').text(),
    'TrainNegSlider' : d3.select('#TrainNegRange').text(),
    'TestNegSlider' : d3.select('#TestNegRange').text(),
    'covTrue' : covTrue,
    'covFalse' : covFalse,
    'muTrue' : muTrue,
    'muFalse' : muFalse
}

// call api and get data
getData(body).then((data) => {

    posTrainData = data['TrainPosSlider']
    negTrainData =  data['TrainNegSlider']
    posTestData = data['TestPosSlider']
    negTestData = data['TestNegSlider']
    covTrue = data['covTrue']
    covFalse = data['covFalse']
    muTrue = data['muTrue']
    muFalse = data['muFalse']


    // Calculate mu
    trainMu = [
        {x: d3.mean(posTrainData, d => d.x), y : d3.mean(posTrainData, d => d.y), lab : 'trainTrue'},
        {x: d3.mean(negTrainData, d => d.x), y : d3.mean(negTrainData, d => d.y), lab : 'trainFalse'}
    ]
    testMu = [
        {x: d3.mean(posTestData, d => d.x), y : d3.mean(posTestData, d => d.y), lab : 'testTrue'},
        {x: d3.mean(negTestData, d => d.x), y : d3.mean(negTestData, d => d.y), lab : 'testFalse'}
    ]


    // bind mu values to individual groups
    posTrainMuGroup = train_svg.selectAll("g.TrainTrue")
        .data([trainMu[0]])
        .enter()
        .append("g")

    negTrainMuGroup = train_svg.selectAll("g.TrainFalse")
        .data([trainMu[1]])
        .enter()
        .append("g")
    posTestMuGroup = test_svg.selectAll("g.TestTrue")
        .data([testMu[0]])
        .enter()
        .append("g")

    negTestMuGroup = test_svg.selectAll("g.TestFalse")
        .data([testMu[1]])
        .enter()
        .append("g")

    // bind negative and positive data to groups
    posTrainGroup = posTrainMuGroup.selectAll("g.data")
        .data(posTrainData)
        .enter()
        .append("g")
        .style("fill", "cyan")
        .attr("class", "trainTrue")

    negTrainGroup = negTrainMuGroup.selectAll("g.data")
        .data(negTrainData)
        .enter()
        .append("g")
        .style("fill", "red")
        .attr("class", "trainFalse")

    posTestGroup = posTestMuGroup.selectAll("g.data")
        .data(posTestData)
        .enter()
        .append("g")
        .style("fill", "blue")
        .attr("class", "testTrue")

    negTestGroup = negTestMuGroup.selectAll("g.data")
        .data(negTestData)
        .enter()
        .append("g")
        .style("fill", "red")
        .attr("class", "testFalse")

    // plot mu and points
    plotMu()
    plotData()

    // call drag behavior on mu anchors
    posTrainMuGroup.call(dragMu)
    negTrainMuGroup.call(dragMu)
    posTestMuGroup.call(dragMu)
    negTestMuGroup.call(dragMu)

    // call drag behavior on individual points
    posTrainGroup.call(dragPoint)
    negTrainGroup.call(dragPoint)
    posTestGroup.call(dragPoint)
    negTestGroup.call(dragPoint)


}

)

    


/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////




///////////////////////////////////     PLOTTING FUNCTION     ///////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////

// generates Mu points
function plotMu(){

    // create mu points
    for (let group of [posTrainMuGroup, negTrainMuGroup]){
            group.append("circle")
            .attr("r", 4)
            .style("fill", "black")
            .attr("cx",function(d){return scaleX(d.x,train_dims)})
            .attr("cy",function(d){return scaleY(d.y,train_dims);})
            .attr("class", "mu")
            .attr('lab', function(d){return d.lab})
            .on('mouseover', handleMouseOver)
            .on('mouseout', handleMouseOutMu)
    }

    // create mu points
    for (let group of [posTestMuGroup, negTestMuGroup]){
        group.append("circle")
        .attr("r", 4)
        .style("fill", "black")
        .attr("cx",function(d){return scaleX(d.x,test_dims)})
        .attr("cy",function(d){return scaleY(d.y,test_dims);})
        .attr("class", "mu")
        .attr('lab', function(d){return d.lab})
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOutMu)
    }
}

// generates data points
function plotData(){

    // create points
    posTrainGroup.append("circle")
        .attr("r", 2)
        .style("fill", "#3370ff")
        .attr('opacity', 1)
        .attr("cx",function(d){return scaleX(d.x,train_dims);})
        .attr("cy",function(d){return scaleY(d.y,train_dims);})
        .attr("class", "blue")
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOutPoint)

    // create points
    negTrainGroup.append("circle")
        .attr("r", 2)
        .style("fill", "red")
        .attr('opacity', 1)
        .attr("cx",function(d){return scaleX(d.x,train_dims);})
        .attr("cy",function(d){return scaleY(d.y,train_dims);})
        .attr("class", "red")
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOutPoint)

    // create points
    posTestGroup.append("circle")
        .attr("r", 2)
        .style("fill", "#3370ff")
        .attr('opacity', 1)
        .attr("cx",function(d){return scaleX(d.x,test_dims);})
        .attr("cy",function(d){return scaleY(d.y,test_dims);})
        .attr("class", "blue")
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOutPoint)

    // create points
    negTestGroup.append("circle")
        .attr("r", 2)
        .style("fill", "red")
        .attr('opacity', 1)
        .attr("cx",function(d){return scaleX(d.x,test_dims);})
        .attr("cy",function(d){return scaleY(d.y,test_dims);})
        .attr("class", "red")
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOutPoint)
}

function reBindData(){

    //fade out old data
    posTrainMuGroup.selectAll('g')
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1)
        .transition()
        .duration(750)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .remove()
        .on("end", () => {})

    //fade out old data
    negTrainMuGroup.selectAll('g')
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1)
        .transition()
        .duration(750)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .remove()
        .on("end", () => {})

    //fade out old data
    posTestMuGroup.selectAll('g')
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1)
        .transition()
        .duration(750)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .remove()
        .on("end", () => {})

    //fade out old data
    negTestMuGroup.selectAll('g')
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1)
        .transition()
        .duration(750)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .remove()
        .on("end", () => {})

    // rebind data
    posTrainGroup = posTrainMuGroup.selectAll("g.data")
        .data(posTrainData)
        .enter()
        .append("g")
        .style("fill", "cyan")
        .attr("class", "trainTrue")
    
    // rebind data
    negTrainGroup = negTrainMuGroup.selectAll("g.data")
        .data(negTrainData)
        .enter()
        .append("g")
        .style("fill", "red")
        .attr("class", "trainFalse")
    
    // rebind data
    posTestGroup = posTestMuGroup.selectAll("g.data")
        .data(posTestData)
        .enter()
        .append("g")
        .style("fill", "blue")
        .attr("class", "testTrue")
    
    // rebind data
    negTestGroup = negTestMuGroup.selectAll("g.data")
        .data(negTestData)
        .enter()
        .append("g")
        .style("fill", "red")
        .attr("class", "testFalse")
    
    // draw new points
    plotData()

    // move mu to new location
    updateMu(2000)

    // update drag behavior
    posTrainGroup.call(dragPoint)
    negTrainGroup.call(dragPoint)
    posTestGroup.call(dragPoint)
    negTestGroup.call(dragPoint)
    
    
}

function plotDecisionBoundary(){

    // get current dims of svgs
    let train_dims = d3.select('#left_chart').node().getBoundingClientRect()
    let test_dims = d3.select('#right_chart').node().getBoundingClientRect()

    // color ranges
    let elevRange = [0,1]
    let thresh = [0,1]

    // generate contours
    let contours = d3.contours()
    .size([xDataRange[1], yDataRange[1]])
    .thresholds(thresh)(decisionBoundary)

    // create color interpolation function
    let color = d => d3.interpolateRgb("#ffa6a6","#a4c7fc")(d)


    let paths = train_svg.selectAll("path")
        .data(scaleContour(contours, train_dims));

    let pathsExit = paths.exit().remove();

    let pathsEnter = paths.join('path')
    .style('fill', function(d) {
        return color(d.value);
    })

    paths = pathsEnter.merge(paths);
    paths.transition().duration(200)
    .attr('d', d3.geoPath())

    paths = test_svg.selectAll("path")
    .data(scaleContour(contours, test_dims));

    pathsExit = paths.exit().remove();

    pathsEnter = paths.join('path')
    .style('fill', function(d) {
        return color(d.value);
    })

    paths = pathsEnter.merge(paths);
    paths.transition().duration(200)
    .attr('d', d3.geoPath())

    // raise and points and mus to top of layer so they remain visible and draggable
    d3.select('#left_chart').selectAll("g").raise()
    d3.select('#right_chart').selectAll("g").raise()
    posTrainMuGroup.selectAll('circle').raise()
    posTestMuGroup.selectAll('circle').raise()
    negTrainMuGroup.selectAll('circle').raise()
    negTestMuGroup.selectAll('circle').raise()
}


// function plotDecisionBoundary(){

//     // if a decision bouindary has not been generated, return
//     if (!decisionBoundary){
//         return
//     }

//     // get current dims of svgs
//     let train_dims = d3.select('#left_chart').node().getBoundingClientRect()
//     let test_dims = d3.select('#right_chart').node().getBoundingClientRect()

//     // color ranges
//     let elevRange = [0,1]
//     let thresh = [0,1]

//     // generate contours
//     let contours = d3.contours()
//     .size([xDataRange[1], yDataRange[1]])
//     .thresholds(thresh)(decisionBoundary)

//     // create color interpolation function
//     let color = d => d3.interpolateRgb("#ffa6a6","#a4c7fc")(d)

//     // add path to svg
//     test_svg.selectAll("path")
//         .data(scaleContour(contours, test_dims))
//         .join("path")
//         .attr("class", "surface")
//         .attr("fill", d => color(d.value))
//         .attr("d", d3.geoPath())
//         .attr('opacity', 0)
//         .transition()
//         .duration(1000)
//         .attr('opacity', 1)

//     // add path to svg
//     train_svg.selectAll("path")
//         .data(scaleContour(contours, train_dims))
//         .join("path")
//         .attr("class", "surface")
//         .attr("fill", d => color(d.value))
//         .attr("d", d3.geoPath())
//         .attr('opacity', 0)
//         .transition()
//         .duration(1000)
//         .attr('opacity', 1)

//     // raise and points and mus to top of layer so they remain visible and draggable
//     d3.select('#left_chart').selectAll("g").raise()
//     d3.select('#right_chart').selectAll("g").raise()
//     posTrainMuGroup.selectAll('circle').raise()
//     posTestMuGroup.selectAll('circle').raise()
//     negTrainMuGroup.selectAll('circle').raise()
//     negTestMuGroup.selectAll('circle').raise()
// }

function scaleContour(contours, dims) {
    // scales generated data to svg size
    return contours.map(({type, value, coordinates}) => (
        {type, value, coordinates: coordinates.map(rings => (
        rings.map(points => (
            points.map(([x, y]) => ([
            scaleX(x,dims), scaleY(y,dims)
            ]))
        ))
        ))}
    ));
}


function scaleContourNN(contours, v) {
    // scales generated data to svg size
    return contours.map(({type, value, coordinates}) => (
        {type, value, coordinates: coordinates.map(rings => (
        rings.map(points => (
            points.map(([x, y]) => ([
            (x/301)*v, (y/301)*v
            ]))
        ))
        ))}
    ));
}

function clearDecisionBoundary(){

    // clear all path elements
    d3.select('#left_chart')
        .selectAll("path")
        .transition()
        .duration(1000)
        .attr('opacity', 0)
        .remove()
        .on("end", () => {})

    // clear all path elements
    d3.select('#right_chart')
        .selectAll("path")
        .transition()
        .duration(1000)
        .attr('opacity', 0)
        .remove()
        .on("end", () => {})

    // set any decsionboundary data to null
    decisionBoundary = null
}

function plotNNDecisionBoundary(){

    // get current dims of svgs
    let train_dims = d3.select('#training_nn').node().getBoundingClientRect()
    let test_dims = d3.select('#testing_nn').node().getBoundingClientRect()

    // color ranges
    let elevRange = [0,1]
    let thresh = [0,1]
    let width = 301
    let height = 301

    let contours = d3.contours()
    .size([width,height])
    .thresholds(thresh)((nnData.surface[nnCounter]).flat())

    let color = d => d3.interpolateRgb("#ffa6a6","#a4c7fc")(d)

    let paths = d3.select('#training_nn').selectAll('.NNpath')
    .data(scaleContourNN(contours, 350));
    
    let pathsExit = paths.exit().remove();

    let pathsEnter = paths.join('path')
    .attr('d', d3.geoPath())
    .style('fill', function(d) {
      return color(d.value);
    })
    .attr('d', d3.geoPath())

    paths = pathsEnter.merge(paths);
    paths.transition().duration(100)
    .attr('d', d3.geoPath())

    paths = d3.select('#testing_nn').selectAll('.NNpath')
    .data(scaleContourNN(contours, 350));
    
    pathsExit = paths.exit().remove();

    pathsEnter = paths.join('path')
    .attr('class', 'NNpath')
    .attr('d', d3.geoPath())
    .style('fill', function(d) {
      return color(d.value);
    })
    .attr('d', d3.geoPath())

    paths = pathsEnter.merge(paths);
    paths.transition().duration(100)
    .attr('d', d3.geoPath())

  d3.select('#training_nn').selectAll('circle').raise()
  d3.select('#testing_nn').selectAll('circle').raise()
  //nnTestGroup.raise()



  return

    // // Mark the points as entering or exiting
    // const entering = nnData.surface[(nnCounter + 1) %45].map(d => {
    //     return {
    //         ...d,
    //         type: "entering"
    //     };
    //     });
    // const exiting = nnData.surface[nnCounter].map(d => {
    // return {
    //     ...d,
    //     type: "exiting"
    // };
    // });

    
    // // Combine the entering and exiting points
    // const allData = entering.concat(exiting);

    // const contourFunc = d3
    //   .contours()
    //   .thresholds(thresh)
    //   .size([width, height])

    // let color = d => d3.interpolateRgb("#ffa6a6","#a4c7fc")(d)

    // // Start a global transition
    // d3.transition()
    //   .duration(1000)
    //   .tween("contours", d => {
    //     return tweenValue => {

    //         // console.log(tweenValue)

    //         const inverse = 1 - tweenValue;

    //         // Set the weight accessor to return the tween value
    //         // Entering points will gradually increase their effect on the contour generator.
    //         // Exiting points will gradually decrease their effect on the contour generator.
    //         contourFunc.values(d => {
    //           return d.type === "entering" ? tweenValue : inverse;
    //         });
  
    //         const contours = contourFunc(nnData.surface[nnCounter]);

    //       const contourPaths = d3.select('#training_nn').selectAll("path").data(contours);

    //       contourPaths.exit().remove();

    //       contourPaths
    //         .enter()
    //         .append("path")
    //         .attr("fill", d => color(d.value))
    //         .style("opacity", 1);

    //       contourPaths.attr("d", d3.geoPath());
    //     };
    //   });
  }

function plotNNPoints(){
    // create points
    nnTrainGroup = d3.select('#training_nn')
        .selectAll('g.nndata')
        .data(nnTrain)
        .enter()
        .append("circle")
        .attr("r", 2)
        .style("fill", function(d){return d.val ? "#3370ff" : 'red'})
        .attr('opacity', 0.5)
        .attr("cx",function(d){return scalenn(d.x,400);})
        .attr("cy",function(d){return scalennY(d.y,400);})

    nnTrainGroup = d3.select('#testing_nn')
        .selectAll('g.nndata')
        .data(nnTest)
        .enter()
        .append("circle")
        .attr("r", 2)
        .style("fill", function(d){return d.val ? "#3370ff" : 'red'})
        .attr('opacity', 0.5)
        .attr("cx",function(d){return scalenn(d.x,400);})
        .attr("cy",function(d){return scalennY(d.y,400);})
}


function plotLineStruct(){
    let trainNN = d3.select('#training_nn')
    let testNN = d3.select('#testing_nn')

    var xAxis = d3.scaleLinear()
    .domain([0,43])
    .range([0,400 ]);
    var yAxis = d3.scaleLinear()
    .domain([0,1])
    .range([ 350, 0 ]);

    trainNN.append("g")
    .attr("transform", "translate(420,355)")
    .call(d3.axisBottom(xAxis));
    trainNN.append("g")
    .attr("transform", "translate(420," + 5 + ")")
    .call(d3.axisLeft(yAxis));

    testNN.append("g")
    .attr("transform", "translate(420,355)")
    .call(d3.axisBottom(xAxis));
    testNN.append("g")
    .attr("transform", "translate(420," + 5 + ")")
    .call(d3.axisLeft(yAxis));

    var lineNames = ['sensitivity', 'specificity', 'acc']
    var color = d3.scaleOrdinal().domain(lineNames).range(['#fb4c4c', '#2084cf', '#499329'])

    var lineLegend = trainNN.selectAll(".lineLegend").data(lineNames)
    .enter().append("g")
    .attr("class","lineLegend")
    .attr("transform", function (d,i) {
            return "translate("+ (400 + (i*185)) + ",420)";
        });

    lineLegend.append("text").text(function (d) {return d;})
        .attr("transform", "translate(25,15)"); //align texts with boxes

    lineLegend.append("rect")
        .attr("fill", function (d, i) {return color(d); })
        .attr("width", 20).attr("height", 20);

    var lineLegend = testNN.selectAll(".lineLegend").data(lineNames)
    .enter().append("g")
    .attr("class","lineLegend")
    .attr("transform", function (d,i) {
            return "translate("+ (400 + (i*185)) + ",420)";
        });

    lineLegend.append("text").text(function (d) {return d;})
        .attr("transform", "translate(25,15)"); //align texts with boxes

    lineLegend.append("rect")
        .attr("fill", function (d, i) {return color(d); })
        .attr("width", 20).attr("height", 20);


    var axisLabel = trainNN
    .append("text")
    .text("EPOCHS")
    .attr("x", 575)
	.attr("y", 390)
    .attr('font-weight' , ' bold')
    .attr("class","axisLabel")

    axisLabel = testNN
    .append("text")
    .text("EPOCHS")
    .attr("x", 575)
	.attr("y", 390)
    .attr('font-weight' , ' bold')
    .attr("class","axisLabel")
}

function plotLines(){

    let trainNN = d3.select('#training_nn')
    let testNN = d3.select('#testing_nn')

    var xAxis = d3.scaleLinear()
    .domain([0,43])
    .range([0,400 ]);
    
    var yAxis = d3.scaleLinear()
    .domain([0,1])
    .range([ 350, 0 ]);

    var simpleLine = d3.line()
        .x(function(d) { return xAxis(d.x) })
        .y(function(d) { return yAxis(d.y) })

    var lineNames = ['sensitivity', 'acc', 'specificity']

    var color = d3.scaleOrdinal().domain(lineNames).range(['#fb4c4c', '#499329', '#2084cf'])


    var nestedData = Array.from(
        d3.group(nnData.train_metrics.filter((d) => {return d.x < nnCounter}), d => d.line), ([key, value]) => ({ key, value }))

    let lines =trainNN.selectAll('.line')
        .data(nestedData)

    let linesExit = lines.exit().remove();

    let linesEnter = lines.join("path")
        .attr("fill", "none")
        .attr("class", "line")
        .attr("stroke", d => color(d.key))
        .attr("transform", "translate(420," + 5 + ")")
        .attr("stroke-width", 2)

    lines = linesEnter.merge(lines);

    lines.transition()
    .duration(100)
    .attr("d", d => simpleLine(d.value));



    nestedData = Array.from(
        d3.group(nnData.test_metrics.filter((d) => {return d.x < nnCounter}), d => d.line), ([key, value]) => ({ key, value }))

    lines =testNN.selectAll('.line')
        .data(nestedData)

    linesExit = lines.exit().remove();

    linesEnter = lines.join("path")
        .attr("fill", "none")
        .attr("class", "line")
        .attr("stroke", d => color(d.key))
        .attr("transform", "translate(420," + 5 + ")")
        .attr("stroke-width", 2)

    lines = linesEnter.merge(lines);

    lines.transition()
    .duration(100)
    .attr("d", d => simpleLine(d.value));
}


function plotROCLines(options){
    var width = 350,
	    height = 350,
	    data = options.data,
	    container = options.container,
	    labelsData = options.labels

    var svg_width= d3.select(container).node().getBoundingClientRect().width
    
    var margin = {top: 50, right: (svg_width -width) /2, bottom: 100, left: (svg_width -width) /2};

	let svg = d3.select(container).append("svg")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var xAxis = d3.scaleLinear()
    .domain([0,1])
    .range([0,350 ]);
    
    var yAxis = d3.scaleLinear()
    .domain([0,1])
    .range([ 350, 0 ]);

    svg.append("g")
    .attr("transform", "translate(0,350)")
    .call(d3.axisBottom(xAxis));

    svg.append("g")
    .call(d3.axisLeft(yAxis));

    svg.append("g")
    .call(d3.axisBottom(xAxis).tickSize(0).tickValues([]))
    .selectAll("text").remove()
    
    svg.append("g")
    .attr("transform", "translate(350,0)")
    .call(d3.axisRight(xAxis).tickSize(0).tickValues([]));


    let neutral = [
        {"x":0.0, "y":350.0},
        {"x":350.0,"y":0},
    ];

    svg.selectAll(".shading")
    .data([data])
    .enter()
    .append("path")
    .attr("fill", "#e3e6f0")
    .attr("d", d3.area()
      .x(function(d) { return xAxis(d.fpr) })
      .y0(yAxis(0))
      .y1(function(d) { return yAxis(d.tpr) })
      )

    svg.selectAll(".neutralLine")
      .data([neutral])
      .enter()
      .append("path")
      .attr('stroke', "black")
      .style("stroke-dasharray", ("3, 3"))
      .attr("stroke-width", 2)
      .attr("d", d3.line()
      .x(function(d) { return d.x })
      .y(function(d) { return d.y })
      )
  



    let lines = svg.selectAll('.line')
        .data([data])

    let linesExit = lines.exit().remove();

    let linesEnter = lines.join("path")
        .attr("fill", "none")
        .attr("class", "line")
        .attr('stroke', "#4e73df")
        .attr("stroke-width", 2)

    lines = linesEnter.merge(lines);

    lines
    .attr("d", d3.line()
    .x(function(d) { return xAxis(d.fpr) })
    .y(function(d) { return yAxis(d.tpr) })
    )

    var axisLabel = d3.select(container)
        .append("text")
        .text("False Positive Rate")
        .attr("x", (width/2) + margin.left)
        .attr("y", height + 40 + margin.top)
        .style("text-anchor", "middle")
        .attr('font-weight' , ' bold')
        .attr("class","axisLabel")

    var axisLabel = d3.select(container)
        .append("text")
        .text("True Positive Rate")
        .attr("x", margin.left - 40)
        .attr("y", (height/2) + margin.top)
        .style("text-anchor", "middle")
        .attr('font-weight' , ' bold')
        .attr('transform', 'rotate(-90 ' + (margin.left - 40) + ' ' + ((height/2) + margin.top) + ')')
        .attr("class","axisLabel")

}

/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////     API CALLS     ///////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////

async function getData(content){
    // returns randomly genderated data, given requested size in GenerateData()
    const response = await fetch('http://127.0.0.1:8000/RandomData/generateData/', {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(content),
      });
      return response.json();
}

async function generateData(random = true){
    // get slider values
    body = {
        'TrainPosSlider' : d3.select('#TrainPosRange').text(),
        'TestPosSlider' : d3.select('#TestPosRange').text(),
        'TrainNegSlider' : d3.select('#TrainNegRange').text(),
        'TestNegSlider' : d3.select('#TestNegRange').text(),
        'covTrue' : random ? null: covTrue,
        'covFalse' : random ? null: covFalse,
        'muTrue' : random ? null: muTrue,
        'muFalse' : random ? null: muFalse
    }
    
    // get data from api, and reassign to data vars
    let data = await getData(body)
    posTrainData = data['TrainPosSlider']
    negTrainData =  data['TrainNegSlider']
    posTestData = data['TestPosSlider']
    negTestData = data['TestNegSlider']
    covTrue = data['covTrue']
    covFalse = data['covFalse']
    muTrue = data['muTrue']
    muFalse = data['muFalse']
}

async function getModelResults(content){
    // passes modelname and current data to api and returns json containing decision boundary array
    const response = await fetch('http://127.0.0.1:8000/trainModel/train/', {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(content),
      });
    return response.json();

}

async function trainModel(modelName){
    // collect model name and current data
    let body = {
        "model" : modelName,
        'posTrainData' : posTrainData,
        'negTrainData': negTrainData,
        'posTestData' : posTestData,
        'negTestData' : negTestData,
    }
    // collect decision boundary
    let response =  await getModelResults(body)
    decisionBoundary =  response.surface
    metrics = response.metrics
}

async function trainNNModel(modelName){

    let loadingModal = document.querySelector('#loadingmodal')

    openLoadingModal(loadingModal)

    console.log(d3.select("#LRRange").text())
    // collect model name and current data
    let body = {
        "model" : modelName,
        'posTrainData' : posTrainData,
        'negTrainData': negTrainData,
        'posTestData' : posTestData,
        'negTestData' : negTestData,
        'learning_rate' : parseFloat(d3.select("#LRRange").text()),
        'EPOCHS' : parseInt(d3.select("#EPOCHRange").text()),
        'nodes_per_layer' : parseInt(d3.select("#LayerSizeRange").text()),
        'num_layers' : parseInt(d3.select("#NumLayersRange").text()),

    }
    // collect decision boundary
    let response =  await getModelResults(body)
    closeModal(loadingModal)
    decisionBoundary =  response.surface
    metrics = response.metrics
}



/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////     EVENT LISTENERS     ////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////

// resize and scale points on window resizing
d3.select(window).on('resize', resizeWindow);

// event listener on generate data button, creates new data, plots points, and clears any existing decision boundary
// d3.select('#GenerateDistributionButton').on('click', () => {
//     generateData().then(() => {
//         reBindData()
//         clearDecisionBoundary()
//         clearMetrics()
//         })
//     }
// )

d3.select('#GenerateNewDataButton').on('click', () => {
    generateData().then(() => {
        reBindData()
        clearDecisionBoundary()
        clearMetrics()
        })
    }
)


d3.select('#GenerateNewDataButtonInModal').on('click', () => {
    generateData().then(() => {
        reBindData()
        clearDecisionBoundary()
        clearMetrics()
        })
    }
)

// event listener on train model button, collects checked model type in radio buttons, calls train model, then plots the decision boundary
// d3.select('#TrainModelButton').on('click', () => {
//     if (d3.select('input[name="MODEL"]:checked').node().value == "MLP"){
//         const modal = document.querySelector(button.dataset.modalTarget)
//         opennnModal(modal)
//     }
//     else{
//         trainModel(d3.select('input[name="MODEL"]:checked').node().value).then(() => {
//             plotDecisionBoundary()
//             populateMainTable()
//             })
//     }

//     }
// )

// handler on hover over start
function handleMouseOver(d, i) {       
    d3.select(this).transition()
        .duration(200)
        .attr('opacity', 0.5)
        .attr("r", 10);
}

// handler on hover over end for points
function handleMouseOutPoint(d, i) {   
    d3.select(this).transition()
        .duration(200)
        .attr('opacity', 1)
        .attr("r", 2);
}

// handler on hover over end for mu
function handleMouseOutMu(d, i) {   
    d3.select(this).transition()
        .duration(200)
        .attr('opacity', 1.0)
        .attr("r", 4);
}

/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////



////////////////////////////////     DRAG BEHAVIOR FUNCTIONS     ////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////

function dragstarted(){
    //empty, add on hover functionality
};
// handler for dragging mu point
function draggedMu(event,d){

    // computes dimension of svg visible area                                          
    var dims = computeDimensions(this)

    // transform change in px position to change in data position
    let dx = scaleXinvert(event.x + event.dx, dims) - scaleXinvert(event.x, dims)
    let dy = scaleYinvert(event.y + event.dy, dims) - scaleYinvert(event.y, dims)

    let changeTrainData, changeTestData, otherMu, otherMuData
    switch (d3.select(this)
        .selectAll('circle.mu')
        .attr('lab')) {
            case 'trainTrue':
                changeTrainData = posTrainData;
                changeTestData = posTestData;
                otherMuData = testMu[0]
                otherMu = posTestMuGroup
                break;
            case 'trainFalse':
                changeTrainData = negTrainData;
                changeTestData = negTestData;
                otherMuData = testMu[1]
                otherMu = negTestMuGroup
                break;
            case 'testTrue':
                changeTrainData = posTrainData;
                changeTestData = posTestData;
                otherMuData = trainMu[0]
                otherMu = posTrainMuGroup
                break;
            case 'testFalse':
                changeTrainData = negTrainData;
                changeTestData = negTestData;
                otherMuData = trainMu[1]
                otherMu = negTrainMuGroup
      }


    // confirm points aren't leaving visible area
    if (isSafetoMove(dims, dx, dy, changeTrainData) & isSafetoMove(dims, dx, dy, changeTestData)){
    
        // for each bound data point, update bound data
        for (let i = 0; i < changeTrainData.length; i++) {
            changeTrainData[i]['x'] +=  dx
            changeTrainData[i]['y'] +=  dy
        }
        for (let i = 0; i < changeTestData.length; i++) {
            changeTestData[i]['x'] +=  dx
            changeTestData[i]['y'] +=  dy
    }

        // update bound mu data
        d.x += dx
        d.y += dy
        otherMuData['x'] += dx
        otherMuData['y'] += dy
        
        // Avoid overhead by transforming only 30% of the time
        if (Math.random() < 0.3){
            // update position of mu
            d3.select(this)
                .selectAll('circle')
                .attr("cx", function (d) {return scaleX(d.x,dims);})
                .attr("cy", function (d) {return scaleY(d.y,dims);});

            // update position of mu
            otherMu
                .selectAll('circle')
                .attr("cx", function (d) {return scaleX(d.x,dims);})
                .attr("cy", function (d) {return scaleY(d.y,dims);});
        }
    }

};
// handler for dragging single point
function draggedPoint(event, d){

    // computes dimension of svg visible area                                          
    var dims = computeDimensions(this)

    // transform change in px position to change in data position
    let dx = scaleXinvert(event.x + event.dx, dims) - scaleXinvert(event.x, dims)
    let dy = scaleYinvert(event.y + event.dy, dims) - scaleYinvert(event.y, dims)

    // confirm points aren't leaving visible area
    if (isSafetoMove(dims, dx, dy, [{'x':d.x,'y':d.y}])){

        // update bound point data
        d.x += dx;
        d.y += dy;

        // update position of point
        d3.select(this)
            .selectAll('circle')
            .attr("cx", function (d) {return scaleX(d.x,dims);})
            .attr("cy", function (d) {return scaleY(d.y,dims);});
    }
};
// handler for ending drag event
function dragended(){
    //empty, add on hover functionality
    // add api call to django to update algoithm decision boundary
    transformAllPoints()
};
// when a single point is updated, reposition mu
function updateMu(transitionTime = 200){

    // update bound mu values after a point was updated
    trainMu[0]['x'] = d3.mean(posTrainData, d => d.x)
    trainMu[0]['y'] = d3.mean(posTrainData, d => d.y)
    trainMu[1]['x'] = d3.mean(negTrainData, d => d.x)
    trainMu[1]['y'] = d3.mean(negTrainData, d => d.y)

    testMu[0]['x'] = d3.mean(posTestData, d => d.x)
    testMu[0]['y'] = d3.mean(posTestData, d => d.y)
    testMu[1]['x'] = d3.mean(negTestData, d => d.x)
    testMu[1]['y'] = d3.mean(negTestData, d => d.y)

    muTrue = [trainMu[0]['x'], trainMu[0]['y']]
    muFalse = [trainMu[1]['x'], trainMu[1]['y']]

    let train_dims = d3.select('#left_chart').node().getBoundingClientRect()
    let test_dims = d3.select('#right_chart').node().getBoundingClientRect()

    // transition mu points to new location
    posTrainMuGroup.selectAll('circle')
        .transition()
        .duration(transitionTime)
        .attr("cx", function (d) {return scaleX(d.x,train_dims);})
        .attr("cy", function (d) {return scaleY(d.y,train_dims);});
    posTrainMuGroup.selectAll('circle').raise()

    negTrainMuGroup.selectAll('circle')
        .transition()
        .duration(transitionTime)
        .attr("cx", function (d) {return scaleX(d.x,train_dims);})
        .attr("cy", function (d) {return scaleY(d.y,train_dims);});
    negTrainMuGroup.selectAll('circle').raise()

    posTestMuGroup.selectAll('circle')
        .transition()
        .duration(transitionTime)
        .attr("cx", function (d) {return scaleX(d.x,test_dims);})
        .attr("cy", function (d) {return scaleY(d.y,test_dims);});
    posTestMuGroup.selectAll('circle').raise()

    negTestMuGroup.selectAll('circle')
        .transition()
        .duration(transitionTime)
        .attr("cx", function (d) {return scaleX(d.x,test_dims);})
        .attr("cy", function (d) {return scaleY(d.y,test_dims);});
    negTestMuGroup.selectAll('circle').raise()
}

/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////



//////////////////////////////     RESIZING/TRANSFORM FUNCTIONS     /////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////

// resizing points and decision boundary 
function resizeWindow(){
    transformAllPoints()
    plotDecisionBoundary()

}
// repositions all points
function transformAllPoints(){

    //get current dims of left and right charts
    let train_dims = d3.select('#left_chart').node().getBoundingClientRect()
    let test_dims = d3.select('#right_chart').node().getBoundingClientRect()

    muTrue = [trainMu[0]['x'], trainMu[0]['y']]
    muFalse = [trainMu[1]['x'], trainMu[1]['y']]

    // update all points in '#left_chart'
    posTrainMuGroup.selectAll('circle')
        .transition()
        .duration(200)
        .attr("cx", function (d) {return scaleX(d.x,train_dims);})
        .attr("cy", function (d) {return scaleY(d.y,train_dims);});

    negTrainMuGroup.selectAll('circle')
        .transition()
        .duration(200)
        .attr("cx", function (d) {return scaleX(d.x,train_dims);})
        .attr("cy", function (d) {return scaleY(d.y,train_dims);});

    posTrainGroup.selectAll('circle')
        .transition()
        .duration(200)
        .attr("cx", function (d) {return scaleX(d.x,train_dims);})
        .attr("cy", function (d) {return scaleY(d.y,train_dims);});

    negTrainGroup.selectAll('circle')
        .transition()
        .duration(200)
        .attr("cx", function (d) {return scaleX(d.x,train_dims);})
        .attr("cy", function (d) {return scaleY(d.y,train_dims);});

    // update all points in '#right_chart'
    posTestMuGroup.selectAll('circle')
        .transition()
        .duration(200)
        .attr("cx", function (d) {return scaleX(d.x,test_dims);})
        .attr("cy", function (d) {return scaleY(d.y,test_dims);});

    negTestMuGroup.selectAll('circle')
        .transition()
        .duration(200)
        .attr("cx", function (d) {return scaleX(d.x,test_dims);})
        .attr("cy", function (d) {return scaleY(d.y,test_dims);});

    posTestGroup.selectAll('circle')
        .transition()
        .duration(200)
        .attr("cx", function (d) {return scaleX(d.x,test_dims);})
        .attr("cy", function (d) {return scaleY(d.y,test_dims);});

    negTestGroup.selectAll('circle')
        .transition()
        .duration(200)
        .attr("cx", function (d) {return scaleX(d.x,test_dims);})
        .attr("cy", function (d) {return scaleY(d.y,test_dims);});


}

/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////     HELPER FUNCTIONS     ///////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////

// computes the dimension of an HTML parent element
function computeDimensions(element) {
    return d3.select(element).node().parentNode.parentNode.getBoundingClientRect();
  }
// returns d3.scale linear() for x and y dimensions
function getXYscaler(dims){

    let width = dims['width']
    let height = dims['height']
    let x = d3.scaleLinear()
        .domain(xDataRange)
        .range([0, width])
    let y = d3.scaleLinear()
        .domain(yDataRange)
        .range([height, 0])
    return {'xScale':x, 'yScale':y}
}
// scales data x and y value to svg coordinates
function scaleXY(x,y,dims){

    let scales = getXYscaler(dims)
    let newX = scales['xScale'](x)
    let newY = scales['yScale'](y)
    return [newX,newY]
}
// scales data x value to svg coordinates
function scaleX(x,dims){

    let scales = getXYscaler(dims)
    let newX = scales['xScale'](x)
    return newX
}
// scales data y value to svg coordinates
function scaleY(y,dims){

    let scales = getXYscaler(dims)
    let newY = scales['yScale'](y)
    return newY
}
// scales x and y value from svg coordinates to data
function scaleXYinvert(x,y,dims){

    let scales = getXYscaler(dims)
    let newX = scales['xScale'].invert(x)
    let newY = scales['yScale'].invert(y)
    return [newX,newY]
}
// scales x value from svg coordinates to data
function scaleXinvert(x,dims){

    let scales = getXYscaler(dims)
    let newX = scales['xScale'].invert(x)
    return newX
}
// scales y value from svg coordinates to data
function scaleYinvert(y,dims){

    let scales = getXYscaler(dims)
    let newY = scales['yScale'].invert(y)
    return newY
}

function scalenn(v){
    let scale = d3.scaleLinear()
    .domain([-150,150])
    .range([0, 350])
    return scale(v)
}

function scalennY(v){
    let scale = d3.scaleLinear()
    .domain([-150,150])
    .range([350, 0])
    return scale(v)
}
// determines if a drag event won't cause a point to leave bounds of SVG
function isSafetoMove(dims, dx, dy, changeData){

    // bool var to confirm that 
    var safe = true

    // for each bound data point, update bound data
    for (let i = 0; i < changeData.length; i++) {
        let newX = changeData[i]['x'] + dx
        let newY = changeData[i]['y'] + dy
        if ((newX < (xDataRange[0] + xPad)) || (newX > (xDataRange[1] - xPad)) || (newY < (yDataRange[0] + yPad)) || (newY > (yDataRange[1] - yPad))){
            safe = false
            break;
            }
        }
    return safe
};

function clearMetrics(){
    metrics = null
}

function roundMetric(value){
    return (Math.round(value*1000) / 10) + "%"
}

function roundAUC(value){
    return Math.round(value*1000) / 1000
}



/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////



///////////////////////////////////     EVAL BUTTON MODAL     ///////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////
// https://github.com/WebDevSimplified/Vanilla-JavaScript-Modal

const openModalButtons = document.querySelectorAll('[data-modal-target*="#modal"]')
const closeModalButtons = document.querySelectorAll('[data-close-button]')
const openModalButtonsnn = document.querySelectorAll('[data-modal-target*="#HyperParamterModal"]')
const closeModalButtonsnn = document.querySelectorAll('[data-close-button-nn]')

const openModalButtonsGenerateData = document.querySelectorAll('[data-modal-target*="#GenerateDatamodal"]')
//const closeModalButtonsGenerateData = document.querySelectorAll('[data-close-button-nn]')



const NNInModalButton = document.querySelectorAll("#TrainNNInModal")
const GenDistInModalButton = document.querySelectorAll("#GenerateDistributionButtonInModal")

const positiveCovMatrix0 = document.querySelector("#positive-cov-matrix-0");
const positiveCovMatrix1 = document.querySelector("#positive-cov-matrix-1");
const positiveCovMatrix2 = document.querySelector("#positive-cov-matrix-2");
const positiveCovMatrix3 = document.querySelector("#positive-cov-matrix-3");
const positiveMu0 = document.querySelector("#positive-mu-0");
const positiveMu1 = document.querySelector("#positive-mu-1");


positiveCovMatrix0.addEventListener("change", (event) => {
    if (parseFloat(positiveCovMatrix0.value) > 5.300){
        positiveCovMatrix0.value = 5.300
    }
    if (parseFloat(positiveCovMatrix0.value) < 2.000){
        positiveCovMatrix0.value = 2.000
    }
});

positiveCovMatrix1.addEventListener("change", (event) => {
    if (parseFloat(positiveCovMatrix1.value) > 2.600){
        positiveCovMatrix1.value = 2.600
    }
    if (parseFloat(positiveCovMatrix1.value) < -2.600){
        positiveCovMatrix1.value = -2.600
    }
    positiveCovMatrix2.textContent = positiveCovMatrix1.value;
});

positiveCovMatrix3.addEventListener("change", (event) => {
    if (parseFloat(positiveCovMatrix3.value) > 4.000){
        positiveCovMatrix3.value = 4.000
    }
    if (parseFloat(positiveCovMatrix3.value) < 1.300){
        positiveCovMatrix3.value = 1.300
    }
});

positiveMu0.addEventListener("change", (event) => {
    if (parseFloat(positiveMu0.value) > .800){
        positiveMu0.value = .800
    }
    if (parseFloat(positiveMu0.value) < .200){
        positiveMu0.value = .200
    }
});

positiveMu1.addEventListener("change", (event) => {
    if (parseFloat(positiveMu1.value) > .400){
        positiveMu1.value = .400
    }
    if (parseFloat(positiveMu1.value) < .250){
        positiveMu1.value = .250
    }
});




const negativeCovMatrix0 = document.querySelector("#negative-cov-matrix-0");
const negativeCovMatrix1 = document.querySelector("#negative-cov-matrix-1");
const negativeCovMatrix2 = document.querySelector("#negative-cov-matrix-2");
const negativeCovMatrix3 = document.querySelector("#negative-cov-matrix-3");
const negativeMu0 = document.querySelector("#negative-mu-0");
const negativeMu1 = document.querySelector("#negative-mu-1");

negativeCovMatrix0.addEventListener("change", (event) => {
    if (parseFloat(negativeCovMatrix0.value) > 5.300){
        negativeCovMatrix0.value = 5.300
    }
    if (parseFloat(negativeCovMatrix0.value) < 2.000){
        negativeCovMatrix0.value = 2.000
    }
});

negativeCovMatrix1.addEventListener("change", (event) => {
    if (parseFloat(negativeCovMatrix1.value) > 2.600){
        negativeCovMatrix1.value = 2.600
    }
    if (parseFloat(negativeCovMatrix1.value) < -2.600){
        negativeCovMatrix1.value = -2.600
    }
    negativeCovMatrix2.textContent = negativeCovMatrix1.value;
});

negativeCovMatrix3.addEventListener("change", (event) => {
    if (parseFloat(negativeCovMatrix3.value) > 4.000){
        negativeCovMatrix3.value = 4.000
    }
    if (parseFloat(negativeCovMatrix3.value) < 1.300){
        negativeCovMatrix3.value = 1.300
    }
});

positiveMu0.addEventListener("change", (event) => {
    if (parseFloat(negativeMu0.value) > .800){
        negativeMu0.value = .800
    }
    if (parseFloat(negativeMu0.value) < .200){
        negativeMu0.value = .200
    }
});

negativeMu1.addEventListener("change", (event) => {
    if (parseFloat(negativeMu1.value) > .400){
        negativeMu1.value = .400
    }
    if (parseFloat(negativeMu1.value) < .250){
        negativeMu1.value = .250
    }
});


// const negativeCovMatrix1 = document.querySelector("#negative-cov-matrix-1");
// const negativeCovMatrix2 = document.querySelector("#negative-cov-matrix-2");

// negativeCovMatrix1.addEventListener("change", (event) => {
//     negativeCovMatrix2.textContent = negativeCovMatrix1.value;
// });



GenDistInModalButton.forEach(button => {
    button.addEventListener('click', (event) => {
        const modal = button.closest('.modal')
        closeModal(modal)
        covTrue[0][0] = parseFloat(positiveCovMatrix0.value) * 1000
        covTrue[0][1] = parseFloat(positiveCovMatrix1.value) * 1000
        covTrue[1][0] = parseFloat(positiveCovMatrix2.textContent) * 1000
        covTrue[1][1] = parseFloat(positiveCovMatrix3.value) * 1000
        muTrue[0] = parseFloat(positiveMu0.value) * 1000
        muTrue[1] = parseFloat(positiveMu1.value) * 1000
        covFalse[0][0] = parseFloat(negativeCovMatrix0.value)* 1000
        covFalse[0][1] = parseFloat(negativeCovMatrix1.value)* 1000
        covFalse[1][0] = parseFloat(negativeCovMatrix2.textContent)* 1000
        covFalse[1][1] = parseFloat(negativeCovMatrix3.value)* 1000
        muFalse[0] = parseFloat(negativeMu0.value)* 1000
        muFalse[1] = parseFloat(negativeMu1.value)* 1000
        generateData(false).then(() => {
        reBindData()
        clearDecisionBoundary()
        clearMetrics()
        })
    }
    )
});

NNInModalButton.forEach(button => {
    button.addEventListener('click', (event) => {
        const modal = button.closest('.modal')
        closeModal(modal)
        trainNNModel("MLP").then(() =>{
            plotDecisionBoundary()
            populateMainTable()
        })
    }
    )
});


const overlay = document.getElementById('overlay')

openModalButtonsnn.forEach(button => {
    button.addEventListener('click', () => {
        if (d3.select('input[name="MODEL"]:checked').node().value == "MLP"){

            const modal = document.querySelector(button.dataset.modalTarget)
            opennnModal(modal)
            
        }
        else{
            trainModel(d3.select('input[name="MODEL"]:checked').node().value).then(() => {
                plotDecisionBoundary()
                populateMainTable()
                })
        }
    })
  })


  openModalButtonsGenerateData.forEach(button => {
    button.addEventListener('click', () => {
      const modal = document.querySelector(button.dataset.modalTarget)
      positiveCovMatrix0.value = Math.round(covTrue[0][0]) / 1000
      positiveCovMatrix1.value = Math.round(covTrue[0][1]) / 1000
      positiveCovMatrix2.textContent = Math.round(covTrue[1][0])/ 1000
      positiveCovMatrix3.value = Math.round(covTrue[1][1])/ 1000
      positiveMu0.value = Math.round(muTrue[0])/ 1000
      positiveMu1.value = Math.round(muTrue[1])/ 1000

      
      negativeCovMatrix0.value = Math.round(covFalse[0][0])/ 1000
      negativeCovMatrix1.value = Math.round(covFalse[0][1])/ 1000
      negativeCovMatrix2.textContent = Math.round(covFalse[1][0])/ 1000
      negativeCovMatrix3.value = Math.round(covFalse[1][1])/ 1000
      negativeMu0.value = Math.round(muFalse[0])/ 1000
      negativeMu1.value = Math.round(muFalse[1])/ 1000

      openGenerateDistributionModal(modal)
    })
  })

//   d3.select('#GenerateDistributionButton').on('click', () => {
//     generateData().then(() => {
//         reBindData()
//         clearDecisionBoundary()
//         clearMetrics()
//         })
//     }
// )

openModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (metrics == null) return
    const modal = document.querySelector(button.dataset.modalTarget)
    openModal(modal)
  })
})

overlay.addEventListener('click', () => {
  const modals = document.querySelectorAll('.modal.active')
  modals.forEach(modal => {
    closeModal(modal)
  })
})

closeModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = button.closest('.modal')
    closeModal(modal)
  })
})

function openLoadingModal(modal) {
    if (modal == null) return
    modal.classList.add('active')
    overlay.classList.add('active')
}

function openGenerateDistributionModal(modal) {
    if (modal == null) return
    modal.classList.add('active')
    overlay.classList.add('active')
}

function openModal(modal) {
    if (modal == null) return
    modal.classList.add('active')
    overlay.classList.add('active')
    plotROC(metrics.trainROC, '#training_cm')
    plotROC(metrics.testROC, '#testing_cm')
    //plotCM(metrics.trainCM,'#training_cm')
    //plotCM(metrics.testCM,'#testing_cm')
    populateTable()
}

function opennnModal(modal) {
    modal.classList.add('active')
    overlay.classList.add('active')
    plotNNPoints()
    plotLineStruct()
    plotLines()
    intervalID = setInterval(function() {
        plotNNDecisionBoundary()
        plotLines()
        nnCounter =  (nnCounter + 1) % 45;
}, 250)
}


function closeModal(modal) {
  if (modal == null) return
  modal.classList.remove('active')
  overlay.classList.remove('active')
  clearInterval(intervalID)
  d3.select('#testing_nn').selectAll('path').remove()
  d3.select('#training_nn').selectAll('path').remove()
  d3.select('#testing_nn').selectAll('circle').remove()
  d3.select('#training_nn').selectAll('circle').remove()
  d3.select('#training_cm').selectAll('svg').remove()
  d3.select('#testing_cm').selectAll('svg').remove()
  nnCounter = 0 
}

function populateMainTable(){
    d3.select("#mainMetrics").style('visibility', 'visible')
    d3.select('td#trainSpecificityMain').text(roundMetric(metrics.trainSpecificity))
    d3.select('td#trainSensitivityMain').text(roundMetric(metrics.trainSensitivity))
    d3.select('td#testSpecificityMain').text(roundMetric(metrics.testSpecificity) + " [" +roundMetric(metrics.testSpecificityCI[0]) + "," + roundMetric(metrics.testSpecificityCI[1]) + "]")
    d3.select('td#testSensitivityMain').text(roundMetric(metrics.testSensitivity) + " [" + roundMetric(metrics.testSensitivityCI[0]) + "," + roundMetric(metrics.testSensitivityCI[1]) + "]")
}

/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////



///////////////////////////     CONFUSION MATRIX AND METRICS TABLE     //////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////
// https://gist.github.com/hsiaoyi0504/1b599d44deab7e68328b057c47abe47c




function plotCM(cm, selection){

    Matrix(
        {
            container : selection,
            data : cm,
            labels : ['TRUE', 'FALSE'],
            start_color : '#ffffff',
            end_color : '#4e73df'
        }
    )
}

function plotROC(data, selection){

    plotROCLines(
        {
            container : selection,
            data : data,
            labels : ['TPR', 'FPR'],
        }
    )
}

function populateTable(){
    d3.select('td#trainF1').text(roundMetric(metrics.trainF1))
    d3.select('td#trainSpecificity').text(roundMetric(metrics.trainSpecificity))
    // d3.select('td#trainSpecificityCI').text("[" +roundMetric(metrics.trainSpecificityCI[0]) + "," + roundMetric(metrics.trainSpecificityCI[1]) + "]")
    d3.select('td#trainSensitivity').text(roundMetric(metrics.trainSensitivity))
    // d3.select('td#trainSensitivityCI').text("[" + roundMetric(metrics.trainSensitivityCI[0]) + "," + roundMetric(metrics.trainSensitivityCI[1]) + "]")
    d3.select('td#trainAcc').text(roundMetric(metrics.trainAcc))
    d3.select('td#trainAUC').text(roundAUC(metrics.trainAUC))

    d3.select('td#testF1').text(roundMetric(metrics.testF1))
    d3.select('td#testSpecificity').text(roundMetric(metrics.testSpecificity))
    d3.select('td#testSpecificityCI').text("[" +roundMetric(metrics.testSpecificityCI[0]) + "," + roundMetric(metrics.testSpecificityCI[1]) + "]")
    d3.select('td#testSensitivity').text(roundMetric(metrics.testSensitivity))
    d3.select('td#testSensitivityCI').text("[" + roundMetric(metrics.testSensitivityCI[0]) + "," + roundMetric(metrics.testSensitivityCI[1]) + "]")
    d3.select('td#testAcc').text(roundMetric(metrics.testAcc))
    d3.select('td#testAUC').text(roundAUC(metrics.testAUC))
    d3.select('td#testAUCCI').text("[" + roundAUC(metrics.testAUCCI[0]) + "," + roundAUC(metrics.testAUCCI[1]) + "]")
    }


function Matrix(options) {
	var width = 350,
	    height = 350,
	    data = options.data,
	    container = options.container,
	    labelsData = options.labels,
	    startColor = options.start_color,
	    endColor = options.end_color;

    var svg_width= d3.select(container).node().getBoundingClientRect().width
    
    var margin = {top: 50, right: (svg_width -width) /2, bottom: 100, left: (svg_width -width) /2};

    var maxValue = d3.max(data, function(layer) { return d3.max(layer, function(d) { return d; }); });
    var minValue = d3.min(data, function(layer) { return d3.min(layer, function(d) { return d; }); });

	var numrows = data.length;
	var numcols = data[0].length;

	var svg = d3.select(container).append("svg")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var background = svg.append("rect")
	    .style("stroke", "black")
	    .style("stroke-width", "2px")
	    .attr("width", width)
	    .attr("height", height);

	var x = d3.scaleBand()
	    .domain(d3.range(numcols))
	    .range([0, width]);

	var y = d3.scaleBand()
	    .domain(d3.range(numrows))
	    .range([0, height]);

	var colorMap = d3.scaleLinear()
	    .domain([minValue,maxValue])
	    .range([startColor, endColor]);

	var row = svg.selectAll(".row")
	    .data(data)
	  	.enter().append("g")
	    .attr("class", "row")
	    .attr("transform", function(d, i) { return "translate(0," + y(i) + ")"; });

	var cell = row.selectAll(".cell")
	    .data(function(d) { return d; })
			.enter().append("g")
	    .attr("class", "cell")
	    .attr("transform", function(d, i) { return "translate(" + x(i) + ", 0)"; });

	cell.append('rect')
	    .attr("width", x.bandwidth())
	    .attr("height", y.bandwidth())
	    .style("stroke-width", 0);

    cell.append("text")
	    .attr("dy", ".42em")
	    .attr("x", x.bandwidth() / 2)
	    .attr("y", y.bandwidth() / 2)
	    .attr("text-anchor", "middle")
	    .style("fill", function(d, i) { return d >= (minValue + maxValue)/2 ? 'white' : 'black'; })
	    .text(function(d, i) { return d; });

	row.selectAll(".cell")
	    .data(function(d, i) { return data[i]; })
	    .style("fill", colorMap);

	var labels = svg.append('g')
		.attr('class', "labels");

	var columnLabels = labels.selectAll(".column-label")
	    .data(labelsData)
	    .enter().append("g")
	    .attr("class", "column-label")
	    .attr("transform", function(d, i) { return "translate(" + x(i) + "," + height + ")"; });

	columnLabels.append("line")
		.style("stroke", "black")
	    .style("stroke-width", "1px")
	    .attr("x1", x.bandwidth() / 2)
	    .attr("x2", x.bandwidth() / 2)
	    .attr("y1", 0)
	    .attr("y2", 5);

	columnLabels.append("text")
	    .attr("x", 30)
	    .attr("y", y.bandwidth() / 2)
	    .attr("dy", ".22em")
	    .attr("text-anchor", "end")
	    .attr("transform", "rotate(-60)")
	    .text(function(d, i) { return d; });

	var rowLabels = labels.selectAll(".row-label")
	    .data(labelsData)
	    .enter()
        .append("g")
	    .attr("class", "row-label")
	    .attr("transform", function(d, i) { return "translate(" + 0 + "," + y(i) + ")"; });

	rowLabels.append("line")
		.style("stroke", "black")
	    .style("stroke-width", "1px")
	    .attr("x1", 0)
	    .attr("x2", -5)
	    .attr("y1", y.bandwidth() / 2)
	    .attr("y2", y.bandwidth() / 2);

	rowLabels.append("text")
	    .attr("x", -8)
	    .attr("y", y.bandwidth() / 2)
	    .attr("dy", ".32em")
	    .attr("text-anchor", "end")
	    .text(function(d, i) { return d; });

}

/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////