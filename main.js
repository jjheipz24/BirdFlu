/******** Influenza - Avian Variables *******/
const influenzaChoices = document.querySelector('#influenzaChoices');
const resetFluButton = document.querySelector('#resetFlu');
let influenzaData;
let influenzaChart;
let xGridFlu, yGridFlu;
let xScaleFlu, yScaleFlu, colorScaleFlu, radiusScaleFlu;
let xAxisGroupFlu, yAxisGroupFlu;
let xAxisFlu, yAxisFlu, xLabelFlu, yLabelFlu;
let pointsFlu, zoomFlu, gFlu;
let keySvgFlu, defsFlu, keyFlu, yKeyAxisFlu, yKeyGroupFlu, yKeyScaleFlu, keyLabelFlu;

/******** Other Variables *******/

let parseDate = d3.timeParse("%m-%d-%Y");
let formatTime = d3.timeFormat("%m-%d-%Y");

let w = 650;
let keyW = 100;
let h = 550;


function rowConverter(row) {
    return {
        latitude: row.latitude,
        longitude: row.longitude,
        region: row.region,
        country: row.country,
        admin1: row.admin1,
        localityName: row.localityName,
        localityQuality: row.localityQuality,
        observationDate: parseDate(row.observationDate),
        reportingDate: parseDate(row.reportingDate),
        status: row.status,
        disease: row.disease,
        type: row.type,
        species: row.species,
        sumAtRisk: parseInt(row.sumAtRisk),
        sumCases: parseInt(row.sumCases),
        sumDeaths: parseInt(row.sumDeaths)
    }
}

function makeInfluenzaChart(dataset) {
    influenzaData = filter(dataset, d => d.disease === 'Influenza - Avian');

    //sorts the dates from oldest to newest
    let data = influenzaData.sort((a, b) => a.reportingDate - b.reportingDate);

    //pulls only the unique dates
    const uniqueArr = [...new Set(data.map(d => formatTime(d.reportingDate)))];

    data = createNewDataset(dataset, uniqueArr);

    /******** Sets Up the Chart *******/
    influenzaData = data.sort((a, b) => a.reportingDate - b.reportingDate);
    console.log(influenzaData);

    xScaleFlu = d3.scaleLinear()
        .domain([0, d3.max(influenzaData, d => d.sumCases)])
        .range([50, w - 50]);

    yScaleFlu = d3.scaleLinear()
        .domain([0, d3.max(influenzaData, d => d.sumDeaths) + 50])
        .range([h - 50, 20]);

    colorScaleFlu = d3.scaleSequential()
        .domain([0, d3.max(influenzaData, d => ((d.sumDeaths / d.sumAtRisk) * 100))])
        .interpolator(d3.interpolateRgb('#ff4996', '#4e0c7a'));

    influenzaChart = d3.select('#influenza')
        .attr('width', w)
        .attr('height', h);

    /********* Creates the X and Y Grid Lines *********/
    xGridFlu = influenzaChart.append('g')
        .classed('grid', true)
        .attr('transform', `translate(30, ${h - 50})`)
        .call(makeXGrid(xScaleFlu)
            .tickSize(-h)
            .tickFormat("")
        );
    yGridFlu = influenzaChart.append('g')
        .classed('grid', true)
        .attr('transform', `translate(80, 0)`)
        .call(makeYGrid(yScaleFlu)
            .tickSize(-w)
            .tickFormat(""));

    /********* Adds the Data to the Chart ********/
    gFlu = influenzaChart.append('g');
    pointsFlu = gFlu.selectAll('circle')
        .data(influenzaData)
        .enter()
        .append('circle')
        .classed("dot", true)
        .attr('cx', (d) => xScaleFlu(d.sumCases) + 30)
        .attr('cy', (d) => yScaleFlu(d.sumDeaths))
        .attr('r', 10)
        .attr('fill', (d) => colorScaleFlu((d.sumDeaths / d.sumAtRisk) * 100))
        .attr('opacity', '.8')
        .call(showTooltip);

    /****** Allows for Zoom Capabilities ********/
    zoomFlu = d3.zoom()
        .scaleExtent([1, 3000])
        .translateExtent([
            [50, 0],
            [w, h]
        ])
        .extent([
            [50, 0],
            [w, h]
        ])
        .on("zoom", () => {
            zoomed(xScaleFlu, yScaleFlu, xAxisGroupFlu, yAxisGroupFlu, xAxisFlu, yAxisFlu, xGridFlu, yGridFlu, pointsFlu, influenzaData, 0);
        })

    influenzaChart.call(zoomFlu);

    /********* Axes *********/
    xAxisFlu = d3.axisBottom(xScaleFlu);
    yAxisFlu = d3.axisLeft(yScaleFlu);

    xAxisGroupFlu = influenzaChart.append('g')
        .attr('id', 'xAxis')
        .attr('transform', `translate(30, ${h - 50})`)
        .call(xAxisFlu);

    //Label for X Axis
    influenzaChart.append('text')
        .classed('xAxis-label', true)
        .attr('text-anchor', 'middle')
        .attr('x', (w / 2) + 30)
        .attr('y', h)
        .text('Number of Confirmed Cases');

    yAxisGroupFlu = influenzaChart.append('g')
        .classed('yAxis', true)
        .attr('transform', `translate(80,0 )`)
        .call(yAxisFlu);

    //Label for Y Axis
    influenzaChart.append('text')
        .classed('yAxis-label', true)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .attr('x', -(h / 2) + 20)
        .attr('y', 20)
        .text('Number of Related Chicken Deaths');

    /*********** LEGEND **********/
    keySvgFlu = d3.select("#keyFlu")
        .attr('width', keyW)
        .attr('height', h);

    defsFlu = influenzaChart.append('defs');
    keyFlu = defsFlu.append("linearGradient")
        .attr('id', 'linear-gradient-flu');

    keyFlu
        .attr('x1', '0%')
        .attr('y2', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

    keyFlu.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#4e0c7a');

    keyFlu.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#ff4996');

    keySvgFlu.append('rect')
        .attr('x', 40)
        .attr('y', (h / 4) + 25)
        .attr('width', 20)
        .attr('height', 300)
        .style('fill', 'url(#linear-gradient-flu)')
        .style('opacity', '0.8');

    //Color scale for flu chart legend
    yKeyScaleFlu = d3.scaleLinear()
        .domain([0, 100])
        .range([(h / 4 + 25) + 299, (h / 4) + 25]);

    yKeyAxisFlu = d3.axisRight(yKeyScaleFlu)
        .ticks(4)
        .tickFormat(d => d + '%')
        .tickSize(0);

    yKeyGroupFlu = keySvgFlu.append('g')
        .classed('yAxis-key', true)
        .attr('transform', `translate(${keyW - 40}, 0)`)
        .call(yKeyAxisFlu);

    keyLabelFlu = keySvgFlu.append('text')
        .classed('keyTitle', true)
        .attr('x', keyW / 2)
        .attr('y', h / 4 + 5)
        .attr('text-anchor', 'middle')
        .text('Mortality Rate');

}

function makeXGrid(xScale) {
    return d3.axisBottom(xScale)
        .ticks();
}

function makeYGrid(yScale) {
    return d3.axisLeft(yScale)
        .ticks();
}
//Re-scales everything to allow for zooming of the axes and points
function zoomed(xScale, yScale, xAxisGroup, yAxisGroup, xAxis, yAxis, xGrid, yGrid, points, data, chartNum) {
    var new_xScale = d3.event.transform.rescaleX(xScale);
    var new_yScale = d3.event.transform.rescaleY(yScale);

    xAxisGroup.call(xAxis.scale(new_xScale));
    yAxisGroup.call(yAxis.scale(new_yScale));

    xGrid.call(makeXGrid(new_xScale)
        .tickSize(-h)
        .tickFormat("")
    );

    yGrid.call(makeYGrid(new_yScale)
        .tickSize(-w)
        .tickFormat("")
    );

    points.data(data)
        .attr('cx', (d) => {
            switch (chartNum) {
                case 0:
                    return new_xScale(d.sumCases) + 30;
                    break;
                case 1:
                case 2:
                    return new_xScale(d.sumAtRisk) + 30;
                    break;
                default:
                    return new_xScale(d.sumCases) + 30;
            }

        })
        .attr('cy', (d) => {
            switch (chartNum) {
                case 0:
                case 2:
                    return new_yScale(d.sumDeaths);
                    break;
                case 1:
                    return new_yScale(d.sumCases);
                    break;
                default:
                    return new_yScale(d.sumDeaths);
            }

        });
}

function updateCharts(selectedDataset, selectedDropdown, chart, xAxisGroup, yAxisGroup, xAxis, yAxis, xScale, yScale, xGrid, yGrid, zoom, g) {
    //console.log(selectedDropdown.value);
    let points;

    let colorScale = d3.scaleSequential()
        .domain([0, d3.max(selectedDataset, d => ((d.sumDeaths / d.sumAtRisk) * 100))])
        .interpolator(d3.interpolateRgb('#ff4996', '#4e0c7a'));

    switch (selectedDropdown.selectedIndex) {
        case 0:
            xScale.domain([0, d3.max(selectedDataset, d => d.sumCases)]);
            yScale.domain([0, d3.max(selectedDataset, d => d.sumDeaths) + 50]);

            g.selectAll('circle')
                .data(selectedDataset)
                .join('circle')
                .transition()
                .duration(2000)
                .ease(d3.easePoly)
                .attr('cx', (d) => xScale(d.sumCases) + 30)
                .attr('cy', (d) => yScale(d.sumDeaths))
                .attr('r', 10)
                .attr('fill', (d) => colorScale((d.sumDeaths / d.sumAtRisk) * 100))
                .attr('opacity', '0.8');

            points = chart.selectAll('circle');

            zoom.on("zoom", () => {
                zoomed(xScale, yScale, xAxisGroup, yAxisGroup, xAxis, yAxis, xGrid, yGrid, points, selectedDataset, 0);
            });

            chart.call(zoom);

            xAxis = d3.axisBottom(xScale);
            yAxis = d3.axisLeft(yScale);

            xAxisGroup
                .transition()
                .duration(2000)
                .call(xAxis);

            //Label for X Axis
            chart.select('.xAxis-label')
                .text('Number of Confirmed Cases');

            yAxisGroup
                .transition()
                .duration(2000)
                .call(yAxis);

            //Y Axis Label
            chart.select('.yAxis-label')
                .text('Number of Related Chicken Deaths');
            break;
        case 1:
            xScale.domain([0, d3.max(selectedDataset, d => d.sumAtRisk)]);
            yScale.domain([0, d3.max(selectedDataset, d => d.sumCases) + 50]);

            g.selectAll('circle')
                .data(selectedDataset)
                .join('circle')
                .transition()
                .duration(2000)
                .ease(d3.easePoly)
                .attr('cx', (d) => xScale(d.sumAtRisk) + 30)
                .attr('cy', (d) => yScale(d.sumCases))
                .attr('r', 10)
                .attr('fill', (d) => colorScale((d.sumDeaths / d.sumAtRisk) * 100))
                .attr('opacity', '0.8');

            points = chart.selectAll('circle');

            zoom.on("zoom", () => {
                zoomed(xScale, yScale, xAxisGroup, yAxisGroup, xAxis, yAxis, xGrid, yGrid, points, selectedDataset, 1);
            });

            chart.call(zoom);

            xAxis = d3.axisBottom(xScale);
            yAxis = d3.axisLeft(yScale);

            xAxisGroup
                .transition()
                .duration(2000)
                .call(xAxis);

            //Label for X Axis
            chart.select('.xAxis-label')
                .text('Number of Chickens at Risk');

            yAxisGroup
                .transition()
                .duration(2000)
                .call(yAxis);

            //Y Axis Label
            chart.select('.yAxis-label')
                .text('Number of Confirmed Cases');
            break;
        case 2:
            xScale.domain([0, d3.max(selectedDataset, d => d.sumAtRisk)]);
            yScale.domain([0, d3.max(selectedDataset, d => d.sumDeaths) + 50]);

            g.selectAll('circle')
                .data(selectedDataset)
                .join('circle')
                .transition()
                .duration(2000)
                .ease(d3.easePoly)
                .attr('cx', (d) => xScale(d.sumAtRisk) + 30)
                .attr('cy', (d) => yScale(d.sumDeaths))
                .attr('r', 10)
                .attr('fill', (d) => colorScale((d.sumDeaths / d.sumAtRisk) * 100))
                .attr('opacity', '0.8');

            points = chart.selectAll('circle');

            zoom.on("zoom", () => {
                zoomed(xScale, yScale, xAxisGroup, yAxisGroup, xAxis, yAxis, xGrid, yGrid, points, selectedDataset, 2);
            });

            chart.call(zoom);

            xAxis = d3.axisBottom(xScale);
            yAxis = d3.axisLeft(yScale);

            xAxisGroup
                .transition()
                .duration(2000)
                .call(xAxis);

            //Label for X Axis
            chart.select('.xAxis-label')
                .text('Number of Chickens at Risk');

            yAxisGroup
                .transition()
                .duration(2000)
                .call(yAxis);

            //Y Axis Label
            chart.select('.yAxis-label')
                .text('Number of Related Chicken Deaths');
            break;
        default:
            xScale.domain([0, d3.max(selectedDataset, d => d.sumCases)]);
            yScale.domain([0, d3.max(selectedDataset, d => d.sumDeaths) + 50]);

            g.selectAll('circle')
                .data(selectedDataset)
                .join('circle')
                .transition()
                .duration(2000)
                .ease(d3.easePoly)
                .attr('cx', (d) => xScale(d.sumCases) + 30)
                .attr('cy', (d) => yScale(d.sumDeaths))
                .attr('r', 10)
                .attr('fill', (d) => colorScale((d.sumDeaths / d.sumAtRisk) * 100))
                .attr('opacity', '0.8');

            points = chart.selectAll('circle');

            zoom.on("zoom", () => {
                zoomed(xScale, yScale, xAxisGroup, yAxisGroup, xAxis, yAxis, xGrid, yGrid, points, selectedDataset, 0);
            });

            chart.call(zoom);

            xAxis = d3.axisBottom(xScale);
            yAxis = d3.axisLeft(yScale);

            xAxisGroup
                .transition()
                .duration(2000)
                .call(xAxis);

            //Label for X Axis
            chart.select('.xAxis-label')
                .text('Number of Confirmed Cases');
            yAxisGroup
                .transition()
                .duration(2000)
                .call(yAxis);

            //Y Axis Label
            chart.select('.yAxis-label')
                .text('Number of Related Chicken Deaths');
            break;
    }
}

function showTooltip(selection) {
    //console.log('hovered');
    selection
        .on('mouseover', function (d) {
            d3.select(this)
                .style('opacity', '1');

            // const xPos = d3.select(this).attr('cx');
            // const yPos = d3.select(this).attr('cy');

            d3.select('#tooltip')
                .style('left', `${d3.event.pageX + 20}px`)
                .style('top', `${d3.event.pageY - 100}px`)
                .style('background-color', colorScaleFlu((d.sumDeaths / d.sumAtRisk) * 100));

            /*d3.select('.date')
                 .style('color', colorScaleFlu((d.sumDeaths / d.sumAtRisk) * 100));*/

            d3.select('#tooltip')
                .classed('hidden', false);

            d3.select('.date')
                .text(d.reportingDate);

            d3.select('.numRisk')
                .text(d.sumAtRisk);

            d3.select('.numCases')
                .text(d.sumCases);

            d3.select('.numDeaths')
                .text(d.sumDeaths);
        })
        .on('mouseout', function () {
            d3.select(this)
                .style('opacity', '.8');

            //rehides the tooltip
            d3.select('#tooltip')
                .classed('hidden', true);
        });


}

function resetChart(selection, zoom) {
    selection
        .transition()
        .duration(1000)
        .ease(d3.easeQuad)
        .call(zoom.transform, d3.zoomIdentity);
}

//Finds all of the records for a specific date
//Gets the average for sumRisks, sumCases, and sumDeaths
//Creates a new dataset of the averages for a specific reporting date
//Returns the dataset
function createNewDataset(dataset, uniqueData) {
    let largeArray = [];
    for (let item in uniqueData) {
        let newArr = filter(dataset, d => formatTime(d.reportingDate) === uniqueData[item]);
        let sumRisk = newArr.map(d => d.sumAtRisk);
        let sumCase = newArr.map(d => d.sumCases);
        let sumDeath = newArr.map(d => d.sumDeaths);
        //console.log(sumRisk);
        let avgSumRisks = Math.round(sumRisk.reduce((acc, amt) => {
            return acc + amt;
        }, 0) / sumRisk.length);
        let avgSumCases = Math.round(sumCase.reduce((acc, amt) => {
            return acc + amt;
        }, 0) / sumCase.length);
        let avgSumDeaths = Math.round(sumDeath.reduce((acc, amt) => {
            return acc + amt;
        }, 0) / sumDeath.length);

        largeArray.push({
            reportingDate: uniqueData[item],
            sumAtRisk: avgSumRisks,
            sumCases: avgSumCases,
            sumDeaths: avgSumDeaths
        });
    };

    //console.log(largeArray);
    return largeArray;
}


//filtering
const filter = (data, rule) => {
    let filteredArr = data.reduce((acc, d) => {
        if (rule(d)) {
            return [
                ...acc,
                d
            ]
        } else {
            return acc;
        }

    }, []);

    return filteredArr;
}

window.onload = function () {
    d3.csv('csv/Outbreak_refined_chicken.csv', rowConverter)
        .then((dataset) => {
            this.makeInfluenzaChart(dataset);

        });
    influenzaChoices.addEventListener("change", () => {
        updateCharts(influenzaData, influenzaChoices, influenzaChart, xAxisGroupFlu, yAxisGroupFlu, xAxisFlu, yAxisFlu, xScaleFlu, yScaleFlu, xGridFlu, yGridFlu, zoomFlu, gFlu);
    });

    resetFluButton.addEventListener('click', () => {
        resetChart(influenzaChart, zoomFlu);
    });
}