(function ($) {
  "use strict";

  /* Sale Statistics Chart (Men vs Women daily orders) */
  if ($("#myChart").length) {
    var canvas = document.getElementById("myChart");
    var ctx = canvas.getContext("2d");

    // Read data passed from backend
    var labels = JSON.parse(canvas.getAttribute("data-labels")); // last 30 days
    var menData = JSON.parse(canvas.getAttribute("data-men"));   // men daily orders
    var womenData = JSON.parse(canvas.getAttribute("data-women")); // women daily orders

    new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Men",
            tension: 0.3,
            fill: true,
            backgroundColor: "rgba(44, 120, 220, 0.2)",
            borderColor: "rgba(44, 120, 220)",
            data: menData,
          },
          {
            label: "Women",
            tension: 0.3,
            fill: true,
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderColor: "rgba(255, 99, 132)",
            data: womenData,
          },
        ],
      },
      options: {
        plugins: {
          legend: { labels: { usePointStyle: true } },
        },
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Number of Orders" },
          },
          x: {
            title: { display: true, text: "Date" },
          },
        },
      },
    });
  }

  /* Order Status Donut Chart */
  if ($("#myChart2").length) {
    var canvas = document.getElementById("myChart2");

    var donutLabels = JSON.parse(canvas.getAttribute("data-labels"));
    var donutData = JSON.parse(canvas.getAttribute("data-values"));

    // Map each status to a specific color
    const statusColors = {
      Delivered: "#7bcf86", 
      Pending: "#ffcd56", 
      Shipped: "#5897fb", 
      "Out for Delivery": "#d595e5", 
      Cancelled: "#ff6b6b", 
      Processing: "#f39c12",
    };

    // Generate colors dynamically
    const backgroundColors = donutLabels.map(
      (label) => statusColors[label] || "#9b59b6"
    );

    var ctx = canvas.getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: donutLabels,
        datasets: [
          {
            data: donutData,
            backgroundColor: backgroundColors,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        plugins: {
          legend: { position: "bottom", labels: { usePointStyle: true } },
        },
        responsive: true,
      },
    });
  }
})(jQuery);
