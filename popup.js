
document.addEventListener("DOMContentLoaded", function() {
    const clearButton = document.getElementById('clear-data');

    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
              console.log(request.msg);
      }
  );

    // Clear data handler
    clearButton.addEventListener('click', function() {
      chrome.storage.local.clear(function() {
        var error = chrome.runtime.lastError;
        localStorage.setItem('timeSpentOnSite', 0)
        if (error) {
          console.error(error);
        }
      });
    })

    // Convert object into array and sort the data
    function sortProperties(obj) {
      // convert object into array
      var sortable = [];
      for(var key in obj) {
        if(obj.hasOwnProperty(key)) {
          sortable.push([key, obj[key]]); // each item is an array in format [key, value]
        }
      }
      // sort items by descending order
      sortable.sort(function(a, b) {
        return b[1]-a[1]; // compare numbers
      });
      return sortable; // array in format [ [ key1, val1 ], [ key2, val2 ], ... ]
    }

    // Convert milliseconds to hours and minutes.
    function msToHours(ms) {
      var minutes = Math.floor((ms / (1000 * 60)) % 60),
        hours = Math.floor(ms / (1000 * 60 * 60));
        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
      let time = hours + '.' + minutes;
      return time;
    }

    // Get all data from Chrome storage
    chrome.storage.local.get(null, data => {
      let sortedData = sortProperties(data);
      
      //Get top 10
      sortedData = sortedData.slice(0, 10);
      var x = sortedData.map(a => a[0]);
      var y = sortedData.map(a => a[1]);

      //Process data and labels
      y.forEach((element, index) => { 
        let processedTime = msToHours(element);
        y[index] = processedTime;
      });

      x.forEach((element, index) => { 
        let twitchRemoved = element.replace("-Twitch", "");
        x[index] = twitchRemoved;
      });

      //Build chart
      var options = {
        chart: {
          type: 'bar',
          foreColor: '#E8E8E8'
        },
        series: [
          {
            name: 'Time watched:',
            data:  y
          }
        ],
        xaxis: {
          categories: x,
          labels: {
            formatter: (value) => { return value.toFixed(2).toString().replace('.', 'h').replace('0h0', '').replace('0h', '') + 'min' },
          }
        },
        dataLabels: {
          enabled: true,
          textAnchor: 'right',
          offsetX: 5,
          style: {
            colors: [
              '#E8E8E8'
            ],
          },
          formatter: (value) => { return value.toFixed(2).toString().replace('.', 'h').replace('0h0', '').replace('0h', '') + 'min' },
        },
        colors: [
          '#9146FF'
        ],
        plotOptions: {
          bar: {
            horizontal: true,
            borderRadius: 3,
          },
        },
        tooltip: {
          y: {
            formatter: (value) => { return value.toFixed(2).toString().replace('.', 'h').replace('0h0', '').replace('0h', '') + 'min' },
            title: {
              formatter: (seriesName) => seriesName,
            },
          },
        }
      }
        
      var chart = new ApexCharts(document.querySelector('#list'), options)
      chart.render()
  });
});


  